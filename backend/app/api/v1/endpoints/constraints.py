"""
Constraint Rules & Weights API Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import ConstraintRule, Institution
from backend.app.schemas.schemas import ConstraintRuleUpdate

router = APIRouter()


@router.get("")
def get_constraints(db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    rule = db.query(ConstraintRule).filter(ConstraintRule.institution_id == inst.id).first()
    if not rule:
        rule = ConstraintRule(institution_id=inst.id)
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule


@router.put("")
def update_constraints(req: ConstraintRuleUpdate, db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    rule = db.query(ConstraintRule).filter(ConstraintRule.institution_id == inst.id).first()
    if not rule:
        rule = ConstraintRule(institution_id=inst.id)
        db.add(rule)

    for k, v in req.dict().items():
        setattr(rule, k, v)

    db.commit()
    db.refresh(rule)
    return rule
