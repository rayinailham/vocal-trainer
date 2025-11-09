/**
 * Audio-related type definitions for Vocal Trainer application
 *
 * These types support the simplified vocal range detection flow that replaces
 * the step-based system with state-based transitions.
 */

/**
 * Raw pitch data from audio analysis
 */
export interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  timestamp: number;
}

/**
 * Complete vocal range analysis results
 * Used in the results display and for saving user data
 */
export interface VocalRange {
  lowestNote: string;
  highestNote: string;
  lowestFrequency: number;
  highestFrequency: number;
  rangeInSemitones: number;
  voiceType: 'soprano' | 'mezzo-soprano' | 'alto' | 'tenor' | 'baritone' | 'bass' | 'unknown';
}

/**
 * Configuration for audio processing
 * Used when creating AudioProcessor instances
 */
export interface AudioSettings {
  sampleRate: number;
  bufferSize: number;
  inputDeviceId?: string;
  autoGainControl: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

/**
 * Result of real-time pitch detection
 * Includes confidence metrics for quality assessment
 */
export interface PitchDetectionResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  confidence: number;
  isAccurate: boolean;
  timestamp: number;
}

/**
 * Advanced audio analyzer configuration
 * Currently not used but available for future enhancements
 */
export interface AudioAnalyzerSettings {
  windowSize: number;
  hopSize: number;
  sampleRate: number;
  pitchAlgorithm: 'YIN' | 'AMDF' | 'McLeod' | 'autocorrelation';
}

/**
 * Microphone permission status and device information
 * Used for handling browser microphone permissions
 */
export interface MicrophonePermission {
  granted: boolean;
  deviceLabel?: string;
  deviceId?: string;
}

/**
 * Complete audio stream components
 * Used for advanced audio processing and context management
 */
export interface AudioStream {
  mediaStream: MediaStream;
  audioContext: AudioContext;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
}