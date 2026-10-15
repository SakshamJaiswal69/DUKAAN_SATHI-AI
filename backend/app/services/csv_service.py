import io
import csv
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from .. import models, schemas

class CsvService:
    PRODUCTS_HEADER = ["sku", "name", "category", "unit", "purchase_cost", "selling_price", "current_stock", "reorder_level"]
    SALES_HEADER = ["sale_id", "sold_at", "sku", "quantity", "unit_selling_price", "unit_cost"]

    @staticmethod
    def get_products_template_csv() -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(CsvService.PRODUCTS_HEADER)
        writer.writerow(["SKU-ATTA-001", "Aashirvaad Shudh Chakki Atta 5kg", "Staples & Grains", "packet", 240.0, 275.0, 25, 10])
        writer.writerow(["SKU-SALT-002", "Tata Salt Iodized 1kg", "Staples & Grains", "packet", 22.0, 28.0, 40, 15])
        writer.writerow(["SKU-OIL-003", "Fortune Sunlite Sunflower Oil 1L", "Edible Oils", "pouch", 125.0, 145.0, 18, 8])
        return output.getvalue()

    @staticmethod
    def get_electricals_products_template_csv() -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(CsvService.PRODUCTS_HEADER)
        writer.writerow(["ELEC-WIRE-001", "Polycab 1.5 sq mm FR Copper Wire (90m Coil Red)", "Wires & Cables", "coil", 1420.0, 1750.0, 15, 8])
        writer.writerow(["ELEC-LED-004", "Philips Stellar Bright 9W LED Bulb", "Lighting & LED", "pcs", 75.0, 110.0, 50, 25])
        writer.writerow(["ELEC-SW-008", "Anchor Roma Classic 6A Modular Switch", "Switches & Sockets", "pcs", 24.0, 36.0, 120, 50])
        return output.getvalue()

    @staticmethod
    def get_electricals_sales_template_csv() -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(CsvService.SALES_HEADER)
        writer.writerow(["ELEC-INV-001", "2026-10-01", "ELEC-WIRE-001", 2, 1750.0, 1420.0])
        writer.writerow(["ELEC-INV-001", "2026-10-01", "ELEC-SW-008", 6, 36.0, 24.0])
        return output.getvalue()

    @staticmethod
    def preview_products_csv(db: Session, file_content: str) -> schemas.CsvPreviewResponse:
        f = io.StringIO(file_content)
        reader = csv.DictReader(f)
        
        # Check header
        if not reader.fieldnames:
            return schemas.CsvPreviewResponse(
                file_type="products",
                total_rows=0,
                valid_rows_count=0,
                invalid_rows_count=1,
                preview_data=[],
                errors=[schemas.CsvRowError(row_number=1, field="header", message="Empty or missing CSV header")]
            )

        fieldnames_clean = [col.strip().lower() for col in reader.fieldnames]
        required_cols = ["sku", "name", "category", "selling_price"]
        missing_cols = [c for c in required_cols if c not in fieldnames_clean]
        if missing_cols:
            return schemas.CsvPreviewResponse(
                file_type="products",
                total_rows=0,
                valid_rows_count=0,
                invalid_rows_count=1,
                preview_data=[],
                errors=[schemas.CsvRowError(row_number=1, field="columns", message=f"Missing required columns: {', '.join(missing_cols)}")]
            )

        existing_skus = {p.sku.upper() for p in db.query(models.Product.sku).all()}
        seen_in_file = set()

        preview_rows = []
        errors = []
        valid_count = 0
        row_num = 1

        for raw_row in reader:
            row_num += 1
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
            sku = row.get("sku", "").upper()
            name = row.get("name", "")
            category = row.get("category", "General")
            unit = row.get("unit", "pcs") or "pcs"
            cost_str = row.get("purchase_cost", "0")
            price_str = row.get("selling_price", "0")
            stock_str = row.get("current_stock", "0")
            reorder_str = row.get("reorder_level", "10")

            row_has_error = False

            if not sku:
                errors.append(schemas.CsvRowError(row_number=row_num, field="sku", message="SKU cannot be empty"))
                row_has_error = True
            elif sku in seen_in_file:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="sku", message="Duplicate SKU within this CSV file"))
                row_has_error = True
            elif sku in existing_skus:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="sku", message=f"SKU '{sku}' already exists in the store"))
                row_has_error = True

            if not name:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="name", message="Product name cannot be empty"))
                row_has_error = True

            try:
                price = float(price_str)
                if price <= 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="selling_price", message="Selling price must be greater than 0"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="selling_price", message="Invalid numeric value for selling price"))
                row_has_error = True
                price = 0.0

            try:
                cost = float(cost_str) if cost_str else 0.0
                if cost < 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="purchase_cost", message="Purchase cost cannot be negative"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="purchase_cost", message="Invalid numeric value for purchase cost"))
                row_has_error = True
                cost = 0.0

            try:
                stock = int(stock_str) if stock_str else 0
                if stock < 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="current_stock", message="Stock cannot be negative"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="current_stock", message="Invalid integer for current stock"))
                row_has_error = True
                stock = 0

            try:
                reorder = int(reorder_str) if reorder_str else 10
                if reorder < 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="reorder_level", message="Reorder level cannot be negative"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="reorder_level", message="Invalid integer for reorder level"))
                row_has_error = True
                reorder = 10

            seen_in_file.add(sku)
            if not row_has_error:
                valid_count += 1

            if len(preview_rows) < 10:
                preview_rows.append({
                    "row_number": row_num,
                    "sku": sku,
                    "name": name,
                    "category": category,
                    "unit": unit,
                    "purchase_cost": cost,
                    "selling_price": price,
                    "current_stock": stock,
                    "reorder_level": reorder,
                    "status": "VALID" if not row_has_error else "INVALID"
                })

        total_rows = row_num - 1
        return schemas.CsvPreviewResponse(
            file_type="products",
            total_rows=total_rows,
            valid_rows_count=valid_count,
            invalid_rows_count=total_rows - valid_count,
            preview_data=preview_rows,
            errors=errors[:50]  # Cap error list to prevent huge payload
        )

    @staticmethod
    def import_products_csv(db: Session, file_content: str) -> schemas.CsvImportCommitResponse:
        preview = CsvService.preview_products_csv(db, file_content)
        if preview.invalid_rows_count > 0:
            return schemas.CsvImportCommitResponse(
                success=False,
                imported_count=0,
                skipped_count=preview.total_rows,
                message=f"Import blocked: CSV contains {preview.invalid_rows_count} invalid row(s). Please fix and retry."
            )

        f = io.StringIO(file_content)
        reader = csv.DictReader(f)
        count = 0

        for raw_row in reader:
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
            sku = row["sku"].upper()
            name = row["name"]
            category = row.get("category", "General") or "General"
            unit = row.get("unit", "pcs") or "pcs"
            cost = float(row.get("purchase_cost", "0") or "0")
            price = float(row.get("selling_price", "0"))
            stock = int(row.get("current_stock", "0") or "0")
            reorder = int(row.get("reorder_level", "10") or "10")

            prod = models.Product(
                sku=sku,
                name=name,
                category=category,
                unit=unit,
                purchase_cost=cost,
                selling_price=price,
                current_stock=stock,
                reorder_level=reorder,
                active_status=True
            )
            db.add(prod)
            db.flush()

            if stock > 0:
                movement = models.StockMovement(
                    product_id=prod.id,
                    movement_type="in",
                    quantity=stock,
                    occurred_at=datetime.utcnow(),
                    reason="CSV Initial Import",
                    reference_id=f"CSV-IMP-{prod.sku}",
                    notes="Opening balance imported from CSV file"
                )
                db.add(movement)

            count += 1

        # Mark demo data flag as false since user imported custom products
        setting = db.query(models.StoreSetting).first()
        if setting:
            setting.is_demo_data = False

        db.commit()
        return schemas.CsvImportCommitResponse(
            success=True,
            imported_count=count,
            skipped_count=0,
            message=f"Successfully imported {count} products into inventory."
        )

    @staticmethod
    def preview_sales_csv(db: Session, file_content: str) -> schemas.CsvPreviewResponse:
        f = io.StringIO(file_content)
        reader = csv.DictReader(f)

        if not reader.fieldnames:
            return schemas.CsvPreviewResponse(
                file_type="sales",
                total_rows=0,
                valid_rows_count=0,
                invalid_rows_count=1,
                preview_data=[],
                errors=[schemas.CsvRowError(row_number=1, field="header", message="Empty or missing CSV header")]
            )

        fieldnames_clean = [col.strip().lower() for col in reader.fieldnames]
        required_cols = ["sale_id", "sold_at", "sku", "quantity", "unit_selling_price"]
        missing_cols = [c for c in required_cols if c not in fieldnames_clean]
        if missing_cols:
            return schemas.CsvPreviewResponse(
                file_type="sales",
                total_rows=0,
                valid_rows_count=0,
                invalid_rows_count=1,
                preview_data=[],
                errors=[schemas.CsvRowError(row_number=1, field="columns", message=f"Missing required columns: {', '.join(missing_cols)}")]
            )

        product_sku_map = {p.sku.upper(): p for p in db.query(models.Product).all()}
        existing_invoices = {s.invoice_no for s in db.query(models.Sale.invoice_no).all()}

        preview_rows = []
        errors = []
        valid_count = 0
        row_num = 1

        for raw_row in reader:
            row_num += 1
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
            sale_id = row.get("sale_id", "").strip()
            date_str = row.get("sold_at", "").strip()
            sku = row.get("sku", "").strip().upper()
            qty_str = row.get("quantity", "0").strip()
            price_str = row.get("unit_selling_price", "0").strip()
            cost_str = row.get("unit_cost", "").strip()

            row_has_error = False

            if not sale_id:
                errors.append(schemas.CsvRowError(row_number=row_num, field="sale_id", message="sale_id is required"))
                row_has_error = True
            elif sale_id in existing_invoices:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="sale_id", message=f"Sale/Invoice '{sale_id}' already exists in system"))
                row_has_error = True

            try:
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                try:
                    datetime.fromisoformat(date_str)
                except Exception:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="sold_at", message="Invalid date format. Expected YYYY-MM-DD"))
                    row_has_error = True

            if not sku or sku not in product_sku_map:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="sku", message=f"SKU '{sku}' does not exist in product catalog"))
                row_has_error = True

            try:
                qty = int(qty_str)
                if qty <= 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="quantity", message="Quantity must be greater than 0"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="quantity", message="Invalid integer for quantity"))
                row_has_error = True
                qty = 0

            try:
                price = float(price_str)
                if price <= 0:
                    errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="unit_selling_price", message="Selling price must be greater than 0"))
                    row_has_error = True
            except ValueError:
                errors.append(schemas.CsvRowError(row_number=row_num, sku=sku, field="unit_selling_price", message="Invalid numeric price"))
                row_has_error = True
                price = 0.0

            if not row_has_error:
                valid_count += 1

            if len(preview_rows) < 10:
                preview_rows.append({
                    "row_number": row_num,
                    "sale_id": sale_id,
                    "sold_at": date_str,
                    "sku": sku,
                    "quantity": qty,
                    "unit_selling_price": price,
                    "unit_cost": float(cost_str) if cost_str else 0.0,
                    "status": "VALID" if not row_has_error else "INVALID"
                })

        total_rows = row_num - 1
        return schemas.CsvPreviewResponse(
            file_type="sales",
            total_rows=total_rows,
            valid_rows_count=valid_count,
            invalid_rows_count=total_rows - valid_count,
            preview_data=preview_rows,
            errors=errors[:50]
        )

    @staticmethod
    def import_sales_csv(db: Session, file_content: str) -> schemas.CsvImportCommitResponse:
        preview = CsvService.preview_sales_csv(db, file_content)
        if preview.invalid_rows_count > 0:
            return schemas.CsvImportCommitResponse(
                success=False,
                imported_count=0,
                skipped_count=preview.total_rows,
                message=f"Import blocked: CSV contains {preview.invalid_rows_count} invalid row(s). Please fix and retry."
            )

        f = io.StringIO(file_content)
        reader = csv.DictReader(f)
        product_sku_map = {p.sku.upper(): p for p in db.query(models.Product).all()}

        # Group rows by sale_id
        sales_by_id: Dict[str, Dict[str, Any]] = {}
        for raw_row in reader:
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
            sale_id = row["sale_id"]
            if sale_id not in sales_by_id:
                try:
                    dt = datetime.strptime(row["sold_at"], "%Y-%m-%d")
                except ValueError:
                    dt = datetime.fromisoformat(row["sold_at"])
                sales_by_id[sale_id] = {
                    "sold_at": dt,
                    "items": []
                }

            sku = row["sku"].upper()
            prod = product_sku_map[sku]
            qty = int(row["quantity"])
            price = float(row["unit_selling_price"])
            cost = float(row.get("unit_cost", "") or prod.purchase_cost)

            sales_by_id[sale_id]["items"].append({
                "product": prod,
                "quantity": qty,
                "unit_selling_price": price,
                "unit_cost_snapshot": cost,
                "line_total": round(qty * price, 2)
            })

        imported_sales_count = 0
        for sale_id, data in sales_by_id.items():
            total_amt = sum(item["line_total"] for item in data["items"])
            sale = models.Sale(
                invoice_no=sale_id,
                sold_at=data["sold_at"],
                total_amount=round(total_amt, 2),
                source="import",
                notes="Imported via historical CSV"
            )
            db.add(sale)
            db.flush()

            for it in data["items"]:
                sale_item = models.SaleItem(
                    sale_id=sale.id,
                    product_id=it["product"].id,
                    quantity=it["quantity"],
                    unit_selling_price=it["unit_selling_price"],
                    unit_cost_snapshot=it["unit_cost_snapshot"],
                    line_total=it["line_total"]
                )
                db.add(sale_item)

            imported_sales_count += 1

        db.commit()
        return schemas.CsvImportCommitResponse(
            success=True,
            imported_count=imported_sales_count,
            skipped_count=0,
            message=f"Successfully imported {imported_sales_count} historical sales transactions."
        )
