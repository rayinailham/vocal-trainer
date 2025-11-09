'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioProcessor, createAudioProcessor } from '@/lib/audio';
import { 
  frequencyToNote, 
  noteToFrequency, 
  isPitchInTolerance,
  calculateVocalRange 
} from '@/lib/pitch';
import { PitchDetectionResult } from '@/types/audio';

export default function TestAudioPage() {
  const [audioProcessor, setAudioProcessor] = useState<AudioProcessor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const recordedFrequencies = useRef<number[]>([]);

  useEffect(() => {
    // Initialize audio processor on component mount
    const processor = createAudioProcessor();
    setAudioProcessor(processor);
    
    return () => {
      processor.dispose();
    };
  }, []);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testMicrophoneAccess = async () => {
    if (!audioProcessor) {
      setError('Audio processor not initialized');
      return;
    }

    try {
      addTestResult('Testing microphone access...');
      const permission = await audioProcessor.initialize();
      
      if (permission.granted) {
        setIsInitialized(true);
        addTestResult(`✅ Microphone access granted. Device: ${permission.deviceLabel}`);
      } else {
        setError('Microphone access denied');
        addTestResult('❌ Microphone access denied');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addTestResult(`❌ Error: ${errorMessage}`);
    }
  };

  const startPitchDetection = () => {
    if (!audioProcessor || !isInitialized) {
      setError('Audio not initialized');
      return;
    }

    try {
      addTestResult('Starting pitch detection...');
      audioProcessor.startPitchDetection((result: PitchDetectionResult) => {
        setCurrentPitch(result);
        recordedFrequencies.current.push(result.frequency);
        
        // Log pitch detection results
        if (result.confidence > 0.7) {
          addTestResult(`🎵 Pitch: ${result.note}${result.octave} (${result.frequency.toFixed(2)}Hz, ${result.cents} cents, confidence: ${result.confidence.toFixed(2)})`);
        }
      });
      setIsRecording(true);
      addTestResult('✅ Pitch detection started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addTestResult(`❌ Error starting pitch detection: ${errorMessage}`);
    }
  };

  const stopPitchDetection = () => {
    if (!audioProcessor) {
      setError('Audio processor not initialized');
      return;
    }

    try {
      audioProcessor.stopPitchDetection();
      setIsRecording(false);
      addTestResult('⏹️ Pitch detection stopped');
      
      // Calculate vocal range if we have enough data
      if (recordedFrequencies.current.length > 5) {
        const vocalRange = calculateVocalRange(recordedFrequencies.current);
        addTestResult(`📊 Vocal Range: ${vocalRange.lowestNote} to ${vocalRange.highestNote} (${vocalRange.rangeInSemitones} semitones, voice type: ${vocalRange.voiceType})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addTestResult(`❌ Error stopping pitch detection: ${errorMessage}`);
    }
  };

  const testFrequencyConversion = () => {
    addTestResult('Testing frequency to note conversion...');
    
    // Test known frequencies
    const testFrequencies = [
      { freq: 440, expected: 'A4' },
      { freq: 261.63, expected: 'C4' },
      { freq: 523.25, expected: 'C5' },
      { freq: 349.23, expected: 'F4' }
    ];

    testFrequencies.forEach(({ freq, expected }) => {
      const result = frequencyToNote(freq);
      const actual = `${result.note}${result.octave}`;
      const isCorrect = actual === expected;
      addTestResult(`${isCorrect ? '✅' : '❌'} ${freq}Hz → ${actual} (expected: ${expected}, cents: ${result.cents})`);
    });

    // Test note to frequency conversion
    addTestResult('Testing note to frequency conversion...');
    const testNotes = ['A4', 'C4', 'C5', 'F4'];
    
    testNotes.forEach(note => {
      const noteInfo = note.match(/([A-G]#?)(\d)/);
      if (noteInfo) {
        const frequency = noteToFrequency(noteInfo[1], parseInt(noteInfo[2]));
        const backToNote = frequencyToNote(frequency);
        const actual = `${backToNote.note}${backToNote.octave}`;
        const isCorrect = actual === note;
        addTestResult(`${isCorrect ? '✅' : '❌'} ${note} → ${frequency.toFixed(2)}Hz → ${actual}`);
      }
    });

    // Test pitch tolerance
    addTestResult('Testing pitch tolerance...');
    const targetFreq = 440; // A4
    const testFreqs = [435, 445, 430, 450]; // Various frequencies around A4
    
    testFreqs.forEach(freq => {
      const isInTolerance = isPitchInTolerance(freq, 'A', 4, 50);
      const centsDiff = Math.round(1200 * Math.log2(freq / targetFreq));
      addTestResult(`${freq}Hz vs A4: ${isInTolerance ? '✅' : '❌'} In tolerance (cents: ${centsDiff})`);
    });
  };

  const clearResults = () => {
    setTestResults([]);
    recordedFrequencies.current = [];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Audio Utilities Test</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Current Pitch Display */}
        {currentPitch && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            <div className="text-lg font-semibold">
              Current Pitch: {currentPitch.note}{currentPitch.octave}
            </div>
            <div className="text-sm">
              Frequency: {currentPitch.frequency.toFixed(2)}Hz | 
              Cents: {currentPitch.cents} | 
              Confidence: {(currentPitch.confidence * 100).toFixed(1)}% |
              Accurate: {currentPitch.isAccurate ? '✅' : '❌'}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={testMicrophoneAccess}
            disabled={isInitialized}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            Test Microphone
          </button>
          
          <button
            onClick={startPitchDetection}
            disabled={!isInitialized || isRecording}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            Start Detection
          </button>
          
          <button
            onClick={stopPitchDetection}
            disabled={!isRecording}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            Stop Detection
          </button>
          
          <button
            onClick={testFrequencyConversion}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            Test Conversions
          </button>
        </div>

        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mb-6"
        >
          Clear Results
        </button>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Microphone Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isInitialized ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Recording Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{isRecording ? 'Recording' : 'Not Recording'}</span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click the buttons above to run tests.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}