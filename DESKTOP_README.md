# Pigeon70 SSTV Desktop Application

A full-featured desktop GUI application for Pigeon70 SSTV encoding and decoding, optimized for Arch Linux.

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
# Run the Arch Linux installation script
./install_arch.sh
```

### **2. Test Installation**
```bash
# Test all components
./test_desktop.py
```

### **3. Run Application**
```bash
# Launch the desktop GUI
./desktop_sstv.py
```

## 🖥️ **Features**

### **Full GUI Interface:**
- ✅ **Image preview** - See original and decoded images side by side
- ✅ **Progress tracking** - Real-time progress bars and status updates
- ✅ **Audio information** - Display audio duration and quality
- ✅ **Threaded operations** - Non-blocking encode/decode operations

### **Image Operations:**
- ✅ **Load any image** - PNG, JPG, BMP, GIF support
- ✅ **Auto-resize** - Automatically resizes to 320×240 for SSTV
- ✅ **Generate test patterns** - Built-in test image generator
- ✅ **Image preview** - See images before and after processing

### **Audio Operations:**
- ✅ **Real-time transmission** - Play audio through speakers
- ✅ **Real-time reception** - Record from microphone (75 seconds)
- ✅ **File I/O** - Load and save WAV files
- ✅ **Audio quality** - Professional 44.1kHz audio processing

### **Testing Features:**
- ✅ **Full test cycle** - Encode → Decode → Compare
- ✅ **Test image generation** - Create gradient test patterns
- ✅ **Error handling** - Comprehensive error reporting
- ✅ **Performance monitoring** - Track encoding/decoding times

## 🎯 **Usage Guide**

### **Basic Workflow:**

1. **Load or Generate Image:**
   - Click "Load Image" to select a file
   - Or click "Generate Test Image" for testing

2. **Encode to Audio:**
   - Click "Encode to Audio"
   - Watch progress bar and status updates
   - Audio is ready for transmission

3. **Transmit Audio:**
   - Click "Transmit Audio"
   - Audio plays through speakers
   - Use for radio transmission

4. **Receive Audio:**
   - Click "Receive Audio"
   - Records for 75 seconds from microphone
   - Automatically decodes to image

5. **View Results:**
   - Original image on the left
   - Decoded image on the right
   - Compare quality and accuracy

### **Advanced Features:**

- **Full Test Cycle:** Tests complete encode/decode process
- **Audio File I/O:** Save/load WAV files for analysis
- **Real-time Processing:** Live transmission and reception
- **Progress Monitoring:** See exactly what's happening

## 🔧 **Arch Linux Specific**

### **Audio System:**
- **ALSA** - Low-level audio support
- **PulseAudio** - Audio server and mixing
- **PortAudio** - Cross-platform audio I/O

### **Dependencies:**
```bash
# System packages
sudo pacman -S python python-pip python-numpy python-scipy python-pillow portaudio tk alsa-utils pulseaudio pulseaudio-alsa

# Python packages
pip install --user sounddevice soundfile matplotlib
```

### **Audio Device Configuration:**
```bash
# List audio devices
python3 -c "import sounddevice as sd; print(sd.query_devices())"

# Test microphone
arecord -d 5 test.wav && aplay test.wav

# Test speakers
speaker-test -t wav -c 2
```

## 📡 **Real SSTV Setup**

### **For Amateur Radio:**

1. **Connect Radio to Computer:**
   ```
   Radio Audio Out → Computer Line In
   Computer Audio Out → Radio Audio In
   ```

2. **Configure Audio Routing:**
   ```bash
   # Use pavucontrol for GUI audio routing
   pavucontrol
   
   # Or use pactl for command line
   pactl load-module module-null-sink sink_name=sstv
   ```

3. **Radio Settings:**
   - **Mode:** USB (Upper Sideband)
   - **Frequency:** 14.230 MHz (20m), 7.171 MHz (40m)
   - **Audio Level:** Adjust for proper modulation

### **Testing Setup:**
1. **Generate test image** in the application
2. **Encode to audio** and transmit through speakers
3. **Record with microphone** and decode
4. **Compare images** to verify quality

## 🐛 **Troubleshooting**

### **Audio Issues:**
```bash
# Check audio devices
./test_desktop.py

# Test microphone
arecord -d 5 test.wav

# Test speakers
speaker-test -t wav -c 2

# Check PulseAudio
pulseaudio --check -v
```

### **Permission Issues:**
```bash
# Add user to audio group
sudo usermod -a -G audio $USER
# Log out and back in
```

### **Python Issues:**
```bash
# Reinstall dependencies
pip install --user --upgrade sounddevice soundfile numpy pillow

# Check Python version
python3 --version  # Should be 3.8+
```

### **GUI Issues:**
```bash
# Test tkinter
python3 -c "import tkinter; tkinter._test()"

# Check display
echo $DISPLAY
```

## 📊 **Performance**

### **Typical Performance:**
- **Encoding:** 1-3 seconds for 320×240 image
- **Decoding:** 10-30 seconds for 75-second audio
- **Memory usage:** ~50MB for typical operations
- **CPU usage:** Moderate during processing

### **Optimization Tips:**
- Close other audio applications
- Use dedicated audio interface
- Ensure good audio signal quality
- Use WAV files for best quality

## 🎯 **Comparison with Web Version**

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| **GUI** | Basic | Full-featured |
| **Real SSTV** | ❌ | ✅ |
| **Audio I/O** | Limited | Full |
| **Performance** | Browser limited | Native |
| **Testing** | Basic | Comprehensive |
| **Arch Linux** | Works | Optimized |

## 🚀 **Next Steps**

1. **Test the application** with generated test images
2. **Try real images** to see quality differences
3. **Set up audio routing** for radio use
4. **Experiment with different images** and audio quality
5. **Use for actual SSTV operations** with amateur radio

The desktop version provides everything you need for real SSTV capabilities on Arch Linux!




