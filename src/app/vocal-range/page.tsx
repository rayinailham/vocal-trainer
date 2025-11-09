'use client';

/**
 * Vocal Range Detection Page
 *
 * This page allows users to detect their vocal range through a simplified flow without steps.
 * The component uses a state-based approach with three main modes:
 * 1. Setup Mode - Microphone selection and initialization
 * 2. Practice Mode - Real-time pitch monitoring for practice
 * 3. Detection Mode - Active vocal range detection
 * 4. Results Mode - Display of detected vocal range
 *
 * Key Features:
 * - Auto-initialization of audio when microphone is selected
 * - Real-time pitch monitoring in practice mode
 * - Seamless transition from practice to detection
 * - Comprehensive error handling and recovery
 * - State validation to prevent invalid transitions
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AudioProcessor, createAudioProcessor } from '@/lib/audio';
import { PitchDetectionResult, VocalRange, MicrophonePermission } from '@/types/audio';
import { saveVocalRange, loadVocalRange } from '@/lib/storage';
import AudioVisualizer from '@/components/AudioVisualizer';
import PitchMeter from '@/components/PitchMeter';
import PianoKeyboard from '@/components/PianoKeyboard';
import MicrophoneSelector from '@/components/MicrophoneSelector';

// Error types for better error handling
type ErrorType = 'permission' | 'device' | 'context' | 'processing' | 'unknown';

interface ErrorInfo {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}


export default function VocalRangePage() {
  // Core audio processing state
  const [audioProcessor, setAudioProcessor] = useState<AudioProcessor | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Application flow states - replaces the old step system
  const [isAudioReady, setIsAudioReady] = useState(false); // Audio initialized and ready
  const [isDetecting, setIsDetecting] = useState(false); // Active range detection in progress
  const [showResults, setShowResults] = useState(false); // Results are being displayed
  
  // Audio activity states
  const [isRecording, setIsRecording] = useState(false); // Currently recording for range detection
  const [isMonitoring, setIsMonitoring] = useState(false); // Real-time pitch monitoring active
  
  // Data states
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(null);
  const [savedVocalRange, setSavedVocalRange] = useState<VocalRange | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentRange, setCurrentRange] = useState<{ min: number; max: number } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Recording data
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const errorRecoveryTimer = useRef<NodeJS.Timeout | null>(null);
  const deviceChangeHandler = useRef<((event: Event) => void) | null>(null);

  // Error handling utility
  const handleError = useCallback((error: unknown, type: ErrorType = 'unknown', recoverable: boolean = false, retryAction?: () => void) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[${type}] Error:`, error);
    
    setError({
      type,
      message: errorMessage,
      recoverable,
      retryAction
    });
    
    // Auto-clear error after 5 seconds if recoverable
    if (recoverable) {
      if (errorRecoveryTimer.current) {
        clearTimeout(errorRecoveryTimer.current);
      }
      errorRecoveryTimer.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, []);

  /**
   * Validates state transitions to prevent invalid application states
   * This replaces the rigid step system with a flexible but safe state machine
   */
  const validateStateTransition = useCallback((from: string, to: string, action: string) => {
    const validTransitions: Record<string, string[]> = {
      'idle': ['initializing', 'monitoring'],
      'initializing': ['idle', 'monitoring', 'error'],
      'monitoring': ['idle', 'detecting', 'error'],
      'detecting': ['monitoring', 'results', 'error'],
      'results': ['idle', 'monitoring'],
      'error': ['idle']
    };
    
    if (!validTransitions[from]?.includes(to)) {
      handleError(new Error(`Invalid state transition: ${from} -> ${to} during ${action}`), 'processing');
      return false;
    }
    return true;
  }, [handleError]);

  /**
   * Determines the current application state based on multiple boolean flags
   * This provides a single source of truth for the application's current mode
   */
  const getCurrentState = useCallback(() => {
    if (error) return 'error';
    if (showResults) return 'results';
    if (isDetecting) return 'detecting';
    if (isMonitoring) return 'monitoring';
    if (isAudioReady) return 'idle';
    return 'initializing';
  }, [error, showResults, isDetecting, isMonitoring, isAudioReady]);

  // Memoize voice type color and description functions to prevent re-renders
  const voiceTypeHelpers = useMemo(() => ({
    getVoiceTypeColor: (voiceType: string) => {
      switch (voiceType) {
        case 'soprano': return 'text-purple-600';
        case 'mezzo-soprano': return 'text-pink-600';
        case 'alto': return 'text-orange-600';
        case 'tenor': return 'text-blue-600';
        case 'baritone': return 'text-green-600';
        case 'bass': return 'text-red-600';
        default: return 'text-gray-600';
      }
    },
    getVoiceTypeDescription: (voiceType: string) => {
      switch (voiceType) {
        case 'soprano': return 'Highest female voice type';
        case 'mezzo-soprano': return 'Middle female voice type';
        case 'alto': return 'Lowest female voice type';
        case 'tenor': return 'Highest male voice type';
        case 'baritone': return 'Middle male voice type';
        case 'bass': return 'Lowest male voice type';
        default: return 'Voice type could not be determined';
      }
    }
  }), []);

  // Reset detection function - defined early to avoid circular dependencies
  const resetDetection = useCallback(() => {
    try {
      // Clean up audio processor
      if (audioProcessor) {
        if (isMonitoring) {
          audioProcessor.stopMonitoring();
        }
        if (isRecording) {
          audioProcessor.stopRangeDetection();
        }
        audioProcessor.dispose();
      }
      
      // Create new processor
      const processor = createAudioProcessor();
      setAudioProcessor(processor);
      
      // Reset state
      setIsAudioReady(false);
      setIsDetecting(false);
      setShowResults(false);
      setIsRecording(false);
      setIsMonitoring(false);
      setCurrentPitch(null);
      setError(null);
      setVocalRange(null);
      setCurrentRange(null);
      setSaveSuccess(false);
      
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      if (errorRecoveryTimer.current) {
        clearTimeout(errorRecoveryTimer.current);
        errorRecoveryTimer.current = null;
      }
    } catch (error) {
      handleError(error, 'processing');
      // Force reset state even if cleanup failed
      setIsAudioReady(false);
      setIsDetecting(false);
      setShowResults(false);
      setIsRecording(false);
      setIsMonitoring(false);
      setCurrentPitch(null);
      setVocalRange(null);
      setCurrentRange(null);
      setSaveSuccess(false);
    }
  }, [audioProcessor, isMonitoring, isRecording, handleError]);

  // Handle microphone disconnection
  const handleMicrophoneDisconnection = useCallback(() => {
    if (isDetecting || isMonitoring) {
      handleError(new Error('Microphone disconnected. Please select your microphone again.'), 'device', true, () => {
        resetDetection();
      });
      
      // Stop current activities
      if (audioProcessor) {
        if (isMonitoring) {
          audioProcessor.stopMonitoring();
        }
        if (isDetecting) {
          audioProcessor.stopRangeDetection();
        }
      }
      
      setIsMonitoring(false);
      setIsDetecting(false);
      setIsAudioReady(false);
    }
  }, [audioProcessor, isDetecting, isMonitoring, handleError, resetDetection]);

  // Handle audio context suspension
  const handleAudioContextSuspension = useCallback(async () => {
    if (audioProcessor) {
      try {
        const stream = audioProcessor.getAudioStream();
        if (stream && stream.audioContext.state === 'suspended') {
          await stream.audioContext.resume();
          
          // Restart monitoring if it was active
          if (isMonitoring && !isDetecting) {
            audioProcessor.startMonitoring((result: PitchDetectionResult) => {
              setCurrentPitch(result);
            });
          }
        }
      } catch (error) {
        handleError(error, 'context', true, () => {
          resetDetection();
        });
      }
    }
  }, [audioProcessor, isMonitoring, isDetecting, handleError, resetDetection]);

  // Setup device change listener
  useEffect(() => {
    deviceChangeHandler.current = () => {
      handleMicrophoneDisconnection();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', deviceChangeHandler.current);
    
    return () => {
      if (deviceChangeHandler.current) {
        navigator.mediaDevices.removeEventListener('devicechange', deviceChangeHandler.current);
      }
    };
  }, [handleMicrophoneDisconnection]);

  // Setup visibility change listener for audio context
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAudioContextSuspension();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleAudioContextSuspension]);

  useEffect(() => {
    // Initialize audio processor on component mount
    const processor = createAudioProcessor();
    setAudioProcessor(processor);
    
    // Load saved vocal range if exists
    const saved = loadVocalRange();
    if (saved) {
      setSavedVocalRange(saved);
    }
    
    return () => {
      // Clean up all timers
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }
      if (errorRecoveryTimer.current) {
        clearTimeout(errorRecoveryTimer.current);
        errorRecoveryTimer.current = null;
      }
      
      // Clean up audio processor
      if (processor) {
        processor.dispose();
      }
      
      // Clean up device change listener
      if (deviceChangeHandler.current) {
        navigator.mediaDevices.removeEventListener('devicechange', deviceChangeHandler.current);
        deviceChangeHandler.current = null;
      }
    };
  }, []);

  const handleDeviceSelected = (deviceId: string) => {
    if (!validateStateTransition(getCurrentState(), 'initializing', 'device selection')) {
      return;
    }
    
    setSelectedDeviceId(deviceId);
    setError(null); // Clear any previous errors
    // Auto-initialize audio when device is selected
    initializeAudio(deviceId);
  };

  // Memoize the pitch detection callback to prevent unnecessary re-renders
  const pitchDetectionCallback = useCallback((result: PitchDetectionResult) => {
    setCurrentPitch(result);
  }, []);

  const handlePermissionChange = useCallback((permission: MicrophonePermission) => {
    if (permission.granted) {
      setError(null);
      // Auto-start monitoring when permission is granted in practice mode
      if (isAudioReady && !isMonitoring && !isDetecting) {
        if (audioProcessor) {
          try {
            audioProcessor.startMonitoring(pitchDetectionCallback);
            setIsMonitoring(true);
          } catch (error) {
            handleError(error, 'permission', true);
          }
        }
      }
    } else {
      handleError(new Error('Microphone access denied. Please allow microphone access to use this feature.'), 'permission', true);
      setIsMonitoring(false);
      setIsAudioReady(false);
    }
  }, [isAudioReady, isMonitoring, isDetecting, audioProcessor, pitchDetectionCallback, handleError]);

  // Memoize the range detection callbacks to prevent unnecessary re-renders
  const rangeProgressCallback = useCallback((minFreq: number, maxFreq: number) => {
    setCurrentRange({ min: minFreq, max: maxFreq });
  }, []);
  
  const rangeCompleteCallback = useCallback((range: VocalRange) => {
    setVocalRange(range);
    setIsRecording(false);
    setIsDetecting(false);
    setShowResults(true);
  }, []);

  /**
   * Initializes audio with the selected device and auto-starts monitoring
   * This is a key part of the simplified flow - no separate "Start Practice" step needed
   */
  const initializeAudio = async (deviceId: string) => {
    if (!audioProcessor) {
      handleError(new Error('Audio processor not initialized'), 'processing');
      return;
    }

    try {
      // Dispose existing processor if any
      if (audioProcessor.isActive()) {
        audioProcessor.dispose();
      }
      
      // Create new audio processor with selected device
      const processor = createAudioProcessor({ inputDeviceId: deviceId });
      setAudioProcessor(processor);
      
      const permission = await processor.initialize();
      
      if (permission.granted) {
        setIsAudioReady(true);
        setError(null);
        
        // Auto-start monitoring for practice mode - key improvement in new flow
        try {
          processor.startMonitoring(pitchDetectionCallback);
          setIsMonitoring(true);
        } catch (monitorError) {
          handleError(monitorError, 'processing', true);
          setIsAudioReady(false);
        }
      } else {
        handleError(new Error('Microphone access denied. Please allow microphone access to use this feature.'), 'permission', true);
      }
    } catch (err) {
      handleError(err, 'device', true, () => initializeAudio(deviceId));
    }
  };

  const stopPractice = () => {
    if (!validateStateTransition(getCurrentState(), 'idle', 'stop practice')) {
      return;
    }
    
    try {
      if (audioProcessor && isMonitoring) {
        audioProcessor.stopMonitoring();
        setIsMonitoring(false);
        setCurrentPitch(null);
      }
    } catch (error) {
      handleError(error, 'processing');
    }
  };

  /**
   * Starts the vocal range detection process
   * Directly transitions from practice mode to detection without intermediate steps
   */
  const startDetection = () => {
    if (!validateStateTransition(getCurrentState(), 'detecting', 'start detection')) {
      return;
    }
    
    if (!audioProcessor || !isAudioReady) {
      handleError(new Error('Audio not ready. Please select a microphone first.'), 'device', true);
      return;
    }

    try {
      // Stop monitoring first - seamless transition from practice to detection
      if (isMonitoring) {
        audioProcessor.stopMonitoring();
        setIsMonitoring(false);
      }

      // Start range detection
      setIsDetecting(true);
      setError(null);
      audioProcessor.startRangeDetection(rangeProgressCallback, rangeCompleteCallback);
      
      setIsRecording(true);
      setCurrentRange(null);
      
      // Auto-stop after 15 seconds maximum for user convenience
      recordingTimer.current = setTimeout(() => {
        stopDetection();
      }, 15000);
      
    } catch (err) {
      handleError(err, 'processing', true, () => startDetection());
      setIsDetecting(false);
    }
  };

  const stopDetection = () => {
    if (!validateStateTransition(getCurrentState(), 'results', 'stop detection')) {
      return;
    }
    
    if (!audioProcessor) {
      handleError(new Error('Audio processor not initialized'), 'processing');
      return;
    }

    try {
      audioProcessor.stopRangeDetection();
      setIsRecording(false);
      setIsDetecting(false);
      setShowResults(true);
      
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }
    } catch (err) {
      handleError(err, 'processing');
      // Still try to show results even if stopping failed
      setShowResults(true);
      setIsDetecting(false);
      setIsRecording(false);
    }
  };



  const saveVocalRangeResults = () => {
    if (!vocalRange) {
      handleError(new Error('No vocal range data to save'), 'processing');
      return;
    }

    try {
      saveVocalRange(vocalRange);
      setSavedVocalRange(vocalRange);
      setSaveSuccess(true);
      setError(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      handleError(err, 'processing', true, () => saveVocalRangeResults());
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vocal Range Detection</h1>
          <p className="text-lg text-gray-600">Practice with real-time pitch detection, then test your vocal range</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`border px-4 py-3 rounded mb-6 ${
            error.type === 'permission' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
            error.type === 'device' ? 'bg-orange-100 border-orange-400 text-orange-700' :
            error.type === 'context' ? 'bg-purple-100 border-purple-400 text-purple-700' :
            'bg-red-100 border-red-400 text-red-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <strong className="capitalize">{error.type} Error:</strong> {error.message}
                {error.recoverable && (
                  <p className="text-sm mt-1">This error is recoverable. Please try again or use the retry button.</p>
                )}
              </div>
              {error.recoverable && error.retryAction && (
                <button
                  onClick={() => {
                    setIsRecovering(true);
                    setError(null);
                    error.retryAction?.();
                    setTimeout(() => setIsRecovering(false), 1000);
                  }}
                  disabled={isRecovering}
                  className="ml-4 px-3 py-1 text-sm font-medium bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {isRecovering ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Setup View (Default) */}
          {!isAudioReady && !showResults && (
            <div className="space-y-6">
              {savedVocalRange && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Previously Saved Results</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-green-600">Range:</span>
                      <div className="font-mono font-bold text-green-900">
                        {savedVocalRange.lowestNote} - {savedVocalRange.highestNote}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-green-600">Voice Type:</span>
                      <div className={`font-semibold ${voiceTypeHelpers.getVoiceTypeColor(savedVocalRange.voiceType)}`}>
                        {savedVocalRange.voiceType.charAt(0).toUpperCase() + savedVocalRange.voiceType.slice(1)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    Select a microphone below to retake the test and update your results.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Select Your Microphone
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Choose your microphone to begin real-time pitch detection and vocal range testing
                  </p>
                  <p className="text-sm text-gray-500">
                    Your microphone will automatically start monitoring for practice mode
                  </p>
                </div>
                 
                <MicrophoneSelector
                  onDeviceSelected={handleDeviceSelected}
                  onPermissionChange={handlePermissionChange}
                  selectedDeviceId={selectedDeviceId}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Practice Mode View (Audio Ready) */}
          {isAudioReady && !isDetecting && !showResults && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Practice Mode
                </h2>
                <p className="text-gray-600 mb-4">
                  Get comfortable with your voice and microphone
                </p>
                <p className="text-sm text-gray-500">
                  Sing different notes to see real-time pitch detection. When ready, click Start Detection.
                </p>
              </div>
              
              {/* Microphone Selector in Practice View */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Microphone</h3>
                  <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <MicrophoneSelector
                  onDeviceSelected={handleDeviceSelected}
                  onPermissionChange={handlePermissionChange}
                  selectedDeviceId={selectedDeviceId}
                  className="w-full"
                  compact={true}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {isMonitoring ? 'Monitoring active' : 'Select a microphone to enable monitoring'}
                </p>
              </div>
              {/* Audio Visualizer */}
              <div className="mb-6">
                <AudioVisualizer
                  width={700}
                  height={200}
                  currentPitch={currentPitch}
                  isRecording={false}
                  isMonitoring={isMonitoring}
                  className="w-full"
                />
              </div>

              {/* Pitch Meter */}
              <div className="mb-6">
                <PitchMeter
                  currentPitch={currentPitch}
                  showCents={true}
                  showFrequency={true}
                />
              </div>

              {/* Current Note Display */}
              {currentPitch && currentPitch.confidence > 0.7 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-blue-800">
                    {currentPitch.note}{currentPitch.octave}
                  </div>
                  <div className="text-sm text-blue-600">
                    {currentPitch.frequency.toFixed(1)} Hz
                  </div>
                </div>
              )}

              {/* Practice Controls */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-lg font-medium text-gray-700">
                    {isMonitoring ? 'Practice Mode Active' : 'Practice Mode Inactive'}
                  </span>
                </div>
                
                <div className="flex gap-4 justify-center">
                  {!isMonitoring ? (
                    <button
                      onClick={() => {
                        if (audioProcessor) {
                          audioProcessor.startMonitoring(pitchDetectionCallback);
                          setIsMonitoring(true);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Start Monitoring
                    </button>
                  ) : (
                    <button
                      onClick={stopPractice}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Stop Monitoring
                    </button>
                  )}
                  
                  <button
                    onClick={startDetection}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Start Detection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detection View */}
          {isDetecting && (
            <div className="space-y-6">
              {/* Audio Visualizer */}
              <div className="mb-6">
                <AudioVisualizer
                  width={700}
                  height={200}
                  currentPitch={currentPitch}
                  isRecording={isRecording}
                  className="w-full"
                />
              </div>

              {/* Pitch Meter */}
              <div className="mb-6">
                <PitchMeter
                  currentPitch={currentPitch}
                  showCents={true}
                  showFrequency={true}
                />
              </div>

              {/* Recording Progress */}
              {currentRange && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Current Range Detected</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-blue-600">Lowest:</span>
                      <div className="font-mono text-blue-900">
                        {currentRange.min.toFixed(1)} Hz
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600">Highest:</span>
                      <div className="font-mono text-blue-900">
                        {currentRange.max.toFixed(1)} Hz
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Controls */}
              <div className="text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-lg font-medium text-gray-700">
                      Recording... Sing from your lowest to highest note
                    </span>
                  </div>
                  <button
                    onClick={stopDetection}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Stop Detection
                  </button>
                </div>
              </div>

              {/* Current Note Display */}
              {currentPitch && currentPitch.confidence > 0.7 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-blue-800">
                    {currentPitch.note}{currentPitch.octave}
                  </div>
                  <div className="text-sm text-blue-600">
                    {currentPitch.frequency.toFixed(1)} Hz
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {showResults && vocalRange && (
            <div className="space-y-6">
              {/* Results Display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Your Vocal Range</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Lowest Note</div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {vocalRange.lowestNote}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vocalRange.lowestFrequency.toFixed(1)} Hz
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Highest Note</div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {vocalRange.highestNote}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vocalRange.highestFrequency.toFixed(1)} Hz
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-sm text-gray-600 mb-1">Range</div>
                  <div className="text-xl font-bold text-gray-900">
                    {vocalRange.rangeInSemitones} semitones
                  </div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-semibold ${voiceTypeHelpers.getVoiceTypeColor(vocalRange.voiceType)}`}>
                    {vocalRange.voiceType.charAt(0).toUpperCase() + vocalRange.voiceType.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {voiceTypeHelpers.getVoiceTypeDescription(vocalRange.voiceType)}
                  </div>
                </div>
              </div>

              {/* Comparison with Previous Results */}
              {savedVocalRange && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-3 text-center">Comparison with Previous Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-yellow-600 mb-1">Previous Range</div>
                      <div className="font-mono font-bold text-yellow-900">
                        {savedVocalRange.lowestNote} - {savedVocalRange.highestNote}
                      </div>
                      <div className="text-xs text-yellow-700">
                        {savedVocalRange.rangeInSemitones} semitones
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 mb-1">Current Range</div>
                      <div className="font-mono font-bold text-yellow-900">
                        {vocalRange.lowestNote} - {vocalRange.highestNote}
                      </div>
                      <div className="text-xs text-yellow-700">
                        {vocalRange.rangeInSemitones} semitones
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 mb-1">Improvement</div>
                      <div className="font-mono font-bold text-yellow-900">
                        {vocalRange.rangeInSemitones > savedVocalRange.rangeInSemitones ? '+' : ''}
                        {vocalRange.rangeInSemitones - savedVocalRange.rangeInSemitones} semitones
                      </div>
                      <div className="text-xs text-yellow-700">
                        {vocalRange.rangeInSemitones > savedVocalRange.rangeInSemitones
                          ? 'Improved!'
                          : vocalRange.rangeInSemitones < savedVocalRange.rangeInSemitones
                            ? 'Decreased'
                            : 'No change'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Piano Keyboard Visualization */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Your Range on Piano</h4>
                <PianoKeyboard
                  startOctave={2}
                  endOctave={6}
                  highlightedNotes={[vocalRange.lowestNote, vocalRange.highestNote]}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetDetection}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Retake Test
                </button>
                <button
                  onClick={saveVocalRangeResults}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Save Results
                </button>
              </div>
              
              {/* Save Success Message */}
              {saveSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
                  <strong>Success!</strong> Your vocal range has been saved.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Best Results</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Find a quiet environment with minimal background noise</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Warm up your voice gently before starting the test</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Sing at a comfortable volume - don&apos;t shout or whisper</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Hold each note steady for 2-3 seconds for accurate detection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Don&apos;t strain - find your comfortable range, not your absolute limits</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}