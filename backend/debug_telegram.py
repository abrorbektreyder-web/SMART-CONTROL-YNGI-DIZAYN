import sys
import os
import requests

# Add current dir to path
sys.path.append(os.getcwd())

from app.core.config import settings

def debug_telegram():
    print("🔍 DIAGNOSTICS: Telegram Configuration")
    
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    
    # 1. Check Config
    if not token:
        print("❌ ERROR: TELEGRAM_BOT_TOKEN is None or Empty.")
    else:
        masked_token = token[:5] + "..." + token[-5:] if len(token) > 10 else "***"
        print(f"✅ TELEGRAM_BOT_TOKEN loaded: {masked_token}")
        
    if not chat_id:
        print("❌ ERROR: TELEGRAM_CHAT_ID is None or Empty.")
    else:
        print(f"✅ TELEGRAM_CHAT_ID loaded: {chat_id}")

    if not token or not chat_id:
        print("🚫 Skipping network test due to missing config.")
        return

    # 2. Network Test
    print("\n🚀 Sending Test Message to Telegram...")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": "🛠 TEST MESSAGE: Debugging connection from Smart Control POS.",
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"📡 API Response Code: {response.status_code}")
        print(f"📄 API Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Message sent!")
        else:
            print("❌ FAILURE: Telegram rejected the request.")
            
    except Exception as e:
        print(f"❌ EXCEPTION during request: {e}")

if __name__ == "__main__":
    debug_telegram()
