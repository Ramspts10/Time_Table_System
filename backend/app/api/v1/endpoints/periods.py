"""
Period Configuration API Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import PeriodConfig, Institution
from backend.app.schemas.schemas import PeriodConfigCreate, PeriodConfigResponse

router = APIRouter()


@router.get("", response_model=PeriodConfigResponse)
def get_period_config(db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    cfg = db.query(PeriodConfig).filter(PeriodConfig.institution_id == inst.id).first()
    if not cfg:
        cfg = PeriodConfig(institution_id=inst.id)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.put("", response_model=PeriodConfigResponse)
def update_period_config(req: PeriodConfigCreate, db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    cfg = db.query(PeriodConfig).filter(PeriodConfig.institution_id == inst.id).first()
    if not cfg:
        cfg = PeriodConfig(institution_id=inst.id)
        db.add(cfg)

    for k, v in req.dict().items():
        setattr(cfg, k, v)

    db.commit()
    db.refresh(cfg)
    return cfg
