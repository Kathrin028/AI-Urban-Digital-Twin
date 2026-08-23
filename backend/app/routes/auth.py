from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import register_citizen, authenticate_user
from app.core.dependencies import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    return await register_citizen(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    return await authenticate_user(login_data)

# Support Swagger UI authentication natively if needed
@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    login_data = UserLogin(email=form_data.username, password=form_data.password)
    return await authenticate_user(login_data)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
