from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # DATABASE
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost/smart_control_dev"
    
    # SECURITY
    SECRET_KEY: str = "super_secret_key_change_this_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # TELEGRAM NOTIFICATIONS
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
