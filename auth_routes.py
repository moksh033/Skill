# ============================================================
# AUTH ROUTES — Login / Register / Me
# ============================================================

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    LoginRequest,
    RegisterRequest,
    Token,
    TokenData,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from database import user_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(data: RegisterRequest):
    """Register a new user with a hashed password."""
    if user_collection.find_one({"username": data.username}) is not None:
        raise HTTPException(status_code=400, detail="Username already exists")

    if user_collection.find_one({"user_id": data.user_id}) is not None:
        raise HTTPException(status_code=400, detail="User ID already exists")

    hashed = hash_password(data.password)
    user_collection.insert_one(
        {
            "user_id": data.user_id,
            "name": data.name,
            "username": data.username,
            "password": hashed,
            "role": data.role.upper(),
            "department": data.department,
        }
    )

    access_token = create_access_token(
        data={
            "sub": data.username,
            "user_id": data.user_id,
            "role": data.role.upper(),
            "name": data.name,
            "department": data.department,
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
def login(data: LoginRequest):
    """Authenticate with username + password, returns JWT."""
    user = user_collection.find_one({"username": data.username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Support legacy users without passwords (seeded data) —
    # treat any password as valid for them, but warn.
    if "password" not in user or not user["password"]:
        # Auto-set password for seeded users on first login
        hashed = hash_password(data.password)
        user_collection.update_one(
            {"username": data.username},
            {"$set": {"password": hashed}},
        )
    else:
        if not verify_password(data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token = create_access_token(
        data={
            "sub": user["username"],
            "user_id": user["user_id"],
            "role": user["role"],
            "name": user["name"],
            "department": user.get("department", ""),
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me")
def get_me(current_user: TokenData = Depends(get_current_user)):
    """Return the current user's info from the JWT."""
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "name": current_user.name,
        "role": current_user.role,
        "department": current_user.department,
    }
