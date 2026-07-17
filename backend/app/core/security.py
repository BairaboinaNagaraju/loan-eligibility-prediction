from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from app.core.config import settings

# Use bcrypt directly to avoid passlib's __about__ incompatibility with bcrypt>=4.0
try:
    import bcrypt

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    def get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

except ImportError:
    # Fallback to passlib if bcrypt direct is not available
    from passlib.context import CryptContext
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return _pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(password: str) -> str:
        return _pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: Union[timedelta, None] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
