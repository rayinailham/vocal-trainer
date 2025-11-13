import Meyda from 'meyda';
import {
  AudioSettings,
  AudioStream,
  PitchDetectionResult,
  MicrophonePermission,
  PitchData,
  VocalRange
} from '@/types/audio';
import { calculateVocalRange } from './pitch';

// Suppress deprecation warnings from Meyda's use of ScriptProcessorNode
// This is a temporary solution until Meyda migrates to AudioWorklets
const suppressConsoleWarnings = (() => {
  let isSuppressionActive = false;
  return () => {
    if (isSuppressionActive) return;
    isSuppressionActive = true;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function (...args: unknown[]) {
      const message = String(args[0] || '');
      // Suppress only ScriptProcessorNode deprecation from Meyda
      if (
        message.includes('[Deprecation]') && 
        message.includes('ScriptProcessorNode')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = function (...args: unknown[]) {
      const message = String(args[0] || '');
      // Suppress only ScriptProcessorNode deprecation from Meyda
      if (
        message.includes('[Deprecation]') && 
        message.includes('ScriptProcessorNode')
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };
  };
})();

// Call suppression when module loads
suppressConsoleWarnings();

// Type definitions for Meyda features
interface MeydaFeatures {
  buffer: Float32Array;
}

/**
 * Simple autocorrelation-based pitch detection
 */
function detectPitch(audioBuffer: Float32Array, sampleRate: number): number | null {
  const bufferSize = audioBuffer.length;
  const threshold = 0.01; // Threshold for pitch detection
  
  // Calculate RMS to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += audioBuffer[i] * audioBuffer[i];
  }
  rms = Math.sqrt(rms / bufferSize);
  
  if (rms < threshold) {
    return null; // No significant signal
  }
  
  // Autocorrelation
  const correlations = new Float32Array(bufferSize);
  for (let lag = 0; lag < bufferSize; lag++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      correlation += audioBuffer[i] * audioBuffer[i + lag];
    }
    correlations[lag] = correlation;
  }
  
  // Find the peak in correlations (excluding lag 0)
  let maxCorrelation = 0;
  let bestLag = -1;
  
  // Only search in reasonable pitch range (80Hz - 1100Hz for human voice)
  const minLag = Math.floor(sampleRate / 1100);
  const maxLag = Math.floor(sampleRate / 80);
  
  for (let lag = minLag; lag < maxLag && lag < bufferSize; lag++) {
    if (correlations[lag] > maxCorrelation) {
      maxCorrelation = correlations[lag];
      bestLag = lag;
    }
  }
  
  if (bestLag === -1 || maxCorrelation < 0.3) {
    return null; // No clear pitch detected
  }
  
  // Calculate frequency from lag
  const frequency = sampleRate / bestLag;
  
  // Validate frequency is in human voice range
  if (frequency < 80 || frequency > 1100) {
    return null;
  }
  
  return frequency;
}

/**
 * AudioProcessor handles all audio processing for the Vocal Trainer application
 *
 * This class supports the simplified vocal range detection flow with:
 * - Auto-initialization capabilities
 * - Real-time pitch monitoring for practice
 * - Seamless transition to range detection
 * - Comprehensive error handling and cleanup
 *
 * Key improvements for the new flow:
 * - No step-based restrictions
 * - Direct monitoring mode activation
 * - Flexible state management
 */
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meydaAnalyzer: ReturnType<typeof Meyda.createMeydaAnalyzer> | null = null;
  private isProcessing: boolean = false;
  private isMonitoring: boolean = false;
  private settings: AudioSettings;
  private onPitchDetectedCallback?: (result: PitchDetectionResult) => void;
  private onMonitoringCallback?: (result: PitchDetectionResult) => void;
  private onRangeProgressCallback?: (minFreq: number, maxFreq: number) => void;
  private onRangeCompleteCallback?: (range: VocalRange) => void;
  private recordedFrequencies: number[] = [];
  private minFrequency: number = Infinity;
  private maxFrequency: number = -Infinity;
  private stableReadings: number = 0;
  private maxRecordedFrequencies: number = 100; // Limit to prevent memory leaks
  private lastProcessedTime: number = 0;
  private processingInterval: number = 100; // Process every 100ms to reduce CPU load

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  /**
   * Initialize audio context and request microphone access
   */
  async initialize(): Promise<MicrophonePermission> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as unknown as typeof AudioContext))();
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.settings.sampleRate,
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSuppression,
          autoGainControl: this.settings.autoGainControl,
          deviceId: this.settings.inputDeviceId
        }
      });

      // Create audio source from microphone
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.settings.bufferSize * 2;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect nodes
      this.source.connect(this.analyser);

      // Get device info
      const audioTracks = this.mediaStream.getAudioTracks();
      const track = audioTracks[0];
      const deviceLabel = track.label || 'Microphone';
      const deviceId = track.getSettings().deviceId;

      return {
        granted: true,
        deviceLabel,
        deviceId
      };
    } catch (error) {
      console.error('Error initializing audio:', error);
      return {
        granted: false
      };
    }
  }

  /**
   * Start pitch detection using custom algorithm
   */
  startPitchDetection(
    onPitchDetected: (result: PitchDetectionResult) => void
  ): void {
    if (!this.audioContext || !this.source) {
      throw new Error('Audio not initialized. Call initialize() first.');
    }

    this.onPitchDetectedCallback = onPitchDetected;

    // Create Meyda analyzer for getting audio buffer
    this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.source,
      bufferSize: this.settings.bufferSize,
      featureExtractors: ["buffer"],
      callback: (features: MeydaFeatures) => {
        // Throttle processing to reduce CPU load
        const now = Date.now();
        if (now - this.lastProcessedTime < this.processingInterval) {
          return;
        }
        this.lastProcessedTime = now;
        
        if (features && features.buffer && this.onPitchDetectedCallback) {
          const frequency = detectPitch(features.buffer, this.audioContext!.sampleRate);
          if (frequency !== null) {
            const result = this.processPitchData(frequency);
            this.onPitchDetectedCallback(result);
          }
        }
      }
    });

    this.meydaAnalyzer.start();
    this.isProcessing = true;
  }

  /**
   * Stop pitch detection
   */
  stopPitchDetection(): void {
    if (this.meydaAnalyzer) {
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }
    this.isProcessing = false;
  }

  /**
   * Process raw pitch frequency into PitchDetectionResult
   */
  private processPitchData(frequency: number): PitchDetectionResult {
    const timestamp = Date.now();
    const { note, octave, cents } = this.frequencyToNote(frequency);
    
    // Calculate confidence based on pitch stability
    const confidence = this.calculatePitchConfidence(frequency);
    
    // Determine if pitch is accurate (within 50 cents)
    const isAccurate = Math.abs(cents) <= 50;

    return {
      frequency,
      note,
      octave,
      cents,
      confidence,
      isAccurate,
      timestamp
    };
  }

  /**
   * Calculate pitch confidence based on frequency stability
   */
  private calculatePitchConfidence(frequency: number): number {
    // Simple confidence calculation based on frequency range
    // Human voice typically ranges from 80Hz to 1100Hz
    if (frequency < 80 || frequency > 1100) {
      return 0.3; // Low confidence for out-of-range frequencies
    }
    
    // Higher confidence for typical vocal range
    if (frequency >= 100 && frequency <= 800) {
      return 0.9;
    }
    
    return 0.7; // Medium confidence for edge cases
  }

  /**
   * Convert frequency to musical note
   */
  private frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
    if (frequency <= 0) {
      return { note: 'C', octave: 4, cents: 0 };
    }

    // A4 = 440Hz is the reference
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75); // C0 is 4.75 octaves below A4
    
    // Calculate note number and cents
    const noteNum = 12 * Math.log2(frequency / C0);
    const roundedNoteNum = Math.round(noteNum);
    const cents = Math.round((noteNum - roundedNoteNum) * 100);
    
    // Convert to note name and octave
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(roundedNoteNum / 12);
    const noteIndex = roundedNoteNum % 12;
    const note = noteNames[noteIndex];

    return { note, octave, cents };
  }

  /**
   * Get current audio stream data
   */
  getAudioStream(): AudioStream | null {
    if (!this.mediaStream || !this.audioContext || !this.source || !this.analyser) {
      return null;
    }

    return {
      mediaStream: this.mediaStream,
      audioContext: this.audioContext,
      source: this.source,
      analyser: this.analyser
    };
  }

  /**
   * Get current pitch data (single reading)
   */
  getCurrentPitch(): PitchData | null {
    if (!this.analyser || !this.isProcessing) {
      return null;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const timeData = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(timeData);

    // Use custom pitch detection
    const frequency = detectPitch(timeData, this.audioContext!.sampleRate);
    
    if (frequency !== null) {
      const { note, octave, cents } = this.frequencyToNote(frequency);
      return {
        frequency,
        note,
        octave,
        cents,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.analyser) {
      this.analyser.fftSize = this.settings.bufferSize * 2;
    }
  }

  /**
   * Check if currently processing audio
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('[AudioProcessor] Starting cleanup process...');
    console.log('[AudioProcessor] Current state - isProcessing:', this.isProcessing, 'isMonitoring:', this.isMonitoring);
    
    // Stop all active processes
    this.stopPitchDetection();
    this.stopMonitoring();
    this.stopRangeDetection();
    
    // Stop and clean up media stream tracks
    if (this.mediaStream) {
      console.log('[AudioProcessor] Stopping media stream tracks...');
      const tracks = this.mediaStream.getTracks();
      console.log('[AudioProcessor] Found', tracks.length, 'tracks to stop');
      tracks.forEach((track, index) => {
        console.log(`[AudioProcessor] Stopping track ${index}:`, track.label, 'state:', track.readyState);
        track.stop();
        console.log(`[AudioProcessor] Track ${index} stopped, new state:`, track.readyState);
      });
      this.mediaStream = null;
    } else {
      console.log('[AudioProcessor] No media stream to clean up');
    }
    
    // Disconnect audio nodes
    if (this.source) {
      console.log('[AudioProcessor] Disconnecting audio source...');
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.analyser) {
      console.log('[AudioProcessor] Disconnecting analyser...');
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    // Stop Meyda analyzer
    if (this.meydaAnalyzer) {
      console.log('[AudioProcessor] Stopping Meyda analyzer...');
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      console.log('[AudioProcessor] Closing audio context, current state:', this.audioContext.state);
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close().then(() => {
          console.log('[AudioProcessor] Audio context closed successfully');
        }).catch(error => {
          console.error('[AudioProcessor] Error closing audio context:', error);
        });
      }
      this.audioContext = null;
    }
    
    // Clear all callbacks to prevent memory leaks
    this.onPitchDetectedCallback = undefined;
    this.onMonitoringCallback = undefined;
    this.onRangeProgressCallback = undefined;
    this.onRangeCompleteCallback = undefined;
    
    // Clear recorded data
    this.recordedFrequencies = [];
    this.minFrequency = Infinity;
    this.maxFrequency = -Infinity;
    this.stableReadings = 0;
    
    this.isProcessing = false;
    this.isMonitoring = false;
    
    console.log('[AudioProcessor] Cleanup completed');
  }

  /**
   * Start continuous monitoring mode for practice
   *
   * This is a key feature of the simplified flow - users can practice
   * with real-time feedback without going through a separate "practice step"
   */
  startMonitoring(onPitchDetected: (result: PitchDetectionResult) => void): void {
    if (!this.audioContext || !this.source) {
      throw new Error('Audio not initialized. Call initialize() first.');
    }

    this.onMonitoringCallback = onPitchDetected;
    this.isMonitoring = true;

    // Create Meyda analyzer for monitoring
    this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.source,
      bufferSize: this.settings.bufferSize,
      featureExtractors: ["buffer"],
      callback: (features: MeydaFeatures) => {
        // Throttle processing to reduce CPU load
        const now = Date.now();
        if (now - this.lastProcessedTime < this.processingInterval) {
          return;
        }
        this.lastProcessedTime = now;
        
        if (features && features.buffer && this.onMonitoringCallback && this.isMonitoring) {
          const frequency = detectPitch(features.buffer, this.audioContext!.sampleRate);
          if (frequency !== null) {
            const result = this.processPitchData(frequency);
            this.onMonitoringCallback(result);
          }
        }
      }
    });

    this.meydaAnalyzer.start();
  }

  /**
   * Stop monitoring mode
   */
  stopMonitoring(): void {
    if (this.meydaAnalyzer && this.isMonitoring) {
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }
    this.isMonitoring = false;
    this.onMonitoringCallback = undefined;
  }

  /**
   * Start vocal range detection with real-time tracking
   *
   * Directly starts range detection without requiring users to go through
   * multiple steps. Seamlessly transitions from monitoring mode.
   */
  startRangeDetection(
    onProgress: (minFreq: number, maxFreq: number) => void,
    onComplete: (range: VocalRange) => void
  ): void {
    if (!this.audioContext || !this.source) {
      throw new Error('Audio not initialized. Call initialize() first.');
    }

    // Reset range tracking
    this.recordedFrequencies = [];
    this.minFrequency = Infinity;
    this.maxFrequency = -Infinity;
    this.stableReadings = 0;

    this.onRangeProgressCallback = onProgress;
    this.onRangeCompleteCallback = onComplete;

    // Create Meyda analyzer for range detection
    this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.source,
      bufferSize: this.settings.bufferSize,
      featureExtractors: ["buffer"],
      callback: (features: MeydaFeatures) => {
        if (features && features.buffer) {
          const frequency = detectPitch(features.buffer, this.audioContext!.sampleRate);
          if (frequency !== null) {
            this.handleRangeDetection(frequency);
          }
        }
      }
    });

    this.meydaAnalyzer.start();
    this.isProcessing = true;
  }

  /**
   * Stop range detection
   */
  stopRangeDetection(): void {
    if (this.meydaAnalyzer) {
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }
    this.isProcessing = false;
    this.onRangeProgressCallback = undefined;
    this.onRangeCompleteCallback = undefined;
  }

  /**
   * Handle pitch data for range detection
   */
  private handleRangeDetection(frequency: number): void {
    const result = this.processPitchData(frequency);
    
    // Only consider pitches with good confidence
    if (result.confidence > 0.8) {
      // Prevent memory leaks by limiting the number of recorded frequencies
      if (this.recordedFrequencies.length >= this.maxRecordedFrequencies) {
        this.recordedFrequencies.shift(); // Remove oldest entry
      }
      
      this.recordedFrequencies.push(frequency);
      this.minFrequency = Math.min(this.minFrequency, frequency);
      this.maxFrequency = Math.max(this.maxFrequency, frequency);
      this.stableReadings++;

      // Update progress
      if (this.onRangeProgressCallback) {
        this.onRangeProgressCallback(this.minFrequency, this.maxFrequency);
      }

      // Update vocal range continuously every 10 stable readings
      // This allows users to see their range developing in real-time
      if (this.stableReadings % 10 === 0 && this.stableReadings > 0) {
        this.updateVocalRange();
      }

      // Removed auto-stop condition - detection continues until manually stopped
      // Users can now stop detection whenever they want
    }
  }

  /**
   * Calculate and update vocal range without stopping detection
   */
  private updateVocalRange(): void {
    if (this.recordedFrequencies.length === 0) {
      return;
    }

    // Use static import to avoid chunk loading issues
    try {
      const range = calculateVocalRange(this.recordedFrequencies);

      if (this.onRangeCompleteCallback) {
        this.onRangeCompleteCallback(range);
      }

      // Removed auto-stop - detection continues until manually stopped
    } catch (error) {
      console.error('Failed to calculate vocal range:', error);
      // Don't stop detection on error either
    }
  }

  /**
   * Complete range detection and calculate results (kept for backward compatibility)
   */
  private completeRangeDetection(): void {
    // Delegate to updateVocalRange but don't stop detection
    this.updateVocalRange();
  }

  /**
   * Check if currently monitoring
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current range tracking data
   */
  getCurrentRange(): { min: number; max: number; readings: number } | null {
    if (this.minFrequency === Infinity || this.maxFrequency === -Infinity) {
      return null;
    }

    return {
      min: this.minFrequency,
      max: this.maxFrequency,
      readings: this.stableReadings
    };
  }
}

/**
 * Default audio settings for the application
 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  sampleRate: 44100,
  bufferSize: 4096,
  autoGainControl: true,
  noiseSuppression: true,
  echoCancellation: false
};

/**
 * Create a new AudioProcessor instance with default settings
 */
export function createAudioProcessor(settings?: Partial<AudioSettings>): AudioProcessor {
  return new AudioProcessor({ ...DEFAULT_AUDIO_SETTINGS, ...settings });
}