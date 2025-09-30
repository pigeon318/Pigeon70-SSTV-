/**
 * Pigeon70 SSTV Decoder
 * 
 * Decodes SSTV audio signals back to images according to Pigeon70 specifications:
 * - Resolution: 320x240 pixels
 * - Audio range: 1500-2300 Hz
 * - Frequency detection and image reconstruction
 */

class Pigeon70Decoder {
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
        
        // Timing specifications (corrected to match encoder)
        this.DURATION_VIS = 0.3;        // VIS code duration (300ms)
        this.DURATION_SYNC = 0.01;      // Sync pulse duration (10ms)
        this.DURATION_SEPARATOR = 0.01; // Separator pulse duration (10ms)
        // Pixel duration: (295ms line time - 20ms sync/separator) / 960 pixels = ~0.286ms
        this.DURATION_PIXEL = (0.295 - 0.02) / 960;
        
        // Detection thresholds (relaxed for better detection)
        this.FREQ_TOLERANCE = 100;  // Frequency detection tolerance (increased)
        this.AMPLITUDE_THRESHOLD = 0.05; // Minimum amplitude for detection (decreased)
        this.DEBUG_MODE = false; // Enable debug logging
        
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
     * Convert frequency to pixel value (0-255)
     */
    frequencyToPixel(frequency) {
        if (frequency < this.FREQ_MIN) return 0;
        if (frequency > this.FREQ_MAX) return 255;
        return Math.round(((frequency - this.FREQ_MIN) / (this.FREQ_MAX - this.FREQ_MIN)) * 255);
    }

    /**
     * Detect dominant frequency in audio buffer using optimized autocorrelation
     */
    detectFrequency(audioBuffer, sampleRate = this.SAMPLE_RATE) {
        if (audioBuffer.length < 100) return 1500; // Default if too short
        
        let bestFreq = 1500; // Default frequency
        let bestScore = 0;
        
        // Optimized frequency detection - test key frequencies first
        const testFrequencies = [
            // Critical SSTV frequencies
            this.FREQ_VIS, this.FREQ_SYNC, this.FREQ_SEPARATOR,
            // Pixel range with finer steps for better accuracy
            1500, 1520, 1540, 1560, 1580, 1600, 1620, 1640, 1660, 1680, 1700,
            1720, 1740, 1760, 1780, 1800, 1820, 1840, 1860, 1880, 1900, 1920,
            1940, 1960, 1980, 2000, 2020, 2040, 2060, 2080, 2100, 2120, 2140,
            2160, 2180, 2200, 2220, 2240, 2260, 2280, 2300
        ];
        
        for (const freq of testFrequencies) {
            const score = this.calculateFrequencyScore(audioBuffer, freq, sampleRate);
            if (score > bestScore) {
                bestScore = score;
                bestFreq = freq;
            }
        }
        
        // If we found a good match, refine it
        if (bestScore > 0.05) {
            // Fine-tune around the best frequency with smaller steps
            for (let offset = -20; offset <= 20; offset += 1) {
                const testFreq = bestFreq + offset;
                if (testFreq >= 1000 && testFreq <= 2500) {
                    const score = this.calculateFrequencyScore(audioBuffer, testFreq, sampleRate);
                    if (score > bestScore) {
                        bestScore = score;
                        bestFreq = testFreq;
                    }
                }
            }
        }
        
        return bestFreq;
    }
    
    /**
     * Calculate frequency score using improved autocorrelation
     */
    calculateFrequencyScore(audioBuffer, frequency, sampleRate) {
        const period = sampleRate / frequency;
        
        if (audioBuffer.length < period * 3) return 0;
        
        let correlation = 0;
        let count = 0;
        
        // Use multiple periods for better correlation
        const numPeriods = Math.min(10, Math.floor(audioBuffer.length / period));
        
        for (let p = 1; p < numPeriods; p++) {
            const periodSamples = Math.floor(period * p);
            
            for (let i = 0; i < audioBuffer.length - periodSamples * 2; i += Math.max(1, Math.floor(period / 4))) {
                const sample1 = audioBuffer[i];
                const sample2 = audioBuffer[i + periodSamples];
                
                correlation += sample1 * sample2;
                count++;
                
                if (count > 50) break; // Limit computation
            }
            
            if (count > 50) break;
        }
        
        return count > 0 ? Math.abs(correlation / count) : 0;
    }

