#!/usr/bin/env python3
"""
Quick test script for Pigeon70 SSTV Desktop
Tests all components without GUI
"""

import sys
import numpy as np
from PIL import Image

def test_dependencies():
    """Test if all dependencies are available"""
    print("🔍 Testing dependencies...")
    
    try:
        import numpy
        print("✅ numpy")
    except ImportError:
        print("❌ numpy - install with: pip install numpy")
        return False
    
    try:
        import sounddevice
        print("✅ sounddevice")
    except ImportError:
        print("❌ sounddevice - install with: pip install sounddevice")
        return False
    
    try:
        import soundfile
        print("✅ soundfile")
    except ImportError:
        print("❌ soundfile - install with: pip install soundfile")
        return False
    
    try:
        from PIL import Image
        print("✅ Pillow (PIL)")
    except ImportError:
        print("❌ Pillow - install with: pip install pillow")
        return False
    
    try:
        import tkinter
        print("✅ tkinter")
    except ImportError:
        print("❌ tkinter - install with: sudo pacman -S tk")
        return False
    
    return True

def test_audio_devices():
    """Test audio device access"""
    print("\n🎵 Testing audio devices...")
    
    try:
        import sounddevice as sd
        devices = sd.query_devices()
        print(f"✅ Found {len(devices)} audio devices")
        
        # Test default device
        default_input = sd.default.device[0]
        default_output = sd.default.device[1]
        print(f"✅ Default input: {default_input}")
        print(f"✅ Default output: {default_output}")
        
        return True
    except Exception as e:
        print(f"❌ Audio device error: {e}")
        return False

def test_sstv_engine():
    """Test SSTV encoding/decoding"""
    print("\n🔧 Testing SSTV engine...")
    
    try:
        # Import our SSTV class
        sys.path.append('.')
        from desktop_sstv import Pigeon70SSTV
        
        sstv = Pigeon70SSTV()
        print("✅ SSTV engine initialized")
        
        # Create test image
        test_image = Image.new('RGB', (320, 240), color='red')
        print("✅ Test image created")
        
        # Test encoding (without saving)
        print("🔄 Testing encoding...")
        audio = sstv.encode_image(test_image)
        
        if audio is not None:
            print(f"✅ Encoding successful ({len(audio)/44100:.1f}s audio)")
            
            # Test decoding
            print("🔄 Testing decoding...")
            decoded = sstv.decode_audio(audio)
            
            if decoded is not None:
                print("✅ Decoding successful")
                return True
            else:
                print("❌ Decoding failed")
                return False
        else:
            print("❌ Encoding failed")
            return False
            
    except Exception as e:
        print(f"❌ SSTV engine error: {e}")
        return False

def test_gui():
    """Test GUI creation"""
    print("\n🖥️ Testing GUI...")
    
    try:
        import tkinter as tk
        from desktop_sstv import SSTVDesktopApp
        
        # Create test window
        root = tk.Tk()
        root.withdraw()  # Hide window
        
        app = SSTVDesktopApp(root)
        print("✅ GUI created successfully")
        
        root.destroy()
        return True
        
    except Exception as e:
        print(f"❌ GUI error: {e}")
        return False

def main():
    print("🐦 Pigeon70 SSTV Desktop - System Test")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test dependencies
    if not test_dependencies():
        all_tests_passed = False
    
    # Test audio devices
    if not test_audio_devices():
        all_tests_passed = False
    
    # Test SSTV engine
    if not test_sstv_engine():
        all_tests_passed = False
    
    # Test GUI
    if not test_gui():
        all_tests_passed = False
    
    print("\n" + "=" * 50)
    
    if all_tests_passed:
        print("🎉 All tests passed! Desktop application is ready to use.")
        print("\n🚀 To run the desktop application:")
        print("   ./desktop_sstv.py")
    else:
        print("❌ Some tests failed. Please check the installation.")
        print("\n🔧 To install missing dependencies:")
        print("   ./install_arch.sh")

if __name__ == "__main__":
    main()

