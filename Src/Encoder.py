import wave
import struct
import numpy as np
from PIL import Image

# Constants
SAMPLE_RATE = 44100  # Hz
FREQ_MIN = 1500
FREQ_MAX = 2300
DURATION_VIS = 0.3
DURATION_SYNC = 0.01
DURATION_SEP = 0.01
DURATION_PIXEL = 0.0003  # 0.3 ms per tone

def freq_for_value(value):
    return FREQ_MIN + (value / 255.0) * (FREQ_MAX - FREQ_MIN)

def tone(freq, duration):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    wave = 0.5 * np.sin(2 * np.pi * freq * t)
    return wave

def encode_image_to_audio(image_path, output_path="pigeon70.wav"):
    img = Image.open(image_path).resize((320, 240)).convert("RGB")
    samples = []

    # VIS Code (1900 Hz for 300ms)
    samples.extend(tone(1900, DURATION_VIS))

    for y in range(240):
        # Sync Pulse (1200 Hz, 10ms)
        samples.extend(tone(1200, DURATION_SYNC))
        # Separator (1500 Hz, 10ms)
        samples.extend(tone(1500, DURATION_SEP))

        for x in range(320):
            r, g, b = img.getpixel((x, y))
            for color in (r, g, b):
                freq = freq_for_value(color)
                samples.extend(tone(freq, DURATION_PIXEL))

    # Normalize
    audio = np.int16(np.array(samples) * 32767)

    with wave.open(output_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())

    print(f"✅ Audio saved to {output_path}")

# Example usage
# encode_image_to_audio("input_image.jpg")