    /**
     * Detect frequency using Web Audio API's AnalyserNode
     */
    async detectFrequencyAdvanced(audioBuffer, sampleRate = this.SAMPLE_RATE) {
        await this.initAudio();
        
        const buffer = this.audioContext.createBuffer(1, audioBuffer.length, sampleRate);
        buffer.copyToChannel(audioBuffer, 0);
        
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.8;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(analyser);
        
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        
        // Find peak frequency
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }
        
        // Convert bin index to frequency
        const frequency = (maxIndex * sampleRate) / (2 * analyser.fftSize);
        
        source.disconnect();
        return frequency;
    }

    /**
     * Find VIS code in audio buffer with improved detection
     */
    findVISCode(audioBuffer, sampleRate = this.SAMPLE_RATE) {
        const visSamples = Math.floor(this.DURATION_VIS * sampleRate);
        const hopSize = Math.floor(sampleRate * 0.005); // 5ms hops for better resolution
        
        let bestMatch = -1;
        let bestScore = 0;
        
        // Search through the first 1 second of audio (VIS should be at the very beginning)
        const searchLimit = Math.min(audioBuffer.length - visSamples, sampleRate * 1);
        
        for (let i = 0; i < searchLimit; i += hopSize) {
            const segment = audioBuffer.slice(i, i + visSamples);
            
            // Test VIS frequency directly
            const visScore = this.calculateFrequencyScore(segment, this.FREQ_VIS, sampleRate);
            
            if (visScore > bestScore) {
                bestScore = visScore;
                bestMatch = i;
            }
        }
        
        // If we found any match, verify it
        if (bestMatch !== -1 && bestScore > 0.01) {
            const segment = audioBuffer.slice(bestMatch, bestMatch + visSamples);
            const frequency = this.detectFrequency(segment, sampleRate);
            const frequencyError = Math.abs(frequency - this.FREQ_VIS);
            
            console.log(`VIS code candidate at sample ${bestMatch} (${(bestMatch/sampleRate).toFixed(2)}s): frequency=${frequency.toFixed(1)}Hz, error=${frequencyError.toFixed(1)}Hz, score=${bestScore.toFixed(3)}`);
            
            if (frequencyError < this.FREQ_TOLERANCE) {
                console.log(`✅ VIS code found at sample ${bestMatch} (${(bestMatch/sampleRate).toFixed(2)}s) with frequency ${frequency.toFixed(1)}Hz`);
                return bestMatch;
            }
        }
        
        console.log('❌ VIS code not found');
        return -1;
    }

    /**
     * Find sync pulse in audio buffer with improved detection
     */
    findSyncPulse(audioBuffer, startIndex, sampleRate = this.SAMPLE_RATE) {
        const syncSamples = Math.floor(this.DURATION_SYNC * sampleRate);
        const searchRange = Math.floor(sampleRate * 0.5); // Search in 500ms window
        
        let bestMatch = -1;
        let bestScore = 0;
        
        // Fine-grained search for sync pulses
        const stepSize = Math.floor(sampleRate * 0.001); // 1ms steps for better accuracy
        
        for (let i = startIndex; i < Math.min(startIndex + searchRange, audioBuffer.length - syncSamples); i += stepSize) {
            const segment = audioBuffer.slice(i, i + syncSamples);
            
            // Test sync frequency
            const syncScore = this.calculateFrequencyScore(segment, this.FREQ_SYNC, sampleRate);
            
            if (syncScore > bestScore) {
                bestScore = syncScore;
                bestMatch = i;
            }
        }
        
        // Accept match with very low threshold for sync pulses
        if (bestMatch !== -1 && bestScore > 0.005) {
            const segment = audioBuffer.slice(bestMatch, bestMatch + syncSamples);
            const frequency = this.detectFrequency(segment, sampleRate);
            const frequencyError = Math.abs(frequency - this.FREQ_SYNC);
            
            if (frequencyError < this.FREQ_TOLERANCE) {
                return bestMatch;
            }
        }
        
        return -1;
    }

    /**
     * Decode a single line of pixels (optimized)
     */
    decodeLine(audioBuffer, startIndex, sampleRate = this.SAMPLE_RATE) {
        const pixels = new Array(this.WIDTH * 3); // R, G, B for each pixel
        let currentIndex = startIndex;
        
        // Skip separator pulse
        const separatorSamples = Math.floor(this.DURATION_SEPARATOR * sampleRate);
        currentIndex += separatorSamples;
        
        const pixelSamples = Math.floor(this.DURATION_PIXEL * sampleRate);
        
        // Decode each pixel (3 tones per pixel: R, G, B)
        for (let x = 0; x < this.WIDTH; x++) {
            for (let color = 0; color < 3; color++) {
                // Ensure we don't go out of bounds
                if (currentIndex + pixelSamples >= audioBuffer.length) {
                    // Fill remaining pixels with default value
                    for (let remaining = x * 3 + color; remaining < pixels.length; remaining++) {
                        pixels[remaining] = 128; // Default gray
                    }
                    return { pixels, nextIndex: audioBuffer.length };
                }
                
                const segment = audioBuffer.slice(currentIndex, currentIndex + pixelSamples);
                
                // Quick frequency detection for pixel data
                const frequency = this.detectFrequency(segment, sampleRate);
                const pixelValue = this.frequencyToPixel(frequency);
                
                // Clamp pixel value to valid range
                const clampedValue = Math.max(0, Math.min(255, pixelValue));
                
                pixels[x * 3 + color] = clampedValue;
                currentIndex += pixelSamples;
            }
        }
        
        return { pixels, nextIndex: currentIndex };
    }

    /**
     * Decode entire SSTV signal to image with improved error handling and timeout protection
     */
    async decodeAudio(audioBuffer, sampleRate = this.SAMPLE_RATE) {
        console.log('Starting SSTV decoding...');
        console.log(`Audio buffer length: ${audioBuffer.length} samples (${(audioBuffer.length / sampleRate).toFixed(2)} seconds)`);
        
        // Add timeout protection
        const startTime = Date.now();
        const maxDecodeTime = 120000; // 2 minutes max
        
        // Find VIS code with timeout
        console.log('Searching for VIS code...');
        const visIndex = this.findVISCode(audioBuffer, sampleRate);
        let startIndex = 0;
        
        if (visIndex === -1) {
            console.warn('VIS code not found, attempting to decode from beginning of audio');
            // Try to find the first sync pulse instead
            console.log('Searching for first sync pulse...');
            const firstSync = this.findSyncPulse(audioBuffer, 0, sampleRate);
            if (firstSync === -1) {
                throw new Error('No VIS code or sync pulse found in audio signal. Please ensure the audio contains a valid Pigeon70 SSTV signal.');
            }
            startIndex = firstSync;
            console.log(`Starting decode from first sync pulse at sample ${startIndex}`);
        } else {
            startIndex = visIndex + Math.floor(this.DURATION_VIS * sampleRate);
            console.log(`VIS code found at sample ${visIndex}, starting decode at sample ${startIndex}`);
        }
        
        // Create image data
        const imageData = new ImageData(this.WIDTH, this.HEIGHT);
        const data = imageData.data;
        
        let currentIndex = startIndex;
        let successfulLines = 0;
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 10;
        
        // Decode each line with timeout protection
        for (let y = 0; y < this.HEIGHT; y++) {
            // Check for timeout
            if (Date.now() - startTime > maxDecodeTime) {
                console.warn(`Decoding timeout after ${(Date.now() - startTime) / 1000} seconds`);
                break;
            }
            
            // Progress callback
            if (this.onProgress) {
                this.onProgress((y + 1) / this.HEIGHT);
            }
            
            // Find sync pulse for this line
            let syncIndex = this.findSyncPulse(audioBuffer, currentIndex, sampleRate);
            let lineStartIndex = syncIndex;
            
            if (syncIndex === -1) {
                // Try searching in a wider range around the expected position
                const expectedLineTime = 0.295; // 295ms per line
                const searchStart = Math.max(0, currentIndex - Math.floor(sampleRate * 0.1)); // 100ms before
                const searchEnd = Math.min(audioBuffer.length, currentIndex + Math.floor(sampleRate * 0.2)); // 200ms after
                
                // Search in wider range
                for (let searchIndex = searchStart; searchIndex < searchEnd; searchIndex += Math.floor(sampleRate * 0.01)) {
                    const testSync = this.findSyncPulse(audioBuffer, searchIndex, sampleRate);
                    if (testSync !== -1) {
                        syncIndex = testSync;
                        lineStartIndex = testSync;
                        break;
                    }
                }
                
                if (syncIndex === -1) {
                    console.warn(`Sync pulse not found for line ${y}, using estimated position`);
                    // Use estimated line position based on timing
                    lineStartIndex = currentIndex;
                    consecutiveFailures++;
                } else {
                    consecutiveFailures = 0; // Reset failure counter
                }
            } else {
                consecutiveFailures = 0; // Reset failure counter
            }
            
            try {
                // Decode the line
                const lineResult = this.decodeLine(audioBuffer, lineStartIndex, sampleRate);
                const pixels = lineResult.pixels;
                
                // Copy pixel data to image
                for (let x = 0; x < this.WIDTH; x++) {
                    const pixelIndex = (y * this.WIDTH + x) * 4;
                    data[pixelIndex] = pixels[x * 3];     // R
                    data[pixelIndex + 1] = pixels[x * 3 + 1]; // G
                    data[pixelIndex + 2] = pixels[x * 3 + 2]; // B
                    data[pixelIndex + 3] = 255;           // A
                }
                
                if (syncIndex !== -1) {
                    currentIndex = lineResult.nextIndex;
                } else {
                    // Skip ahead by estimated line time with some tolerance
                    currentIndex += Math.floor(sampleRate * 0.295); // 295ms per line
                }
                
                successfulLines++;
                
                // Log progress every 20 lines
                if (y % 20 === 0) {
                    console.log(`Decoded line ${y + 1}/${this.HEIGHT} (${((y + 1) / this.HEIGHT * 100).toFixed(1)}%)`);
                }
                
            } catch (error) {
                console.warn(`Error decoding line ${y}:`, error.message);
                consecutiveFailures++;
                
                // Skip ahead and try next line
                currentIndex += Math.floor(sampleRate * 0.295); // Skip estimated line time
            }
            
            // Stop if too many consecutive failures
            if (consecutiveFailures >= maxConsecutiveFailures) {
                console.warn(`Too many consecutive failures (${consecutiveFailures}), stopping decode`);
                break;
            }
        }
        
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`Decoding completed in ${totalTime.toFixed(1)} seconds. Successfully decoded ${successfulLines} lines out of ${this.HEIGHT}`);
        
        if (successfulLines === 0) {
            throw new Error('No lines could be decoded. Please check the audio quality and ensure it contains a valid SSTV signal.');
        }
        
        return imageData;
    }

    /**
     * Decode audio from file
     */
    async decodeFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    await this.initAudio();
                    const audioBuffer = await this.audioContext.decodeAudioData(e.target.result);
                    const imageData = await this.decodeAudio(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
                    resolve(imageData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Decode audio from microphone input
     */
    async decodeFromMicrophone(duration = 75) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.initAudio();
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = this.audioContext.createMediaStreamSource(stream);
                const analyser = this.audioContext.createAnalyser();
                
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;
                
                source.connect(analyser);
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                const audioBuffer = new Float32Array(duration * this.SAMPLE_RATE);
                let sampleIndex = 0;
                
                const processAudio = () => {
                    analyser.getByteFrequencyData(dataArray);
                    
                    // Convert to float32 and add to buffer
                    for (let i = 0; i < bufferLength && sampleIndex < audioBuffer.length; i++) {
                        audioBuffer[sampleIndex] = (dataArray[i] - 128) / 128;
                        sampleIndex++;
                    }
                    
                    if (sampleIndex < audioBuffer.length) {
                        requestAnimationFrame(processAudio);
                    } else {
                        stream.getTracks().forEach(track => track.stop());
                        source.disconnect();
                        
                        // Decode the captured audio
                        this.decodeAudio(audioBuffer, this.SAMPLE_RATE)
                            .then(resolve)
                            .catch(reject);
                    }
                };
                
                processAudio();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled) {
        this.DEBUG_MODE = enabled;
    }

    /**
     * Test audio buffer for SSTV signals (debug function)
     */
    testAudioBuffer(audioBuffer, sampleRate = this.SAMPLE_RATE) {
        console.log('=== SSTV Audio Buffer Test ===');
        console.log(`Buffer length: ${audioBuffer.length} samples (${(audioBuffer.length / sampleRate).toFixed(2)} seconds)`);
        console.log(`Sample rate: ${sampleRate} Hz`);
        
        // Test for VIS code
        const visIndex = this.findVISCode(audioBuffer, sampleRate);
        if (visIndex !== -1) {
            console.log(`✅ VIS code found at sample ${visIndex} (${(visIndex / sampleRate).toFixed(3)}s)`);
        } else {
            console.log('❌ VIS code not found');
        }
        
        // Test for sync pulses
        let syncCount = 0;
        let currentIndex = 0;
        while (currentIndex < audioBuffer.length - Math.floor(this.DURATION_SYNC * sampleRate)) {
            const syncIndex = this.findSyncPulse(audioBuffer, currentIndex, sampleRate);
            if (syncIndex === -1) break;
            syncCount++;
            currentIndex = syncIndex + Math.floor(sampleRate * 0.3); // Skip ahead 300ms
        }
        console.log(`Found ${syncCount} sync pulses`);
        
        // Test frequency range
        const testSegments = 20;
        const segmentSize = Math.floor(audioBuffer.length / testSegments);
        console.log('Frequency analysis:');
        for (let i = 0; i < testSegments; i++) {
            const start = i * segmentSize;
            const end = Math.min(start + segmentSize, audioBuffer.length);
            const segment = audioBuffer.slice(start, end);
            const freq = this.detectFrequency(segment, sampleRate);
            const time = (start / sampleRate).toFixed(2);
            
            // Highlight important frequencies
            let marker = '';
            if (Math.abs(freq - this.FREQ_VIS) < 50) marker = ' [VIS]';
            else if (Math.abs(freq - this.FREQ_SYNC) < 50) marker = ' [SYNC]';
            else if (Math.abs(freq - this.FREQ_SEPARATOR) < 50) marker = ' [SEP]';
            
            console.log(`  ${time}s: ${freq.toFixed(1)} Hz${marker}`);
        }
        
        // Test specific frequencies at the beginning
        console.log('Beginning frequency tests:');
        const visSegment = audioBuffer.slice(0, Math.floor(this.DURATION_VIS * sampleRate));
        const visScore = this.calculateFrequencyScore(visSegment, this.FREQ_VIS, sampleRate);
        console.log(`  VIS (0-${this.DURATION_VIS}s): score=${visScore.toFixed(3)}`);
        
        const syncSegment = audioBuffer.slice(Math.floor(this.DURATION_VIS * sampleRate), Math.floor((this.DURATION_VIS + this.DURATION_SYNC) * sampleRate));
        const syncScore = this.calculateFrequencyScore(syncSegment, this.FREQ_SYNC, sampleRate);
        console.log(`  First sync: score=${syncScore.toFixed(3)}`);
        
        return {
            visFound: visIndex !== -1,
            visIndex: visIndex,
            syncCount: syncCount,
            bufferLength: audioBuffer.length,
            duration: audioBuffer.length / sampleRate
        };
    }

    /**
     * Export decoded image as PNG
     */
    exportAsPNG(imageData, filename = 'decoded_sstv.png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pigeon70Decoder;
}

