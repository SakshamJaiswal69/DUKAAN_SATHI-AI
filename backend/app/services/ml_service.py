import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from .. import models, schemas

class MLDemandForecastService:
    @staticmethod
    def get_product_daily_sales_series(
        db: Session,
        product_id: int,
        days_history: int = 90
    ) -> pd.DataFrame:
        """
        Extract daily sales history for a product.
        Fills missing calendar dates with 0 units (confirmed zero-sales days).
        """
        now = datetime.utcnow()
        start_date = now - timedelta(days=days_history)

        sales_records = db.query(
            models.Sale.sold_at,
            models.SaleItem.quantity
        ).join(models.Sale, models.SaleItem.sale_id == models.Sale.id)\
         .filter(
             models.SaleItem.product_id == product_id,
             models.Sale.sold_at >= start_date,
             models.Sale.sold_at <= now
         ).all()

        date_range = pd.date_range(start=start_date.date(), end=now.date(), freq="D")
        df_full = pd.DataFrame({"date": date_range})
        df_full["date_str"] = df_full["date"].dt.strftime("%Y-%m-%d")

        if not sales_records:
            df_full["units_sold"] = 0
            return df_full

        # Aggregate by date
        data = []
        for sold_at, qty in sales_records:
            data.append({"date_str": sold_at.strftime("%Y-%m-%d"), "quantity": qty})

        df_sales = pd.DataFrame(data)
        df_agg = df_sales.groupby("date_str")["quantity"].sum().reset_index()

        df_merged = pd.merge(df_full, df_agg, on="date_str", how="left")
        df_merged["units_sold"] = df_merged["quantity"].fillna(0).astype(int)
        df_merged = df_merged.drop(columns=["quantity"])
        return df_merged

    @staticmethod
    def build_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineers time-series features: lag_1, lag_2, lag_7, rolling_mean_7, day_of_week, is_weekend.
        Prevents data leakage by computing rolling metrics strictly on past observations.
        """
        df_feat = df.copy()
        df_feat["day_of_week"] = df_feat["date"].dt.dayofweek
        df_feat["is_weekend"] = df_feat["day_of_week"].isin([5, 6]).astype(int)
        
        # Lag features
        df_feat["lag_1"] = df_feat["units_sold"].shift(1)
        df_feat["lag_2"] = df_feat["units_sold"].shift(2)
        df_feat["lag_7"] = df_feat["units_sold"].shift(7)

        # Rolling statistics (using closed='left' to prevent current day leakage)
        df_feat["rolling_mean_7"] = df_feat["units_sold"].shift(1).rolling(window=7, min_periods=1).mean()
        df_feat["rolling_mean_14"] = df_feat["units_sold"].shift(1).rolling(window=14, min_periods=1).mean()

        return df_feat

    @staticmethod
    def train_and_evaluate_holdout(
        df_feat: pd.DataFrame,
        holdout_days: int = 7
    ) -> Tuple[Optional[Ridge], Optional[float], Optional[float]]:
        """
        Evaluates the model using a chronological time-ordered holdout split.
        Returns: (fitted_model, model_mae, baseline_mae)
        """
        df_valid = df_feat.dropna().copy()
        if len(df_valid) < (holdout_days + 14):
            # Not enough data for meaningful train/test split
            return None, None, None

        train_df = df_valid.iloc[:-holdout_days]
        test_df = df_valid.iloc[-holdout_days:]

        feature_cols = ["lag_1", "lag_2", "lag_7", "rolling_mean_7", "rolling_mean_14", "day_of_week", "is_weekend"]
        X_train, y_train = train_df[feature_cols], train_df["units_sold"]
        X_test, y_test = test_df[feature_cols], test_df["units_sold"]

        # Baseline: Naive 7-day moving average from rolling_mean_7
        y_baseline_pred = test_df["rolling_mean_7"].fillna(train_df["units_sold"].mean())
        baseline_mae = float(mean_absolute_error(y_test, y_baseline_pred))

        # Train Ridge Regression
        model = Ridge(alpha=1.0)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        # Demand cannot be negative
        y_pred = np.clip(y_pred, 0, None)
        model_mae = float(mean_absolute_error(y_test, y_pred))

        # Re-fit on full dataset for future forecasting
        full_model = Ridge(alpha=1.0)
        full_model.fit(df_valid[feature_cols], df_valid["units_sold"])

        return full_model, round(model_mae, 2), round(baseline_mae, 2)

    @staticmethod
    def forecast_product_demand(
        db: Session,
        product_id: int,
        horizon_days: int = 7,
        safety_buffer_percent: float = 20.0,
        lead_time_days: int = 3
    ) -> schemas.ProductForecastResponse:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            raise ValueError(f"Product ID {product_id} not found")

        df_daily = MLDemandForecastService.get_product_daily_sales_series(db, product_id, days_history=90)
        total_days = len(df_daily)
        active_sales_days = int((df_daily["units_sold"] > 0).sum())

        now = datetime.utcnow()
        future_dates = [(now + timedelta(days=i + 1)).strftime("%Y-%m-%d") for i in range(horizon_days)]

        disclaimer_text = "Forecast figures are statistical and machine learning estimates based on historical sales velocity and day-of-week demand patterns. They are indicative estimates, not guaranteed outcomes. The retailer makes all final procurement decisions."

        # Case 1: Insufficient history (< 7 days of total data or 0 sales)
        if total_days < 7 or active_sales_days < 2:
            avg_daily = float(df_daily["units_sold"].mean()) if total_days > 0 else 0.0
            forecast_points = [
                schemas.ForecastDataPoint(
                    date=d_str,
                    predicted_units=round(avg_daily, 1),
                    baseline_units=round(avg_daily, 1)
                ) for d_str in future_dates
            ]
            total_pred = round(avg_daily * horizon_days, 1)
            safety_buffer = math.ceil(total_pred * (safety_buffer_percent / 100.0))
            gross_needed = math.ceil(total_pred) + safety_buffer
            suggested_order = max(0, gross_needed - product.current_stock)

            breakdown_text = (
                f"Status: Insufficient sales history ({active_sales_days} sale days found). "
                f"Using naive daily average fallback ({avg_daily:.1f} units/day). "
                f"Gross Demand: {gross_needed} units (Forecast: {math.ceil(total_pred)} + Safety Buffer: {safety_buffer}). "
                f"Current Stock: {product.current_stock}. Suggested Reorder: {suggested_order}."
            )

            status_rec = "REORDER_NOW" if product.current_stock <= product.reorder_level else "SUFFICIENT_STOCK"

            return schemas.ProductForecastResponse(
                product_id=product.id,
                sku=product.sku,
                name=product.name,
                category=product.category,
                current_stock=product.current_stock,
                reorder_level=product.reorder_level,
                horizon_days=horizon_days,
                model_name="Fallback (Sparse History Average)",
                data_quality_status="INSUFFICIENT_DATA",
                data_points_count=active_sales_days,
                forecast_values=forecast_points,
                total_predicted_demand=total_pred,
                baseline_predicted_demand=total_pred,
                model_mae=None,
                baseline_mae=None,
                model_improvement_percent=None,
                suggested_reorder_qty=suggested_order,
                safety_stock_buffer=safety_buffer,
                lead_time_days=lead_time_days,
                recommendation_status=status_rec,
                calculation_breakdown=breakdown_text,
                disclaimer=disclaimer_text
            )

        # Case 2: Sufficient data available -> Feature engineering & Holdout split
        df_feat = MLDemandForecastService.build_features(df_daily)
        fitted_model, model_mae, baseline_mae = MLDemandForecastService.train_and_evaluate_holdout(
            df_feat, holdout_days=min(7, max(3, int(total_days * 0.15)))
        )

        # Baseline: Recent 7-day average sales
        recent_7_avg = float(df_daily["units_sold"].tail(7).mean())
        if recent_7_avg < 0.05:
            recent_7_avg = float(df_daily["units_sold"].mean())

        # Generate recursive multi-step forecast for the horizon
        forecast_points: List[schemas.ForecastDataPoint] = []
        curr_history = df_daily.copy()

        feature_cols = ["lag_1", "lag_2", "lag_7", "rolling_mean_7", "rolling_mean_14", "day_of_week", "is_weekend"]

        for d_str in future_dates:
            dt_obj = datetime.strptime(d_str, "%Y-%m-%d")
            dow = dt_obj.weekday()
            is_wknd = 1 if dow in [5, 6] else 0

            # Day-of-week multiplier for baseline
            dow_historical = df_daily[df_daily["date"].dt.dayofweek == dow]["units_sold"]
            dow_multiplier = (dow_historical.mean() / (df_daily["units_sold"].mean() + 1e-5)) if len(dow_historical) > 0 else 1.0
            baseline_val = max(0.0, round(recent_7_avg * max(0.5, min(2.0, dow_multiplier)), 1))

            if fitted_model is not None:
                # Compute lag values from curr_history
                lag_1_val = float(curr_history["units_sold"].iloc[-1])
                lag_2_val = float(curr_history["units_sold"].iloc[-2]) if len(curr_history) >= 2 else lag_1_val
                lag_7_val = float(curr_history["units_sold"].iloc[-7]) if len(curr_history) >= 7 else lag_1_val
                roll_7 = float(curr_history["units_sold"].iloc[-7:].mean())
                roll_14 = float(curr_history["units_sold"].iloc[-14:].mean()) if len(curr_history) >= 14 else roll_7

                feat_vector = pd.DataFrame([{
                    "lag_1": lag_1_val,
                    "lag_2": lag_2_val,
                    "lag_7": lag_7_val,
                    "rolling_mean_7": roll_7,
                    "rolling_mean_14": roll_14,
                    "day_of_week": dow,
                    "is_weekend": is_wknd
                }])[feature_cols]

                pred_val = float(np.clip(fitted_model.predict(feat_vector)[0], 0, None))
                pred_val = round(pred_val, 1)
            else:
                pred_val = baseline_val

            forecast_points.append(schemas.ForecastDataPoint(
                date=d_str,
                predicted_units=pred_val,
                baseline_units=baseline_val
            ))

            # Append prediction to history to feed subsequent step lags
            new_row = pd.DataFrame([{"date": dt_obj, "date_str": d_str, "units_sold": pred_val}])
            curr_history = pd.concat([curr_history, new_row], ignore_index=True)

        total_predicted = round(sum(p.predicted_units for p in forecast_points), 1)
        total_baseline = round(sum(p.baseline_units for p in forecast_points), 1)

        # Improvement calculation
        improvement_pct = None
        if model_mae is not None and baseline_mae is not None and baseline_mae > 0:
            improvement_pct = round(((baseline_mae - model_mae) / baseline_mae) * 100, 1)

        # Reorder Recommendation calculation
        safety_buffer = math.ceil(total_predicted * (safety_buffer_percent / 100.0))
        # Account for lead time (pro-rated demand during lead time)
        lead_time_demand = math.ceil((total_predicted / horizon_days) * lead_time_days)
        gross_required = math.ceil(total_predicted) + safety_buffer

        suggested_order = max(0, gross_required - product.current_stock)

        if product.current_stock <= 0:
            rec_status = "REORDER_NOW"
        elif product.current_stock <= product.reorder_level:
            rec_status = "REORDER_NOW"
        elif suggested_order > 0:
            rec_status = "REORDER_SOON"
        else:
            rec_status = "SUFFICIENT_STOCK"

        breakdown_text = (
            f"Forecast Demand ({horizon_days}d): {math.ceil(total_predicted)} units | "
            f"Safety Buffer ({safety_buffer_percent}%): +{safety_buffer} units | "
            f"Lead Time Demand ({lead_time_days}d): ~{lead_time_demand} units | "
            f"Gross Required: {gross_required} units | "
            f"Current Stock: {product.current_stock} units. "
            f"-> Suggested Reorder: max(0, {gross_required} - {product.current_stock}) = {suggested_order} {product.unit}."
        )

        model_display_name = "Ridge Time-Series Regression (Lag & Calendar Features)" if fitted_model else "7-Day Seasonality-Weighted Moving Average"
        quality_status = "SUFFICIENT_DATA" if total_days >= 30 else "LIMITED_DATA"

        return schemas.ProductForecastResponse(
            product_id=product.id,
            sku=product.sku,
            name=product.name,
            category=product.category,
            current_stock=product.current_stock,
            reorder_level=product.reorder_level,
            horizon_days=horizon_days,
            model_name=model_display_name,
            data_quality_status=quality_status,
            data_points_count=active_sales_days,
            forecast_values=forecast_points,
            total_predicted_demand=total_predicted,
            baseline_predicted_demand=total_baseline,
            model_mae=model_mae,
            baseline_mae=baseline_mae,
            model_improvement_percent=improvement_pct,
            suggested_reorder_qty=suggested_order,
            safety_stock_buffer=safety_buffer,
            lead_time_days=lead_time_days,
            recommendation_status=rec_status,
            calculation_breakdown=breakdown_text,
            disclaimer=disclaimer_text
        )

    @staticmethod
    def get_overall_holdout_summary(db: Session, holdout_days: int = 7) -> schemas.HoldoutEvaluationSummary:
        """
        Computes overall holdout evaluation across active products to report model performance.
        """
        products = db.query(models.Product).filter(models.Product.active_status == True).all()

        model_maes = []
        baseline_maes = []
        cutoff_date = (datetime.utcnow() - timedelta(days=holdout_days)).strftime("%Y-%m-%d")

        for p in products:
            df_daily = MLDemandForecastService.get_product_daily_sales_series(db, p.id, days_history=90)
            if len(df_daily) >= (holdout_days + 14) and (df_daily["units_sold"] > 0).sum() >= 5:
                df_feat = MLDemandForecastService.build_features(df_daily)
                _, m_mae, b_mae = MLDemandForecastService.train_and_evaluate_holdout(df_feat, holdout_days=holdout_days)
                if m_mae is not None and b_mae is not None:
                    model_maes.append(m_mae)
                    baseline_maes.append(b_mae)

        if not model_maes:
            return schemas.HoldoutEvaluationSummary(
                evaluation_period_days=holdout_days,
                total_skus_evaluated=0,
                overall_model_mae=0.0,
                overall_baseline_mae=0.0,
                mae_improvement_percent=0.0,
                evaluation_method="Time-Ordered Chronological Holdout (Zero Data Leakage)",
                time_split_cutoff=cutoff_date
            )

        avg_m_mae = round(float(np.mean(model_maes)), 2)
        avg_b_mae = round(float(np.mean(baseline_maes)), 2)
        improvement = round(((avg_b_mae - avg_m_mae) / (avg_b_mae + 1e-5)) * 100, 1)

        return schemas.HoldoutEvaluationSummary(
            evaluation_period_days=holdout_days,
            total_skus_evaluated=len(model_maes),
            overall_model_mae=avg_m_mae,
            overall_baseline_mae=avg_b_mae,
            mae_improvement_percent=improvement,
            evaluation_method="Time-Ordered Chronological Holdout (Zero Data Leakage, No Random Splitting)",
            time_split_cutoff=cutoff_date
        )
