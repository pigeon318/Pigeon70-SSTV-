import numpy as np
import wave
from scipy.fft import fft
from PIL import Image

# Pigeon70 specs
WIDTH, HEIGHT = 320, 240
SAMPLE_RATE = 44100
VIS_FREQ = 1900
VIS_DURATION = 0.3  # seconds
SYNC_FREQ = 1200
SYNC_DURATION = 0.01
SEP_FREQ = 1500
SEP_DURATION = 0.01

# Frequencies for pixel colors
FREQ_MIN = 1500
FREQ_MAX = 2300

def freq_to_color(freq):
    # Map frequency back to 0-255 color value
    val = int(255 * (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN))
    return max(0, min(255, val))

def detect_freq(samples):
    # FFT to find dominant frequency in samples
    N = len(samples)
    window = np.hanning(N)
    fft_result = fft(samples * window)
    fft_mag = np.abs(fft_result[:N // 2])
    peak_index = np.argmax(fft_mag)
    freq = peak_index * SAMPLE_RATE / N
    return freq

def decode_line(audio_samples, start_index):
    # Decode one line of pixels (sync + separator + pixel tones)
    # Returns (line_pixels, next_index)
    
    # Each line: sync(10ms), separator(10ms), 320 pixels * 3 tones each (~0.0004s per tone)
    tone_duration = 0.0004
    tones_per_pixel = 3
    pixels_per_line = WIDTH
    tones_per_line = pixels_per_line * tones_per_pixel
    
    samples_per_sync = int(SYNC_DURATION * SAMPLE_RATE)
    samples_per_sep = int(SEP_DURATION * SAMPLE_RATE)
    samples_per_tone = int(tone_duration * SAMPLE_RATE)
    
    idx = start_index
    
    # Check sync tone (skip)
    sync_tone_samples = audio_samples[idx: idx + samples_per_sync]
    idx += samples_per_sync
    
    # Check separator tone (skip)
    sep_tone_samples = audio_samples[idx: idx + samples_per_sep]
    idx += samples_per_sep
    
    # Decode pixel tones
    line_pixels = []
    for _ in range(pixels_per_line):
        r_samples = audio_samples[idx: idx + samples_per_tone]
        idx += samples_per_tone
        g_samples = audio_samples[idx: idx + samples_per_tone]
        idx += samples_per_tone
        b_samples = audio_samples[idx: idx + samples_per_tone]
        idx += samples_per_tone
        
        r_freq = detect_freq(r_samples)
        g_freq = detect_freq(g_samples)
        b_freq = detect_freq(b_samples)
        
        r = freq_to_color(r_freq)
        g = freq_to_color(g_freq)
        b = freq_to_color(b_freq)
        
        line_pixels.append((r, g, b))
    
    return line_pixels, idx

def find_vis_start(audio_samples):
    # Look for VIS code tone 1900 Hz for 300ms in the beginning of the signal
    samples_needed = int(VIS_DURATION * SAMPLE_RATE)
    window_size = samples_needed
    step = int(SAMPLE_RATE * 0.05)  # 50 ms step
    
    for start in range(0, len(audio_samples) - window_size, step):
        segment = audio_samples[start: start + window_size]
        freq = detect_freq(segment)
        if abs(freq - VIS_FREQ) < 20:
            return start + window_size  # start decoding after VIS
    return None

def decode_pigeon70_wav(filename):
    wav = wave.open(filename, 'rb')
    assert wav.getframerate() == SAMPLE_RATE
    assert wav.getnchannels() == 1  # mono
    
    raw = wav.readframes(wav.getnframes())
    audio_samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    audio_samples /= np.max(np.abs(audio_samples))  # normalize
    
    start_idx = find_vis_start(audio_samples)
    if start_idx is None:
        print("VIS code not found!")
        return
    
    print(f"VIS found at sample index {start_idx}")
    
    image = Image.new('RGB', (WIDTH, HEIGHT))
    pixels = image.load()
    
    idx = start_idx
    for y in range(HEIGHT):
        line_pixels, idx = decode_line(audio_samples, idx)
        for x, rgb in enumerate(line_pixels):
            pixels[x, y] = rgb
    
    image.save("decoded_pigeon70.png")
    print("Image saved as decoded_pigeon70.png")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python decode_pigeon70.py input.wav")
        sys.exit(1)
    decode_pigeon70_wav(sys.argv[1])
