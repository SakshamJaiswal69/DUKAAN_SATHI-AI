# DukaanSaathi AI – Smart Inventory & Demand Prediction System

> **A Data Analytics & Machine Learning-Based Inventory Management and Demand Forecasting System for Indian Retail (Kirana & Electricals Shops).**  
> Built for Academic MVP Evaluation & Retail Operations.

---

## 🌟 Executive Summary

Small retail shops (*Kirana stores*) in India manage hundreds of fast-moving consumer goods (FMCG) and staples without formal demand forecasting tools, relying on manual intuition. This leads to frequent stockouts on weekend peaks and tied-up working capital in slow-moving inventory.

**DukaanSaathi AI** bridges this gap by combining:
1. **Real-time Inventory & Stock Management**: Strict non-negative stock guards, unit cost snapshotting, and multi-tier reorder threshold alerts (*Out of Stock*, *Critical*, *Low Stock*).
2. **Point-of-Sale (POS) Fast Billing**: Quick walk-in sales recording with instant stock deduction and line item profit tracking.
3. **Exploratory Data Analytics (EDA)**: Category revenue mix, sales velocity trends, inventory valuation (cost vs retail), and dead stock identification with transparent, disclosed criteria.
4. **Time-Aware Machine Learning Demand Forecasting**: Multi-horizon predictions (7, 14, 30 days) using lag features (`lag_1`, `lag_7`, `rolling_mean_7`, `day_of_week`, `is_weekend`) with **chronological holdout validation** (zero data leakage) benchmarked against a 7-day Naive moving average.
5. **Explainable Reorder Guidance**: Formula-based suggestions:
   $$\text{Suggested Order} = \max(0, (\text{Forecast Demand} + \text{Safety Buffer}) - \text{Current Stock})$$
   Exposing every variable and assumption to preserve the shopkeeper's final judgment.
6. **Robust CSV Pre-Flight Validation**: Bulk import for products and historical sales with preview, duplicate SKU checks, and downloadable templates.

---

