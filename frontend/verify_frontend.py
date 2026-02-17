
import os

files = [
    "owner.html",
    "cashier.html",
    "accountant.html"
]

base_path = "c:\\Users\\Asus\\Desktop\\CAPCUT\\Smart control\\frontend"
status = {}

for f in files:
    path = os.path.join(base_path, f)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()
            if "STRICT AUTH CHECK" in content and f'role !== "{f.replace(".html", "")}"' in content:
                status[f] = "OK"
            else:
                status[f] = "FAIL (Content mismatch)"
    else:
        status[f] = "FAIL (Missing)"

print("STATUS REPORT:")
for k, v in status.items():
    print(f"{k.upper().replace('.HTML', '')} UI: {v}")
