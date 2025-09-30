/**
 * Pigeon70 SSTV Application
 * 
 * Main application logic for the web-based SSTV encoder/decoder interface
 */

class SSTVApp {
    constructor() {
        this.encoder = new Pigeon70Encoder();
        this.decoder = new Pigeon70Decoder();
        this.currentAudioBuffer = null;
        this.currentImageData = null;
        this.audioSource = null;
        this.isDecoding = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    initializeElements() {
        // Encoder elements
        this.encoderUpload = document.getElementById('encoderUpload');
        this.encoderFileInput = document.getElementById('encoderFileInput');
        this.encodeBtn = document.getElementById('encodeBtn');
        this.playBtn = document.getElementById('playBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.encodeProgress = document.getElementById('encodeProgress');
        this.encoderStatus = document.getElementById('encoderStatus');
        this.encoderPreview = document.getElementById('encoderPreview');

        // Decoder elements
        this.decoderUpload = document.getElementById('decoderUpload');
        this.decoderFileInput = document.getElementById('decoderFileInput');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.micBtn = document.getElementById('micBtn');
        this.downloadImageBtn = document.getElementById('downloadImageBtn');
        this.debugBtn = document.getElementById('debugBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.decodeProgress = document.getElementById('decodeProgress');
        this.decoderStatus = document.getElementById('decoderStatus');
        this.decoderPreview = document.getElementById('decoderPreview');
    }

    setupEventListeners() {
        // Encoder events
        this.encoderUpload.addEventListener('click', () => this.encoderFileInput.click());
        this.encoderFileInput.addEventListener('change', (e) => this.handleEncoderFile(e.target.files[0]));
        this.encodeBtn.addEventListener('click', () => this.encodeImage());
        this.playBtn.addEventListener('click', () => this.playAudio());
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());

        // Decoder events
        this.decoderUpload.addEventListener('click', () => this.decoderFileInput.click());
        this.decoderFileInput.addEventListener('change', (e) => this.handleDecoderFile(e.target.files[0]));
        this.decodeBtn.addEventListener('click', () => this.decodeAudio());
        this.micBtn.addEventListener('click', () => this.recordFromMicrophone());
        this.downloadImageBtn.addEventListener('click', () => this.downloadImage());
        if (this.debugBtn) {
            this.debugBtn.addEventListener('click', () => this.debugAudio());
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.cancelDecoding());
        }

        // Set up decoder progress callback
        this.decoder.setProgressCallback((progress) => {
            this.updateDecodeProgress(progress);
        });
    }

    setupDragAndDrop() {
        // Encoder drag and drop
        this.encoderUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.encoderUpload.classList.add('dragover');
        });

        this.encoderUpload.addEventListener('dragleave', () => {
            this.encoderUpload.classList.remove('dragover');
        });

