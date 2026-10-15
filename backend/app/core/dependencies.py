from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError
from app.core.config import settings
from app.services.auth_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception
        
    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")

    if user.get("role") == "department" and not user.get("department"):
        email = str(user.get("email") or "").lower()
        name = str(user.get("name") or "").lower()
        if "waste" in email or "waste" in name or "garbage" in email or "garbage" in name:
            user["department"] = "Waste Management"
        elif "sanitation" in email or "sanitation" in name or "drainage" in email:
            user["department"] = "Sanitation"
        elif "road" in email or "road" in name or "infra" in email:
            user["department"] = "Roads & Infrastructure"
        elif "water" in email or "water" in name:
            user["department"] = "Water Supply"
        elif "electric" in email or "electric" in name or "power" in email:
            user["department"] = "Electricity"

    return user

async def get_current_active_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_department_user(current_user: dict = Depends(get_current_user)) -> dict:
    role = current_user.get("role")
    if role not in ["admin", "department"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