## 🏗️ Technical Architecture

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2.
- **Analytics & ML**: Pandas, NumPy, Scikit-Learn (`Ridge` time-series regression with recursive multi-step forecasting).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Testing**: Pytest automated test suite covering inventory guards, sales deductions, and ML time splits.
- **Region & Currency**: INR (₹), Asia/Kolkata timezone.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Start backend API server (runs on http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8000
```
*Note: On first startup, the database auto-populates with 20 realistic Kirana products and 60 days of historical sales transactions.*

### 3. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Tests

Run the backend Pytest test suite:
```bash
cd backend
python -m pytest tests -v
```
All 11 unit tests verify:
- Initial stock movements and duplicate SKU rejection.
- Strict non-negative stock guards and insufficient stock errors.
- Real-time POS sales stock deduction and snapshot purchase costing.
- KPI calculations (Revenue, Gross Profit, Margin %).
- Time-series lag feature engineering with zero leakage.
- Chronological holdout evaluation and reorder formula arithmetic.

---

## 📁 Project Structure

```
dukaansaathi-ai/
├── backend/
│   ├── app/
│   │   ├── config.py                 # App settings & environment config
│   │   ├── database.py               # SQLite engine & session setup
│   │   ├── demo_seed.py              # 20 Kirana SKUs & 60-day realistic sales generator
│   │   ├── models.py                 # SQLAlchemy relational ORM models
│   │   ├── schemas.py                # Pydantic v2 validation models
│   │   ├── main.py                   # FastAPI entrypoint with CORS & routes
│   │   ├── routers/
│   │   │   ├── products.py           # Product CRUD & category endpoints
│   │   │   ├── stock.py              # Inward/outward movements & low-stock alerts
│   │   │   ├── sales.py              # POS transactions & invoice history
│   │   │   ├── analytics.py          # Dashboard KPIs, EDA, and slow-moving items
│   │   │   ├── forecast.py           # ML demand prediction & holdout evaluation
│   │   │   ├── import_export.py      # CSV pre-flight validation & template generator
│   │   │   └── settings.py           # Store parameters & 1-click demo reset
│   │   └── services/
│   │       ├── inventory_service.py  # Stock logic & negative stock prevention
│   │       ├── sales_service.py      # Multi-item billing & cost snapshotting
│   │       ├── analytics_service.py  # KPI math & category share analysis
│   │       ├── ml_service.py         # Time-series regression & reorder engine
│   │       └── csv_service.py        # CSV validator & row error reporter
│   ├── tests/
│   │   ├── test_inventory.py         # Inventory CRUD & stock movement tests
│   │   ├── test_sales.py             # POS sales billing & KPI tests
│   │   └── test_ml_forecast.py       # ML holdout & reorder formula tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Top header with demo status banner
│   │   │   ├── Sidebar.tsx           # Navigation sidebar with alert counters
│   │   │   └── MetricCard.tsx        # Executive KPI cards
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx     # Executive KPIs, trend charts, watchlist
│   │   │   ├── ProductsPage.tsx      # Searchable catalog & Add/Edit modal
│   │   │   ├── StockPage.tsx         # Low-stock alerts & audit trail movements
│   │   │   ├── SalesPage.tsx         # Interactive POS cash register billing
│   │   │   ├── AnalyticsPage.tsx     # Category mix, sales velocity, dead stock
│   │   │   ├── ForecastPage.tsx      # ML demand curves & transparent reorders
│   │   │   ├── ImportPage.tsx        # CSV upload, pre-import validation table
│   │   │   └── SettingsHelpPage.tsx  # Store configuration, reset demo, viva guide
│   │   ├── services/
│   │   │   └── api.ts                # Typed async fetch API client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interface definitions
│   │   ├── App.tsx                   # Main layout container
│   │   └── index.css                 # Tailwind CSS styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── sample_data/
│   ├── sample_kirana_products.csv    # 20 standard Indian Kirana retail SKUs
│   └── sample_kirana_sales.csv       # Sample historical sales transactions
├── DEMO_SCRIPT.md                    # Academic viva presentation walkthrough
└── README.md
```

---

## 📊 Machine Learning Methodology

### 1. Data Integrity & Zero Data Leakage
- Daily calendar series are created per SKU. Missing sales dates are filled with `0` (confirmed zero-sales days, distinct from missing data).
- Time-ordered split: Chronologically partitions training data prior to a cutoff date ($T - 7\text{d}$) and evaluates on unseen holdout days. Random train/test split is strictly forbidden for time-series.

### 2. Feature Engineering
- **Autoregressive Lags**: `lag_1`, `lag_2`, `lag_7` (captures day-of-week cyclical purchasing).
- **Rolling Windows**: `rolling_mean_7`, `rolling_mean_14` computed on past days only.
- **Calendar Signals**: `day_of_week` (0 to 6), `is_weekend` (1 or 0 to capture Indian weekend grocery surges).

### 3. Evaluation & Baseline Benchmarking
- **Model Metric**: Mean Absolute Error (MAE) measured against the actual units sold in the holdout period.
- **Baseline Comparison**: Compared against a Naive 7-day Moving Average to demonstrate empirical machine learning improvement.

### 4. Transparent Reorder Recommendation Formula
$$\text{Gross Required} = \lceil \text{Forecast Demand} \rceil + \lceil \text{Forecast Demand} \times \frac{\text{Safety Buffer \%}}{100} \rceil$$
$$\text{Suggested Order} = \max(0, \text{Gross Required} - \text{Current Stock})$$

---

## 🔒 Security, Integrity & Privacy

- Parameterized database operations via SQLAlchemy ORM (SQL injection protected).
- Strict non-negative stock guards prevent phantom inventory.
- Snapshot cost recording guarantees historical profit integrity if wholesale prices change.
- Demo data banner informs the user whether numbers are synthetic or real.
- No third-party API keys or sensitive external data transmissions.
