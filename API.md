# Pigeon70 SSTV API Reference

## Overview

The Pigeon70 SSTV library provides a complete implementation of the Pigeon70 Slow Scan Television format for web browsers. It includes both encoding (image to audio) and decoding (audio to image) capabilities.

## Classes

### Pigeon70Encoder

Encodes images into SSTV audio signals according to Pigeon70 specifications.

#### Constructor
```javascript
const encoder = new Pigeon70Encoder();
```

#### Properties
- `WIDTH`: 320 (image width in pixels)
- `HEIGHT`: 240 (image height in pixels)
- `SAMPLE_RATE`: 44100 (audio sample rate in Hz)
- `FREQ_VIS`: 1900 (VIS code frequency in Hz)
- `FREQ_SYNC`: 1200 (sync pulse frequency in Hz)
- `FREQ_SEPARATOR`: 1500 (separator pulse frequency in Hz)
- `FREQ_MIN`: 1500 (minimum pixel frequency in Hz)
- `FREQ_MAX`: 2300 (maximum pixel frequency in Hz)

#### Methods

##### `async initAudio()`
Initializes the Web Audio API context.
- **Returns**: `Promise<AudioContext>`

##### `pixelToFrequency(pixelValue)`
Converts a pixel value (0-255) to frequency (1500-2300 Hz).
- **Parameters**:
  - `pixelValue` (number): Pixel value from 0 to 255
- **Returns**: `number` - Frequency in Hz

##### `generateTone(frequency, duration, sampleRate)`
Generates a sine wave tone.
- **Parameters**:
  - `frequency` (number): Frequency in Hz
  - `duration` (number): Duration in seconds
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Audio buffer

##### `generateSilence(duration, sampleRate)`
Generates silence.
- **Parameters**:
  - `duration` (number): Duration in seconds
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Silent audio buffer

##### `resizeImage(imageData, targetWidth, targetHeight)`
Resizes image to Pigeon70 specifications (320×240).
- **Parameters**:
  - `imageData` (ImageData): Source image data
  - `targetWidth` (number): Target width (default: 320)
  - `targetHeight` (number): Target height (default: 240)
- **Returns**: `ImageData` - Resized image data

##### `async encodeImage(imageData)`
Encodes image data to SSTV audio signal.
- **Parameters**:
  - `imageData` (ImageData): Image data to encode
- **Returns**: `Promise<Float32Array>` - Encoded audio buffer

##### `async playAudio(audioBuffer)`
Plays the encoded audio.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to play
- **Returns**: `Promise<AudioBufferSourceNode>` - Audio source node

##### `exportAsWAV(audioBuffer, filename)`
Exports audio as WAV file.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to export
  - `filename` (string): Output filename (default: 'pigeon70_sstv.wav')

##### `async encodeFromFile(file)`
Encodes image from file input.
- **Parameters**:
  - `file` (File): Image file to encode
- **Returns**: `Promise<Float32Array>` - Encoded audio buffer

---

### Pigeon70Decoder

Decodes SSTV audio signals back to images.

#### Constructor
```javascript
const decoder = new Pigeon70Decoder();
```

#### Properties
- Same as Pigeon70Encoder
- `FREQ_TOLERANCE`: 50 (frequency detection tolerance in Hz)
- `AMPLITUDE_THRESHOLD`: 0.1 (minimum amplitude for detection)

#### Methods

##### `async initAudio()`
Initializes the Web Audio API context.
- **Returns**: `Promise<AudioContext>`

##### `frequencyToPixel(frequency)`
Converts frequency (1500-2300 Hz) to pixel value (0-255).
- **Parameters**:
  - `frequency` (number): Frequency in Hz
- **Returns**: `number` - Pixel value from 0 to 255

##### `detectFrequency(audioBuffer, sampleRate)`
Detects dominant frequency in audio buffer using autocorrelation.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to analyze
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `number` - Detected frequency in Hz

##### `async detectFrequencyAdvanced(audioBuffer, sampleRate)`
Detects frequency using Web Audio API's AnalyserNode.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to analyze
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Promise<number>` - Detected frequency in Hz

##### `findVISCode(audioBuffer, sampleRate)`
Finds VIS code in audio buffer.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to search
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `number` - Sample index of VIS code, or -1 if not found

##### `findSyncPulse(audioBuffer, startIndex, sampleRate)`
Finds sync pulse in audio buffer.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to search
  - `startIndex` (number): Starting sample index
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `number` - Sample index of sync pulse, or -1 if not found

##### `decodeLine(audioBuffer, startIndex, sampleRate)`
Decodes a single line of pixels.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer containing line data
  - `startIndex` (number): Starting sample index
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Object` - `{pixels: Array, nextIndex: number}`

