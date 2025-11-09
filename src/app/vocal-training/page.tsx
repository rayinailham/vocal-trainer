'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioProcessor, createAudioProcessor } from '@/lib/audio';
import {
  noteToFrequency,
  frequencyToNote,
  isPitchInTolerance,
  calculateCentsDifference
} from '@/lib/pitch';
import { 
  TrainingMode, 
  TrainingVariation, 
  TrainingSession, 
  TrainingScore, 
  TrainingProgress,
  TrainingSettings,
  ExerciseNote
} from '@/types/training';
import { PitchDetectionResult } from '@/types/audio';
import AudioVisualizer from '@/components/AudioVisualizer';
import PitchMeter from '@/components/PitchMeter';
import ProgressIndicator from '@/components/ProgressIndicator';
import PianoKeyboard from '@/components/PianoKeyboard';

// Default training variations
const DEFAULT_TRAINING_VARIATIONS: TrainingVariation[] = [
  {
    id: 'scale-major-up',
    name: 'Major Scale Up',
    mode: TrainingMode.SCALE,
    description: 'Sing a major scale ascending',
    difficulty: 'beginner',
    settings: {
      startNote: 'C4',
      endNote: 'C5',
      tempo: 120,
      direction: 'up',
      pattern: [0, 2, 4, 5, 7, 9, 11, 12] // Major scale intervals
    }
  },
  {
    id: 'scale-major-down',
    name: 'Major Scale Down',
    mode: TrainingMode.SCALE,
    description: 'Sing a major scale descending',
    difficulty: 'beginner',
    settings: {
      startNote: 'C5',
      endNote: 'C4',
      tempo: 120,
      direction: 'down',
      pattern: [12, 11, 9, 7, 5, 4, 2, 0] // Major scale intervals descending
    }
  },
  {
    id: 'arpeggio-major',
    name: 'Major Arpeggio',
    mode: TrainingMode.ARPEGGIO,
    description: 'Sing a major arpeggio up and down',
    difficulty: 'intermediate',
    settings: {
      startNote: 'C4',
      endNote: 'C5',
      tempo: 100,
      direction: 'both',
      pattern: [0, 4, 7, 12, 7, 4, 0] // Major arpeggio
    }
  },
  {
    id: 'interval-third',
    name: 'Third Intervals',
    mode: TrainingMode.INTERVAL,
    description: 'Sing third intervals up and down',
    difficulty: 'intermediate',
    settings: {
      startNote: 'C4',
      endNote: 'C5',
      tempo: 80,
      direction: 'both',
      interval: 3
    }
  },
  {
    id: 'pitch-match',
    name: 'Pitch Matching',
    mode: TrainingMode.PITCH_MATCH,
    description: 'Match random pitches in your range',
    difficulty: 'beginner',
    settings: {
      startNote: 'C4',
      endNote: 'C5',
      tempo: 60
    }
  },
  {
    id: 'sustain',
    name: 'Note Sustain',
    mode: TrainingMode.SUSTAIN,
    description: 'Hold notes for steady pitch',
    difficulty: 'beginner',
    settings: {
      startNote: 'C4',
      endNote: 'C5',
      tempo: 60
    }
  }
];

// Default training settings
const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  tolerance: 50, // 50 cents tolerance
  minDuration: 1000, // 1 second minimum duration
  autoAdvance: true,
  showHints: true,
  playReference: false,
  volume: 0.7
};

type TrainingState = 'setup' | 'ready' | 'listening' | 'processing' | 'feedback' | 'complete';

