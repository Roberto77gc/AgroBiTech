#!/bin/bash

# Cursor Launcher Script
# This script helps launch Cursor in different environments

CURSOR_PATH="$HOME/Applications/cursor/squashfs-root/AppRun"

# Check if we're in a graphical environment
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    echo "Warning: No display server detected. Cursor is a graphical application."
    echo "To run Cursor, make sure you have:"
    echo "1. A display server running (X11 or Wayland)"
    echo "2. Proper DISPLAY or WAYLAND_DISPLAY environment variables set"
    echo ""
    echo "If you're using SSH, try: ssh -X username@hostname"
    echo "Or for better performance: ssh -Y username@hostname"
    echo ""
    read -p "Do you want to try launching anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if AppRun exists
if [ ! -f "$CURSOR_PATH" ]; then
    echo "Error: Cursor not found at $CURSOR_PATH"
    echo "Please make sure Cursor is properly installed."
    exit 1
fi

echo "Launching Cursor..."
echo "If you see GPU/OpenGL errors, they are usually harmless and Cursor should still work."
echo ""

# Launch Cursor with common workarounds for headless environments
exec "$CURSOR_PATH" --no-sandbox --disable-gpu-sandbox --disable-dev-shm-usage "$@"