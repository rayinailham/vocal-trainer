/**
 * Storage utilities for Vocal Trainer application
 * Handles local storage of user data, settings, and training sessions
 */

import { VocalRange, AudioSettings } from '@/types/audio';
import { TrainingSession, TrainingSettings, TrainingStats, TrainingMode } from '@/types/training';

// Storage keys
const STORAGE_KEYS = {
  VOCAL_RANGE: 'vocal-trainer-vocal-range',
  TRAINING_SESSIONS: 'vocal-trainer-training-sessions',
  TRAINING_SETTINGS: 'vocal-trainer-training-settings',
  AUDIO_SETTINGS: 'vocal-trainer-audio-settings',
  TRAINING_STATS: 'vocal-trainer-training-stats',
  USER_PREFERENCES: 'vocal-trainer-user-preferences',
} as const;

// Error handling for storage operations
class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generic function to save data to localStorage
 */
function saveToStorage<T>(key: string, data: T): void {
  if (!isLocalStorageAvailable()) {
    throw new StorageError('localStorage is not available');
  }

  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError('Storage quota exceeded. Please clear some data.', error);
    }
    throw new StorageError(`Failed to save data to storage: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Generic function to load data from localStorage
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.warn(`Failed to load data from storage for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 */
function removeFromStorage(key: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove data from storage for key ${key}:`, error);
  }
}

/**
 * Vocal Range Storage Functions
 */
export function saveVocalRange(vocalRange: VocalRange): void {
  try {
    saveToStorage(STORAGE_KEYS.VOCAL_RANGE, vocalRange);
  } catch (error) {
    console.error('Failed to save vocal range:', error);
    throw error;
  }
}

export function loadVocalRange(): VocalRange | null {
  return loadFromStorage<VocalRange | null>(STORAGE_KEYS.VOCAL_RANGE, null);
}

/**
 * Training Sessions Storage Functions
 */
export function saveTrainingSession(session: TrainingSession): void {
  try {
    const sessions = loadTrainingSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    // Keep only the last 100 sessions to prevent storage issues
    if (sessions.length > 100) {
      sessions.splice(0, sessions.length - 100);
    }
    
    saveToStorage(STORAGE_KEYS.TRAINING_SESSIONS, sessions);
  } catch (error) {
    console.error('Failed to save training session:', error);
    throw error;
  }
}

export function loadTrainingSessions(): TrainingSession[] {
  return loadFromStorage<TrainingSession[]>(STORAGE_KEYS.TRAINING_SESSIONS, []);
}

export function getTrainingSessionById(sessionId: string): TrainingSession | null {
  const sessions = loadTrainingSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

export function deleteTrainingSession(sessionId: string): void {
  try {
    const sessions = loadTrainingSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    saveToStorage(STORAGE_KEYS.TRAINING_SESSIONS, filteredSessions);
  } catch (error) {
    console.error('Failed to delete training session:', error);
    throw error;
  }
}

/**
 * Training Settings Storage Functions
 */
export function saveTrainingSettings(settings: TrainingSettings): void {
  try {
    saveToStorage(STORAGE_KEYS.TRAINING_SETTINGS, settings);
  } catch (error) {
    console.error('Failed to save training settings:', error);
    throw error;
  }
}

export function loadTrainingSettings(): TrainingSettings {
  const defaultSettings: TrainingSettings = {
    tolerance: 50, // 50 cents tolerance
    minDuration: 500, // 500ms minimum duration
    autoAdvance: true,
    showHints: true,
    playReference: true,
    volume: 0.7,
  };
  
  return loadFromStorage(STORAGE_KEYS.TRAINING_SETTINGS, defaultSettings);
}

/**
 * Audio Settings Storage Functions
 */
export function saveAudioSettings(settings: AudioSettings): void {
  try {
    saveToStorage(STORAGE_KEYS.AUDIO_SETTINGS, settings);
  } catch (error) {
    console.error('Failed to save audio settings:', error);
    throw error;
  }
}

export function loadAudioSettings(): AudioSettings {
  const defaultSettings: AudioSettings = {
    sampleRate: 44100,
    bufferSize: 2048,
    autoGainControl: true,
    noiseSuppression: true,
    echoCancellation: true,
  };
  
  return loadFromStorage(STORAGE_KEYS.AUDIO_SETTINGS, defaultSettings);
}

/**
 * Training Statistics Storage Functions
 */
export function saveTrainingStats(stats: TrainingStats): void {
  try {
    saveToStorage(STORAGE_KEYS.TRAINING_STATS, stats);
  } catch (error) {
    console.error('Failed to save training stats:', error);
    throw error;
  }
}

export function loadTrainingStats(): TrainingStats {
  const defaultStats: TrainingStats = {
    totalSessions: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 100,
    timeSpent: 0,
    favoriteMode: 'scale' as TrainingMode.SCALE, // Default to scale mode
    improvementRate: 0,
  };
  
  return loadFromStorage(STORAGE_KEYS.TRAINING_STATS, defaultStats);
}

/**
 * Update training statistics based on a completed session
 */
export function updateTrainingStats(session: TrainingSession): void {
  try {
    const currentStats = loadTrainingStats();
    const sessionScore = session.averageScore || 0;
    const sessionDuration = session.endTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60) // Convert to minutes
      : 0;
    
    const newStats: TrainingStats = {
      totalSessions: currentStats.totalSessions + 1,
      totalScore: currentStats.totalScore + sessionScore,
      averageScore: (currentStats.totalScore + sessionScore) / (currentStats.totalSessions + 1),
      bestScore: Math.max(currentStats.bestScore, sessionScore),
      worstScore: Math.min(currentStats.worstScore, sessionScore),
      timeSpent: currentStats.timeSpent + sessionDuration,
      favoriteMode: session.variation.mode,
      improvementRate: calculateImprovementRate(currentStats, sessionScore),
    };
    
    saveTrainingStats(newStats);
  } catch (error) {
    console.error('Failed to update training stats:', error);
    throw error;
  }
}

/**
 * Calculate improvement rate based on recent sessions
 */
function calculateImprovementRate(currentStats: TrainingStats, newScore: number): number {
  try {
    const sessions = loadTrainingSessions();
    if (sessions.length < 2) return 0;
    
    // Get the last 5 completed sessions before this one
    const recentSessions = sessions
      .filter(s => s.completed && s.averageScore !== undefined)
      .slice(-5);
    
    if (recentSessions.length === 0) return 0;
    
    const recentAverage = recentSessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / recentSessions.length;
    const improvement = ((newScore - recentAverage) / recentAverage) * 100;
    
    return Math.round(improvement * 100) / 100; // Round to 2 decimal places
  } catch {
    return 0;
  }
}

/**
 * User Preferences Storage Functions
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'id';
  notifications: boolean;
  autoSave: boolean;
  showTips: boolean;
}

export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const currentPreferences = loadUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    saveToStorage(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
}

export function loadUserPreferences(): UserPreferences {
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    language: 'en',
    notifications: true,
    autoSave: true,
    showTips: true,
  };
  
  return loadFromStorage(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
}

/**
 * Data Cleanup Utilities
 */
export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      removeFromStorage(key);
    });
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
}

export function clearTrainingData(): void {
  try {
    removeFromStorage(STORAGE_KEYS.TRAINING_SESSIONS);
    removeFromStorage(STORAGE_KEYS.TRAINING_STATS);
  } catch (error) {
    console.error('Failed to clear training data:', error);
    throw error;
  }
}

export function getStorageUsage(): { used: number; available: number; percentage: number } {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0, percentage: 0 };
  }

  try {
    let used = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length;
      }
    });

    // Estimate available space (localStorage typically has 5-10MB limit)
    const estimated = 5 * 1024 * 1024; // 5MB
    const available = Math.max(0, estimated - used);
    const percentage = (used / estimated) * 100;

    return { used, available, percentage };
  } catch {
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Export data for backup
 */
export function exportData(): string {
  try {
    const data: Record<string, unknown> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      if (value) {
        data[name] = JSON.parse(value);
      }
    });
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new StorageError('Failed to export data', error instanceof Error ? error : undefined);
  }
}

/**
 * Import data from backup
 */
export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData);
    Object.entries(data).forEach(([name, value]) => {
      const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
      if (key) {
        saveToStorage(key, value);
      }
    });
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new StorageError('Failed to import data', error instanceof Error ? error : undefined);
  }
}