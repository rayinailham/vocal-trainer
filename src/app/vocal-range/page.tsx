'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioProcessor, createAudioProcessor } from '@/lib/audio';
import { calculateVocalRange } from '@/lib/pitch';
import { PitchDetectionResult, VocalRange } from '@/types/audio';
import { saveVocalRange, loadVocalRange } from '@/lib/storage';
import AudioVisualizer from '@/components/AudioVisualizer';
import PitchMeter from '@/components/PitchMeter';
import ProgressIndicator from '@/components/ProgressIndicator';
import PianoKeyboard from '@/components/PianoKeyboard';

type DetectionStep = 'idle' | 'permission' | 'lowest' | 'highest' | 'processing' | 'complete';

interface StepInfo {
  step: DetectionStep;
  title: string;
  description: string;
  instruction: string;
}

const STEPS: StepInfo[] = [
  {
    step: 'idle',
    title: 'Welcome to Vocal Range Detection',
    description: 'This tool will help you discover your vocal range',
    instruction: 'Click the button below to get started'
  },
  {
    step: 'permission',
    title: 'Microphone Permission',
    description: 'We need access to your microphone to detect your vocal range',
    instruction: 'Please allow microphone access when prompted'
  },
  {
    step: 'lowest',
    title: 'Find Your Lowest Note',
    description: 'Sing your lowest comfortable note',
    instruction: 'Take a deep breath and sing as low as you comfortably can. Hold the note for 2-3 seconds.'
  },
  {
    step: 'highest',
    title: 'Find Your Highest Note',
    description: 'Now sing your highest comfortable note',
    instruction: 'Take a deep breath and sing as high as you comfortably can. Hold the note for 2-3 seconds.'
  },
  {
    step: 'processing',
    title: 'Processing Your Range',
    description: 'Analyzing your vocal data',
    instruction: 'Please wait while we calculate your vocal range...'
  },
  {
    step: 'complete',
    title: 'Your Vocal Range',
    description: 'Here are your results',
    instruction: 'You can save these results or retake the test'
  }
];

