# Vocal Trainer

A modern web application for vocal training and pitch detection built with Next.js and TypeScript.

## Overview

Vocal Trainer is a comprehensive web application designed to help users improve their vocal skills through real-time pitch detection, vocal range analysis, and structured training exercises. The application uses advanced audio processing techniques to provide accurate feedback on pitch accuracy and vocal performance.

## Features

### Core Features
- 🎤 **Real-time Pitch Detection**: Accurate pitch detection using Web Audio API and Meyda.js
- 🎵 **Vocal Range Analysis**: Automatically detects and classifies your vocal range
- 🎹 **Interactive Training Exercises**: Multiple training modes including scales, arpeggios, and pitch matching
- 📊 **Visual Feedback**: Real-time audio visualization and pitch meters
- 💾 **Progress Tracking**: Save and track your training sessions over time

### Training Modes
- **Scale Training**: Practice major and minor scales
- **Arpeggio Exercises**: Improve pitch control with arpeggios
- **Interval Training**: Master pitch intervals
- **Pitch Matching**: Develop accuracy with random pitch exercises
- **Note Sustain**: Build breath control and pitch stability

### Technical Features
- ✅ Next.js 15 with App Router
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS for responsive design
- ✅ Web Audio API integration
- ✅ Local storage for data persistence
- ✅ Mobile-responsive design
- ✅ Cross-browser compatibility

## Technology Stack

- **Framework**: Next.js 15.5.5
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.6
- **Audio Processing**: Meyda.js
- **Build Tool**: Turbopack (dev), Next.js build (prod)
- **Linting**: ESLint 9

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd vocal-trainer

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Usage

### 1. Detect Your Vocal Range
- Navigate to the "Vocal Range" page
- Allow microphone access when prompted
- Follow the step-by-step instructions
- Sing your lowest and highest comfortable notes
- View your vocal range classification (soprano, alto, tenor, baritone, bass)

### 2. Start Training
- Go to the "Vocal Training" page
- Select a training exercise
- Choose your root note
- Adjust settings as needed
- Follow the on-screen prompts to sing the displayed notes
- Receive real-time feedback on your pitch accuracy

### 3. Track Progress
- All training sessions are automatically saved
- View your improvement over time
- Compare scores across different exercises
- Export your data for backup

## Project Structure

```
vocal-trainer/
├── src/
│   ├── app/                    # Next.js pages with App Router
│   │   ├── vocal-range/         # Vocal range detection page
│   │   ├── vocal-training/      # Training exercises page
│   │   ├── test-audio/          # Audio testing page
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/              # Reusable UI components
│   │   ├── AudioVisualizer.tsx   # Waveform visualization
│   │   ├── PianoKeyboard.tsx    # Interactive piano
│   │   ├── PitchMeter.tsx       # Pitch accuracy indicator
│   │   ├── ProgressIndicator.tsx # Progress bars
│   │   └── Navigation.tsx       # Site navigation
│   ├── lib/                    # Core utilities
│   │   ├── audio.ts             # Audio processing engine
│   │   ├── pitch.ts             # Pitch calculation utilities
│   │   ├── storage.ts           # Local storage management
│   │   └── utils.ts             # General utilities
│   ├── types/                  # TypeScript definitions
│   │   ├── audio.ts             # Audio-related types
│   │   └── training.ts          # Training-related types
│   └── styles/                 # Global styles
│       └── globals.css          # Tailwind and custom styles
├── public/                     # Static assets
├── DEPLOYMENT.md               # Deployment guide
├── vocal-trainer-phase-plan.md # Implementation phases
└── package.json               # Dependencies and scripts
```

## Scripts

- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build application for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript errors

## Browser Support

The application supports modern browsers with Web Audio API support:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance

### Optimizations
- Code splitting for reduced bundle size
- Lazy loading of components
- Optimized audio processing
- Efficient canvas rendering
- Local storage caching

### Metrics
- Page load time: < 3 seconds
- Pitch detection latency: < 100ms
- Memory usage: Stable during extended use
- Bundle size: ~118KB (first load)

## Security

- HTTPS required for microphone access
- Secure audio context handling
- Local storage encryption for sensitive data
- XSS protection with Content Security Policy

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Automatic deployment with zero configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Check the troubleshooting section in DEPLOYMENT.md
- Review browser console for errors
- Ensure HTTPS is enabled for microphone access
- Verify browser compatibility

## Roadmap

- [ ] Add more training exercises
- [ ] Implement custom exercise creation
- [ ] Add audio playback for reference notes
- [ ] Integrate with external microphones
- [ ] Add multi-language support
- [ ] Implement cloud sync for progress