export default function VocalTrainingPage() {
  const [audioProcessor, setAudioProcessor] = useState<AudioProcessor | null>(null);
  const [trainingState, setTrainingState] = useState<TrainingState>('setup');
  const [selectedVariation, setSelectedVariation] = useState<TrainingVariation | null>(null);
  const [rootNote, setRootNote] = useState<string>('C4');
  const [trainingSettings, setTrainingSettings] = useState<TrainingSettings>(DEFAULT_TRAINING_SETTINGS);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [currentProgress, setCurrentProgress] = useState<TrainingProgress | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState<ExerciseNote[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [scores, setScores] = useState<TrainingScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for timing and pitch tracking
  const noteStartTime = useRef<number>(0);
  const pitchHistory = useRef<number[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize audio processor on component mount
    const processor = createAudioProcessor();
    setAudioProcessor(processor);
    
    return () => {
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
      processor.dispose();
    };
  }, []);

  const initializeAudio = async () => {
    if (!audioProcessor) {
      setError('Audio processor not initialized');
      return false;
    }

    try {
      const permission = await audioProcessor.initialize();
      if (permission.granted) {
        setIsInitialized(true);
        setError(null);
        return true;
      } else {
        setError('Microphone access denied. Please allow microphone access to use this feature.');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  };

  const generateExerciseNotes = useCallback((variation: TrainingVariation, root: string): ExerciseNote[] => {
    const notes: ExerciseNote[] = [];
    
    switch (variation.mode) {
      case TrainingMode.SCALE:
        if (variation.settings.pattern) {
          const startFreq = noteToFrequency(root, 4);
          variation.settings.pattern.forEach((interval) => {
            const frequency = startFreq * Math.pow(2, interval / 12);
            const noteInfo = frequencyToNote(frequency);
            notes.push({
              note: `${noteInfo.note}${noteInfo.octave}`,
              frequency,
              duration: 2000, // 2 seconds per note
              isTarget: true
            });
          });
        }
        break;
        
      case TrainingMode.ARPEGGIO:
        if (variation.settings.pattern) {
          const startFreq = noteToFrequency(root, 4);
          variation.settings.pattern.forEach((interval) => {
            const frequency = startFreq * Math.pow(2, interval / 12);
            const noteInfo = frequencyToNote(frequency);
            notes.push({
              note: `${noteInfo.note}${noteInfo.octave}`,
              frequency,
              duration: 1500, // 1.5 seconds per note
              isTarget: true
            });
          });
        }
        break;
        
      case TrainingMode.INTERVAL:
        if (variation.settings.interval) {
          const startFreq = noteToFrequency(root, 4);
          const intervalFreq = startFreq * Math.pow(2, variation.settings.interval / 12);
          const startNoteInfo = frequencyToNote(startFreq);
          const intervalNoteInfo = frequencyToNote(intervalFreq);
          
          notes.push(
            {
              note: `${startNoteInfo.note}${startNoteInfo.octave}`,
              frequency: startFreq,
              duration: 1500,
              isTarget: true
            },
            {
              note: `${intervalNoteInfo.note}${intervalNoteInfo.octave}`,
              frequency: intervalFreq,
              duration: 1500,
              isTarget: true
            }
          );
        }
        break;
        
      case TrainingMode.PITCH_MATCH:
        // Generate random notes within the range
        const startFreq = noteToFrequency(root, 4);
        const endFreq = noteToFrequency(root, 5);
        const numNotes = 8;
        
        for (let i = 0; i < numNotes; i++) {
          const randomFreq = startFreq + Math.random() * (endFreq - startFreq);
          const noteInfo = frequencyToNote(randomFreq);
          notes.push({
            note: `${noteInfo.note}${noteInfo.octave}`,
            frequency: randomFreq,
            duration: 2000,
            isTarget: true
          });
        }
        break;
        
      case TrainingMode.SUSTAIN:
        // Create a series of notes to hold
        const sustainNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        sustainNotes.forEach(note => {
          const noteInfo = parseNoteString(note);
          const frequency = noteToFrequency(noteInfo.note, noteInfo.octave);
          notes.push({
            note,
            frequency,
            duration: 3000, // 3 seconds per note
            isTarget: true
          });
        });
        break;
        
      default:
        // Default to major scale
        const scaleFreq = noteToFrequency(root, 4);
        for (let i = 0; i < 8; i++) {
          const frequency = scaleFreq * Math.pow(2, i / 12);
          const noteInfo = frequencyToNote(frequency);
          notes.push({
            note: `${noteInfo.note}${noteInfo.octave}`,
            frequency,
            duration: 2000,
            isTarget: true
          });
        }
    }
    
    return notes;
  }, []);

  const parseNoteString = (noteString: string): { note: string; octave: number } => {
    const match = noteString.match(/^([A-G]#?)(\d+)$/);
    
    if (!match) {
      throw new Error(`Invalid note format: ${noteString}`);
    }
    
    return {
      note: match[1],
      octave: parseInt(match[2], 10)
    };
  };

  const startTraining = async () => {
    if (!selectedVariation) {
      setError('Please select a training variation');
      return;
    }

    if (!isInitialized) {
      const initialized = await initializeAudio();
      if (!initialized) return;
    }

    try {
      // Generate exercise notes
      const notes = generateExerciseNotes(selectedVariation, rootNote);
      setExerciseNotes(notes);
      setCurrentNoteIndex(0);
      setScores([]);

      // Create new training session
      const session: TrainingSession = {
        id: Date.now().toString(),
        variation: selectedVariation,
        startTime: new Date(),
        scores: [],
        completed: false,
        notes: notes.map(n => n.note)
      };
      setCurrentSession(session);

      // Set initial progress
      setCurrentProgress({
        sessionId: session.id,
        currentStep: 1,
        totalSteps: notes.length,
        currentNote: notes[0]?.note,
        nextNote: notes[1]?.note,
        isRecording: false
      });

      setTrainingState('ready');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const startListening = () => {
    if (!audioProcessor || !exerciseNotes.length) {
      setError('Cannot start listening');
      return;
    }

    const currentNote = exerciseNotes[currentNoteIndex];
    if (!currentNote) return;

    try {
      // Reset pitch tracking
      pitchHistory.current = [];
      noteStartTime.current = Date.now();

      // Start pitch detection
      audioProcessor.startPitchDetection((result: PitchDetectionResult) => {
        setCurrentPitch(result);
        
        if (result.confidence > 0.7) {
          pitchHistory.current.push(result.frequency);
          
          // Check if pitch is within tolerance
          const targetNoteInfo = parseNoteString(currentNote.note);
          const isAccurate = isPitchInTolerance(
            result.frequency,
            targetNoteInfo.note,
            targetNoteInfo.octave,
            trainingSettings.tolerance
          );

          // Auto-advance if pitch is held for minimum duration
          if (isAccurate && trainingSettings.autoAdvance) {
            const duration = Date.now() - noteStartTime.current;
            if (duration >= trainingSettings.minDuration) {
              stopListening();
            }
          }
        }
      });

      // Update progress
      setCurrentProgress(prev => prev ? {
        ...prev,
        isRecording: true
      } : null);

      setTrainingState('listening');

      // Auto-stop after maximum duration
      recordingTimer.current = setTimeout(() => {
        stopListening();
      }, currentNote.duration + 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const stopListening = () => {
    if (!audioProcessor || !currentSession || !exerciseNotes.length) {
      setError('Cannot stop listening');
      return;
    }

    try {
      audioProcessor.stopPitchDetection();
      
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Calculate score for current note
      const currentNote = exerciseNotes[currentNoteIndex];
      const targetNoteInfo = parseNoteString(currentNote.note);
      
      let accuracy = 0;
      let cents = 0;
      let frequency = 0;
      
      if (pitchHistory.current.length > 0) {
        // Calculate average frequency
        frequency = pitchHistory.current.reduce((sum, freq) => sum + freq, 0) / pitchHistory.current.length;
        
        // Calculate cents difference
        const targetFrequency = noteToFrequency(targetNoteInfo.note, targetNoteInfo.octave);
        cents = calculateCentsDifference(targetFrequency, frequency);
        
        // Calculate accuracy based on cents difference
        accuracy = Math.max(0, 100 - Math.abs(cents));
      }

      const score: TrainingScore = {
        timestamp: Date.now(),
        targetNote: currentNote.note,
        actualNote: frequency > 0 ? frequencyToNote(frequency).note + frequencyToNote(frequency).octave : 'N/A',
        frequency,
        accuracy,
        cents,
        duration: Date.now() - noteStartTime.current
      };

      const newScores = [...scores, score];
      setScores(newScores);

      // Update session
      const updatedSession = {
        ...currentSession,
        scores: newScores,
        averageScore: newScores.reduce((sum, s) => sum + s.accuracy, 0) / newScores.length
      };
      setCurrentSession(updatedSession);

      // Update progress
      const nextIndex = currentNoteIndex + 1;
      const isComplete = nextIndex >= exerciseNotes.length;
      
      setCurrentProgress({
        sessionId: currentSession.id,
        currentStep: nextIndex + 1,
        totalSteps: exerciseNotes.length,
        currentNote: exerciseNotes[nextIndex]?.note,
        nextNote: exerciseNotes[nextIndex + 1]?.note,
        isRecording: false
      });

      if (isComplete) {
        // Complete the session
        const completedSession = {
          ...updatedSession,
          endTime: new Date(),
          completed: true
        };
        setCurrentSession(completedSession);
        setTrainingState('complete');
      } else {
        setCurrentNoteIndex(nextIndex);
        setTrainingState('feedback');
        
        // Auto-advance to next note after feedback
        setTimeout(() => {
          setTrainingState('ready');
        }, 2000);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const resetTraining = () => {
    setTrainingState('setup');
    setSelectedVariation(null);
    setCurrentSession(null);
    setCurrentProgress(null);
    setExerciseNotes([]);
    setCurrentNoteIndex(0);
    setScores([]);
    setCurrentPitch(null);
    setError(null);
    pitchHistory.current = [];
  };

  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 75) return 'text-yellow-600';
    if (accuracy >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (accuracy: number) => {
    if (accuracy >= 90) return '🎯';
    if (accuracy >= 75) return '👍';
    if (accuracy >= 60) return '😐';
    return '😅';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vocal Training</h1>
          <p className="text-lg text-gray-600">Improve your pitch accuracy and vocal control</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Setup State */}
        {trainingState === 'setup' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Training Setup</h2>
            
            {/* Training Variation Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Training Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEFAULT_TRAINING_VARIATIONS.map((variation) => (
                  <div
                    key={variation.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedVariation?.id === variation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedVariation(variation)}
                  >
                    <h3 className="font-semibold text-gray-900">{variation.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{variation.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      variation.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      variation.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {variation.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Note Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Root Note
              </label>
              <select
                value={rootNote}
                onChange={(e) => setRootNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                  <option key={note} value={`${note}4`}>{note}4</option>
                ))}
              </select>
            </div>

            {/* Training Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Training Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoAdvance"
                    checked={trainingSettings.autoAdvance}
                    onChange={(e) => setTrainingSettings({
                      ...trainingSettings,
                      autoAdvance: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <label htmlFor="autoAdvance" className="text-sm text-gray-700">
                    Auto-advance when pitch is accurate
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showHints"
                    checked={trainingSettings.showHints}
                    onChange={(e) => setTrainingSettings({
                      ...trainingSettings,
                      showHints: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <label htmlFor="showHints" className="text-sm text-gray-700">
                    Show hints and feedback
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Tolerance: {trainingSettings.tolerance} cents
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={trainingSettings.tolerance}
                    onChange={(e) => setTrainingSettings({
                      ...trainingSettings,
                      tolerance: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={startTraining}
                disabled={!selectedVariation}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Start Training
              </button>
            </div>
          </div>
        )}

        {/* Ready State */}
        {trainingState === 'ready' && currentProgress && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Get Ready to Sing
              </h2>
              <p className="text-gray-600">
                Note {currentProgress.currentStep} of {currentProgress.totalSteps}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6">
              <ProgressIndicator
                currentStep={currentProgress.currentStep}
                totalSteps={currentProgress.totalSteps}
                currentLabel={`Note ${currentProgress.currentNote}`}
                variant="steps"
                size="large"
              />
            </div>

            {/* Current Note Display */}
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-blue-800 mb-2">
                {currentProgress.currentNote}
              </div>
              {trainingSettings.showHints && (
                <p className="text-gray-600">
                  Take a breath and sing this note clearly
                </p>
              )}
            </div>

            {/* Piano Keyboard */}
            <div className="mb-6">
              <PianoKeyboard
                startOctave={3}
                endOctave={5}
                highlightedNotes={[currentProgress.currentNote || '']}
              />
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={startListening}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <div className="w-3 h-3 bg-white rounded-full" />
                Start Recording
              </button>
            </div>
          </div>
        )}

        {/* Listening State */}
        {trainingState === 'listening' && currentProgress && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Recording...
              </h2>
              <p className="text-gray-600">
                Sing: {currentProgress.currentNote}
              </p>
            </div>

            {/* Audio Visualizer */}
            <div className="mb-6">
              <AudioVisualizer
                width={700}
                height={200}
                currentPitch={currentPitch}
                isRecording={true}
                className="w-full"
              />
            </div>

            {/* Pitch Meter */}
            <div className="mb-6">
              <PitchMeter
                currentPitch={currentPitch}
                targetNote={currentProgress.currentNote}
                showCents={true}
                showFrequency={true}
              />
            </div>

            {/* Current Pitch Display */}
            {currentPitch && currentPitch.confidence > 0.7 && (
              <div className="text-center mb-6">
                <div className={`text-4xl font-mono font-bold ${
                  isPitchInTolerance(
                    currentPitch.frequency,
                    parseNoteString(currentProgress.currentNote || '').note,
                    parseNoteString(currentProgress.currentNote || '').octave,
                    trainingSettings.tolerance
                  ) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentPitch.note}{currentPitch.octave}
                </div>
                <div className="text-sm text-gray-600">
                  {currentPitch.frequency.toFixed(1)} Hz
                </div>
              </div>
            )}

            {/* Stop Button */}
            <div className="text-center">
              <button
                onClick={stopListening}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Stop Recording
              </button>
            </div>
          </div>
        )}

        {/* Feedback State */}
        {trainingState === 'feedback' && scores.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Feedback
              </h2>
            </div>

            {/* Last Score */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">
                {getScoreEmoji(scores[scores.length - 1].accuracy)}
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(scores[scores.length - 1].accuracy)}`}>
                {scores[scores.length - 1].accuracy.toFixed(1)}%
              </div>
              <div className="text-gray-600">
                Target: {scores[scores.length - 1].targetNote} | 
                Sung: {scores[scores.length - 1].actualNote}
              </div>
              <div className="text-sm text-gray-500">
                {scores[scores.length - 1].cents > 0 ? '+' : ''}{scores[scores.length - 1].cents} cents
              </div>
            </div>

            {/* Progress */}
            {currentProgress && (
              <div className="text-center">
                <p className="text-gray-600">
                  Preparing next note...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete State */}
        {trainingState === 'complete' && currentSession && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Training Complete!
              </h2>
              <p className="text-gray-600">
                Great job on completing the {currentSession.variation.name} exercise
              </p>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">
                {getScoreEmoji(currentSession.averageScore || 0)}
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(currentSession.averageScore || 0)}`}>
                {(currentSession.averageScore || 0).toFixed(1)}%
              </div>
              <div className="text-gray-600">
                Average Score
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                {currentSession.scores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{score.targetNote}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-mono text-sm">{score.actualNote}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${getScoreColor(score.accuracy)}`}>
                        {score.accuracy.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500">
                        {score.cents > 0 ? '+' : ''}{score.cents}¢
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetTraining}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                New Training
              </button>
              <button
                onClick={() => {
                  // Retry same training
                  setCurrentNoteIndex(0);
                  setScores([]);
                  setTrainingState('ready');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}