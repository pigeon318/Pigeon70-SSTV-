#!/usr/bin/env python3
"""
Pigeon70 SSTV - Real Desktop Implementation
For actual amateur radio SSTV transmission and reception
"""

import numpy as np
import sounddevice as sd
import soundfile as sf
from PIL import Image
import argparse
import time
import threading
from scipy import signal
import matplotlib.pyplot as plt

class Pigeon70SSTV:
    def __init__(self):
        # Pigeon70 specifications
        self.WIDTH = 320
        self.HEIGHT = 240
        self.SAMPLE_RATE = 44100
        
        # Frequency mapping
        self.FREQ_VIS = 1900      # VIS code frequency
        self.FREQ_SYNC = 1200     # Sync pulse frequency
        self.FREQ_SEPARATOR = 1500 # Separator pulse frequency
        self.FREQ_MIN = 1500      # Minimum pixel frequency
        self.FREQ_MAX = 2300      # Maximum pixel frequency
        
        # Timing specifications
        self.DURATION_VIS = 0.3        # VIS code duration (300ms)
        self.DURATION_SYNC = 0.01      # Sync pulse duration (10ms)
        self.DURATION_SEPARATOR = 0.01 # Separator pulse duration (10ms)
        self.DURATION_PIXEL = (0.295 - 0.02) / 960  # Pixel tone duration
        
        # Audio settings
        self.audio_device = None
        self.is_transmitting = False
        self.is_receiving = False
        
    def pixel_to_frequency(self, pixel_value):
        """Convert pixel value (0-255) to frequency (1500-2300 Hz)"""
        return self.FREQ_MIN + (pixel_value / 255) * (self.FREQ_MAX - self.FREQ_MIN)
    
    def frequency_to_pixel(self, frequency):
        """Convert frequency (1500-2300 Hz) to pixel value (0-255)"""
        if frequency < self.FREQ_MIN:
            return 0
        if frequency > self.FREQ_MAX:
            return 255
        return int(((frequency - self.FREQ_MIN) / (self.FREQ_MAX - self.FREQ_MIN)) * 255)
    
    def generate_tone(self, frequency, duration):
        """Generate a sine wave tone"""
        samples = int(duration * self.SAMPLE_RATE)
        t = np.linspace(0, duration, samples, False)
        return np.sin(2 * np.pi * frequency * t)
    
    def encode_image(self, image_path, output_wav=None):
        """Encode image to SSTV audio signal"""
        print(f"Loading image: {image_path}")
        
        # Load and resize image
        img = Image.open(image_path).convert('RGB')
        img = img.resize((self.WIDTH, self.HEIGHT))
        img_array = np.array(img)
        
        print(f"Image size: {img_array.shape}")
        
        # Calculate timing
        line_time = self.DURATION_SYNC + self.DURATION_SEPARATOR + (960 * self.DURATION_PIXEL)
        total_duration = self.DURATION_VIS + (self.HEIGHT * line_time)
        total_samples = int(total_duration * self.SAMPLE_RATE)
        
        print(f"Total duration: {total_duration:.1f} seconds")
        print(f"Line time: {line_time:.3f} seconds")
        
        # Create audio buffer
        audio_buffer = np.zeros(total_samples)
        sample_index = 0
        
        # Generate VIS code
        print("Generating VIS code...")
        vis_tone = self.generate_tone(self.FREQ_VIS, self.DURATION_VIS)
        audio_buffer[sample_index:sample_index + len(vis_tone)] = vis_tone
        sample_index += len(vis_tone)
        
        # Process each line
        for y in range(self.HEIGHT):
            if y % 50 == 0:
                print(f"Processing line {y + 1}/{self.HEIGHT}")
            
            # Sync pulse
            sync_tone = self.generate_tone(self.FREQ_SYNC, self.DURATION_SYNC)
            audio_buffer[sample_index:sample_index + len(sync_tone)] = sync_tone
            sample_index += len(sync_tone)
            
            # Separator pulse
            separator_tone = self.generate_tone(self.FREQ_SEPARATOR, self.DURATION_SEPARATOR)
            audio_buffer[sample_index:sample_index + len(separator_tone)] = separator_tone
            sample_index += len(separator_tone)
            
            # Process each pixel in the line
            for x in range(self.WIDTH):
                r, g, b = img_array[y, x]
                
                # Generate tones for R, G, B values
                r_tone = self.generate_tone(self.pixel_to_frequency(r), self.DURATION_PIXEL)
                g_tone = self.generate_tone(self.pixel_to_frequency(g), self.DURATION_PIXEL)
                b_tone = self.generate_tone(self.pixel_to_frequency(b), self.DURATION_PIXEL)
                
                # Add tones to buffer
                audio_buffer[sample_index:sample_index + len(r_tone)] = r_tone
                sample_index += len(r_tone)
                audio_buffer[sample_index:sample_index + len(g_tone)] = g_tone
                sample_index += len(g_tone)
                audio_buffer[sample_index:sample_index + len(b_tone)] = b_tone
                sample_index += len(b_tone)
        
        # Normalize audio
        audio_buffer = audio_buffer / np.max(np.abs(audio_buffer)) * 0.8
        
        # Save to file if requested
        if output_wav:
            sf.write(output_wav, audio_buffer, self.SAMPLE_RATE)
            print(f"Audio saved to: {output_wav}")
        
        return audio_buffer
    
    def detect_frequency(self, audio_segment):
        """Detect dominant frequency in audio segment using FFT"""
        # Use FFT for frequency detection
        fft = np.fft.fft(audio_segment)
        freqs = np.fft.fftfreq(len(audio_segment), 1/self.SAMPLE_RATE)
        
        # Find peak in relevant frequency range
        mask = (freqs >= 1000) & (freqs <= 2500)
        peak_idx = np.argmax(np.abs(fft[mask]))
        return freqs[mask][peak_idx]
    
    def find_vis_code(self, audio_buffer):
        """Find VIS code in audio buffer"""
        vis_samples = int(self.DURATION_VIS * self.SAMPLE_RATE)
        
        # Search first 2 seconds
        search_limit = min(len(audio_buffer) - vis_samples, int(2 * self.SAMPLE_RATE))
        
        for i in range(0, search_limit, int(0.01 * self.SAMPLE_RATE)):  # 10ms steps
            segment = audio_buffer[i:i + vis_samples]
            frequency = self.detect_frequency(segment)
            
            if abs(frequency - self.FREQ_VIS) < 50:  # 50Hz tolerance
                print(f"VIS code found at {i/self.SAMPLE_RATE:.2f}s (frequency: {frequency:.1f}Hz)")
                return i
        
        print("VIS code not found")
        return -1
    
    def find_sync_pulse(self, audio_buffer, start_index):
        """Find sync pulse in audio buffer"""
        sync_samples = int(self.DURATION_SYNC * self.SAMPLE_RATE)
        search_range = int(0.3 * self.SAMPLE_RATE)  # 300ms search window
        
        for i in range(start_index, min(start_index + search_range, len(audio_buffer) - sync_samples), int(0.001 * self.SAMPLE_RATE)):  # 1ms steps
            segment = audio_buffer[i:i + sync_samples]
            frequency = self.detect_frequency(segment)
            
            if abs(frequency - self.FREQ_SYNC) < 100:  # 100Hz tolerance
                return i
        
        return -1
    
    def decode_audio(self, audio_path, output_image=None):
        """Decode SSTV audio signal to image"""
        print(f"Loading audio: {audio_path}")
        
        # Load audio
        audio_buffer, sample_rate = sf.read(audio_path)
        if sample_rate != self.SAMPLE_RATE:
            print(f"Warning: Sample rate mismatch. Expected {self.SAMPLE_RATE}, got {sample_rate}")
        
        print(f"Audio length: {len(audio_buffer)/sample_rate:.1f} seconds")
        
        # Find VIS code
        vis_index = self.find_vis_code(audio_buffer)
        if vis_index == -1:
            print("No VIS code found, starting from beginning")
            start_index = 0
        else:
            start_index = vis_index + int(self.DURATION_VIS * self.SAMPLE_RATE)
        
        # Create image
        image_data = np.zeros((self.HEIGHT, self.WIDTH, 3), dtype=np.uint8)
        current_index = start_index
        
        # Decode each line
        for y in range(self.HEIGHT):
            if y % 50 == 0:
                print(f"Decoding line {y + 1}/{self.HEIGHT}")
            
            # Find sync pulse
            sync_index = self.find_sync_pulse(audio_buffer, current_index)
            if sync_index == -1:
                print(f"Sync pulse not found for line {y}")
                # Use estimated position
                sync_index = current_index
            else:
                current_index = sync_index
            
            # Skip separator
            current_index += int(self.DURATION_SEPARATOR * self.SAMPLE_RATE)
            
            # Decode pixels
            for x in range(self.WIDTH):
                for color_idx in range(3):  # R, G, B
                    pixel_samples = int(self.DURATION_PIXEL * self.SAMPLE_RATE)
                    
                    if current_index + pixel_samples >= len(audio_buffer):
                        break
                    
                    segment = audio_buffer[current_index:current_index + pixel_samples]
                    frequency = self.detect_frequency(segment)
                    pixel_value = self.frequency_to_pixel(frequency)
                    
                    image_data[y, x, color_idx] = pixel_value
                    current_index += pixel_samples
                
                if current_index + pixel_samples >= len(audio_buffer):
                    break
        
        # Create and save image
        img = Image.fromarray(image_data)
        
        if output_image:
            img.save(output_image)
            print(f"Image saved to: {output_image}")
        
        return img
    
    def transmit_audio(self, audio_buffer):
        """Transmit audio through sound device"""
        print("Starting transmission...")
        self.is_transmitting = True
        
        try:
            sd.play(audio_buffer, self.SAMPLE_RATE)
            sd.wait()  # Wait until audio is finished
        except Exception as e:
            print(f"Transmission error: {e}")
        finally:
            self.is_transmitting = False
            print("Transmission complete")
    
    def receive_audio(self, duration=75):
        """Receive audio from microphone"""
        print(f"Starting reception for {duration} seconds...")
        self.is_receiving = True
        
        try:
            # Record audio
            audio_buffer = sd.rec(int(duration * self.SAMPLE_RATE), 
                                samplerate=self.SAMPLE_RATE, 
                                channels=1)
            sd.wait()  # Wait until recording is finished
            
            print("Reception complete")
            return audio_buffer.flatten()
            
        except Exception as e:
            print(f"Reception error: {e}")
            return None
        finally:
            self.is_receiving = False

