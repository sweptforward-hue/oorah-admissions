#!/usr/bin/env python3
"""
Seed Antigravity profile state.vscdb with the active OAuth token from antigravity-cli.
"""

import json
import os
import sqlite3
from pathlib import Path

CLI_TOKEN_FILE = Path.home() / ".gemini" / "antigravity-cli" / "antigravity-oauth-token"

TARGET_DIRS = [
    Path.home() / ".config" / "Antigravity" / "User" / "globalStorage",
    Path.home() / ".config" / "Antigravity IDE" / "User" / "globalStorage",
]

def seed_auth():
    if not CLI_TOKEN_FILE.exists():
        print(f"Error: Token file not found at {CLI_TOKEN_FILE}")
        return False

    with open(CLI_TOKEN_FILE, "r") as f:
        data = json.load(f)

    token_info = data.get("token", {})
    access_token = token_info.get("access_token", "")
    refresh_token = token_info.get("refresh_token", "")
    email = "rachellicohenca1@gmail.com"
    name = "rachellicohenca1"

    if not access_token:
        print("Error: No access_token found in token file.")
        return False

    auth_status = json.dumps({
        "apiKey": access_token,
        "email": email,
        "name": name,
    })

    print(f"Seeding auth for {email} into Antigravity profile databases...")

    for storage_dir in TARGET_DIRS:
        storage_dir.mkdir(parents=True, exist_ok=True)
        db_path = storage_dir / "state.vscdb"
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS ItemTable (key TEXT PRIMARY KEY, value TEXT)")
        
        # Insert/replace antigravityAuthStatus
        cur.execute(
            "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)",
            ("antigravityAuthStatus", auth_status),
        )
        
        conn.commit()
        conn.close()
        print(f"  -> Seeded {db_path}")

    print("Antigravity profile authentication seeding complete.")
    return True

if __name__ == "__main__":
    seed_auth()
