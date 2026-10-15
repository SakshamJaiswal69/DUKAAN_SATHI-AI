from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..services.csv_service import CsvService

router = APIRouter(prefix="/import", tags=["CSV Import & Templates"])

@router.get("/template/products")
def download_products_template():
    csv_data = CsvService.get_products_template_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_template.csv"}
    )

@router.get("/template/sales")
def download_sales_template():
    csv_data = CsvService.get_sales_template_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_template.csv"}
    )

@router.get("/template/electricals_products")
def download_electricals_products_template():
    csv_data = CsvService.get_electricals_products_template_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=electricals_products_template.csv"}
    )

@router.get("/template/electricals_sales")
def download_electricals_sales_template():
    csv_data = CsvService.get_electricals_sales_template_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=electricals_sales_template.csv"}
    )

@router.post("/preview/products", response_model=schemas.CsvPreviewResponse)
async def preview_products(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files (.csv) are supported")
    content = await file.read()
    try:
        decoded_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            decoded_text = content.decode("latin1")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to decode file. Please ensure UTF-8 encoding.")
    return CsvService.preview_products_csv(db, decoded_text)

@router.post("/commit/products", response_model=schemas.CsvImportCommitResponse)
async def commit_products(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files (.csv) are supported")
    content = await file.read()
    decoded_text = content.decode("utf-8-sig", errors="replace")
    return CsvService.import_products_csv(db, decoded_text)

@router.post("/preview/sales", response_model=schemas.CsvPreviewResponse)
async def preview_sales(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files (.csv) are supported")
    content = await file.read()
    try:
        decoded_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            decoded_text = content.decode("latin1")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to decode file. Please ensure UTF-8 encoding.")
    return CsvService.preview_sales_csv(db, decoded_text)

@router.post("/commit/sales", response_model=schemas.CsvImportCommitResponse)
async def commit_sales(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files (.csv) are supported")
    content = await file.read()
    decoded_text = content.decode("utf-8-sig", errors="replace")
    return CsvService.import_sales_csv(db, decoded_text)
