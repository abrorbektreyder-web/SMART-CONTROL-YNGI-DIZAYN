"""
Access Control Dependencies
===========================
Foydalanuvchi autentifikatsiyasi va rol tekshiruvi uchun dependency funksiyalari.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User, UserRole


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Token orqali foydalanuvchini olish va bloklangan emasligini tekshirish.
    Agar is_active=False bo'lsa -> 403 Forbidden.
    """
    # current_user is now a User object (not dict) from get_current_user
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foydalanuvchi topilmadi"
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan! Profilingiz bloklangan."
        )
    
    return current_user


async def require_owner(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Faqat OWNER roliga ega foydalanuvchilarga ruxsat berish.
    """
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu amal faqat Owner uchun ruxsat etilgan"
        )
    
    return current_user