export default function VocalRangePage() {
  const [audioProcessor, setAudioProcessor] = useState<AudioProcessor | null>(null);
  const [currentStep, setCurrentStep] = useState<DetectionStep>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(null);
  const [savedVocalRange, setSavedVocalRange] = useState<VocalRange | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Recording data
  const lowestFrequencies = useRef<number[]>([]);
  const highestFrequencies = useRef<number[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const stablePitchCount = useRef<number>(0);
  const lastStablePitch = useRef<number | null>(null);

  const stepIndex = STEPS.findIndex(step => step.step === currentStep);
  const currentStepInfo = STEPS[stepIndex] || STEPS[0];

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
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
      processor.dispose();
    };
  }, []);

  useEffect(() => {
    // Auto-advance from permission step
    if (currentStep === 'permission' && isInitialized) {
      const timer = setTimeout(() => {
        setCurrentStep('lowest');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isInitialized]);

  const startDetection = async () => {
    if (!audioProcessor) {
      setError('Audio processor not initialized');
      return;
    }

    try {
      setCurrentStep('permission');
      const permission = await audioProcessor.initialize();
      
      if (permission.granted) {
        setIsInitialized(true);
        setError(null);
      } else {
        setError('Microphone access denied. Please allow microphone access to use this feature.');
        setCurrentStep('idle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setCurrentStep('idle');
    }
  };

  const startRecording = (type: 'lowest' | 'highest') => {
    if (!audioProcessor || !isInitialized) {
      setError('Audio not initialized');
      return;
    }

    // Reset recording data
    if (type === 'lowest') {
      lowestFrequencies.current = [];
    } else {
      highestFrequencies.current = [];
    }
    stablePitchCount.current = 0;
    lastStablePitch.current = null;

    try {
      audioProcessor.startPitchDetection((result: PitchDetectionResult) => {
        setCurrentPitch(result);
        
        // Only consider pitches with good confidence
        if (result.confidence > 0.7) {
          const frequency = result.frequency;
          
          // Check if pitch is stable (within 20 cents of previous stable pitch)
          if (lastStablePitch.current === null || 
              Math.abs(calculateCentsDifference(lastStablePitch.current, frequency)) < 20) {
            stablePitchCount.current++;
            lastStablePitch.current = frequency;
            
            // Add to appropriate frequency array
            if (type === 'lowest') {
              lowestFrequencies.current.push(frequency);
            } else {
              highestFrequencies.current.push(frequency);
            }
            
            // Auto-stop after 3 seconds of stable pitch
            if (stablePitchCount.current >= 30) { // Assuming ~10 updates per second
              stopRecording(type);
            }
          } else {
            // Reset if pitch changed significantly
            stablePitchCount.current = 1;
            lastStablePitch.current = frequency;
          }
        }
      });
      
      setIsRecording(true);
      
      // Auto-stop after 10 seconds maximum
      recordingTimer.current = setTimeout(() => {
        stopRecording(type);
      }, 10000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const stopRecording = (type: 'lowest' | 'highest') => {
    if (!audioProcessor) {
      setError('Audio processor not initialized');
      return;
    }

    try {
      audioProcessor.stopPitchDetection();
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      // Move to next step
      if (type === 'lowest') {
        setCurrentStep('highest');
      } else {
        // Process the results
        processVocalRange();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const processVocalRange = () => {
    setCurrentStep('processing');
    
    // Combine all recorded frequencies
    const allFrequencies = [...lowestFrequencies.current, ...highestFrequencies.current];
    
    if (allFrequencies.length === 0) {
      setError('No vocal data recorded. Please try again.');
      setCurrentStep('idle');
      return;
    }
    
    // Calculate vocal range
    const range = calculateVocalRange(allFrequencies);
    setVocalRange(range);
    
    // Move to complete step
    setTimeout(() => {
      setCurrentStep('complete');
    }, 2000);
  };

  const calculateCentsDifference = (freq1: number, freq2: number): number => {
    return Math.round(1200 * Math.log2(freq2 / freq1));
  };

  const resetDetection = () => {
    setCurrentStep('idle');
    setIsRecording(false);
    setCurrentPitch(null);
    setError(null);
    setVocalRange(null);
    setSaveSuccess(false);
    lowestFrequencies.current = [];
    highestFrequencies.current = [];
    stablePitchCount.current = 0;
    lastStablePitch.current = null;
    
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const saveVocalRangeResults = () => {
    if (!vocalRange) {
      setError('No vocal range data to save');
      return;
    }

    try {
      saveVocalRange(vocalRange);
      setSavedVocalRange(vocalRange);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save vocal range';
      setError(errorMessage);
    }
  };

  const getVoiceTypeColor = (voiceType: string) => {
    switch (voiceType) {
      case 'soprano': return 'text-purple-600';
      case 'mezzo-soprano': return 'text-pink-600';
      case 'alto': return 'text-orange-600';
      case 'tenor': return 'text-blue-600';
      case 'baritone': return 'text-green-600';
      case 'bass': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getVoiceTypeDescription = (voiceType: string) => {
    switch (voiceType) {
      case 'soprano': return 'Highest female voice type';
      case 'mezzo-soprano': return 'Middle female voice type';
      case 'alto': return 'Lowest female voice type';
      case 'tenor': return 'Highest male voice type';
      case 'baritone': return 'Middle male voice type';
      case 'bass': return 'Lowest male voice type';
      default: return 'Voice type could not be determined';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vocal Range Detection</h1>
          <p className="text-lg text-gray-600">Discover your vocal range in just a few simple steps</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={stepIndex + 1}
            totalSteps={STEPS.length}
            currentLabel={currentStepInfo.title}
            variant="steps"
            size="medium"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Step Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {currentStepInfo.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {currentStepInfo.description}
            </p>
            <p className="text-sm text-gray-500">
              {currentStepInfo.instruction}
            </p>
          </div>

          {/* Step Content */}
          {currentStep === 'idle' && (
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
                      <div className={`font-semibold ${getVoiceTypeColor(savedVocalRange.voiceType)}`}>
                        {savedVocalRange.voiceType.charAt(0).toUpperCase() + savedVocalRange.voiceType.slice(1)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    You can retake the test to update your saved results.
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <button
                  onClick={startDetection}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                >
                  {savedVocalRange ? 'Retake Vocal Range Test' : 'Start Vocal Range Detection'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'permission' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600">Waiting for microphone permission...</p>
            </div>
          )}

          {(currentStep === 'lowest' || currentStep === 'highest') && (
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

              {/* Recording Controls */}
              <div className="text-center">
                {!isRecording ? (
                  <button
                    onClick={() => startRecording(currentStep as 'lowest' | 'highest')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Start Recording
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                      <span className="text-lg font-medium text-gray-700">
                        Recording... Hold your note steady
                      </span>
                    </div>
                    <button
                      onClick={() => stopRecording(currentStep as 'lowest' | 'highest')}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}
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

          {currentStep === 'processing' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating your vocal range...</p>
            </div>
          )}

          {currentStep === 'complete' && vocalRange && (
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
                  <div className={`text-lg font-semibold ${getVoiceTypeColor(vocalRange.voiceType)}`}>
                    {vocalRange.voiceType.charAt(0).toUpperCase() + vocalRange.voiceType.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getVoiceTypeDescription(vocalRange.voiceType)}
                  </div>
                </div>
              </div>

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