from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from .. import models, schemas

class AnalyticsService:
    @staticmethod
    def get_dashboard_kpis(
        db: Session,
        days: int = 30,
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None
    ) -> schemas.DashboardKpiResponse:
        now = datetime.utcnow()
        if start_date_str and end_date_str:
            try:
                start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
                end_dt = datetime.strptime(end_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                delta_days = max(1, (end_dt - start_dt).days)
            except ValueError:
                start_dt = now - timedelta(days=days)
                end_dt = now
                delta_days = days
        else:
            delta_days = days
            start_dt = now - timedelta(days=days)
            end_dt = now

        # Query sale items in date range
        sale_items = db.query(
            models.SaleItem.quantity,
            models.SaleItem.line_total,
            models.SaleItem.unit_cost_snapshot,
            models.SaleItem.unit_selling_price
        ).join(models.Sale, models.SaleItem.sale_id == models.Sale.id).filter(
            models.Sale.sold_at >= start_dt,
            models.Sale.sold_at <= end_dt
        ).all()

        total_revenue = 0.0
        total_units_sold = 0
        total_profit = 0.0
        revenue_with_cost = 0.0

        for qty, line_total, cost_snap, sell_price in sale_items:
            total_revenue += line_total
            total_units_sold += qty
            if cost_snap > 0:
                profit_per_unit = sell_price - cost_snap
                total_profit += profit_per_unit * qty
                revenue_with_cost += line_total

        total_revenue = round(total_revenue, 2)
        total_profit = round(total_profit, 2)

        cost_coverage_pct = round((revenue_with_cost / total_revenue * 100), 1) if total_revenue > 0 else 100.0
        gross_margin_pct = round((total_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0

        # Stock metrics
        products = db.query(models.Product).filter(models.Product.active_status == True).all()
        low_stock_count = 0
        out_of_stock_count = 0
        total_products_count = len(products)
        inventory_val_cost = 0.0
        inventory_val_retail = 0.0

        for p in products:
            if p.current_stock <= 0:
                out_of_stock_count += 1
            if p.current_stock <= p.reorder_level:
                low_stock_count += 1
            inventory_val_cost += p.current_stock * p.purchase_cost
            inventory_val_retail += p.current_stock * p.selling_price

        # Check demo data flag
        setting = db.query(models.StoreSetting).first()
        is_demo = setting.is_demo_data if setting else False

        return schemas.DashboardKpiResponse(
            selected_period_days=delta_days,
            start_date=start_dt.strftime("%Y-%m-%d"),
            end_date=end_dt.strftime("%Y-%m-%d"),
            total_revenue=total_revenue,
            total_units_sold=total_units_sold,
            estimated_gross_profit=total_profit,
            gross_margin_percent=gross_margin_pct,
            cost_data_coverage_percent=cost_coverage_pct,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            total_products_count=total_products_count,
            total_inventory_valuation_cost=round(inventory_val_cost, 2),
            total_inventory_valuation_retail=round(inventory_val_retail, 2),
            is_demo_data=is_demo
        )

    @staticmethod
    def get_sales_trend(
        db: Session,
        days: int = 30,
        group_by: str = "daily"  # daily, weekly
    ) -> List[schemas.SalesTrendPoint]:
        now = datetime.utcnow()
        start_dt = now - timedelta(days=days)

        sales = db.query(models.Sale).filter(
            models.Sale.sold_at >= start_dt,
            models.Sale.sold_at <= now
        ).order_by(models.Sale.sold_at.asc()).all()

        # Build continuous date mapping so zero days are shown
        trend_dict: Dict[str, Dict[str, float]] = {}
        for d in range(days + 1):
            curr_date_str = (start_dt + timedelta(days=d)).strftime("%Y-%m-%d")
            trend_dict[curr_date_str] = {"revenue": 0.0, "units_sold": 0, "profit": 0.0}

        for s in sales:
            d_str = s.sold_at.strftime("%Y-%m-%d")
            if d_str in trend_dict:
                for item in s.items:
                    trend_dict[d_str]["revenue"] += item.line_total
                    trend_dict[d_str]["units_sold"] += item.quantity
                    if item.unit_cost_snapshot > 0:
                        trend_dict[d_str]["profit"] += (item.unit_selling_price - item.unit_cost_snapshot) * item.quantity

        result = []
        for date_str, metrics in sorted(trend_dict.items()):
            result.append(schemas.SalesTrendPoint(
                date=date_str,
                revenue=round(metrics["revenue"], 2),
                units_sold=int(metrics["units_sold"]),
                estimated_profit=round(metrics["profit"], 2)
            ))
        return result

    @staticmethod
    def get_category_performance(db: Session, days: int = 30) -> List[schemas.CategoryPerformance]:
        start_dt = datetime.utcnow() - timedelta(days=days)

        # Query sales grouped by category
        query = db.query(
            models.Product.category,
            func.sum(models.SaleItem.line_total).label("cat_revenue"),
            func.sum(models.SaleItem.quantity).label("cat_units"),
            func.count(func.distinct(models.Product.id)).label("prod_count")
        ).join(models.Product, models.SaleItem.product_id == models.Product.id)\
         .join(models.Sale, models.SaleItem.sale_id == models.Sale.id)\
         .filter(models.Sale.sold_at >= start_dt)\
         .group_by(models.Product.category).all()

        total_rev = sum(row.cat_revenue or 0.0 for row in query)

        result = []
        for cat, cat_rev, cat_units, p_count in query:
            rev = float(cat_rev or 0.0)
            share = round((rev / total_rev * 100), 1) if total_rev > 0 else 0.0
            result.append(schemas.CategoryPerformance(
                category=cat,
                revenue=round(rev, 2),
                units_sold=int(cat_units or 0),
                product_count=int(p_count or 0),
                revenue_share_percent=share
            ))
        result.sort(key=lambda x: x.revenue, reverse=True)
        return result

    @staticmethod
    def get_product_rankings(db: Session, days: int = 30, limit: int = 10) -> List[schemas.ProductPerformance]:
        start_dt = datetime.utcnow() - timedelta(days=days)

        query = db.query(
            models.Product,
            func.coalesce(func.sum(models.SaleItem.quantity), 0).label("units_sold"),
            func.coalesce(func.sum(models.SaleItem.line_total), 0.0).label("revenue")
        ).outerjoin(
            models.SaleItem,
            and_(
                models.SaleItem.product_id == models.Product.id,
                models.SaleItem.sale_id.in_(
                    db.query(models.Sale.id).filter(models.Sale.sold_at >= start_dt)
                )
            )
        ).filter(models.Product.active_status == True)\
         .group_by(models.Product.id)\
         .order_by(desc("units_sold"))\
         .limit(limit).all()

        rankings = []
        for prod, units, rev in query:
            if prod.current_stock <= 0:
                status_str = "OUT_OF_STOCK"
            elif prod.current_stock <= (prod.reorder_level / 2):
                status_str = "CRITICAL"
            elif prod.current_stock <= prod.reorder_level:
                status_str = "LOW"
            else:
                status_str = "HEALTHY"

            rankings.append(schemas.ProductPerformance(
                product_id=prod.id,
                sku=prod.sku,
                name=prod.name,
                category=prod.category,
                units_sold=int(units or 0),
                revenue=round(float(rev or 0.0), 2),
                current_stock=prod.current_stock,
                reorder_level=prod.reorder_level,
                stock_status=status_str
            ))
        return rankings

    @staticmethod
    def get_slow_moving_products(
        db: Session,
        days: int = 30,
        max_sales_threshold: int = 3
    ) -> List[schemas.SlowMovingProduct]:
        start_dt = datetime.utcnow() - timedelta(days=days)

        products = db.query(models.Product).filter(models.Product.active_status == True).all()

        # Query units sold per product in period
        sales_data = db.query(
            models.SaleItem.product_id,
            func.coalesce(func.sum(models.SaleItem.quantity), 0).label("units_sold"),
            func.max(models.Sale.sold_at).label("last_sold_date")
        ).join(models.Sale, models.SaleItem.sale_id == models.Sale.id)\
         .filter(models.Sale.sold_at >= start_dt)\
         .group_by(models.SaleItem.product_id).all()

        sales_map = {row.product_id: (int(row.units_sold), row.last_sold_date) for row in sales_data}

        slow_list = []
        now = datetime.utcnow()

        for p in products:
            units_sold, last_sold = sales_map.get(p.id, (0, None))
            if units_sold <= max_sales_threshold:
                if last_sold:
                    days_no_sale = (now - last_sold).days
                else:
                    days_no_sale = days

                capital_locked = round(p.current_stock * p.purchase_cost, 2)
                rule_desc = f"Sold ≤ {max_sales_threshold} units in the last {days} days"

                slow_list.append(schemas.SlowMovingProduct(
                    product_id=p.id,
                    sku=p.sku,
                    name=p.name,
                    category=p.category,
                    units_sold=units_sold,
                    days_with_no_sales=days_no_sale,
                    current_stock=p.current_stock,
                    capital_locked=capital_locked,
                    rule_disclosed=rule_desc
                ))

        slow_list.sort(key=lambda x: x.capital_locked, reverse=True)
        return slow_list
