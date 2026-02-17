from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager

from app.core.db import engine, Base
# Import all models to register them with Base.metadata
from app.modules.auth.models import User
from app.modules.products.models import Product
from app.modules.shifts.models import Shift
from app.modules.sales.models import Sale, SaleItem, VoidItem
from app.modules.debts.models import Debt, DebtPayment
from app.modules.expenses.models import Expense

from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.shifts.router import router as shifts_router
from app.modules.sales.router import router as sales_router
from app.modules.debts.router import router as debts_router
from app.modules.expenses.router import router as expenses_router
from app.modules.reports.router import router as reports_router
# from app.core.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Create all database tables automatically.
    This ensures DB schema matches ORM models on every deployment.
    """
    print("🔄 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified successfully!")
    
    # Start Scheduler
    # start_scheduler()
    # print("⏰ Bg Scheduler started!")
    
    yield
    # Shutdown: cleanup if needed
    print("👋 Application shutting down...")


app = FastAPI(
    title="Smart Control POS",
    version="4.0",
    description="Anti-Fraud Local-First POS System",
    lifespan=lifespan
)

# CORS Middleware (Executed first)
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*" # Keep wildcard as fallback for other dev scenarios if needed, but origins are explicit above
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint (UptimeRobot pings this to prevent spin-down)
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Smart Control is running"}


# Telegram Diagnostika (Token va Chat ID tekshiruvi)
@app.get("/telegram-test")
def telegram_test():
    from app.core.config import settings
    from app.core.notifications import send_telegram_alert, get_formatted_time
    
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    
    diagnostics = {
        "token_exists": bool(token),
        "token_preview": f"{token[:10]}...{token[-5:]}" if token else "NONE",
        "chat_id_exists": bool(chat_id),
        "chat_id": chat_id if chat_id else "NONE",
    }
    
    if not token or not chat_id:
        diagnostics["error"] = "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID topilmadi!"
        diagnostics["fix"] = "Render Dashboard → Environment Variables → qo'shing"
        return diagnostics
    
    # Haqiqiy test xabar yuborish
    try:
        test_msg = f"🔧 <b>TELEGRAM TEST</b>\n\n✅ Smart Control bot ishlayapti!\n📅 Vaqt: {get_formatted_time()}"
        send_telegram_alert(test_msg)
        diagnostics["message_sent"] = True
        diagnostics["status"] = "SUCCESS"
    except Exception as e:
        diagnostics["message_sent"] = False
        diagnostics["error"] = str(e)
    
    return diagnostics


# Include Routers (MUST BE BEFORE STATIC FILES TO AVOID 405 ON POST)
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(shifts_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(debts_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

# Mount Static Files for Frontend (Catch-all at the end)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")