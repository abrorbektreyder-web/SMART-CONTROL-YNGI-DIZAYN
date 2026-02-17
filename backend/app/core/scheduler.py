from datetime import datetime
import pytz
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.modules.products.models import Product, ProductBatch
from app.core.notifications import send_telegram_alert
from apscheduler.triggers.cron import CronTrigger
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def check_expiring_products():
    """
    Checks for expiring products and sends notifications ONLY if status changes.
    Runs once daily via cron.
    """
    db = SessionLocal()
    try:
        print("🔍 Checking expiring products...")
        # Get all active batches for active products
        batches = db.query(ProductBatch).join(Product).filter(Product.status == "active").all()
        print(f"✅ Found {len(batches)} batches.")
        today = datetime.now() 
        
        notification_count = 0
        
        for batch in batches:
            expiry = batch.expiry_date
            if not expiry:
                continue
                
            delta = expiry - today
            remaining_days = delta.days + 1  # Include today
            
            new_status = None # Default is None (OK)
            
            # RULE CHECK
            if batch.product.product_type == "dairy":
                if remaining_days <= 3:
                    new_status = "RED"
            elif batch.product.product_type == "long_term":
                if remaining_days <= 15:
                    new_status = "RED"
                elif remaining_days <= 30:
                    new_status = "YELLOW"
            
            # Retrieve previous status
            prev_status = batch.current_status
            
            # LOGIC:
            # If status changed AND new status is WARNING (RED/YELLOW) -> Notify & Update
            # If status changed to OK (from RED/YELLOW) -> Update only (no notify)
            
            if new_status != prev_status:
                batch.current_status = new_status
                db.add(batch)
                
                # Only notify if entering a warning state
                if new_status in ["RED", "YELLOW"]:
                    icon = "🔴" if new_status == "RED" else "🟡"
                    # Format message
                    msg = (
                        f"⚠️ <b>Muddati oz qolgan mahsulot</b>\n\n"
                        f"Mahsulot nomi: <b>{batch.product.name}</b>\n"
                        f"Qoldiq: {batch.quantity} dona\n"
                        f"Qolgan kun: <b>{remaining_days}</b>\n"
                        f"Status: <b>{new_status}</b>"
                    )
                    
                    try:
                        send_telegram_alert(msg)
                        notification_count += 1
                    except Exception as e:
                        print(f"Failed to send alert for batch {batch.id}: {e}")
        
        db.commit()
        print(f"✅ Checked expiring products: Sent {notification_count} alerts.")
            
    except Exception as e:
        print(f"❌ Error in check_expiring_products: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    # Run every day at 09:00 AM
    trigger = CronTrigger(hour=9, minute=0)
    scheduler.add_job(check_expiring_products, trigger=trigger, id="check_expiry_job", replace_existing=True)
    scheduler.start()
