import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import models

DEMO_KIRANA_PRODUCTS = [
    {
        "sku": "SKU-ATTA-001",
        "name": "Aashirvaad Shudh Chakki Atta 5kg",
        "category": "Staples & Grains",
        "unit": "packet",
        "purchase_cost": 235.0,
        "selling_price": 275.0,
        "current_stock": 18,
        "reorder_level": 15,
        "supplier_name": "ITC Distribution Hub",
        "daily_base_demand": 4.5,
        "notes": "Pilsbury & Aashirvaad high volume staple"
    },
    {
        "sku": "SKU-SALT-002",
        "name": "Tata Salt Vacuum Evaporated Iodized 1kg",
        "category": "Staples & Grains",
        "unit": "packet",
        "purchase_cost": 21.0,
        "selling_price": 28.0,
        "current_stock": 42,
        "reorder_level": 20,
        "supplier_name": "Tata Consumer Products",
        "daily_base_demand": 5.0,
        "notes": "Fastest moving daily commodity"
    },
    {
        "sku": "SKU-RICE-003",
        "name": "India Gate Basmati Rice Feast Rozzana 5kg",
        "category": "Staples & Grains",
        "unit": "packet",
        "purchase_cost": 415.0,
        "selling_price": 490.0,
        "current_stock": 11,
        "reorder_level": 10,
        "supplier_name": "KRBL Logistics",
        "daily_base_demand": 1.8,
        "notes": "Premium long grain rice"
    },
    {
        "sku": "SKU-DAL-004",
        "name": "Tata Sampann Unpolished Toor Dal 1kg",
        "category": "Pulses & Legumes",
        "unit": "packet",
        "purchase_cost": 138.0,
        "selling_price": 168.0,
        "current_stock": 21,
        "reorder_level": 12,
        "supplier_name": "Tata Consumer Products",
        "daily_base_demand": 3.2,
        "notes": "Unpolished high-protein dal"
    },
    {
        "sku": "SKU-OIL-005",
        "name": "Fortune Sunlite Refined Sunflower Oil 1L",
        "category": "Edible Oils",
        "unit": "pouch",
        "purchase_cost": 124.0,
        "selling_price": 145.0,
        "current_stock": 7,  # LOW STOCK
        "reorder_level": 15,
        "supplier_name": "Adani Wilmar Agency",
        "daily_base_demand": 3.8,
        "notes": "Essential cooking medium"
    },
    {
        "sku": "SKU-OIL-006",
        "name": "Saffola Gold Pro Healthy Lifestyle Edible Oil 1L",
        "category": "Edible Oils",
        "unit": "pouch",
        "purchase_cost": 158.0,
        "selling_price": 188.0,
        "current_stock": 25,
        "reorder_level": 10,
        "supplier_name": "Marico Ltd Dist.",
        "daily_base_demand": 2.0,
        "notes": "Blended oil for heart health"
    },
    {
        "sku": "SKU-MILK-007",
        "name": "Amul Taaza Homogenised Toned Milk 1L",
        "category": "Dairy & Bakery",
        "unit": "carton",
        "purchase_cost": 62.0,
        "selling_price": 72.0,
        "current_stock": 38,
        "reorder_level": 25,
        "supplier_name": "Gujarat Co-op Milk Mktg",
        "daily_base_demand": 8.0,
        "notes": "Daily staple long life tetra pack"
    },
    {
        "sku": "SKU-BUTR-008",
        "name": "Amul Pasteurised Salted Butter 500g",
        "category": "Dairy & Bakery",
        "unit": "box",
        "purchase_cost": 238.0,
        "selling_price": 275.0,
        "current_stock": 3,  # CRITICAL LOW
        "reorder_level": 12,
        "supplier_name": "Gujarat Co-op Milk Mktg",
        "daily_base_demand": 2.5,
        "notes": "Refrigerated dairy stock"
    },
    {
        "sku": "SKU-BRED-009",
        "name": "Britannia 100% Whole Wheat Bread 400g",
        "category": "Dairy & Bakery",
        "unit": "packet",
        "purchase_cost": 38.0,
        "selling_price": 50.0,
        "current_stock": 16,
        "reorder_level": 12,
        "supplier_name": "Britannia Daily Delivery",
        "daily_base_demand": 5.5,
        "notes": "Short shelf life morning item"
    },
    {
        "sku": "SKU-MAGI-010",
        "name": "Maggi 2-Minute Masala Instant Noodles 280g (4-Pack)",
        "category": "Snacks & Packaged Food",
        "unit": "pack",
        "purchase_cost": 50.0,
        "selling_price": 60.0,
        "current_stock": 48,
        "reorder_level": 20,
        "supplier_name": "Nestle India Direct",
        "daily_base_demand": 6.2,
        "notes": "Very fast moving impulse snack"
    },
    {
        "sku": "SKU-PRLE-011",
        "name": "Parle-G Gluco Biscuits 250g Family Pack",
        "category": "Snacks & Packaged Food",
        "unit": "packet",
        "purchase_cost": 24.0,
        "selling_price": 30.0,
        "current_stock": 55,
        "reorder_level": 25,
        "supplier_name": "Parle Products Agency",
        "daily_base_demand": 7.0,
        "notes": "Consistent daily volume driver"
    },
    {
        "sku": "SKU-GDAY-012",
        "name": "Britannia Good Day Cashew Cookies 200g",
        "category": "Snacks & Packaged Food",
        "unit": "packet",
        "purchase_cost": 37.0,
        "selling_price": 45.0,
        "current_stock": 26,
        "reorder_level": 15,
        "supplier_name": "Britannia Industries",
        "daily_base_demand": 3.5,
        "notes": "Popular tea-time biscuit"
    },
    {
        "sku": "SKU-BHUJ-013",
        "name": "Haldiram's Nagpur Aloo Bhujia 400g",
        "category": "Snacks & Packaged Food",
        "unit": "packet",
        "purchase_cost": 94.0,
        "selling_price": 115.0,
        "current_stock": 18,
        "reorder_level": 10,
        "supplier_name": "Haldiram Snacks Distributor",
        "daily_base_demand": 2.4,
        "notes": "Savory namkeen favourite"
    },
    {
        "sku": "SKU-TEA-014",
        "name": "Brooke Bond Red Label Strong Blend Tea 500g",
        "category": "Beverages",
        "unit": "box",
        "purchase_cost": 218.0,
        "selling_price": 260.0,
        "current_stock": 15,
        "reorder_level": 10,
        "supplier_name": "Hindustan Unilever Ltd",
        "daily_base_demand": 2.2,
        "notes": "Chai staple for household customers"
    },
    {
        "sku": "SKU-COF-015",
        "name": "Nescafe Classic 100% Pure Instant Coffee Jar 50g",
        "category": "Beverages",
        "unit": "jar",
        "purchase_cost": 152.0,
        "selling_price": 185.0,
        "current_stock": 14,
        "reorder_level": 8,
        "supplier_name": "Nestle India Direct",
        "daily_base_demand": 1.2,
        "notes": "Steady winter/evening demand"
    },
    {
        "sku": "SKU-SPIC-016",
        "name": "MDH Deggi Mirch Red Chilli Powder 100g",
        "category": "Spices & Masalas",
        "unit": "box",
        "purchase_cost": 72.0,
        "selling_price": 88.0,
        "current_stock": 24,
        "reorder_level": 10,
        "supplier_name": "Mahashian Di Hatti Ltd",
        "daily_base_demand": 1.5,
        "notes": "Natural color and pungency spice"
    },
    {
        "sku": "SKU-SPIC-017",
        "name": "Everest Turmeric / Haldi Powder 200g",
        "category": "Spices & Masalas",
        "unit": "box",
        "purchase_cost": 56.0,
        "selling_price": 70.0,
        "current_stock": 28,
        "reorder_level": 12,
        "supplier_name": "Everest Spices Agency",
        "daily_base_demand": 1.6,
        "notes": "Pure aromatic turmeric"
    },
    {
        "sku": "SKU-SOAP-018",
        "name": "Dettol Original Germ Protection Bathing Soap 125g",
        "category": "Personal Care",
        "unit": "bar",
        "purchase_cost": 42.0,
        "selling_price": 55.0,
        "current_stock": 30,
        "reorder_level": 15,
        "supplier_name": "Reckitt Benckiser",
        "daily_base_demand": 3.0,
        "notes": "Antibacterial hygiene soap"
    },
    {
        "sku": "SKU-PAST-019",
        "name": "Colgate Strong Teeth Dental Cream Toothpaste 200g",
        "category": "Personal Care",
        "unit": "tube",
        "purchase_cost": 96.0,
        "selling_price": 120.0,
        "current_stock": 19,
        "reorder_level": 10,
        "supplier_name": "Colgate-Palmolive India",
        "daily_base_demand": 1.9,
        "notes": "Family oral hygiene leader"
    },
    {
        "sku": "SKU-DET-020",
        "name": "Surf Excel Easy Wash Detergent Powder 1kg",
        "category": "Household & Cleaning",
        "unit": "pouch",
        "purchase_cost": 122.0,
        "selling_price": 148.0,
        "current_stock": 0,  # OUT OF STOCK!
        "reorder_level": 12,
        "supplier_name": "Hindustan Unilever Ltd",
        "daily_base_demand": 2.5,
        "notes": "Premium laundry detergent"
    }
]

