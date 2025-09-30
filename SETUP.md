# Pigeon70 SSTV Setup Guide

## Quick Start

1. **Clone or download** this repository
2. **Start a local web server** in the project directory:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have it installed)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000/Src/`
4. **Click on `index.html`** to open the main interface

## File Structure

```
Pigeon70-SSTV/
├── Src/
│   ├── index.html          # Main web interface
│   ├── demo.html           # Demo and test page
│   ├── sstv-encoder.js     # SSTV encoder implementation
│   ├── sstv-decoder.js     # SSTV decoder implementation
│   ├── app.js              # Main application logic
│   └── audio-utils.js      # Audio processing utilities
├── Docs/
│   └── Specs               # Original specifications
├── README.md               # Project overview
├── USAGE.md                # Usage guide
├── API.md                  # API reference
├── SETUP.md                # This file
└── package.json            # Project configuration
```

## Features Implemented

### ✅ Core Functionality
- **SSTV Encoder**: Converts images to Pigeon70 SSTV audio signals
- **SSTV Decoder**: Converts SSTV audio signals back to images
- **Web Interface**: Modern, responsive web-based interface
- **Audio Processing**: Complete audio generation and analysis
- **File Support**: Image and audio file upload/download

### ✅ Pigeon70 Specifications
- **Resolution**: 320 × 240 pixels
- **Transmission Time**: ~70 seconds
- **Audio Range**: 1500-2300 Hz
- **VIS Code**: 1900 Hz (300ms)
- **Sync Pulse**: 1200 Hz (10ms)
- **Separator**: 1500 Hz (10ms)
- **Color Encoding**: RGB24 (3 tones per pixel)

### ✅ Advanced Features
- **Real-time Encoding**: Live image to audio conversion
- **Microphone Decoding**: Real-time audio capture and decoding
- **Progress Tracking**: Visual progress bars during processing
- **Audio Filters**: Band-pass filtering for improved signal quality
- **Test Tones**: Calibration and testing audio generation
- **Export Options**: WAV audio and PNG image export

## Browser Requirements

- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Web Audio API**: Required for audio processing
- **File API**: Required for file upload/download
- **MediaDevices API**: Required for microphone access
- **Canvas API**: Required for image processing

## Testing

1. **Open the demo page**: Navigate to `Src/demo.html`
2. **Generate test images**: Use the built-in test pattern generators
3. **Test encoding**: Load a test image and encode it to audio
4. **Test decoding**: Play the audio and decode it back to an image
5. **Compare results**: Check how well the decoded image matches the original

## Troubleshooting

### Common Issues

**"Audio context not supported"**
- Ensure you're using a modern browser
- Try clicking a button first to enable audio context

**"Microphone access denied"**
- Grant microphone permissions in your browser
- Use HTTPS (required for microphone access)

**"File not loading"**
- Ensure you're running a local web server (not opening files directly)
- Check browser console for error messages

**"Poor decoding quality"**
- Use high-quality audio files
- Ensure good signal-to-noise ratio
- Try adjusting microphone volume

### Development

For development and customization:

1. **Edit source files** in the `Src/` directory
2. **Test changes** by refreshing the browser
3. **Check console** for any JavaScript errors
4. **Use browser dev tools** for debugging

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
- Review the USAGE.md and API.md files
- Open an issue on GitHub
- Test with the demo page first

## Acknowledgments

- Based on the Pigeon70 SSTV format specifications
- Built for educational and experimental purposes
- Compatible with amateur radio SSTV applications








