/**
 * Audio Utilities for Pigeon70 SSTV
 * 
 * Additional audio processing utilities and helper functions
 */

class AudioUtils {
    constructor() {
        this.SAMPLE_RATE = 44100;
    }

    /**
     * Normalize audio buffer to prevent clipping
     */
    normalizeAudio(audioBuffer, targetPeak = 0.8) {
        const maxValue = Math.max(...audioBuffer.map(Math.abs));
        if (maxValue === 0) return audioBuffer;
        
        const scale = targetPeak / maxValue;
        return audioBuffer.map(sample => sample * scale);
    }

    /**
     * Apply low-pass filter to reduce noise
     */
    applyLowPassFilter(audioBuffer, cutoffFreq = 2500, sampleRate = this.SAMPLE_RATE) {
        const filtered = new Float32Array(audioBuffer.length);
        const rc = 1 / (2 * Math.PI * cutoffFreq);
        const dt = 1 / sampleRate;
        const alpha = dt / (rc + dt);
        
        filtered[0] = audioBuffer[0];
        for (let i = 1; i < audioBuffer.length; i++) {
            filtered[i] = filtered[i - 1] + alpha * (audioBuffer[i] - filtered[i - 1]);
        }
        
        return filtered;
    }

    /**
     * Apply high-pass filter to remove DC offset
     */
    applyHighPassFilter(audioBuffer, cutoffFreq = 50, sampleRate = this.SAMPLE_RATE) {
        const filtered = new Float32Array(audioBuffer.length);
        const rc = 1 / (2 * Math.PI * cutoffFreq);
        const dt = 1 / sampleRate;
        const alpha = rc / (rc + dt);
        
        filtered[0] = audioBuffer[0];
        for (let i = 1; i < audioBuffer.length; i++) {
            filtered[i] = alpha * (filtered[i - 1] + audioBuffer[i] - audioBuffer[i - 1]);
        }
        
        return filtered;
    }

    /**
     * Apply band-pass filter for SSTV frequency range
     */
    applyBandPassFilter(audioBuffer, lowFreq = 1000, highFreq = 2500, sampleRate = this.SAMPLE_RATE) {
        // Apply high-pass filter first
        let filtered = this.applyHighPassFilter(audioBuffer, lowFreq, sampleRate);
        // Then apply low-pass filter
        filtered = this.applyLowPassFilter(filtered, highFreq, sampleRate);
        return filtered;
    }

    /**
     * Calculate RMS (Root Mean Square) for audio level detection
     */
    calculateRMS(audioBuffer) {
        let sum = 0;
        for (let i = 0; i < audioBuffer.length; i++) {
            sum += audioBuffer[i] * audioBuffer[i];
        }
        return Math.sqrt(sum / audioBuffer.length);
    }

    /**
     * Detect audio level and return if signal is present
     */
    detectSignal(audioBuffer, threshold = 0.01) {
        const rms = this.calculateRMS(audioBuffer);
        return rms > threshold;
    }

    /**
     * Generate a test tone for calibration
     */
    generateTestTone(frequency = 1900, duration = 1, sampleRate = this.SAMPLE_RATE) {
        const samples = Math.floor(duration * sampleRate);
        const buffer = new Float32Array(samples);
        const omega = 2 * Math.PI * frequency / sampleRate;
        
        for (let i = 0; i < samples; i++) {
            buffer[i] = 0.5 * Math.sin(omega * i);
        }
        
        return buffer;
    }

    /**
     * Generate a sweep tone for frequency response testing
     */
    generateSweepTone(startFreq = 1500, endFreq = 2300, duration = 2, sampleRate = this.SAMPLE_RATE) {
        const samples = Math.floor(duration * sampleRate);
        const buffer = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const freq = startFreq + (endFreq - startFreq) * (t / duration);
            const omega = 2 * Math.PI * freq / sampleRate;
            buffer[i] = 0.3 * Math.sin(omega * i);
        }
        
        return buffer;
    }

    /**
     * Mix multiple audio buffers
     */
    mixAudioBuffers(buffers) {
        const maxLength = Math.max(...buffers.map(buf => buf.length));
        const mixed = new Float32Array(maxLength);
        
        for (const buffer of buffers) {
            for (let i = 0; i < buffer.length; i++) {
                mixed[i] += buffer[i];
            }
        }
        
        // Normalize to prevent clipping
        return this.normalizeAudio(mixed);
    }

    /**
     * Add fade in/out to prevent clicks
     */
    addFade(audioBuffer, fadeInDuration = 0.01, fadeOutDuration = 0.01, sampleRate = this.SAMPLE_RATE) {
        const faded = new Float32Array(audioBuffer);
        const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
        const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);
        
        // Fade in
        for (let i = 0; i < fadeInSamples; i++) {
            const factor = i / fadeInSamples;
            faded[i] *= factor;
        }
        
        // Fade out
        for (let i = 0; i < fadeOutSamples; i++) {
            const factor = i / fadeOutSamples;
            const index = faded.length - 1 - i;
            faded[index] *= factor;
        }
        
        return faded;
    }

    /**
     * Convert audio buffer to mono if stereo
     */
    toMono(audioBuffer, channels = 2) {
        if (channels === 1) return audioBuffer;
        
        const monoLength = audioBuffer.length / channels;
        const mono = new Float32Array(monoLength);
        
        for (let i = 0; i < monoLength; i++) {
            let sum = 0;
            for (let ch = 0; ch < channels; ch++) {
                sum += audioBuffer[i * channels + ch];
            }
            mono[i] = sum / channels;
        }
        
        return mono;
    }

    /**
     * Resample audio buffer to target sample rate
     */
    resample(audioBuffer, fromRate, toRate) {
        if (fromRate === toRate) return audioBuffer;
        
        const ratio = fromRate / toRate;
        const newLength = Math.floor(audioBuffer.length / ratio);
        const resampled = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const sourceIndex = i * ratio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;
            
            if (index + 1 < audioBuffer.length) {
                // Linear interpolation
                resampled[i] = audioBuffer[index] * (1 - fraction) + audioBuffer[index + 1] * fraction;
            } else {
                resampled[i] = audioBuffer[index];
            }
        }
        
        return resampled;
    }

    /**
     * Create a spectrogram visualization of audio
     */
    createSpectrogram(audioBuffer, sampleRate = this.SAMPLE_RATE, fftSize = 1024) {
        const hopSize = fftSize / 4;
        const spectrogram = [];
        
        for (let i = 0; i < audioBuffer.length - fftSize; i += hopSize) {
            const segment = audioBuffer.slice(i, i + fftSize);
            const fft = this.performFFT(segment);
            spectrogram.push(fft);
        }
        
        return spectrogram;
    }

    /**
     * Simple FFT implementation (for educational purposes)
     * For production use, consider using a library like p5.fft or Web Audio API
     */
    performFFT(signal) {
        const N = signal.length;
        const fft = new Array(N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += signal[n] * Math.cos(angle);
                imag += signal[n] * Math.sin(angle);
            }
            
            fft[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return fft;
    }

    /**
     * Calculate frequency bins for FFT
     */
    getFrequencyBins(fftSize, sampleRate) {
        const bins = new Array(fftSize / 2);
        for (let i = 0; i < bins.length; i++) {
            bins[i] = (i * sampleRate) / fftSize;
        }
        return bins;
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioUtils;
}








