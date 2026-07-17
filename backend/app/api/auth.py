from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate, Token

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Create a new user account. First user registered is automatically an admin."""
    # Check if username exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered.")

    # Check if email exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email address already registered.")

    # First user OR username 'admin' → admin role
    is_first_user = db.query(User).count() == 0
    role = "admin" if (is_first_user or user_in.username.lower() == "admin") else "user"

    db_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """JSON login endpoint — returns JWT access token."""
    if not payload.username or not payload.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(user.username, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.post("/login/json", response_model=Token)
def login_json_alias(payload: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """Alias for /login (for backward compatibility with existing frontend calls)."""
    return login_json(payload, db)


@router.post("/login-form-data", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    """OAuth2 form-data login (for Swagger UI compatibility)."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(user.username, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserOut)
def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    """Get currently authenticated user profile."""
    return current_user


@router.put("/profile", response_model=UserOut)
def update_user_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update email, full name, or password."""
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        current_user.email = user_in.email

    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name

    if user_in.password:
        current_user.hashed_password = get_password_hash(user_in.password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
