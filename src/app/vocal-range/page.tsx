'use client';

/**
 * Simplified Vocal Range Detection Page
 *
 * This page provides a minimal interface for vocal range detection with only:
 * 1. Visual waveform display
 * 2. Current note symbol display
 * 3. Start/stop detection button
 * 4. Microphone selector (always visible)
 *
 * Detection runs continuously until manually stopped by the user.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioProcessor, createAudioProcessor } from '@/lib/audio';
import { PitchDetectionResult, VocalRange, MicrophonePermission } from '@/types/audio';
import { saveVocalRange } from '@/lib/storage';
import AudioVisualizer from '@/components/AudioVisualizer';
import MicrophoneSelector from '@/components/MicrophoneSelector';

interface ErrorInfo {
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}

export default function VocalRangePage() {
  // Core audio processing state
  const [audioProcessor, setAudioProcessor] = useState<AudioProcessor | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Application states
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Data states
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(null);
  const [currentRange, setCurrentRange] = useState<{ min: number; max: number } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Storage-related states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Refs
  const initializeAudioRef = useRef<((deviceId: string, existingProcessor?: AudioProcessor | null) => Promise<void>) | null>(null);

  // Error handling
  const handleError = useCallback((error: unknown, recoverable: boolean = false, retryAction?: () => void) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error:', error);
    
    setError({
      message: errorMessage,
      recoverable,
      retryAction
    });
    
    // Auto-clear error after 5 seconds if recoverable
    if (recoverable) {
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, []);


  // Initialize audio processor on component mount
  useEffect(() => {
    console.log('[VocalRangePage] Component mounting, initializing audio processor...');
    const processor = createAudioProcessor();
    audioProcessorRef.current = processor;
    setAudioProcessor(processor);
    
    // Cleanup function for component unmount and page navigation
    const cleanup = () => {
      console.log('[VocalRangePage] Starting cleanup process...');
      if (audioProcessorRef.current) {
        console.log('[VocalRangePage] Disposing audio processor...');
        audioProcessorRef.current.dispose();
        audioProcessorRef.current = null;
      }
      setAudioProcessor(null);
      setIsAudioReady(false);
      setIsDetecting(false);
      console.log('[VocalRangePage] Cleanup completed');
    };
    
    // Handle page visibility changes (user navigating away)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[VocalRangePage] Page hidden, cleaning up microphone...');
        cleanup();
      }
    };
    
    // Handle beforeunload (user closing tab/window)
    const handleBeforeUnload = () => {
      console.log('[VocalRangePage] Page unloading, cleaning up microphone...');
      cleanup();
    };
    
    // Add event listeners for page navigation and tab closing
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('[VocalRangePage] Component unmounting, cleaning up audio processor...');
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Perform cleanup
      cleanup();
    };
  }, []);

  // Pitch detection callback
  const pitchDetectionCallback = useCallback((result: PitchDetectionResult) => {
    setCurrentPitch(result);
  }, []);

  // Handle device selection
  const handleDeviceSelected = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setError(null);
    if (initializeAudioRef.current) {
      initializeAudioRef.current(deviceId, audioProcessorRef.current);
    }
  }, []);

  // Handle permission changes
  const handlePermissionChange = useCallback((permission: MicrophonePermission) => {
    if (!permission.granted) {
      handleError(new Error('Microphone access denied. Please allow microphone access to use this feature.'), true);
      setIsAudioReady(false);
    }
  }, [handleError]);

  // Range detection callbacks
  const rangeProgressCallback = useCallback((minFreq: number, maxFreq: number) => {
    setCurrentRange({ min: minFreq, max: maxFreq });
  }, []);
  
  const rangeCompleteCallback = useCallback((range: VocalRange) => {
    // Update vocal range continuously without stopping detection
    setVocalRange(range);
    
    // Save vocal range to storage
    setIsSaving(true);
    setSaveError(null);
    
    try {
      saveVocalRange(range);
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save vocal range:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save vocal range');
      // Clear error message after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
    
    // Removed setIsDetecting(false) to allow continuous detection
    // Removed setShowResults(true) to prevent UI from switching to results mode
  }, []);

  // Initialize audio with selected device
  const initializeAudio = useCallback(async (deviceId: string, existingProcessor: AudioProcessor | null = null) => {
    let processor = existingProcessor || audioProcessor;
    
    if (!processor) {
      handleError(new Error('Audio processor not initialized'));
      return;
    }

    try {
      // Dispose existing processor if any
      if (processor.isActive()) {
        processor.dispose();
      }
      
      // Create new audio processor with selected device
      processor = createAudioProcessor({ inputDeviceId: deviceId });
      audioProcessorRef.current = processor;
      setAudioProcessor(processor);
      
      const permission = await processor.initialize();
      
      if (permission.granted) {
        setIsAudioReady(true);
        setError(null);
        
        // Start monitoring for real-time pitch display
        try {
          processor.startMonitoring(pitchDetectionCallback);
        } catch (monitorError) {
          handleError(monitorError, true);
          setIsAudioReady(false);
        }
      } else {
        handleError(new Error('Microphone access denied. Please allow microphone access to use this feature.'), true);
      }
    } catch (err) {
      handleError(err, true, () => initializeAudio(deviceId));
    }
  }, [audioProcessor, pitchDetectionCallback, handleError]);

  // Store initializeAudio in ref to avoid circular dependency
  useEffect(() => {
    initializeAudioRef.current = initializeAudio;
  }, [initializeAudio]);

  // Start detection
  const startDetection = () => {
    if (!audioProcessor || !isAudioReady) {
      handleError(new Error('Audio not ready. Please select a microphone first.'), true);
      return;
    }

    try {
      setIsDetecting(true);
      setError(null);
      setCurrentRange(null);
      setShowResults(false);
      
      // Start range detection
      audioProcessor.startRangeDetection(rangeProgressCallback, rangeCompleteCallback);
    } catch (err) {
      handleError(err, true, () => startDetection());
      setIsDetecting(false);
    }
  };

  // Stop detection
  const stopDetection = () => {
    console.log('[VocalRangePage] Stopping detection...');
    if (!audioProcessor) {
      handleError(new Error('Audio processor not initialized'));
      return;
    }

    try {
      audioProcessor.stopRangeDetection();
      setIsDetecting(false);
      console.log('[VocalRangePage] Detection stopped successfully');
      // Only show results if we have vocal range data
      if (vocalRange) {
        setShowResults(true);
      }
    } catch (err) {
      console.error('[VocalRangePage] Error stopping detection:', err);
      handleError(err);
      // Still try to show results even if stopping failed
      setIsDetecting(false);
      if (vocalRange) {
        setShowResults(true);
      }
    }
  };

  // Continue to new detection
  const continueToNewDetection = () => {
    setShowResults(false);
    setVocalRange(null);
    setCurrentRange(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Vocal Range Detection</h1>
            {saveSuccess && (
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">Detect your vocal range to personalize your training experience</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start justify-between">
              <div>
                <strong>Error:</strong> {error.message}
                {error.recoverable && (
                  <p className="text-sm mt-1">This error is recoverable. Please try again.</p>
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

        {/* Storage Status Messages */}
        {isSaving && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <div className="font-medium text-blue-800">💾 Saving your vocal range data...</div>
                <div className="text-sm text-blue-700">This will enable personalized training experiences</div>
              </div>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="ml-3">
                <div className="font-medium text-green-800">✨ Vocal range saved successfully!</div>
                <div className="text-sm text-green-700 mt-1">This data will be used to personalize your training sessions with optimal root notes.</div>
                <div className="text-xs text-green-600 mt-2 bg-white/50 p-2 rounded border border-green-200">
                  <span className="font-medium">💡 What&apos;s next?</span> Visit the Vocal Training page to experience personalized exercises based on your vocal range.
                </div>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 mr-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="ml-3">
                <div className="font-medium text-yellow-800">⚠️ Unable to save vocal range</div>
                <div className="text-sm text-yellow-700 mt-1">{saveError}</div>
                <div className="text-xs text-yellow-600 mt-2 bg-white/50 p-2 rounded border border-yellow-200">
                  <span className="font-medium">💡 Tip:</span> Your vocal range detection still works, but training personalization may be limited. Try refreshing the page.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Microphone Selector - Always Visible */}
          <div className="mb-6">
            <MicrophoneSelector
              onDeviceSelected={handleDeviceSelected}
              onPermissionChange={handlePermissionChange}
              selectedDeviceId={selectedDeviceId}
              className="w-full"
            />
          </div>

          {/* Audio Visualizer - Always Visible */}
          <div className="mb-6">
            <AudioVisualizer
              width={700}
              height={200}
              currentPitch={currentPitch}
              isRecording={isDetecting}
              isMonitoring={isAudioReady && !isDetecting}
              className="w-full"
            />
          </div>

          {/* Current Note Display - Always Visible */}
          <div className="mb-6 text-center">
            {currentPitch && currentPitch.confidence > 0.7 ? (
              <div className="inline-block bg-blue-50 rounded-lg px-6 py-4">
                <div className="text-4xl font-mono font-bold text-blue-800">
                  {currentPitch.note}{currentPitch.octave}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {currentPitch.frequency.toFixed(1)} Hz
                </div>
              </div>
            ) : (
              <div className="inline-block bg-gray-50 rounded-lg px-6 py-4">
                <div className="text-2xl font-mono text-gray-400">
                  -- 
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  No pitch detected
                </div>
              </div>
            )}
          </div>

          {/* Detection Controls */}
          <div className="text-center mb-6">
            {!isDetecting ? (
              <button
                onClick={startDetection}
                disabled={!isAudioReady}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                Start Detection
              </button>
            ) : (
              <button
                onClick={stopDetection}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                Stop Detection
              </button>
            )}
          </div>

          {/* Current Range During Detection */}
          {isDetecting && currentRange && (
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-50 rounded-lg px-6 py-3">
                <div className="text-sm text-blue-600 mb-1">Current Range Detected</div>
                <div className="font-mono text-blue-900">
                  {currentRange.min.toFixed(1)} - {currentRange.max.toFixed(1)} Hz
                </div>
              </div>
            </div>
          )}

          {/* Real-time Vocal Range Display - Shows during detection */}
          {isDetecting && vocalRange && (
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Developing Vocal Range</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Lowest Note</div>
                    <div className="text-xl font-mono font-bold text-gray-900">
                      {vocalRange.lowestNote}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Highest Note</div>
                    <div className="text-xl font-mono font-bold text-gray-900">
                      {vocalRange.highestNote}
                    </div>
                  </div>
                </div>

                <div className="text-base font-medium text-gray-900">
                  {vocalRange.voiceType.charAt(0).toUpperCase() + vocalRange.voiceType.slice(1)}
                </div>
                
                <div className="text-xs text-gray-600 mt-2">
                  Range updates every 10 stable readings
                </div>
              </div>
            </div>
          )}

          {/* Final Results Display - Only shown after manual stop */}
          {!isDetecting && showResults && vocalRange && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Final Vocal Range</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Lowest Note</div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {vocalRange.lowestNote}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Highest Note</div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {vocalRange.highestNote}
                    </div>
                  </div>
                </div>

                <div className="text-lg font-semibold text-gray-900">
                  {vocalRange.voiceType.charAt(0).toUpperCase() + vocalRange.voiceType.slice(1)}
                </div>
              </div>

              <button
                onClick={continueToNewDetection}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Detect Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}