##### `async decodeAudio(audioBuffer, sampleRate)`
Decodes entire SSTV signal to image.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to decode
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Promise<ImageData>` - Decoded image data

##### `async decodeFromFile(file)`
Decodes audio from file.
- **Parameters**:
  - `file` (File): Audio file to decode
- **Returns**: `Promise<ImageData>` - Decoded image data

##### `async decodeFromMicrophone(duration)`
Decodes audio from microphone input.
- **Parameters**:
  - `duration` (number): Recording duration in seconds (default: 75)
- **Returns**: `Promise<ImageData>` - Decoded image data

##### `setProgressCallback(callback)`
Sets progress callback function.
- **Parameters**:
  - `callback` (function): Callback function receiving progress (0-1)

##### `exportAsPNG(imageData, filename)`
Exports decoded image as PNG file.
- **Parameters**:
  - `imageData` (ImageData): Image data to export
  - `filename` (string): Output filename (default: 'decoded_sstv.png')

---

### AudioUtils

Additional audio processing utilities.

#### Constructor
```javascript
const audioUtils = new AudioUtils();
```

#### Properties
- `SAMPLE_RATE`: 44100 (default sample rate in Hz)

#### Methods

##### `normalizeAudio(audioBuffer, targetPeak)`
Normalizes audio buffer to prevent clipping.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to normalize
  - `targetPeak` (number): Target peak level (default: 0.8)
- **Returns**: `Float32Array` - Normalized audio buffer

##### `applyLowPassFilter(audioBuffer, cutoffFreq, sampleRate)`
Applies low-pass filter to reduce noise.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to filter
  - `cutoffFreq` (number): Cutoff frequency in Hz (default: 2500)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Filtered audio buffer

##### `applyHighPassFilter(audioBuffer, cutoffFreq, sampleRate)`
Applies high-pass filter to remove DC offset.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to filter
  - `cutoffFreq` (number): Cutoff frequency in Hz (default: 50)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Filtered audio buffer

##### `applyBandPassFilter(audioBuffer, lowFreq, highFreq, sampleRate)`
Applies band-pass filter for SSTV frequency range.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to filter
  - `lowFreq` (number): Low cutoff frequency in Hz (default: 1000)
  - `highFreq` (number): High cutoff frequency in Hz (default: 2500)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Filtered audio buffer

##### `calculateRMS(audioBuffer)`
Calculates RMS (Root Mean Square) for audio level detection.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to analyze
- **Returns**: `number` - RMS value

##### `detectSignal(audioBuffer, threshold)`
Detects if signal is present above threshold.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to analyze
  - `threshold` (number): Detection threshold (default: 0.01)
- **Returns**: `boolean` - True if signal detected

##### `generateTestTone(frequency, duration, sampleRate)`
Generates a test tone for calibration.
- **Parameters**:
  - `frequency` (number): Frequency in Hz (default: 1900)
  - `duration` (number): Duration in seconds (default: 1)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Test tone audio buffer

##### `generateSweepTone(startFreq, endFreq, duration, sampleRate)`
Generates a sweep tone for frequency response testing.
- **Parameters**:
  - `startFreq` (number): Start frequency in Hz (default: 1500)
  - `endFreq` (number): End frequency in Hz (default: 2300)
  - `duration` (number): Duration in seconds (default: 2)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Sweep tone audio buffer

##### `mixAudioBuffers(buffers)`
Mixes multiple audio buffers.
- **Parameters**:
  - `buffers` (Array<Float32Array>): Array of audio buffers to mix
- **Returns**: `Float32Array` - Mixed audio buffer

##### `addFade(audioBuffer, fadeInDuration, fadeOutDuration, sampleRate)`
Adds fade in/out to prevent clicks.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to fade
  - `fadeInDuration` (number): Fade in duration in seconds (default: 0.01)
  - `fadeOutDuration` (number): Fade out duration in seconds (default: 0.01)
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
- **Returns**: `Float32Array` - Faded audio buffer

##### `toMono(audioBuffer, channels)`
Converts audio buffer to mono if stereo.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to convert
  - `channels` (number): Number of channels (default: 2)
- **Returns**: `Float32Array` - Mono audio buffer

##### `resample(audioBuffer, fromRate, toRate)`
Resamples audio buffer to target sample rate.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to resample
  - `fromRate` (number): Source sample rate in Hz
  - `toRate` (number): Target sample rate in Hz
- **Returns**: `Float32Array` - Resampled audio buffer

##### `createSpectrogram(audioBuffer, sampleRate, fftSize)`
Creates a spectrogram visualization of audio.
- **Parameters**:
  - `audioBuffer` (Float32Array): Audio buffer to analyze
  - `sampleRate` (number): Sample rate in Hz (default: 44100)
  - `fftSize` (number): FFT size (default: 1024)
- **Returns**: `Array<Array<number>>` - Spectrogram data

##### `performFFT(signal)`
Performs FFT on signal (simple implementation).
- **Parameters**:
  - `signal` (Float32Array): Signal to transform
- **Returns**: `Array<number>` - FFT magnitude spectrum

##### `getFrequencyBins(fftSize, sampleRate)`
Calculates frequency bins for FFT.
- **Parameters**:
  - `fftSize` (number): FFT size
  - `sampleRate` (number): Sample rate in Hz
- **Returns**: `Array<number>` - Frequency bins in Hz

## Error Handling

All async methods can throw errors. Common error types:

- `Error`: General errors (e.g., "VIS code not found")
- `DOMException`: Web Audio API errors
- `TypeError`: Invalid parameter types

## Browser Compatibility

- **Web Audio API**: Required for all audio operations
- **File API**: Required for file upload/download
- **MediaDevices API**: Required for microphone access
- **Canvas API**: Required for image processing

## Performance Considerations

- **Memory Usage**: Large images and long audio files consume significant memory
- **CPU Usage**: Real-time decoding can be CPU intensive
- **Audio Latency**: Browser audio latency may affect real-time applications
- **File Size**: WAV files are large; consider compression for storage

## Examples

See the `USAGE.md` file for comprehensive usage examples and the `demo.html` file for interactive demonstrations.