        this.encoderUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            this.encoderUpload.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleEncoderFile(files[0]);
            }
        });

        // Decoder drag and drop
        this.decoderUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.decoderUpload.classList.add('dragover');
        });

        this.decoderUpload.addEventListener('dragleave', () => {
            this.decoderUpload.classList.remove('dragover');
        });

        this.decoderUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            this.decoderUpload.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('audio/')) {
                this.handleDecoderFile(files[0]);
            }
        });
    }

    showStatus(element, message, type = 'info') {
        element.innerHTML = `<div class="status ${type}">${message}</div>`;
    }

    clearStatus(element) {
        element.innerHTML = '';
    }

    updateProgress(progressElement, progress) {
        const fill = progressElement.querySelector('.progress-fill');
        fill.style.width = `${progress * 100}%`;
    }

    // Encoder methods
    handleEncoderFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showStatus(this.encoderStatus, 'Please select a valid image file.', 'error');
            return;
        }

        this.showStatus(this.encoderStatus, `Selected: ${file.name}`, 'info');
        this.encodeBtn.disabled = false;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            this.encoderPreview.innerHTML = '';
            this.encoderPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    async encodeImage() {
        const file = this.encoderFileInput.files[0];
        if (!file) return;

        try {
            this.showStatus(this.encoderStatus, 'Encoding image to SSTV audio...', 'info');
            this.encodeProgress.style.display = 'block';
            this.updateProgress(this.encodeProgress, 0);

            // Simulate progress
            const progressInterval = setInterval(() => {
                const current = parseFloat(this.encodeProgress.querySelector('.progress-fill').style.width) || 0;
                if (current < 90) {
                    this.updateProgress(this.encodeProgress, current / 100 + 0.1);
                }
            }, 100);

            this.currentAudioBuffer = await this.encoder.encodeFromFile(file);

            clearInterval(progressInterval);
            this.updateProgress(this.encodeProgress, 1);

            this.showStatus(this.encoderStatus, 'Encoding complete! Audio ready for playback.', 'success');
            this.playBtn.disabled = false;
            this.downloadBtn.disabled = false;

            setTimeout(() => {
                this.encodeProgress.style.display = 'none';
            }, 2000);

        } catch (error) {
            this.showStatus(this.encoderStatus, `Encoding failed: ${error.message}`, 'error');
            this.encodeProgress.style.display = 'none';
        }
    }

    async playAudio() {
        if (!this.currentAudioBuffer) return;

        try {
            this.showStatus(this.encoderStatus, 'Playing SSTV audio...', 'info');
            this.audioSource = await this.encoder.playAudio(this.currentAudioBuffer);
            
            this.audioSource.onended = () => {
                this.showStatus(this.encoderStatus, 'Audio playback completed.', 'success');
            };

        } catch (error) {
            this.showStatus(this.encoderStatus, `Playback failed: ${error.message}`, 'error');
        }
    }

    downloadAudio() {
        if (!this.currentAudioBuffer) return;
        
        const filename = `pigeon70_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
        this.encoder.exportAsWAV(this.currentAudioBuffer, filename);
        this.showStatus(this.encoderStatus, `Downloaded: ${filename}`, 'success');
    }

    // Decoder methods
    handleDecoderFile(file) {
        if (!file || !file.type.startsWith('audio/')) {
            this.showStatus(this.decoderStatus, 'Please select a valid audio file.', 'error');
            return;
        }

        this.showStatus(this.decoderStatus, `Selected: ${file.name}`, 'info');
        this.decodeBtn.disabled = false;
        if (this.debugBtn) {
            this.debugBtn.disabled = false;
        }
    }

    async decodeAudio() {
        const file = this.decoderFileInput.files[0];
        if (!file) return;

        if (this.isDecoding) {
            this.showStatus(this.decoderStatus, 'Decoding already in progress...', 'info');
            return;
        }

        try {
            this.isDecoding = true;
            this.showStatus(this.decoderStatus, 'Decoding SSTV audio to image...', 'info');
            this.decodeProgress.style.display = 'block';
            this.updateProgress(this.decodeProgress, 0);
            
            // Show cancel button
            if (this.cancelBtn) {
                this.cancelBtn.style.display = 'inline-block';
                this.cancelBtn.disabled = false;
            }

            this.currentImageData = await this.decoder.decodeFromFile(file);

            this.updateProgress(this.decodeProgress, 1);
            this.showStatus(this.decoderStatus, 'Decoding complete! Image ready for download.', 'success');
            this.downloadImageBtn.disabled = false;

            // Show preview
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.currentImageData.width;
            canvas.height = this.currentImageData.height;
            ctx.putImageData(this.currentImageData, 0, 0);
            
            this.decoderPreview.innerHTML = '';
            this.decoderPreview.appendChild(canvas);

            setTimeout(() => {
                this.decodeProgress.style.display = 'none';
            }, 2000);

        } catch (error) {
            this.showStatus(this.decoderStatus, `Decoding failed: ${error.message}`, 'error');
            this.decodeProgress.style.display = 'none';
        } finally {
            this.isDecoding = false;
            if (this.cancelBtn) {
                this.cancelBtn.style.display = 'none';
            }
        }
    }

    async recordFromMicrophone() {
        try {
            this.showStatus(this.decoderStatus, 'Recording from microphone... Please play SSTV audio nearby.', 'info');
            this.micBtn.disabled = true;
            this.micBtn.textContent = '🎤 Recording...';

            this.decodeProgress.style.display = 'block';
            this.updateProgress(this.decodeProgress, 0);

            this.currentImageData = await this.decoder.decodeFromMicrophone(75);

            this.updateProgress(this.decodeProgress, 1);
            this.showStatus(this.decoderStatus, 'Recording and decoding complete!', 'success');
            this.downloadImageBtn.disabled = false;

            // Show preview
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.currentImageData.width;
            canvas.height = this.currentImageData.height;
            ctx.putImageData(this.currentImageData, 0, 0);
            
            this.decoderPreview.innerHTML = '';
            this.decoderPreview.appendChild(canvas);

            setTimeout(() => {
                this.decodeProgress.style.display = 'none';
            }, 2000);

        } catch (error) {
            this.showStatus(this.decoderStatus, `Recording failed: ${error.message}`, 'error');
            this.decodeProgress.style.display = 'none';
        } finally {
            this.micBtn.disabled = false;
            this.micBtn.textContent = '🎤 Record from Mic';
        }
    }

    updateDecodeProgress(progress) {
        this.updateProgress(this.decodeProgress, progress);
    }

    downloadImage() {
        if (!this.currentImageData) return;
        
        const filename = `decoded_sstv_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        this.decoder.exportAsPNG(this.currentImageData, filename);
        this.showStatus(this.decoderStatus, `Downloaded: ${filename}`, 'success');
    }

    async debugAudio() {
        const file = this.decoderFileInput.files[0];
        if (!file) {
            this.showStatus(this.decoderStatus, 'Please select an audio file first.', 'error');
            return;
        }

        try {
            this.showStatus(this.decoderStatus, 'Analyzing audio file...', 'info');
            
            // Load audio file
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    await this.decoder.initAudio();
                    const audioBuffer = await this.decoder.audioContext.decodeAudioData(e.target.result);
                    const audioData = audioBuffer.getChannelData(0);
                    
                    // Enable debug mode and test the audio
                    this.decoder.setDebugMode(true);
                    const testResult = this.decoder.testAudioBuffer(audioData, audioBuffer.sampleRate);
                    
                    // Show results
                    let message = `Audio Analysis Results:\n`;
                    message += `• Duration: ${testResult.duration.toFixed(2)} seconds\n`;
                    message += `• VIS Code: ${testResult.visFound ? 'Found' : 'Not Found'}\n`;
                    message += `• Sync Pulses: ${testResult.syncCount}\n`;
                    message += `• Buffer Length: ${testResult.bufferLength} samples\n\n`;
                    message += `Check browser console for detailed analysis.`;
                    
                    this.showStatus(this.decoderStatus, message, testResult.visFound ? 'success' : 'error');
                    
                } catch (error) {
                    this.showStatus(this.decoderStatus, `Debug failed: ${error.message}`, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            this.showStatus(this.decoderStatus, `Debug failed: ${error.message}`, 'error');
        }
    }

    cancelDecoding() {
        if (this.isDecoding) {
            this.isDecoding = false;
            this.showStatus(this.decoderStatus, 'Decoding cancelled by user.', 'info');
            this.decodeProgress.style.display = 'none';
            if (this.cancelBtn) {
                this.cancelBtn.style.display = 'none';
            }
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SSTVApp();
    
    // Show welcome message
    console.log('🐦 Pigeon70 SSTV Encoder/Decoder loaded successfully!');
    console.log('📋 Specifications:');
    console.log('   • Resolution: 320×240 pixels');
    console.log('   • Transmission time: ~70 seconds');
    console.log('   • Audio range: 1500-2300 Hz');
    console.log('   • Color encoding: RGB24');
});