DEMO_ELECTRICALS_PRODUCTS = [
    {
        "sku": "ELEC-WIRE-001",
        "name": "Polycab 1.5 sq mm FR Flame Retardant Copper Wire (90m Coil, Red)",
        "category": "Wires & Cables",
        "unit": "coil",
        "purchase_cost": 1420.0,
        "selling_price": 1750.0,
        "current_stock": 15,
        "reorder_level": 8,
        "supplier_name": "Polycab India Regional Distributor",
        "daily_base_demand": 2.5,
        "notes": "Fastest moving residential house wiring coil"
    },
    {
        "sku": "ELEC-WIRE-002",
        "name": "Polycab 2.5 sq mm FR House Wire (90m Coil, Blue)",
        "category": "Wires & Cables",
        "unit": "coil",
        "purchase_cost": 2180.0,
        "selling_price": 2650.0,
        "current_stock": 12,
        "reorder_level": 6,
        "supplier_name": "Polycab India Regional Distributor",
        "daily_base_demand": 1.8,
        "notes": "Heavy load power line wire for AC & Geyser circuits"
    },
    {
        "sku": "ELEC-WIRE-003",
        "name": "Havells LifeLine Plus 4.0 sq mm Copper Wire (90m Coil, Green)",
        "category": "Wires & Cables",
        "unit": "coil",
        "purchase_cost": 3450.0,
        "selling_price": 4100.0,
        "current_stock": 5,
        "reorder_level": 4,
        "supplier_name": "Havells India Agency",
        "daily_base_demand": 0.8,
        "notes": "Main distribution board feeder cable"
    },
    {
        "sku": "ELEC-LED-004",
        "name": "Philips Stellar Bright 9W B22 Cool Day White LED Bulb",
        "category": "Lighting & LED",
        "unit": "pcs",
        "purchase_cost": 75.0,
        "selling_price": 110.0,
        "current_stock": 52,
        "reorder_level": 25,
        "supplier_name": "Signify / Philips Distribution",
        "daily_base_demand": 7.5,
        "notes": "Daily consumer lighting replacement staple"
    },
    {
        "sku": "ELEC-LED-005",
        "name": "Syska 12W Emergency Inverter B22 LED Bulb (4hr Backup)",
        "category": "Lighting & LED",
        "unit": "pcs",
        "purchase_cost": 260.0,
        "selling_price": 349.0,
        "current_stock": 6,  # LOW STOCK
        "reorder_level": 12,
        "supplier_name": "Syska LED Trade Agency",
        "daily_base_demand": 2.2,
        "notes": "High demand during summer power cuts"
    },
    {
        "sku": "ELEC-LED-006",
        "name": "Crompton 20W Slim LED Batten Tube Light 4ft",
        "category": "Lighting & LED",
        "unit": "pcs",
        "purchase_cost": 185.0,
        "selling_price": 260.0,
        "current_stock": 28,
        "reorder_level": 15,
        "supplier_name": "Crompton Greaves Consumer",
        "daily_base_demand": 4.0,
        "notes": "Standard living room ceiling batten"
    },
    {
        "sku": "ELEC-LED-007",
        "name": "Wipro 7W Deep Recessed COB Ceiling Downlight Warm White",
        "category": "Lighting & LED",
        "unit": "pcs",
        "purchase_cost": 280.0,
        "selling_price": 390.0,
        "current_stock": 14,
        "reorder_level": 8,
        "supplier_name": "Wipro Enterprises",
        "daily_base_demand": 1.5,
        "notes": "False ceiling decorative architectural light"
    },
    {
        "sku": "ELEC-SW-008",
        "name": "Anchor Roma Classic 6A 1-Way Modular Switch (White)",
        "category": "Switches & Sockets",
        "unit": "pcs",
        "purchase_cost": 24.0,
        "selling_price": 36.0,
        "current_stock": 140,
        "reorder_level": 50,
        "supplier_name": "Panasonic Life Solutions (Anchor)",
        "daily_base_demand": 14.0,
        "notes": "Highest volume electrical hardware item"
    },
    {
        "sku": "ELEC-SW-009",
        "name": "Anchor Roma 16A 3-Pin Power Socket with Safety Shutter",
        "category": "Switches & Sockets",
        "unit": "pcs",
        "purchase_cost": 78.0,
        "selling_price": 115.0,
        "current_stock": 38,
        "reorder_level": 20,
        "supplier_name": "Panasonic Life Solutions (Anchor)",
        "daily_base_demand": 5.0,
        "notes": "Geyser, Microwave, and AC power point"
    },
    {
        "sku": "ELEC-SW-010",
        "name": "Havells Crabtree 2-Module Modular Cover Plate with Base Frame",
        "category": "Switches & Sockets",
        "unit": "pcs",
        "purchase_cost": 58.0,
        "selling_price": 85.0,
        "current_stock": 32,
        "reorder_level": 15,
        "supplier_name": "Havells India Agency",
        "daily_base_demand": 3.2,
        "notes": "Premium polycarbonate plate"
    },
    {
        "sku": "ELEC-MCB-011",
        "name": "Schneider Electric Easy9 16A Single Pole C-Curve MCB",
        "category": "Circuit Protection & MCB",
        "unit": "pcs",
        "purchase_cost": 145.0,
        "selling_price": 210.0,
        "current_stock": 22,
        "reorder_level": 10,
        "supplier_name": "Schneider Electric Partner",
        "daily_base_demand": 2.8,
        "notes": "Essential overload and short-circuit protection"
    },
    {
        "sku": "ELEC-MCB-012",
        "name": "Havells Euro-II 32A Double Pole Main Isolator Switch",
        "category": "Circuit Protection & MCB",
        "unit": "pcs",
        "purchase_cost": 310.0,
        "selling_price": 425.0,
        "current_stock": 3,  # CRITICAL LOW
        "reorder_level": 8,
        "supplier_name": "Havells India Agency",
        "daily_base_demand": 1.4,
        "notes": "Main switchboard incoming isolator"
    },
    {
        "sku": "ELEC-MCB-013",
        "name": "Legrand DX3 40A 2-Pole 30mA RCCB Residual Current Breaker",
        "category": "Circuit Protection & MCB",
        "unit": "pcs",
        "purchase_cost": 1680.0,
        "selling_price": 2150.0,
        "current_stock": 0,  # OUT OF STOCK!
        "reorder_level": 4,
        "supplier_name": "Legrand India Supply",
        "daily_base_demand": 0.6,
        "notes": "Human electric shock prevention device"
    },
    {
        "sku": "ELEC-FAN-014",
        "name": "Crompton Hill Briz 1200mm High Speed Ceiling Fan (Brown)",
        "category": "Fans & Appliances",
        "unit": "pcs",
        "purchase_cost": 1550.0,
        "selling_price": 1950.0,
        "current_stock": 9,
        "reorder_level": 5,
        "supplier_name": "Crompton Greaves Consumer",
        "daily_base_demand": 1.2,
        "notes": "All-season household ceiling fan"
    },
    {
        "sku": "ELEC-FAN-015",
        "name": "Havells Ventil Air DB 150mm Louver Kitchen Exhaust Fan",
        "category": "Fans & Appliances",
        "unit": "pcs",
        "purchase_cost": 1120.0,
        "selling_price": 1420.0,
        "current_stock": 7,
        "reorder_level": 4,
        "supplier_name": "Havells India Agency",
        "daily_base_demand": 0.9,
        "notes": "Kitchen and bathroom exhaust fan"
    },
    {
        "sku": "ELEC-CON-016",
        "name": "Supreme 25mm Heavy Duty PVC Conduit Pipe 3m (Bundle of 10)",
        "category": "Conduits & Piping",
        "unit": "bundle",
        "purchase_cost": 420.0,
        "selling_price": 560.0,
        "current_stock": 14,
        "reorder_level": 8,
        "supplier_name": "Supreme Industries Hardware",
        "daily_base_demand": 2.0,
        "notes": "Slab & wall concealed electrical pipe"
    },
    {
        "sku": "ELEC-CON-017",
        "name": "Goldmedal Modular Concealed Metal GI Junction Box (8 Module)",
        "category": "Conduits & Piping",
        "unit": "pcs",
        "purchase_cost": 82.0,
        "selling_price": 120.0,
        "current_stock": 26,
        "reorder_level": 12,
        "supplier_name": "Goldmedal Electricals",
        "daily_base_demand": 3.0,
        "notes": "Galvanised iron back box for brick walls"
    },
    {
        "sku": "ELEC-ACC-018",
        "name": "Steel Grip PVC Electrical Insulation Tape (Pack of 5 Rolls)",
        "category": "Electrical Accessories",
        "unit": "roll",
        "purchase_cost": 48.0,
        "selling_price": 70.0,
        "current_stock": 45,
        "reorder_level": 20,
        "supplier_name": "Pidilite Industries",
        "daily_base_demand": 6.0,
        "notes": "Everyday electrician joint tape"
    },
    {
        "sku": "ELEC-ACC-019",
        "name": "GM 3012 4+1 Surge Protector Extension Spike Strip 2m",
        "category": "Electrical Accessories",
        "unit": "pcs",
        "purchase_cost": 320.0,
        "selling_price": 450.0,
        "current_stock": 11,
        "reorder_level": 6,
        "supplier_name": "GM Modular Pvt Ltd",
        "daily_base_demand": 1.5,
        "notes": "Computer and television surge strip"
    },
    {
        "sku": "ELEC-ACC-020",
        "name": "Taparia 813 Heavy Duty Line Neon Voltage Tester Screwdriver",
        "category": "Electrical Accessories",
        "unit": "pcs",
        "purchase_cost": 55.0,
        "selling_price": 80.0,
        "current_stock": 20,
        "reorder_level": 10,
        "supplier_name": "Taparia Tools Distribution",
        "daily_base_demand": 1.8,
        "notes": "Electrician and DIY basic hand tester tool"
    }
]

