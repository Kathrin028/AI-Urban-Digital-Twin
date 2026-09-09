import sys
import os
sys.path.append(os.path.abspath('backend'))
from app.core.security import verify_password

hashes = {
    "demo@urbanmind.ai": "$2b$12$xsM6M.mHSoPYfy2aINCg4uGHPLv9WPZGrOcG5vP/tQ1eK8MXji9aC",
    "dept@urbanmind.ai": "$2b$12$OzSW8NA9fJQzgtv8oM./PuKtA83F.3kvNl9weTgG7mVL0B5sRI13i"
}

common_passwords = ["demo", "demo123", "admin", "admin123", "dept", "dept123", "password", "password123", "urbanmind", "urbanmind123"]

for email, h in hashes.items():
    for p in common_passwords:
        if verify_password(p, h):
            print(f"{email} password is {p}")
            break
    else:
        print(f"{email} password not in list")
