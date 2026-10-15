from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, SessionLocal, Base
from .demo_seed import seed_demo_data
from .routers import products, stock, sales, analytics, forecast, import_export, settings as settings_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Auto-seed initial demo dataset if database is empty
try:
    with SessionLocal() as db_session:
        seed_demo_data(db_session, force_reset=False)
except Exception as e:
    print(f"Initial seed warning: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DukaanSaathi AI - Smart Inventory and Demand Prediction System for Kirana & Retail Stores"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(stock.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(forecast.router, prefix=settings.API_V1_STR)
app.include_router(import_export.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "timestamp": "2026-10-15T21:30:00Z"
    }
