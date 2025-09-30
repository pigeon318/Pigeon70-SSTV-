#!/bin/bash

# Pigeon70 SSTV Desktop Launcher
# Activates virtual environment and runs the desktop application

echo "🐦 Starting Pigeon70 SSTV Desktop..."

# Check if virtual environment exists
if [ ! -d "sstv_env" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: ./install_arch.sh"
    exit 1
fi

# Activate virtual environment and run the desktop app
source sstv_env/bin/activate && python3 desktop_sstv.py



