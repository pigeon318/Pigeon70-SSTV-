/**
 * Pigeon70 SSTV Encoder
 * 
 * Encodes images into SSTV audio signals according to Pigeon70 specifications:
 * - Resolution: 320x240 pixels
 * - Audio range: 1500-2300 Hz
 * - Transmission time: ~70 seconds
 * - RGB24 encoding with frequency modulation
 */

class Pigeon70Encoder {
    constructor() {
        // Pigeon70 specifications
        this.WIDTH = 320;
        this.HEIGHT = 240;
        this.SAMPLE_RATE = 44100;
        
        // Frequency mapping
        this.FREQ_VIS = 1900;      // VIS code frequency
        this.FREQ_SYNC = 1200;     // Sync pulse frequency
        this.FREQ_SEPARATOR = 1500; // Separator pulse frequency
        this.FREQ_MIN = 1500;      // Minimum pixel frequency
        this.FREQ_MAX = 2300;      // Maximum pixel frequency
        
        // Timing specifications (corrected)
        this.DURATION_VIS = 0.3;        // VIS code duration (300ms)
        this.DURATION_SYNC = 0.01;      // Sync pulse duration (10ms)
        this.DURATION_SEPARATOR = 0.01; // Separator pulse duration (10ms)
        // Pixel duration: (295ms line time - 20ms sync/separator) / 960 pixels = ~0.286ms
        this.DURATION_PIXEL = (0.295 - 0.02) / 960;
        
        this.audioContext = null;
    }

    /**
     * Initialize the audio context
     */
    async initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Convert pixel value (0-255) to frequency (1500-2300 Hz)
     */
    pixelToFrequency(pixelValue) {
        return this.FREQ_MIN + (pixelValue / 255) * (this.FREQ_MAX - this.FREQ_MIN);
    }

    /**
     * Generate a sine wave tone
     */
    generateTone(frequency, duration, sampleRate = this.SAMPLE_RATE) {
        const samples = Math.floor(duration * sampleRate);
        const buffer = new Float32Array(samples);
        const omega = 2 * Math.PI * frequency / sampleRate;
        
        for (let i = 0; i < samples; i++) {
            buffer[i] = Math.sin(omega * i);
        }
        
        return buffer;
    }

    /**
     * Generate silence
     */
    generateSilence(duration, sampleRate = this.SAMPLE_RATE) {
        const samples = Math.floor(duration * sampleRate);
        return new Float32Array(samples);
    }

    /**
     * Resize image to Pigeon70 specifications (320x240)
     */
    resizeImage(imageData, targetWidth = this.WIDTH, targetHeight = this.HEIGHT) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Create temporary canvas for source image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw resized image
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
        
        return ctx.getImageData(0, 0, targetWidth, targetHeight);
    }

    /**
     * Encode image data to SSTV audio signal
     */
    async encodeImage(imageData) {
        await this.initAudio();
        
        // Resize image to Pigeon70 specifications
        const resizedImage = this.resizeImage(imageData);
        const data = resizedImage.data;
        
        // Calculate total duration (corrected timing)
        const lineTime = this.DURATION_SYNC + this.DURATION_SEPARATOR + (960 * this.DURATION_PIXEL);
        const totalDuration = this.DURATION_VIS + (this.HEIGHT * lineTime);
        
        console.log(`Encoder timing: VIS=${this.DURATION_VIS}s, Line=${lineTime.toFixed(3)}s, Total=${totalDuration.toFixed(1)}s`);
        const totalSamples = Math.floor(totalDuration * this.SAMPLE_RATE);
        
        // Create audio buffer
        const audioBuffer = new Float32Array(totalSamples);
        let sampleIndex = 0;
        
        // Generate VIS code (1900 Hz for 300ms)
        const visTone = this.generateTone(this.FREQ_VIS, this.DURATION_VIS);
        audioBuffer.set(visTone, sampleIndex);
        sampleIndex += visTone.length;
        
        // Process each line
        for (let y = 0; y < this.HEIGHT; y++) {
            // Sync pulse (1200 Hz for 10ms)
            const syncTone = this.generateTone(this.FREQ_SYNC, this.DURATION_SYNC);
            audioBuffer.set(syncTone, sampleIndex);
            sampleIndex += syncTone.length;
            
            // Separator pulse (1500 Hz for 10ms)
            const separatorTone = this.generateTone(this.FREQ_SEPARATOR, this.DURATION_SEPARATOR);
            audioBuffer.set(separatorTone, sampleIndex);
            sampleIndex += separatorTone.length;
            
            // Process each pixel in the line
            for (let x = 0; x < this.WIDTH; x++) {
                const pixelIndex = (y * this.WIDTH + x) * 4;
                const r = data[pixelIndex];
                const g = data[pixelIndex + 1];
                const b = data[pixelIndex + 2];
                
                // Generate tones for R, G, B values
                const rTone = this.generateTone(this.pixelToFrequency(r), this.DURATION_PIXEL);
                const gTone = this.generateTone(this.pixelToFrequency(g), this.DURATION_PIXEL);
                const bTone = this.generateTone(this.pixelToFrequency(b), this.DURATION_PIXEL);
                
                // Add tones to buffer
                audioBuffer.set(rTone, sampleIndex);
                sampleIndex += rTone.length;
                audioBuffer.set(gTone, sampleIndex);
                sampleIndex += gTone.length;
                audioBuffer.set(bTone, sampleIndex);
                sampleIndex += bTone.length;
            }
        }
        
        return audioBuffer;
    }

    /**
     * Play the encoded audio
     */
    async playAudio(audioBuffer) {
        await this.initAudio();
        
        const buffer = this.audioContext.createBuffer(1, audioBuffer.length, this.SAMPLE_RATE);
        buffer.copyToChannel(audioBuffer, 0);
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
        
        return source;
    }

    /**
     * Export audio as WAV file
     */
    exportAsWAV(audioBuffer, filename = 'pigeon70_sstv.wav') {
        const buffer = new ArrayBuffer(44 + audioBuffer.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + audioBuffer.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, this.SAMPLE_RATE, true);
        view.setUint32(28, this.SAMPLE_RATE * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, audioBuffer.length * 2, true);
        
        // Convert float32 to int16
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        // Download file
        const blob = new Blob([buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Encode image from file input
     */
    async encodeFromFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const audioBuffer = await this.encodeImage(imageData);
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pigeon70Encoder;
}
