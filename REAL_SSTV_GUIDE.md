# Pigeon70 SSTV - Real Desktop Implementation

This is a **real desktop SSTV implementation** for actual amateur radio use, not just web-based testing.

## 🚀 **Installation**

```bash
# Install Python dependencies
pip install -r requirements.txt

# On Linux, you might need:
sudo apt-get install portaudio19-dev python3-pyaudio

# On macOS:
brew install portaudio

# On Windows:
# Download and install PortAudio from http://www.portaudio.com/
```

## 📡 **Usage**

### **1. Encode Image to Audio**
```bash
# Encode image to WAV file
./real_sstv.py encode input.png -o output.wav

# Or just encode (creates temp file)
./real_sstv.py encode input.png
```

### **2. Decode Audio to Image**
```bash
# Decode WAV file to image
./real_sstv.py decode input.wav -o output.png
```

### **3. Transmit SSTV (Real-time)**
```bash
# Encode and transmit through speakers
./real_sstv.py transmit input.png
```

### **4. Receive SSTV (Real-time)**
```bash
# Receive from microphone and decode
./real_sstv.py receive -d 75 -o received.png
```

## 🔧 **Real SSTV Setup**

### **For Amateur Radio Use:**

1. **Connect Radio to Computer:**
   ```
   Radio Audio Out → Computer Line In
   Computer Audio Out → Radio Audio In
   ```

2. **Use Virtual Audio Cable (Windows):**
   - Install VAC (Virtual Audio Cable)
   - Route SSTV audio through VAC
   - Connect VAC to radio audio

3. **Use PulseAudio (Linux):**
   ```bash
   # Create virtual sink
   pactl load-module module-null-sink sink_name=sstv
   
   # Route audio
   pavucontrol  # GUI audio control
   ```

4. **Use SoundFlower (macOS):**
   - Install SoundFlower
   - Route audio through SoundFlower
   - Connect to radio

### **Radio Settings:**
- **Mode**: USB (Upper Sideband)
- **Frequency**: 14.230 MHz (20m), 7.171 MHz (40m), etc.
- **Audio Level**: Adjust for proper modulation
- **Squelch**: Off for SSTV

## 🎯 **Features**

### **Real-time Capabilities:**
- ✅ **Live transmission** through speakers
- ✅ **Live reception** from microphone
- ✅ **Hardware audio integration**
- ✅ **Real-time processing**
- ✅ **Professional audio quality**

### **File Operations:**
- ✅ **High-quality WAV encoding/decoding**
- ✅ **Batch processing**
- ✅ **Format validation**
- ✅ **Error handling**

### **Performance:**
- ✅ **Native Python performance**
- ✅ **Optimized FFT processing**
- ✅ **Memory efficient**
- ✅ **Cross-platform**

## 📊 **Comparison**

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| **Real SSTV** | ❌ | ✅ |
| **Hardware Integration** | ❌ | ✅ |
| **Live Transmission** | ❌ | ✅ |
| **Live Reception** | ❌ | ✅ |
| **Radio Control** | ❌ | ✅ |
| **Performance** | Limited | Full |
| **Audio Quality** | Browser dependent | Professional |
| **Installation** | None | Python deps |

## 🔧 **Advanced Usage**

### **Custom Audio Device:**
```python
import sounddevice as sd

# List available devices
print(sd.query_devices())

# Use specific device
sd.default.device = [1, 2]  # Input, Output device IDs
```

### **Integration with Radio Software:**
```python
# Example: Integration with Hamlib
import serial

class RadioControl:
    def __init__(self, port='/dev/ttyUSB0'):
        self.serial = serial.Serial(port, 9600)
    
    def set_frequency(self, freq):
        self.serial.write(f'F{freq}\n'.encode())
    
    def set_mode(self, mode):
        self.serial.write(f'M{mode}\n'.encode())
```

## 🚨 **Troubleshooting**

### **Audio Issues:**
```bash
# Test audio devices
python3 -c "import sounddevice as sd; print(sd.query_devices())"

# Test microphone
python3 -c "import sounddevice as sd; print(sd.rec(1, samplerate=44100))"
```

### **Permission Issues (Linux):**
```bash
# Add user to audio group
sudo usermod -a -G audio $USER
# Log out and back in
```

### **Performance Issues:**
- Close other audio applications
- Use dedicated audio interface
- Adjust buffer sizes in sounddevice

## 📡 **Real SSTV Workflow**

1. **Prepare Image:**
   ```bash
   # Resize to 320x240 if needed
   convert input.jpg -resize 320x240! prepared.png
   ```

2. **Encode and Transmit:**
   ```bash
   # Encode to WAV
   ./real_sstv.py encode prepared.png -o sstv.wav
   
   # Or transmit directly
   ./real_sstv.py transmit prepared.png
   ```

3. **Receive and Decode:**
   ```bash
   # Receive from radio
   ./real_sstv.py receive -d 75 -o received.png
   ```

This desktop version gives you **real SSTV capabilities** for amateur radio use!
