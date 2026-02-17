from pydantic import BaseModel
from typing import Optional
from app.modules.auth.models import UserRole

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    full_name: str
    password: str
    role: UserRole = UserRole.CASHIER

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    redirect_url: str
    id: int

class UserResponse(UserBase):
    id: int
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True
