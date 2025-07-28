# Pigeon70-SSTV-


**Pigeon70** is a custom-designed Slow Scan Television (SSTV) encoding and decoding format, built for experimental and educational purposes. It is inspired by classic SSTV formats like PD120 but introduces unique specifications optimized for modern, hobbyist-level transmission and decoding via web technologies.

## Overview

Pigeon70 transmits images over audio using frequency modulation. The goal of this format is to balance image quality, transmission time, and decoding simplicity, while remaining fully compatible with real-time visualization tools such as waterfall displays and spectrograms.

## Key Features

- **Resolution**: 320 x 240 pixels
- **Transmission Time**: Approximately 70 seconds
- **Modulation Type**: Frequency modulation (FM)
- **Audio Range**: 1500 Hz to 2300 Hz
- **Scan Type**: Progressive, left to right, top to bottom
- **Image Encoding**: RGB24, sent line by line

## Frequency Mapping

| Signal Component | Frequency | Duration |
|------------------|-----------|----------|
| VIS Code         | 1900 Hz   | 300 ms   |
| Sync Pulse       | 1200 Hz   | 10 ms    |
| Separator Pulse  | 1500 Hz   | 10 ms    |
| Pixel Low Range  | 1500 Hz   | Variable |
| Pixel High Range | 2300 Hz   | Variable |

Each pixel’s R, G, B values are transmitted sequentially as a frequency tone proportional to the 8-bit color value (e.g. 0 = 1500 Hz, 255 = 2300 Hz).

## Technical Details

- **Color Encoding**: Each line transmits 320 pixels, with three tones per pixel (one each for R, G, B).
- **Line Structure**:
  - Sync Pulse (10 ms)
  - Separator (10 ms)
  - 960 pixel color tones (3 × 320), ~0.3 ms each

Estimated line time: ~295 ms  
Total image time: ~70 seconds

## Goals

- Enable **web-based** SSTV transmission and reception
- Encourage experimentation in encoding methods
- Serve as a base for adding features like error correction or real-time decoding visualization

## License

This project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).

You are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

See the full license here: [https://creativecommons.org/licenses/by-sa/4.0/](https://creativecommons.org/licenses/by-sa/4.0/)

## Contributing

Pull requests are welcome. If you'd like to implement features, improve the format, or port it to other platforms, feel free to open an issue or submit a PR
