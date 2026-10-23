#!/usr/bin/env python3
"""
Autonomous Button Clicker & Browser Runner for Oorah Admissions Platform
Executes browser automation across all primary routes, clicks interactive buttons,
submits forms, asserts zero unhandled runtime errors, and collects visual evidence.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
NODE_SCRIPT = BASE_DIR / "scripts" / "execute-all-button-clicks.mjs"
REPORT_FILE = BASE_DIR / "scripts" / "autonomous_button_clicks_report.json"
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
AUDIT_DIR = BASE_DIR / "audit_evidence"

REQUIRED_SCREENSHOTS = [
    "staff_roster_verified.png",
    "staff_new_verified.png",
    "staff_detail_verified.png",
    "admin_client_categories_verified.png",
    "universal_deletion_verified.png",
    "persistent_chat_verified.png"
]

def log(msg, level="INFO"):
    colors = {
        "INFO": "\033[36m",
        "SUCCESS": "\033[32m",
        "WARN": "\033[33m",
        "ERROR": "\033[31m",
        "RESET": "\033[0m"
    }
    c = colors.get(level, colors["INFO"])
    reset = colors["RESET"]
    print(f"{c}[{level}]{reset} {msg}")

def verify_screenshots():
    log("\n--- Verifying Visual Evidence Artifacts ---", "INFO")
    all_ok = True
    for fname in REQUIRED_SCREENSHOTS:
        p1 = SCREENSHOTS_DIR / fname
        p2 = AUDIT_DIR / fname
        if p1.exists() and p1.stat().st_size > 10000:
            log(f"✔ screenshots/{fname} exists ({p1.stat().st_size:,} bytes)", "SUCCESS")
        else:
            log(f"✖ Missing or empty screenshots/{fname}", "ERROR")
            all_ok = False

        if p2.exists() and p2.stat().st_size > 10000:
            log(f"✔ audit_evidence/{fname} exists ({p2.stat().st_size:,} bytes)", "SUCCESS")
        else:
            log(f"✖ Missing or empty audit_evidence/{fname}", "ERROR")
            all_ok = False
    return all_ok

def main():
    log("=================================================================", "INFO")
    log("   OORAH ADMISSIONS — AUTONOMOUS BUTTON CLICK RUNNER (PYTHON)    ", "SUCCESS")
    log("=================================================================", "INFO")

    if not NODE_SCRIPT.exists():
        log(f"Node runner script not found at {NODE_SCRIPT}", "ERROR")
        sys.exit(1)

    log(f"Executing Playwright runner via Node.js: {NODE_SCRIPT}...", "INFO")
    cmd = ["node", str(NODE_SCRIPT)]
    result = subprocess.run(cmd, cwd=str(BASE_DIR), capture_output=False)

    if result.returncode != 0:
        log(f"Execution failed with returncode {result.returncode}", "ERROR")
        sys.exit(result.returncode)

    ok = verify_screenshots()
    if not ok:
        log("Evidence verification failed: Some screenshots are missing or empty.", "ERROR")
        sys.exit(1)

    if REPORT_FILE.exists():
        with open(REPORT_FILE, "r") as f:
            report = json.load(f)
        log(f"\n✔ Total Autonomous Actions Executed: {report.get('totalActions', 0)}", "SUCCESS")
        log(f"✔ Report File: {REPORT_FILE}", "INFO")

    log("=================================================================", "SUCCESS")
    log("   ✔ AUTONOMOUS BUTTON CLICKING & EVIDENCE GATHERING COMPLETE    ", "SUCCESS")
    log("=================================================================", "SUCCESS")

if __name__ == "__main__":
    main()
