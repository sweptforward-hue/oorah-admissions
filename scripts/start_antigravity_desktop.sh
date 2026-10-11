#!/usr/bin/env bash
#
# start_antigravity_desktop.sh
# Orchestrates virtual display, window manager, VNC, noVNC, and Antigravity desktop.
#

set -euo pipefail

DISPLAY_NUM=99
DISPLAY_VAR=":${DISPLAY_NUM}"
VNC_PORT=5900
NOVNC_PORT=6080
WORKSPACE_DIR="${1:-/workspaces/oorah-admissions}"

echo "============================================="
echo " Starting Antigravity Desktop Environment    "
echo "============================================="

# 1. Terminate any previous instances cleanly
echo "[1/6] Cleaning up old display & VNC sessions..."
pkill -f "Xvfb ${DISPLAY_VAR}" || true
pkill -f "x11vnc.*${DISPLAY_VAR}" || true
pkill -f "websockify.*${NOVNC_PORT}" || true
pkill -f "/usr/share/antigravity/antigravity" || true

rm -f "/tmp/.X${DISPLAY_NUM}-lock" "/tmp/.X11-unix/X${DISPLAY_NUM}" 2>/dev/null || true
sleep 1

# 2. Start Xvfb (Virtual Framebuffer)
echo "[2/6] Starting Xvfb on display ${DISPLAY_VAR} (1920x1080x24)..."
Xvfb "${DISPLAY_VAR}" -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /tmp/xvfb.log 2>&1 &
XVFB_PID=$!
sleep 2

if ! ps -p "${XVFB_PID}" > /dev/null; then
    echo "Error: Xvfb failed to start. Log output:"
    cat /tmp/xvfb.log
    exit 1
fi
echo "  ✓ Xvfb running (PID ${XVFB_PID})"

export DISPLAY="${DISPLAY_VAR}"

# 3. Start Window Manager (fluxbox)
echo "[3/6] Starting fluxbox window manager..."
fluxbox > /tmp/fluxbox.log 2>&1 &
FLUX_PID=$!
sleep 1
echo "  ✓ Fluxbox running (PID ${FLUX_PID})"

# 4. Start VNC Server (x11vnc) & noVNC bridge (websockify)
echo "[4/6] Starting x11vnc and websockify bridge on port ${NOVNC_PORT}..."
x11vnc -display "${DISPLAY_VAR}" -nopw -listen 127.0.0.1 -xkb -ncache 10 -forever -rfbport "${VNC_PORT}" > /tmp/x11vnc.log 2>&1 &
VNC_PID=$!
sleep 1

websockify --web /usr/share/novnc "${NOVNC_PORT}" 127.0.0.1:"${VNC_PORT}" > /tmp/websockify.log 2>&1 &
WEBSOCK_PID=$!
sleep 2

if ! ps -p "${WEBSOCK_PID}" > /dev/null; then
    echo "Error: websockify failed to start. Log output:"
    cat /tmp/websockify.log
    exit 1
fi
echo "  ✓ x11vnc (PID ${VNC_PID}) & websockify (PID ${WEBSOCK_PID}) active"

# 5. Pre-seed authentication data
echo "[5/6] Seeding Antigravity authentication profile..."
python3 /workspaces/oorah-admissions/scripts/seed_antigravity_auth.py

# 6. Launch Antigravity Desktop
echo "[6/6] Launching Antigravity 2.0 desktop application..."
nohup /usr/bin/antigravity --no-sandbox "${WORKSPACE_DIR}" > /tmp/antigravity-gui.log 2>&1 &
AG_PID=$!
sleep 3

if ps -p "${AG_PID}" > /dev/null; then
    echo "  ✓ Antigravity desktop running (PID ${AG_PID})"
else
    echo "Warning: Antigravity process exited immediately. Inspect /tmp/antigravity-gui.log:"
    cat /tmp/antigravity-gui.log
    exit 1
fi

echo ""
echo "============================================="
echo " 🎉 Antigravity Desktop is Ready!"
echo " Access URL via browser:"
echo "   http://localhost:${NOVNC_PORT}/vnc.html"
echo " (Or open forwarded port ${NOVNC_PORT} in GitHub Codespaces)"
echo "============================================="
