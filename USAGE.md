# Pigeon70 SSTV Usage Guide

## Quick Start

1. **Open the application**: Navigate to `Src/index.html` in your web browser
2. **Encode an image**: Upload an image file and click "Encode to Audio"
3. **Play the audio**: Use the "Play Audio" button to hear the SSTV signal
4. **Decode audio**: Upload an audio file or use the microphone to decode SSTV signals

## Features

### 🎵 Encoder
- **Image Upload**: Supports JPG, PNG, GIF formats
- **Automatic Resizing**: Images are automatically resized to 320×240 pixels
- **Real-time Encoding**: Converts images to SSTV audio signals
- **Audio Playback**: Play encoded audio directly in the browser
- **WAV Export**: Download encoded audio as WAV files

### 📻 Decoder
- **Audio File Support**: Decode from WAV, MP3, OGG files
- **Microphone Input**: Real-time decoding from microphone
- **Progress Tracking**: Visual progress bar during decoding
- **Image Export**: Download decoded images as PNG files

## Technical Specifications

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Resolution** | 320 × 240 | Image dimensions in pixels |
| **Transmission Time** | ~70 seconds | Total time to transmit one image |
| **Audio Range** | 1500-2300 Hz | Frequency range for pixel data |
| **VIS Code** | 1900 Hz, 300ms | Format identification signal |
| **Sync Pulse** | 1200 Hz, 10ms | Line synchronization signal |
| **Separator** | 1500 Hz, 10ms | Separates sync from pixel data |
| **Pixel Duration** | ~0.31ms | Duration of each color tone |
| **Color Encoding** | RGB24 | 3 tones per pixel (R, G, B) |

## Usage Examples

### Basic Encoding
```javascript
// Create encoder instance
const encoder = new Pigeon70Encoder();

// Load and encode an image
const audioBuffer = await encoder.encodeFromFile(imageFile);

// Play the audio
await encoder.playAudio(audioBuffer);

// Export as WAV
encoder.exportAsWAV(audioBuffer, 'my_sstv.wav');
```

### Basic Decoding
```javascript
// Create decoder instance
const decoder = new Pigeon70Decoder();

// Set progress callback
decoder.setProgressCallback((progress) => {
    console.log(`Decoding progress: ${progress * 100}%`);
});

// Decode from file
const imageData = await decoder.decodeFromFile(audioFile);

// Export as PNG
decoder.exportAsPNG(imageData, 'decoded_image.png');
```

### Microphone Decoding
```javascript
// Decode from microphone (75 seconds recording)
const imageData = await decoder.decodeFromMicrophone(75);
```

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.5+)
- **Edge**: Full support

### Required Features
- Web Audio API
- File API
- MediaDevices API (for microphone)
- Canvas API

## Troubleshooting

### Common Issues

**"Audio context not supported"**
- Ensure you're using a modern browser
- Try clicking a button first to enable audio context

**"Microphone access denied"**
- Grant microphone permissions in your browser
- Use HTTPS (required for microphone access)

**"Decoding failed"**
- Check that the audio file contains valid SSTV signals
- Ensure audio quality is good (avoid heavily compressed files)
- Try adjusting microphone volume if using live input

**"Poor image quality"**
- Use high-quality source images
- Ensure good audio signal quality
- Check for interference in the audio signal

### Performance Tips

1. **For encoding**: Use images with good contrast and clear details
2. **For decoding**: Use high-quality audio files (WAV preferred)
3. **For live decoding**: Ensure quiet environment with minimal background noise
4. **For transmission**: Use good quality speakers/transmitters

## Advanced Usage

### Custom Audio Processing
```javascript
const audioUtils = new AudioUtils();

// Apply filters to improve signal quality
const filtered = audioUtils.applyBandPassFilter(audioBuffer, 1000, 2500);

// Normalize audio levels
const normalized = audioUtils.normalizeAudio(filtered, 0.8);

// Add fade in/out to prevent clicks
const faded = audioUtils.addFade(normalized, 0.01, 0.01);
```

### Batch Processing
```javascript
// Process multiple images
const images = [image1, image2, image3];
const audioBuffers = [];

for (const image of images) {
    const audio = await encoder.encodeImage(image);
    audioBuffers.push(audio);
}

// Mix multiple audio signals
const mixed = audioUtils.mixAudioBuffers(audioBuffers);
```

## File Formats

### Supported Input Formats
- **Images**: JPG, PNG, GIF, BMP, WebP
- **Audio**: WAV, MP3, OGG, M4A

### Output Formats
- **Audio**: WAV (44.1kHz, 16-bit, mono)
- **Images**: PNG (320×240, RGB24)

## API Reference

### Pigeon70Encoder

#### Methods
- `encodeImage(imageData)` - Encode ImageData to audio buffer
- `encodeFromFile(file)` - Encode image file to audio buffer
- `playAudio(audioBuffer)` - Play audio buffer
- `exportAsWAV(audioBuffer, filename)` - Export audio as WAV file

### Pigeon70Decoder

#### Methods
- `decodeAudio(audioBuffer, sampleRate)` - Decode audio buffer to ImageData
- `decodeFromFile(file)` - Decode audio file to ImageData
- `decodeFromMicrophone(duration)` - Decode from microphone input
- `setProgressCallback(callback)` - Set progress callback function
- `exportAsPNG(imageData, filename)` - Export image as PNG file

### AudioUtils

#### Methods
- `normalizeAudio(audioBuffer, targetPeak)` - Normalize audio levels
- `applyBandPassFilter(audioBuffer, lowFreq, highFreq)` - Apply band-pass filter
- `generateTestTone(frequency, duration)` - Generate test tone
- `generateSweepTone(startFreq, endFreq, duration)` - Generate frequency sweep
- `mixAudioBuffers(buffers)` - Mix multiple audio buffers

## License

This project is licensed under the Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Open an issue on GitHub
- Review the demo page for examples
