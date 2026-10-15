from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..demo_seed import seed_demo_data

router = APIRouter(prefix="/settings", tags=["Store Settings"])

@router.get("", response_model=schemas.StoreSettingResponse)
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(models.StoreSetting).first()
    if not setting:
        setting = models.StoreSetting(
            shop_name="Apna Kirana Store",
            currency_symbol="₹",
            default_forecast_horizon_days=7,
            default_safety_stock_percent=20.0,
            default_lead_time_days=3,
            is_demo_data=True
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("", response_model=schemas.StoreSettingResponse)
def update_settings(update_in: schemas.StoreSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.StoreSetting).first()
    if not setting:
        setting = models.StoreSetting()
        db.add(setting)

    update_data = update_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(setting, k, v)

    db.commit()
    db.refresh(setting)
    return setting

@router.post("/reset-demo")
def reset_to_demo_dataset(store_type: str = "kirana", db: Session = Depends(get_db)):
    target_type = "electricals" if store_type.lower() == "electricals" else "kirana"
    seed_demo_data(db, force_reset=True, store_type=target_type)
    shop_title = "Electricals & Hardware Store" if target_type == "electricals" else "Kirana Store"
    return {
        "success": True,
        "message": f"Store successfully reset to standard 20 {shop_title} products and 60 days of realistic sales history."
    }

@router.post("/clear-all")
def clear_all_store_data(db: Session = Depends(get_db)):
    db.query(models.SaleItem).delete()
    db.query(models.StockMovement).delete()
    db.query(models.Sale).delete()
    db.query(models.Product).delete()
    
    setting = db.query(models.StoreSetting).first()
    if setting:
        setting.is_demo_data = False
    db.commit()
    return {
        "success": True,
        "message": "All inventory, sales records, and audit history have been cleared."
    }
