# ============================================================
# JWT AUTHENTICATION MODULE
# ============================================================
# Handles token creation, validation, and password hashing.
# Used by auth_routes.py and as a dependency in protected routes.

import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

load_dotenv()

# ---- Configuration from environment ----
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production-please")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# ---- OAuth2 scheme (reads Bearer token from Authorization header) ----
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---- Pydantic models ----
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: str
    username: str
    role: str
    name: str
    department: str


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    user_id: str
    name: str
    username: str
    password: str
    role: str
    department: str


# ---- Utility functions ----
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id", "")
        username: str = payload.get("sub", "")
        role: str = payload.get("role", "")
        name: str = payload.get("name", "")
        department: str = payload.get("department", "")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenData(
            user_id=user_id,
            username=username,
            role=role,
            name=name,
            department=department,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---- FastAPI dependency: get current user from token ----
async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    return decode_access_token(token)


# ---- Role-based access helpers ----
def require_role(*allowed_roles: str):
    """
    Returns a FastAPI dependency that checks the JWT user's role
    against the allowed list. Use as:
        @router.get("/...", dependencies=[Depends(require_role("ADMIN", "TEAM_LEAD"))])
    or inject as a parameter to also get the user:
        def endpoint(user: TokenData = Depends(require_role("ADMIN"))):
    """

    async def _check(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(allowed_roles)}. You have: {current_user.role}",
            )
        return current_user

    return _check
