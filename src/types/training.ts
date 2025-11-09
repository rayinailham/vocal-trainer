/**
 * Training-related type definitions for Vocal Trainer application
 */

export enum TrainingMode {
  SCALE = 'scale',
  ARPEGGIO = 'arpeggio',
  INTERVAL = 'interval',
  CHORD = 'chord',
  PITCH_MATCH = 'pitch_match',
  SUSTAIN = 'sustain'
}

export interface TrainingVariation {
  id: string;
  name: string;
  mode: TrainingMode;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  settings: {
    startNote?: string;
    endNote?: string;
    tempo?: number;
    direction?: 'up' | 'down' | 'both';
    interval?: number;
    pattern?: number[];
  };
}

export interface TrainingSession {
  id: string;
  userId?: string;
  variation: TrainingVariation;
  startTime: Date;
  endTime?: Date;
  scores: TrainingScore[];
  averageScore?: number;
  completed: boolean;
  notes: string[];
}

export interface TrainingScore {
  timestamp: number;
  targetNote: string;
  actualNote: string;
  frequency: number;
  accuracy: number;
  cents: number;
  duration: number;
}

export interface TrainingProgress {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  currentNote?: string;
  nextNote?: string;
  isRecording: boolean;
  timeRemaining?: number;
}

export interface TrainingSettings {
  tolerance: number; // in cents
  minDuration: number; // in milliseconds
  autoAdvance: boolean;
  showHints: boolean;
  playReference: boolean;
  volume: number;
}

export interface TrainingStats {
  totalSessions: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  timeSpent: number; // in minutes
  favoriteMode: TrainingMode;
  improvementRate: number; // percentage
}

export interface ExerciseNote {
  note: string;
  frequency: number;
  duration: number;
  isTarget: boolean;
}

export interface TrainingExercise {
  id: string;
  name: string;
  variation: TrainingVariation;
  notes: ExerciseNote[];
  settings: TrainingSettings;
}