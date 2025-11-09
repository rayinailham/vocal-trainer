
/**
 * Audio-related type definitions for Vocal Trainer application
 */

export interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  timestamp: number;
}

export interface VocalRange {
  lowestNote: string;
  highestNote: string;
  lowestFrequency: number;
  highestFrequency: number;
  rangeInSemitones: number;
  voiceType: 'soprano' | 'mezzo-soprano' | 'alto' | 'tenor' | 'baritone' | 'bass' | 'unknown';
}

export interface AudioSettings {
  sampleRate: number;
  bufferSize: number;
  inputDeviceId?: string;
  autoGainControl: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

export interface PitchDetectionResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  confidence: number;
  isAccurate: boolean;
  timestamp: number;
}

export interface AudioAnalyzerSettings {
  windowSize: number;
  hopSize: number;
  sampleRate: number;
