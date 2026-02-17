import requests
from datetime import datetime
from app.core.config import settings


def get_formatted_time() -> str:
    """Hozirgi vaqtni DD.MM.YYYY HH:MM:SS formatda qaytaradi"""
    return datetime.now().strftime("%d.%m.%Y %H:%M:%S")


def send_telegram_alert(message: str):
    """
    Sends a real message to the Owner's Telegram Channel via Bot API.
    Xatolik bo'lsa server to'xtab qolmaydi — faqat log yoziladi.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    # Log to console for local debugging
    print(f"\n📲 [TELEGRAM LOG]: {message}\n")

    if not token or not chat_id:
        print("⚠️ Telegram Token or Chat ID is missing in .env. Skipping alert.")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print("✅ Telegram xabar yuborildi!")
        else:
            print(f"❌ Telegram API Error ({response.status_code}): {response.text}")
    except requests.exceptions.Timeout:
        print("❌ Telegram API Timeout — xabar yuborilmadi (server javob bermadi)")
    except requests.exceptions.ConnectionError:
        print("❌ Telegram API Connection Error — internet aloqasi yo'q")
    except Exception as e:
        print(f"❌ Telegram xatolik (server to'xtamadi): {e}")
