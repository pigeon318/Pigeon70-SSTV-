#!/bin/bash

# Pigeon70 SSTV Desktop - Arch Linux Installation Script

echo "🐦 Installing Pigeon70 SSTV Desktop for Arch Linux..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Don't run this script as root!"
   echo "Run it as a regular user. It will ask for sudo when needed."
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo pacman -Syu --noconfirm

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo pacman -S --noconfirm \
    python \
    python-pip \
    python-numpy \
    python-scipy \
    python-pillow \
    portaudio \
    tk \
    alsa-utils \
    pulseaudio \
    pulseaudio-alsa

# Create virtual environment and install Python audio dependencies
echo "🎵 Creating virtual environment and installing Python audio dependencies..."
python3 -m venv sstv_env
source sstv_env/bin/activate && pip install \
    sounddevice \
    soundfile \
    pillow

# Check if installation was successful
echo "✅ Checking installation..."

# Test Python imports
source sstv_env/bin/activate && python3 -c "
import sys
try:
    import numpy
    import sounddevice
    import soundfile
    from PIL import Image
    import tkinter
    print('✅ All dependencies installed successfully!')
except ImportError as e:
    print(f'❌ Missing dependency: {e}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "🚀 To run the desktop application:"
    echo "   ./run_desktop.sh"
    echo ""
    echo "🔧 To test audio devices:"
    echo "   python3 -c \"import sounddevice as sd; print(sd.query_devices())\""
    echo ""
    echo "📡 For real SSTV with radio:"
    echo "   - Connect radio audio to computer"
    echo "   - Use 'Transmit Audio' to send through speakers"
    echo "   - Use 'Receive Audio' to capture from microphone"
    echo ""
    echo "🎯 Features:"
    echo "   ✅ Full GUI with image preview"
    echo "   ✅ Real-time audio transmission/reception"
    echo "   ✅ Progress tracking"
    echo "   ✅ Test image generation"
    echo "   ✅ Full encode/decode cycle testing"
    echo "   ✅ Arch Linux optimized"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi

