# Quick Fixes for Web-Based SSTV

## Current Issues & Solutions

### 1. **Server Port Conflict**
```bash
# Kill existing server
pkill -f "python.*http.server"

# Or use different port
python3 -m http.server 8001
```

### 2. **Browser Cache Issues**
```bash
# Use incognito/private mode
# Or hard refresh: Ctrl+Shift+R
# Or clear browser cache
```

### 3. **Audio Processing Limitations**
- Use WAV files (uncompressed)
- Ensure good audio quality
- Use Chrome browser (best Web Audio API support)

### 4. **Performance Issues**
- Close other browser tabs
- Use smaller test images
- Enable hardware acceleration in browser

## Alternative: Simple Python Version

If web-based is too complex, here's a simple Python alternative:

```python
import numpy as np
import scipy.io.wavfile as wav
from PIL import Image
import matplotlib.pyplot as plt

class SimpleSSTV:
    def __init__(self):
        self.sample_rate = 44100
        self.width = 320
        self.height = 240
        
    def encode_image(self, image_path, output_wav):
        # Load and resize image
        img = Image.open(image_path).resize((320, 240))
        img_array = np.array(img)
        
        # Generate SSTV audio
        # (Simplified version)
        duration = 70  # seconds
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        
        # Create audio signal
        audio = np.zeros_like(t)
        
        # Add VIS code, sync pulses, pixel data
        # ... (implementation details)
        
        # Save as WAV
        wav.write(output_wav, self.sample_rate, audio)
        
    def decode_audio(self, wav_path, output_image):
        # Load audio
        sample_rate, audio = wav.read(wav_path)
        
        # Decode to image
        # ... (implementation details)
        
        # Save image
        # ... (implementation details)

# Usage
sstv = SimpleSSTV()
sstv.encode_image("input.png", "output.wav")
sstv.decode_audio("output.wav", "decoded.png")
```

## Recommendation

**For learning/experimentation**: Stick with web-based
**For production use**: Consider Python desktop app
**For maximum performance**: Native C++ app

The web version is actually quite good for educational purposes and testing!


