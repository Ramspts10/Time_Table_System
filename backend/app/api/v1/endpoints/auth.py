"""
Authentication Endpoint API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.models import User
from backend.app.schemas.schemas import LoginRequest, TokenSchema, UserResponse

router = APIRouter()


@router.post("/login", response_model=TokenSchema)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    token = create_access_token(subject=user.id, role=user.role.value if hasattr(user.role, "value") else str(user.role))
    return TokenSchema(
        access_token=token,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )
