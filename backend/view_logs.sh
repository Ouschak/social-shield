#!/bin/bash
# Real-time backend log viewer for Creator Shield

echo "🔍 Creator Shield - Real-Time Backend Logs"
echo "=========================================="
echo ""
echo "Watching for detection events..."
echo "Press Ctrl+C to stop"
echo ""

# Follow the uvicorn process output
# This will show all API requests and detection logs
tail -f /proc/$(pgrep -f "uvicorn app.main:app")/fd/1 2>/dev/null || \
journalctl -f _PID=$(pgrep -f "uvicorn app.main:app") 2>/dev/null || \
echo "Note: Backend is running but output may not be visible. Try running backend in foreground mode."
