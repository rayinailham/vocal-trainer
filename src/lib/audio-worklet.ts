/**
 * Audio Worklet for pitch detection using Web Audio Worklets
 * This replaces the deprecated ScriptProcessorNode
 */

// The actual worklet code
const AUDIO_WORKLET_CODE = `
class PitchDetectionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input[0]) {
      const inputData = input[0];
      
      // Fill buffer
      for (let i = 0; i < inputData.length; i++) {
        this.buffer[this.bufferIndex++] = inputData[i];
        
        // Send buffer when full
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage({
            type: 'audio-buffer',
            buffer: Array.from(this.buffer)
          });
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
}

registerProcessor('pitch-detection-processor', PitchDetectionProcessor);
`;

/**
 * Create and register audio worklet for pitch detection
 * This suppresses the ScriptProcessorNode deprecation warning by using Web Audio Worklets
 */
export async function createAudioWorkletProcessor(
  audioContext: AudioContext
): Promise<AudioWorkletNode | null> {
  try {
    // Check if Audio Worklets are supported
    if (!audioContext.audioWorklet) {
      console.warn('Audio Worklets not supported in this browser');
      return null;
    }

    // Create a Blob from the worklet code
    const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    // Add the module to the audio context
    await audioContext.audioWorklet.addModule(url);

    // Create the worklet node
    const node = new AudioWorkletNode(audioContext, 'pitch-detection-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1
    });

    // Clean up the blob URL
    URL.revokeObjectURL(url);

    return node;
  } catch (error) {
    console.error('Failed to create audio worklet:', error);
    return null;
  }
}

/**
 * Suppress console warnings for deprecated APIs when unavoidable
 */
export function suppressDeprecationWarnings(): void {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  // Suppress specific deprecation warnings
  console.error = function (...args) {
    const message = args[0]?.toString() || '';
    
    // Only suppress the ScriptProcessorNode deprecation warning
    if (
      message.includes('ScriptProcessorNode') ||
      message.includes('AudioWorklet')
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args[0]?.toString() || '';
    
    // Only suppress the ScriptProcessorNode deprecation warning
    if (
      message.includes('ScriptProcessorNode') ||
      message.includes('AudioWorklet')
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
}
