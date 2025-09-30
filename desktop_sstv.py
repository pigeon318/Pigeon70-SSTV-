#!/usr/bin/env python3
"""
Pigeon70 SSTV Desktop Application
Full-featured GUI for Arch Linux with encoder/decoder testing
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import numpy as np
import sounddevice as sd
import soundfile as sf
from PIL import Image, ImageTk
import threading
import time
import os
import sys
from pathlib import Path

class Pigeon70SSTV:
    def __init__(self):
        # Pigeon70 specifications
        self.WIDTH = 320
        self.HEIGHT = 240
        self.SAMPLE_RATE = 44100
        
        # Frequency mapping
        self.FREQ_VIS = 1900
        self.FREQ_SYNC = 1200
        self.FREQ_SEPARATOR = 1500
        self.FREQ_MIN = 1500
        self.FREQ_MAX = 2300
        
        # Timing specifications
        self.DURATION_VIS = 0.3
        self.DURATION_SYNC = 0.01
        self.DURATION_SEPARATOR = 0.01
        self.DURATION_PIXEL = (0.295 - 0.02) / 960
        
        # Audio state
        self.is_transmitting = False
        self.is_receiving = False
        self.current_audio = None
        
    def pixel_to_frequency(self, pixel_value):
        return self.FREQ_MIN + (pixel_value / 255) * (self.FREQ_MAX - self.FREQ_MIN)
    
    def frequency_to_pixel(self, frequency):
        if frequency < self.FREQ_MIN:
            return 0
        if frequency > self.FREQ_MAX:
            return 255
        return int(((frequency - self.FREQ_MIN) / (self.FREQ_MAX - self.FREQ_MIN)) * 255)
    
    def generate_tone(self, frequency, duration):
        samples = int(duration * self.SAMPLE_RATE)
        t = np.linspace(0, duration, samples, False)
        return np.sin(2 * np.pi * frequency * t)
    
    def encode_image(self, image_input, progress_callback=None):
        """Encode image to SSTV audio signal"""
        try:
            # Handle both file path and PIL Image object
            if isinstance(image_input, str):
                # Load from file path
                img = Image.open(image_input).convert('RGB')
            else:
                # Use PIL Image object directly
                img = image_input.convert('RGB')
            
            # Resize image
            img = img.resize((self.WIDTH, self.HEIGHT))
            img_array = np.array(img)
            
            # Calculate timing
            line_time = self.DURATION_SYNC + self.DURATION_SEPARATOR + (960 * self.DURATION_PIXEL)
            total_duration = self.DURATION_VIS + (self.HEIGHT * line_time)
            total_samples = int(total_duration * self.SAMPLE_RATE)
            
            # Create audio buffer
            audio_buffer = np.zeros(total_samples)
            sample_index = 0
            
            # Generate VIS code
            if progress_callback:
                progress_callback(0, "Generating VIS code...")
            vis_tone = self.generate_tone(self.FREQ_VIS, self.DURATION_VIS)
            audio_buffer[sample_index:sample_index + len(vis_tone)] = vis_tone
            sample_index += len(vis_tone)
            
            # Process each line
            for y in range(self.HEIGHT):
                if progress_callback:
                    progress = (y / self.HEIGHT) * 100
                    progress_callback(progress, f"Processing line {y + 1}/{self.HEIGHT}")
                
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
            
            if progress_callback:
                progress_callback(100, "Encoding complete!")
            
            return audio_buffer
            
        except Exception as e:
            if progress_callback:
                progress_callback(0, f"Encoding error: {str(e)}")
            return None
    
    def detect_frequency(self, audio_segment):
        """Detect dominant frequency using FFT"""
        try:
            # Use FFT for frequency detection
            fft = np.fft.fft(audio_segment)
            freqs = np.fft.fftfreq(len(audio_segment), 1/self.SAMPLE_RATE)
            
            # Find peak in relevant frequency range
            mask = (freqs >= 1000) & (freqs <= 2500)
            if not np.any(mask):
                return 1500  # Default frequency
            
            peak_idx = np.argmax(np.abs(fft[mask]))
            return freqs[mask][peak_idx]
        except:
            return 1500  # Default on error
    
    def find_vis_code(self, audio_buffer):
        """Find VIS code in audio buffer"""
        vis_samples = int(self.DURATION_VIS * self.SAMPLE_RATE)
        search_limit = min(len(audio_buffer) - vis_samples, int(2 * self.SAMPLE_RATE))
        
        for i in range(0, search_limit, int(0.01 * self.SAMPLE_RATE)):
            segment = audio_buffer[i:i + vis_samples]
            frequency = self.detect_frequency(segment)
            
            if abs(frequency - self.FREQ_VIS) < 100:
                return i
        
        return -1
    
    def find_sync_pulse(self, audio_buffer, start_index):
        """Find sync pulse in audio buffer"""
        sync_samples = int(self.DURATION_SYNC * self.SAMPLE_RATE)
        search_range = int(0.3 * self.SAMPLE_RATE)
        
        for i in range(start_index, min(start_index + search_range, len(audio_buffer) - sync_samples), int(0.001 * self.SAMPLE_RATE)):
            segment = audio_buffer[i:i + sync_samples]
            frequency = self.detect_frequency(segment)
            
            if abs(frequency - self.FREQ_SYNC) < 150:
                return i
        
        return -1
    
    def decode_audio(self, audio_buffer, progress_callback=None):
        """Decode SSTV audio signal to image"""
        try:
            # Find VIS code
            if progress_callback:
                progress_callback(0, "Searching for VIS code...")
            
            vis_index = self.find_vis_code(audio_buffer)
            if vis_index == -1:
                if progress_callback:
                    progress_callback(0, "No VIS code found, starting from beginning")
                start_index = 0
            else:
                start_index = vis_index + int(self.DURATION_VIS * self.SAMPLE_RATE)
                if progress_callback:
                    progress_callback(5, f"VIS code found at {vis_index/self.SAMPLE_RATE:.2f}s")
            
            # Create image
            image_data = np.zeros((self.HEIGHT, self.WIDTH, 3), dtype=np.uint8)
            current_index = start_index
            
            # Decode each line
            for y in range(self.HEIGHT):
                if progress_callback:
                    progress = 5 + (y / self.HEIGHT) * 90
                    progress_callback(progress, f"Decoding line {y + 1}/{self.HEIGHT}")
                
                # Find sync pulse
                sync_index = self.find_sync_pulse(audio_buffer, current_index)
                if sync_index == -1:
                    sync_index = current_index
                else:
                    current_index = sync_index
                
                # Skip separator
                current_index += int(self.DURATION_SEPARATOR * self.SAMPLE_RATE)
                
                # Decode pixels
                for x in range(self.WIDTH):
                    for color_idx in range(3):
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
            
            if progress_callback:
                progress_callback(100, "Decoding complete!")
            
            return Image.fromarray(image_data)
            
        except Exception as e:
            if progress_callback:
                progress_callback(0, f"Decoding error: {str(e)}")
            return None

class SSTVDesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pigeon70 SSTV Desktop")
        self.root.geometry("1000x700")
        
        # Initialize SSTV engine
        self.sstv = Pigeon70SSTV()
        
        # Variables
        self.current_image = None
        self.current_audio = None
        self.current_decoded_image = None
        
        # Create GUI
        self.create_widgets()
        
        # Check audio devices
        self.check_audio_devices()
    
    def create_widgets(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Title
        title_label = ttk.Label(main_frame, text="🐦 Pigeon70 SSTV Desktop", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Left panel - Controls
        left_frame = ttk.LabelFrame(main_frame, text="Controls", padding="10")
        left_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # Image controls
        ttk.Label(left_frame, text="Image Operations:").grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        
        ttk.Button(left_frame, text="Load Image", 
                  command=self.load_image).grid(row=1, column=0, sticky=(tk.W, tk.E), pady=2)
        
        ttk.Button(left_frame, text="Encode to Audio", 
                  command=self.encode_image).grid(row=2, column=0, sticky=(tk.W, tk.E), pady=2)
        
        ttk.Button(left_frame, text="Transmit Audio", 
                  command=self.transmit_audio).grid(row=3, column=0, sticky=(tk.W, tk.E), pady=2)
        
        # Audio controls
        ttk.Label(left_frame, text="Audio Operations:").grid(row=4, column=0, sticky=tk.W, pady=(20, 5))
        
        ttk.Button(left_frame, text="Load Audio", 
                  command=self.load_audio).grid(row=5, column=0, sticky=(tk.W, tk.E), pady=2)
        
        ttk.Button(left_frame, text="Decode to Image", 
                  command=self.decode_audio).grid(row=6, column=0, sticky=(tk.W, tk.E), pady=2)
        
        ttk.Button(left_frame, text="Receive Audio", 
                  command=self.receive_audio).grid(row=7, column=0, sticky=(tk.W, tk.E), pady=2)
        
        # Test controls
        ttk.Label(left_frame, text="Testing:").grid(row=8, column=0, sticky=tk.W, pady=(20, 5))
        
        ttk.Button(left_frame, text="Full Test Cycle", 
                  command=self.full_test).grid(row=9, column=0, sticky=(tk.W, tk.E), pady=2)
        
        ttk.Button(left_frame, text="Generate Test Image", 
                  command=self.generate_test_image).grid(row=10, column=0, sticky=(tk.W, tk.E), pady=2)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(left_frame, variable=self.progress_var, 
                                          maximum=100, length=200)
        self.progress_bar.grid(row=11, column=0, sticky=(tk.W, tk.E), pady=(20, 5))
        
        # Status label
        self.status_var = tk.StringVar(value="Ready")
        self.status_label = ttk.Label(left_frame, textvariable=self.status_var, 
                                     wraplength=200)
        self.status_label.grid(row=12, column=0, sticky=(tk.W, tk.E), pady=5)
        
        # Right panel - Images
        right_frame = ttk.LabelFrame(main_frame, text="Images", padding="10")
        right_frame.grid(row=1, column=1, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        right_frame.columnconfigure(0, weight=1)
        right_frame.columnconfigure(1, weight=1)
        right_frame.rowconfigure(0, weight=1)
        
        # Original image
        orig_frame = ttk.LabelFrame(right_frame, text="Original Image", padding="5")
        orig_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 5))
        
        self.orig_image_label = ttk.Label(orig_frame, text="No image loaded")
        self.orig_image_label.grid(row=0, column=0)
        
        # Decoded image
        decoded_frame = ttk.LabelFrame(right_frame, text="Decoded Image", padding="5")
        decoded_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(5, 0))
        
        self.decoded_image_label = ttk.Label(decoded_frame, text="No decoded image")
        self.decoded_image_label.grid(row=0, column=0)
        
        # Audio info
        audio_frame = ttk.LabelFrame(main_frame, text="Audio Information", padding="10")
        audio_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(10, 0))
        
        self.audio_info_var = tk.StringVar(value="No audio loaded")
        ttk.Label(audio_frame, textvariable=self.audio_info_var).grid(row=0, column=0, sticky=tk.W)
    
    def check_audio_devices(self):
        """Check available audio devices"""
        try:
            devices = sd.query_devices()
            self.status_var.set(f"Audio devices found: {len(devices)}")
        except Exception as e:
            self.status_var.set(f"Audio error: {str(e)}")
            messagebox.showerror("Audio Error", f"Could not access audio devices:\n{str(e)}")
    
    def update_status(self, progress, message):
        """Update progress bar and status"""
        self.progress_var.set(progress)
        self.status_var.set(message)
        self.root.update_idletasks()
    
    def load_image(self):
        """Load image file"""
        file_path = filedialog.askopenfilename(
            title="Select Image",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.bmp *.gif")]
        )
        
        if file_path:
            try:
                self.current_image = Image.open(file_path)
                self.display_image(self.current_image, self.orig_image_label)
                self.status_var.set(f"Loaded: {os.path.basename(file_path)}")
            except Exception as e:
                messagebox.showerror("Error", f"Could not load image:\n{str(e)}")
    
    def load_audio(self):
        """Load audio file"""
        file_path = filedialog.askopenfilename(
            title="Select Audio File",
            filetypes=[("Audio files", "*.wav *.mp3 *.flac")]
        )
        
        if file_path:
            try:
                audio_data, sample_rate = sf.read(file_path)
                if sample_rate != self.sstv.SAMPLE_RATE:
                    messagebox.showwarning("Sample Rate", 
                                         f"Audio sample rate is {sample_rate} Hz, expected {self.sstv.SAMPLE_RATE} Hz")
                
                self.current_audio = audio_data
                duration = len(audio_data) / sample_rate
                self.audio_info_var.set(f"Loaded: {os.path.basename(file_path)} ({duration:.1f}s)")
                self.status_var.set("Audio loaded successfully")
            except Exception as e:
                messagebox.showerror("Error", f"Could not load audio:\n{str(e)}")
    
    def encode_image(self):
        """Encode image to audio"""
        if self.current_image is None:
            messagebox.showwarning("No Image", "Please load an image first")
            return
        
        def encode_thread():
            try:
                self.current_audio = self.sstv.encode_image(self.current_image, self.update_status)
                if self.current_audio is not None:
                    duration = len(self.current_audio) / self.sstv.SAMPLE_RATE
                    self.audio_info_var.set(f"Encoded audio ({duration:.1f}s)")
                    self.status_var.set("Encoding complete!")
                else:
                    self.status_var.set("Encoding failed!")
            except Exception as e:
                self.status_var.set(f"Encoding error: {str(e)}")
        
        threading.Thread(target=encode_thread, daemon=True).start()
    
    def decode_audio(self):
        """Decode audio to image"""
        if self.current_audio is None:
            messagebox.showwarning("No Audio", "Please load audio first")
            return
        
        def decode_thread():
            try:
                self.current_decoded_image = self.sstv.decode_audio(self.current_audio, self.update_status)
                if self.current_decoded_image is not None:
                    self.display_image(self.current_decoded_image, self.decoded_image_label)
                    self.status_var.set("Decoding complete!")
                else:
                    self.status_var.set("Decoding failed!")
            except Exception as e:
                self.status_var.set(f"Decoding error: {str(e)}")
        
        threading.Thread(target=decode_thread, daemon=True).start()
    
    def transmit_audio(self):
        """Transmit audio through speakers"""
        if self.current_audio is None:
            messagebox.showwarning("No Audio", "Please encode audio first")
            return
        
        def transmit_thread():
            try:
                self.status_var.set("Transmitting...")
                self.sstv.is_transmitting = True
                sd.play(self.current_audio, self.sstv.SAMPLE_RATE)
                sd.wait()
                self.sstv.is_transmitting = False
                self.status_var.set("Transmission complete!")
            except Exception as e:
                self.sstv.is_transmitting = False
                self.status_var.set(f"Transmission error: {str(e)}")
        
        threading.Thread(target=transmit_thread, daemon=True).start()
    
    def receive_audio(self):
        """Receive audio from microphone"""
        def receive_thread():
            try:
                self.status_var.set("Recording for 75 seconds...")
                self.sstv.is_receiving = True
                
                # Record audio
                duration = 75
                audio_data = sd.rec(int(duration * self.sstv.SAMPLE_RATE), 
                                  samplerate=self.sstv.SAMPLE_RATE, channels=1)
                sd.wait()
                
                self.sstv.is_receiving = False
                self.current_audio = audio_data.flatten()
                
                # Auto-decode
                self.status_var.set("Decoding received audio...")
                self.current_decoded_image = self.sstv.decode_audio(self.current_audio, self.update_status)
                
                if self.current_decoded_image is not None:
                    self.display_image(self.current_decoded_image, self.decoded_image_label)
                    self.status_var.set("Reception and decoding complete!")
                else:
                    self.status_var.set("Reception complete, but decoding failed")
                    
            except Exception as e:
                self.sstv.is_receiving = False
                self.status_var.set(f"Reception error: {str(e)}")
        
        threading.Thread(target=receive_thread, daemon=True).start()
    
    def generate_test_image(self):
        """Generate a test pattern"""
        try:
            # Create test pattern
            img_array = np.zeros((self.sstv.HEIGHT, self.sstv.WIDTH, 3), dtype=np.uint8)
            
            for y in range(self.sstv.HEIGHT):
                for x in range(self.sstv.WIDTH):
                    # Create a gradient pattern
                    img_array[y, x, 0] = int((x / self.sstv.WIDTH) * 255)  # R
                    img_array[y, x, 1] = int((y / self.sstv.HEIGHT) * 255)  # G
                    img_array[y, x, 2] = int(((x + y) / (self.sstv.WIDTH + self.sstv.HEIGHT)) * 255)  # B
            
            self.current_image = Image.fromarray(img_array)
            self.display_image(self.current_image, self.orig_image_label)
            self.status_var.set("Test image generated")
        except Exception as e:
            messagebox.showerror("Error", f"Could not generate test image:\n{str(e)}")
    
    def full_test(self):
        """Run full encode/decode test"""
        if self.current_image is None:
            self.generate_test_image()
        
        def test_thread():
            try:
                self.status_var.set("Running full test cycle...")
                
                # Encode
                self.update_status(0, "Encoding test image...")
                audio = self.sstv.encode_image(self.current_image, self.update_status)
                
                if audio is None:
                    self.status_var.set("Test failed at encoding stage")
                    return
                
                # Decode
                self.update_status(0, "Decoding audio...")
                decoded = self.sstv.decode_audio(audio, self.update_status)
                
                if decoded is not None:
                    self.current_decoded_image = decoded
                    self.display_image(decoded, self.decoded_image_label)
                    self.status_var.set("Full test cycle complete!")
                else:
                    self.status_var.set("Test failed at decoding stage")
                    
            except Exception as e:
                self.status_var.set(f"Test error: {str(e)}")
        
        threading.Thread(target=test_thread, daemon=True).start()
    
    def display_image(self, image, label_widget):
        """Display image in label widget"""
        try:
            # Resize image for display
            display_size = (300, 225)  # Maintain aspect ratio
            display_image = image.resize(display_size, Image.Resampling.LANCZOS)
            
            # Convert to PhotoImage
            photo = ImageTk.PhotoImage(display_image)
            
            # Update label
            label_widget.configure(image=photo, text="")
            label_widget.image = photo  # Keep a reference
            
        except Exception as e:
            label_widget.configure(image="", text=f"Display error: {str(e)}")

def main():
    # Check dependencies
    try:
        import numpy
        import sounddevice
        import soundfile
        from PIL import Image
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install required packages:")
        print("pip install numpy sounddevice soundfile pillow")
        sys.exit(1)
    
    # Create and run application
    root = tk.Tk()
    app = SSTVDesktopApp(root)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("\nApplication closed by user")

if __name__ == "__main__":
    main()

