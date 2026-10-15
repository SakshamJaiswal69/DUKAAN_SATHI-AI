import pytest
import pandas as pd
from datetime import datetime, timedelta
from app.services.ml_service import MLDemandForecastService

def test_feature_engineering_no_leakage():
    # Construct 30 days of synthetic sales
    dates = pd.date_range(start="2026-08-01", periods=30, freq="D")
    df = pd.DataFrame({
        "date": dates,
        "units_sold": [i % 5 + 2 for i in range(30)]
    })

    df_feat = MLDemandForecastService.build_features(df)
    assert "lag_1" in df_feat.columns
    assert "lag_7" in df_feat.columns
    assert "rolling_mean_7" in df_feat.columns
    assert "day_of_week" in df_feat.columns
    assert "is_weekend" in df_feat.columns

    # Verify lag_1 on row 1 equals units_sold on row 0
    assert df_feat.loc[1, "lag_1"] == df.loc[0, "units_sold"]

def test_chronological_holdout_evaluation():
    # Construct 45 days of sales data with weekly cycle
    dates = pd.date_range(start="2026-07-01", periods=45, freq="D")
    units = []
    for d in dates:
        # Weekend has 8 units, weekday has 3 units
        base = 8 if d.weekday() in [5, 6] else 3
        units.append(base)

    df = pd.DataFrame({"date": dates, "units_sold": units})
    df_feat = MLDemandForecastService.build_features(df)

    fitted_model, model_mae, baseline_mae = MLDemandForecastService.train_and_evaluate_holdout(df_feat, holdout_days=7)
    assert fitted_model is not None
    assert model_mae is not None
    assert baseline_mae is not None
    # Model MAE should be low because of deterministic pattern
    assert model_mae < 3.0

def test_reorder_recommendation_math():
    # If forecasted demand for 7 days is 35 units, safety buffer is 20% (+7 units),
    # Gross needed = 42 units.
    # If current stock is 12 units:
    # Suggested reorder = max(0, 42 - 12) = 30 units.
    forecast_demand = 35.0
    safety_buffer_pct = 20.0
    current_stock = 12

    safety_buffer = round(forecast_demand * (safety_buffer_pct / 100.0))
    gross_needed = int(forecast_demand) + safety_buffer
    suggested = max(0, gross_needed - current_stock)

    assert safety_buffer == 7
    assert gross_needed == 42
    assert suggested == 30
