# DukaanSaathi AI – Academic Demonstration Script (Viva / Evaluation Guide)

This script provides a 5 to 7 minute presentation walkthrough designed for academic evaluators, professors, and external examiners reviewing the DukaanSaathi AI project.

---

## 🎙️ Step 1: Introduction & Problem Context (1 Minute)

> *"Good morning respected evaluators. Today I present **DukaanSaathi AI**, an intelligent inventory management and demand prediction system designed specifically for small Indian retail grocery and Kirana stores."*

**Key Points to Mention:**
- Kirana stores manage hundreds of FMCG products and daily commodities.
- Most shopkeepers order stock based on guesswork, leading to stockouts on weekends and working capital locked up in dead stock.
- DukaanSaathi AI integrates **descriptive analytics** with **machine learning time-series regression** and **transparent, explainable reorder guidance**.

---

## 🖥️ Step 2: The Executive Dashboard & Data Transparency (1.5 Minutes)

**Action:** Open the web app on `http://localhost:5173`.
1. **Point out the Top Banner:**
   - Notice the **"Realistic Kirana Demo Dataset Active"** banner. Explain that in academic prototypes, distinguishing synthetic demo data from real live shop data is critical for scientific honesty.
2. **Review the Executive KPIs:**
   - **Sales Revenue (₹)** and **Units Sold** over the selected time horizon (e.g. Last 30 Days).
   - **Estimated Gross Profit & Margin (%)**: Highlight that this metric uses **snapshot purchase costing** at the moment of sale. Mention that the system honestly discloses the *cost data coverage percentage* rather than fabricating 100% precision.
   - **Inventory Valuation**: Shows total capital currently invested in stock at wholesale cost vs expected retail return.
3. **Inspect the Revenue Trajectory Chart:**
   - Point out the weekend revenue spikes (Saturday/Sunday lifts), which reflect realistic grocery shopping patterns in Indian neighborhoods.

---

## 🛒 Step 3: Fast Point of Sale (POS) & Strict Stock Guards (1 Minute)

**Action:** Navigate to **POS Sales Entry** in the sidebar.
1. **Search & Select an Item:**
   - Type *"Atta"* or *"Parle-G"* in the quick search bar.
   - Add items to the bill.
2. **Demonstrate Stock Safety Guards:**
   - Try adding more units than available in current stock. Show how the application instantly caps the quantity and warns the user: *"Cannot add more: only X available in stock"*, preventing phantom negative stock.
3. **Complete the Sale:**
   - Click **"Complete Sale & Deduct Stock"**.
   - Show the generated invoice receipt with the invoice number (e.g., `INV-2026...`).
   - Mention that stock was deducted atomically and cost was recorded in the transaction.

---

## ⚠️ Step 4: Low-Stock Alerts & Inward Stock Movement (1 Minute)

**Action:** Navigate to **Stock & Alerts** in the sidebar.
1. **Show the 3-Tier Alert Badges:**
   - **Out of Stock**: `Surf Excel Detergent` (0 units).
   - **Critical Low Stock**: `Amul Salted Butter` (3 units, below 50% of reorder threshold).
   - **Low Stock**: `Fortune Sunflower Oil` (7 units, below threshold of 15).
2. **Execute a Quick Inward Restock:**
   - Click **"Quick Inward Restock"** directly on an alert card.
   - The modal pre-fills with the required shortfall. Click **"Commit Stock Movement"**.
   - Show how the stock movement is appended to the **Audit Trail Log** with timestamp, reason, and reference ID.

---

## 🧠 Step 5: Machine Learning Demand Forecasting & Reorder Guidance (2 Minutes)

**Action:** Navigate to **Demand & Reorder** in the sidebar.
1. **Explain the Zero-Data-Leakage Methodology (FR-10):**
   - Direct the evaluator's attention to the top **Model Evaluation Banner**.
   - Explain: *"We do not randomly split time-series rows, as that causes future data leakage. Instead, we use a **chronological holdout split** where the model is trained on history prior to the cutoff date and evaluated on future days."*
   - Show the **Ridge ML MAE** (Mean Absolute Error in units/day) compared against the **Naive 7-day Moving Average Baseline MAE**, demonstrating empirical improvement.
2. **Inspect the Demand Curve:**
   - Show the 7-day future projection line comparing ML predicted units against the baseline.
3. **Show the Mathematical Explainability Card (FR-09):**
   - Explain the transparent procurement formula:
     $$\text{Suggested Order} = \max(0, (\text{Forecast Demand} + \text{Safety Buffer}) - \text{Current Stock})$$
   - Show the interactive slider: adjusting the Safety Stock Buffer from 10% to 30% dynamically updates the suggested replenishment units.
   - Highlight the **Academic Disclaimer**: *"Predictions are labelled statistical estimates, not guarantees. The shopkeeper retains full autonomy over procurement."*

---

## 📋 Step 6: CSV Pre-Flight Validation & Conclusion (30 Seconds)

**Action:** Navigate to **CSV Import / Data**.
1. **Show the Pre-Flight Validator:**
   - Explain that retailers can download standard templates or upload CSV files. The parser inspects columns, data types, and checks for duplicate SKUs before committing to SQLite.
2. **Concluding Statement:**
   > *"DukaanSaathi AI delivers a practical, explainable, and scientifically sound software system that empowers small retailers with modern data analytics and machine learning without unnecessary complexity."*