def main():
    parser = argparse.ArgumentParser(description='Pigeon70 SSTV Encoder/Decoder')
    parser.add_argument('mode', choices=['encode', 'decode', 'transmit', 'receive'], 
                       help='Operation mode')
    parser.add_argument('input', help='Input file (image for encode, audio for decode)')
    parser.add_argument('-o', '--output', help='Output file')
    parser.add_argument('-d', '--duration', type=int, default=75, 
                       help='Reception duration in seconds (default: 75)')
    
    args = parser.parse_args()
    
    sstv = Pigeon70SSTV()
    
    if args.mode == 'encode':
        audio = sstv.encode_image(args.input, args.output)
        print("Encoding complete!")
        
    elif args.mode == 'decode':
        image = sstv.decode_audio(args.input, args.output)
        print("Decoding complete!")
        
    elif args.mode == 'transmit':
        audio = sstv.encode_image(args.input)
        sstv.transmit_audio(audio)
        
    elif args.mode == 'receive':
        audio = sstv.receive_audio(args.duration)
        if audio is not None:
            # Save received audio
            if args.output:
                sf.write(args.output, audio, sstv.SAMPLE_RATE)
                print(f"Received audio saved to: {args.output}")
            
            # Decode received audio
            temp_wav = "temp_received.wav"
            sf.write(temp_wav, audio, sstv.SAMPLE_RATE)
            image = sstv.decode_audio(temp_wav, args.output)
            print("Reception and decoding complete!")

if __name__ == "__main__":
    main()