def seed_demo_data(db: Session, force_reset: bool = False, store_type: str = "kirana"):
    """
    Populates SQLite database with 20 realistic products and 60 days of historical sales.
    Supports either 'kirana' (Grocery) or 'electricals' (Electrical Goods & Hardware Store).
    """
    existing_products_count = db.query(models.Product).count()
    if existing_products_count > 0 and not force_reset:
        return

    if force_reset:
        db.query(models.SaleItem).delete()
        db.query(models.StockMovement).delete()
        db.query(models.Sale).delete()
        db.query(models.Product).delete()
        db.query(models.StoreSetting).delete()
        db.commit()

    is_elec = store_type.lower() == "electricals"
    shop_name = "Sharma Ji Electricals & Hardware Store" if is_elec else "Gupta Ji Kirana & General Store"
    products_source = DEMO_ELECTRICALS_PRODUCTS if is_elec else DEMO_KIRANA_PRODUCTS

    # Create Store Setting
    setting = models.StoreSetting(
        shop_name=shop_name,
        currency_symbol="₹",
        default_forecast_horizon_days=7,
        default_safety_stock_percent=20.0,
        default_lead_time_days=3,
        is_demo_data=True,
        store_type=store_type.lower()
    )
    db.add(setting)

    # Insert Products
    created_products = []
    demand_profiles = {}
    for item in products_source:
        prod = models.Product(
            sku=item["sku"],
            name=item["name"],
            category=item["category"],
            unit=item["unit"],
            purchase_cost=item["purchase_cost"],
            selling_price=item["selling_price"],
            current_stock=item["current_stock"],
            reorder_level=item["reorder_level"],
            supplier_name=item["supplier_name"],
            notes=item["notes"],
            active_status=True
        )
        db.add(prod)
        db.flush()
        created_products.append(prod)
        demand_profiles[prod.id] = item["daily_base_demand"]

        # Initial stock movement
        init_movement = models.StockMovement(
            product_id=prod.id,
            movement_type="in",
            quantity=prod.current_stock + 120,
            occurred_at=datetime.utcnow() - timedelta(days=65),
            reason="Opening Stock",
            reference_id=f"OPEN-{prod.sku}",
            notes=f"Opening inventory baseline for {store_type.capitalize()} retail store"
        )
        db.add(init_movement)

    db.commit()

    # Generate 60 days of realistic sales history
    random.seed(42 if is_elec else 101)
    now = datetime.utcnow()
    total_sales_created = 0

    for day_offset in range(60, 0, -1):
        sale_date = now - timedelta(days=day_offset)
        dow = sale_date.weekday()
        is_weekend = dow in [5, 6]
        
        # Weekend / weekday traffic
        weekend_factor = 1.35 if is_weekend else 1.0
        num_transactions = int(random.randint(8, 14 if is_elec else 16) * weekend_factor)

        for tx_idx in range(num_transactions):
            invoice_num = f"DEMO-{sale_date.strftime('%Y%m%d')}-{tx_idx+1:03d}"
            hour = random.randint(9, 20)
            minute = random.randint(0, 59)
            sold_time = sale_date.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            basket_size = random.choices([1, 2, 3], weights=[55, 35, 10])[0]
            chosen_products = random.sample(created_products, basket_size)

            sale = models.Sale(
                invoice_no=invoice_num,
                sold_at=sold_time,
                total_amount=0.0,
                source="demo",
                notes=f"Walk-in {'Electrician / Customer' if is_elec else 'Kirana customer'} transaction"
            )
            db.add(sale)
            db.flush()

            sale_total = 0.0
            for prod in chosen_products:
                base_demand = demand_profiles[prod.id]
                if random.random() > (base_demand / 12.0 + (0.15 if is_weekend else 0.0)):
                    continue

                # Quantities for electricals: switches & LED bulbs can sell in higher units (e.g. 2 to 6)
                if "Switch" in prod.name or "Bulb" in prod.name or "Tape" in prod.name:
                    qty = random.choices([1, 2, 4, 6], weights=[40, 35, 15, 10])[0]
                else:
                    qty = random.choices([1, 2, 3], weights=[75, 20, 5])[0]

                line_total = round(prod.selling_price * qty, 2)
                sale_total += line_total

                sale_item = models.SaleItem(
                    sale_id=sale.id,
                    product_id=prod.id,
                    quantity=qty,
                    unit_selling_price=prod.selling_price,
                    unit_cost_snapshot=prod.purchase_cost,
                    line_total=line_total
                )
                db.add(sale_item)

                out_mv = models.StockMovement(
                    product_id=prod.id,
                    movement_type="out",
                    quantity=-qty,
                    occurred_at=sold_time,
                    reason=f"Sale ({'Electrical Hardware' if is_elec else 'Kirana'})",
                    reference_id=invoice_num,
                    notes=f"Sold {qty} {prod.unit} via invoice {invoice_num}"
                )
                db.add(out_mv)

            if sale_total > 0:
                sale.total_amount = round(sale_total, 2)
                total_sales_created += 1
            else:
                db.delete(sale)

    db.commit()
    print(f"DukaanSaathi [{store_type.upper()}] Demo Data initialized: 20 products, {total_sales_created} sales transactions over 60 days.")
