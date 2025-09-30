# Pigeon70 SSTV Troubleshooting Guide

## Common Issues and Solutions

### "VIS code not found in audio signal"

This is the most common decoding error. Here are the solutions:

#### 1. **Use the Debug Tool**
- Upload your audio file
- Click the "🔍 Debug Audio" button
- Check the browser console (F12) for detailed analysis
- This will show you exactly what the decoder is finding

#### 2. **Check Audio Quality**
- **File Format**: Use WAV files when possible (uncompressed)
- **Sample Rate**: Ensure 44.1kHz or higher
- **Bit Depth**: 16-bit or higher recommended
- **Noise Level**: Minimize background noise

#### 3. **Verify the Audio Contains SSTV Signal**
- The audio should be ~70 seconds long
- Should start with a 1900 Hz tone (VIS code)
- Should contain regular sync pulses (1200 Hz)
- Should have frequency variations in the 1500-2300 Hz range

#### 4. **Try Different Audio Sources**
- **Direct Playback**: Play the encoded audio through speakers and record with microphone
- **File Transfer**: Save the WAV file and try decoding that
- **Volume Levels**: Ensure adequate volume (not too loud, not too quiet)

#### 5. **Browser-Specific Issues**
- **Chrome**: Usually works best
- **Firefox**: May need to enable audio context first
- **Safari**: Requires user interaction to start audio
- **Mobile**: May have limitations with microphone access

### "No sync pulse found"

#### Solutions:
1. **Check Audio Length**: Ensure the audio is long enough (~70 seconds)
2. **Verify Signal**: The audio should contain regular 1200 Hz pulses
3. **Try Debug Mode**: Use the debug tool to see what frequencies are detected
4. **Adjust Volume**: The signal might be too quiet or too loud

### "Decoding failed: No lines could be decoded"

#### Solutions:
1. **Check Audio Quality**: Poor quality audio won't decode properly
2. **Verify Format**: Ensure it's a valid Pigeon70 SSTV signal
3. **Try Different File**: Test with a known good SSTV file
4. **Use Debug Tool**: Check what the decoder is actually finding

### Poor Image Quality

#### Solutions:
1. **Source Image**: Use high-contrast, clear images
2. **Audio Quality**: Ensure good signal-to-noise ratio
3. **Volume Levels**: Proper audio levels during encoding/decoding
4. **File Format**: Use uncompressed WAV files

### Browser Compatibility Issues

#### Solutions:
1. **Update Browser**: Use the latest version
2. **Enable Audio**: Allow audio permissions
3. **HTTPS**: Some features require HTTPS (especially microphone)
4. **User Interaction**: Click a button first to enable audio context

## Step-by-Step Debugging Process

### 1. Test the Encoder First
1. Load a simple test image (use the demo page)
2. Encode it to audio
3. Play the audio and listen for the characteristic SSTV sound
4. Try decoding the same audio file

### 2. Use the Debug Tool
1. Upload your problematic audio file
2. Click "🔍 Debug Audio"
3. Check the console output for:
   - Audio duration and sample rate
   - Whether VIS code is found
   - Number of sync pulses detected
   - Frequency analysis throughout the audio

### 3. Check Audio Characteristics
The debug tool will show you:
- **Duration**: Should be ~70 seconds
- **VIS Code**: Should be found at the beginning
- **Sync Pulses**: Should find 240 sync pulses (one per line)
- **Frequencies**: Should show variations in the 1500-2300 Hz range

### 4. Common Debug Results

#### ✅ Good Signal:
```
VIS code found at sample 1234 (0.028s)
Found 240 sync pulses
Frequency analysis shows expected range
```

#### ❌ Poor Signal:
```
VIS code not found
Found 0 sync pulses
Frequency analysis shows noise or wrong range
```

## Advanced Troubleshooting

### Manual Frequency Analysis
If the debug tool shows unexpected frequencies:
1. The audio might be corrupted
2. Wrong sample rate
3. Audio compression artifacts
4. Background noise interference

### Testing with Known Good Files
1. Use the demo page to generate test audio
2. Try encoding and decoding the same image
3. Compare results with your problematic file

### Audio Processing Tips
1. **Normalize Audio**: Ensure proper levels
2. **Filter Noise**: Use audio editing software to reduce noise
3. **Check Sample Rate**: Ensure 44.1kHz or higher
4. **Avoid Compression**: Use WAV instead of MP3 when possible

## Getting Help

If you're still having issues:

1. **Check Console**: Open browser dev tools (F12) and look for error messages
2. **Try Different Browser**: Test in Chrome, Firefox, Safari
3. **Test with Demo**: Use the demo page to verify the system works
4. **Audio Analysis**: Use the debug tool to understand what's happening
5. **File Format**: Try different audio file formats

## Technical Details

### Expected Audio Characteristics:
- **Duration**: ~70 seconds
- **Sample Rate**: 44.1kHz (or higher)
- **VIS Code**: 1900 Hz for 300ms at start
- **Sync Pulses**: 1200 Hz for 10ms, every ~295ms
- **Pixel Data**: 1500-2300 Hz range, ~0.31ms per tone
- **Total Lines**: 240 lines (320×240 image)

### Frequency Detection:
- **Tolerance**: ±50 Hz for most signals
- **Method**: Autocorrelation with multiple period analysis
- **Resolution**: 2 Hz steps for pixel data, 1 Hz for sync pulses
