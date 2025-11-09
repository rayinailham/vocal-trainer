import Meyda from 'meyda';
import { 
  AudioSettings, 
  AudioStream, 
  PitchDetectionResult, 
  MicrophonePermission,
  PitchData 
} from '@/types/audio';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meydaAnalyzer: ReturnType<typeof Meyda.createMeydaAnalyzer> | null = null;
  private isProcessing: boolean = false;
  private settings: AudioSettings;
  private onPitchDetectedCallback?: (result: PitchDetectionResult) => void;

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
   * Start pitch detection using Meyda
   */
  startPitchDetection(
    onPitchDetected: (result: PitchDetectionResult) => void
  ): void {
    if (!this.audioContext || !this.source) {
      throw new Error('Audio not initialized. Call initialize() first.');
    }

    this.onPitchDetectedCallback = onPitchDetected;

    // Create Meyda analyzer
    this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.source,
      bufferSize: this.settings.bufferSize,
      featureExtractors: ['pitch'],
      callback: (features: { pitch: number | null }) => {
        if (features.pitch !== null && this.onPitchDetectedCallback) {
          const result = this.processPitchData(features.pitch);
          this.onPitchDetectedCallback(result);
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
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    // Use Meyda to get pitch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features = Meyda.extract('pitch' as any, dataArray) as { pitch: number | null };
    
    if (features && features.pitch !== null) {
      const { note, octave, cents } = this.frequencyToNote(features.pitch);
      return {
        frequency: features.pitch,
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
    this.stopPitchDetection();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isProcessing = false;
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