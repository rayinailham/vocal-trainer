import { VocalRange } from '@/types/audio';

/**
 * Musical note frequencies (in Hz) for the 4th octave
 * These are the standard equal-tempered frequencies
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88
};

/**
 * All note names in order
 */
export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert frequency to the closest musical note
 * @param frequency The frequency in Hz
 * @returns Object containing note name, octave, and cents deviation
 */
export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  if (frequency <= 0) {
    return { note: 'A', octave: 4, cents: 0 };
  }

  // A4 = 440Hz is the reference
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 is 4.75 octaves below A4
  
  // Calculate note number and cents
  const noteNum = 12 * Math.log2(frequency / C0);
  const roundedNoteNum = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNoteNum) * 100);
  
  // Convert to note name and octave
  const noteNames = ALL_NOTES;
  const octave = Math.floor(roundedNoteNum / 12);
  const noteIndex = roundedNoteNum % 12;
  const note = noteNames[noteIndex];

  return { note, octave, cents };
}

/**
 * Convert musical note and octave to frequency
 * @param note The note name (e.g., 'C', 'A#')
 * @param octave The octave number (e.g., 4)
 * @returns The frequency in Hz
 */
export function noteToFrequency(note: string, octave: number): number {
  const noteName = note.toUpperCase();
  const baseFrequency = NOTE_FREQUENCIES[noteName];
  
  if (!baseFrequency) {
    throw new Error(`Invalid note: ${note}`);
  }

  // Calculate frequency based on octave difference from 4th octave
  const octaveDiff = octave - 4;
  return baseFrequency * Math.pow(2, octaveDiff);
}

/**
 * Check if a pitch is within tolerance of a target note
 * @param frequency The detected frequency in Hz
 * @param targetNote The target note name (e.g., 'C', 'A#')
 * @param targetOctave The target octave
 * @param toleranceCents Tolerance in cents (default: 50 cents)
 * @returns True if the pitch is within tolerance
 */
export function isPitchInTolerance(
  frequency: number,
  targetNote: string,
  targetOctave: number,
  toleranceCents: number = 50
): boolean {
  const targetFrequency = noteToFrequency(targetNote, targetOctave);
  
  // Calculate cents difference between detected frequency and target
  const frequencyRatio = frequency / targetFrequency;
  const centsDiff = Math.round(1200 * Math.log2(frequencyRatio));
  
  return Math.abs(centsDiff) <= toleranceCents;
}

/**
 * Calculate the cents difference between two frequencies
 * @param frequency1 First frequency in Hz
 * @param frequency2 Second frequency in Hz
 * @returns Cents difference (positive if frequency2 is higher)
 */
export function calculateCentsDifference(frequency1: number, frequency2: number): number {
  if (frequency1 <= 0 || frequency2 <= 0) {
    return 0;
  }
  
  return Math.round(1200 * Math.log2(frequency2 / frequency1));
}

/**
 * Calculate vocal range from a series of frequency measurements
 * @param frequencies Array of frequency measurements in Hz
 * @returns VocalRange object with calculated range
 */
export function calculateVocalRange(frequencies: number[]): VocalRange {
  if (frequencies.length === 0) {
    return {
      lowestNote: 'C4',
      highestNote: 'C4',
      lowestFrequency: 261.63,
      highestFrequency: 261.63,
      rangeInSemitones: 0,
      voiceType: 'unknown'
    };
  }

  // Filter out invalid frequencies
  const validFrequencies = frequencies.filter(f => f > 0);
  
  if (validFrequencies.length === 0) {
    return {
      lowestNote: 'C4',
      highestNote: 'C4',
      lowestFrequency: 261.63,
      highestFrequency: 261.63,
      rangeInSemitones: 0,
      voiceType: 'unknown'
    };
  }

  // Find min and max frequencies
  const lowestFrequency = Math.min(...validFrequencies);
  const highestFrequency = Math.max(...validFrequencies);

  // Convert to notes
  const lowestNoteInfo = frequencyToNote(lowestFrequency);
  const highestNoteInfo = frequencyToNote(highestFrequency);

  // Calculate range in semitones
  const rangeInSemitones = Math.round(12 * Math.log2(highestFrequency / lowestFrequency));

  // Determine voice type based on range
  const voiceType = determineVoiceType(lowestFrequency, highestFrequency);

  return {
    lowestNote: `${lowestNoteInfo.note}${lowestNoteInfo.octave}`,
    highestNote: `${highestNoteInfo.note}${highestNoteInfo.octave}`,
    lowestFrequency,
    highestFrequency,
    rangeInSemitones,
    voiceType
  };
}

/**
 * Determine voice type based on frequency range
 * @param lowestFrequency Lowest frequency in Hz
 * @param highestFrequency Highest frequency in Hz
 * @returns Voice type classification
 */
function determineVoiceType(lowestFrequency: number, highestFrequency: number): VocalRange['voiceType'] {
  // Typical voice ranges (approximate):
  // Soprano: C4-C6 (261-1047 Hz)
  // Mezzo-soprano: A3-A5 (220-880 Hz)
  // Alto: F3-F5 (175-698 Hz)
  // Tenor: C3-C5 (131-523 Hz)
  // Baritone: G2-G4 (98-392 Hz)
  // Bass: E2-E4 (82-330 Hz)

  if (lowestFrequency >= 250 && highestFrequency >= 1000) {
    return 'soprano';
  } else if (lowestFrequency >= 200 && highestFrequency >= 850) {
    return 'mezzo-soprano';
  } else if (lowestFrequency >= 170 && highestFrequency >= 650) {
    return 'alto';
  } else if (lowestFrequency >= 120 && highestFrequency >= 500) {
    return 'tenor';
  } else if (lowestFrequency >= 90 && highestFrequency >= 380) {
    return 'baritone';
  } else if (lowestFrequency >= 80 && highestFrequency >= 320) {
    return 'bass';
  }

  return 'unknown';
}

/**
 * Generate a sequence of notes for training exercises
 * @param startNote Starting note (e.g., 'C4')
 * @param endNote Ending note (e.g., 'C5')
 * @param step Interval in semitones (default: 1 for chromatic, 2 for whole tones)
 * @returns Array of note frequencies
 */
export function generateNoteSequence(
  startNote: string,
  endNote: string,
  step: number = 1
): number[] {
  const startNoteInfo = parseNoteString(startNote);
  const endNoteInfo = parseNoteString(endNote);
  
  const startFrequency = noteToFrequency(startNoteInfo.note, startNoteInfo.octave);
  const endFrequency = noteToFrequency(endNoteInfo.note, endNoteInfo.octave);
  
  const startSemitones = Math.round(12 * Math.log2(startFrequency / 261.63) + 48); // Relative to C4
  const endSemitones = Math.round(12 * Math.log2(endFrequency / 261.63) + 48);
  
  const sequence: number[] = [];
  const direction = startSemitones <= endSemitones ? 1 : -1;
  
  for (let i = startSemitones; direction * i <= direction * endSemitones; i += step * direction) {
    const frequency = 261.63 * Math.pow(2, (i - 48) / 12);
    sequence.push(frequency);
  }
  
  return sequence;
}

/**
 * Parse a note string into note name and octave
 * @param noteString Note string (e.g., 'C#4', 'A5')
 * @returns Object with note name and octave
 */
function parseNoteString(noteString: string): { note: string; octave: number } {
  const match = noteString.match(/^([A-G]#?)(\d+)$/);
  
  if (!match) {
    throw new Error(`Invalid note format: ${noteString}`);
  }
  
  return {
    note: match[1],
    octave: parseInt(match[2], 10)
  };
}

/**
 * Get the next note in the chromatic scale
 * @param note Current note (e.g., 'C4')
 * @param semitones Number of semitones to move up (positive) or down (negative)
 * @returns Next note string
 */
export function getNextNote(note: string, semitones: number): string {
  const noteInfo = parseNoteString(note);
  const frequency = noteToFrequency(noteInfo.note, noteInfo.octave);
  const nextFrequency = frequency * Math.pow(2, semitones / 12);
  const nextNoteInfo = frequencyToNote(nextFrequency);
  
  return `${nextNoteInfo.note}${nextNoteInfo.octave}`;
}

/**
 * Check if two notes are the same (ignoring octave)
 * @param note1 First note
 * @param note2 Second note
 * @returns True if notes are the same pitch class
 */
export function isSameNoteClass(note1: string, note2: string): boolean {
  const note1Info = parseNoteString(note1);
  const note2Info = parseNoteString(note2);
  
  return note1Info.note === note2Info.note;
}

/**
 * Calculate the interval between two notes in semitones
 * @param note1 First note
 * @param note2 Second note
 * @returns Number of semitones between the notes
 */
export function calculateInterval(note1: string, note2: string): number {
  const note1Info = parseNoteString(note1);
  const note2Info = parseNoteString(note2);
  
  const frequency1 = noteToFrequency(note1Info.note, note1Info.octave);
  const frequency2 = noteToFrequency(note2Info.note, note2Info.octave);
  
  return Math.round(12 * Math.log2(frequency2 / frequency1));
}

/**
 * Calculate optimal root note based on vocal range
 * Implements frequency analysis, musical theory, range validation, and octave normalization
 * @param vocalRange User's vocal range data
 * @returns Optimal root note string (e.g., 'C4')
 */
export function calculateOptimalRootNote(vocalRange: VocalRange): string {
  if (!vocalRange || !vocalRange.lowestFrequency || !vocalRange.highestFrequency) {
    return 'C4'; // Default fallback
  }

  // 1. Frequency Analysis: Find the midpoint of the vocal range
  const lowestFreq = vocalRange.lowestFrequency;
  const highestFreq = vocalRange.highestFrequency;
  const middleFreq = (lowestFreq + highestFreq) / 2;

  // 2. Musical Theory: Convert frequency to note (for reference)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const noteInfo = frequencyToNote(middleFreq);
  
  // 3. Range Validation: Ensure the note is in a comfortable vocal range
  // We'll adjust the note to be in the middle 60% of the user's range for comfort
  const comfortableLow = lowestFreq + (highestFreq - lowestFreq) * 0.2;
  const comfortableHigh = lowestFreq + (highestFreq - lowestFreq) * 0.8;
  
  let adjustedFreq = middleFreq;
  
  // If the middle frequency is outside the comfortable range, adjust it
  if (middleFreq < comfortableLow) {
    adjustedFreq = comfortableLow;
  } else if (middleFreq > comfortableHigh) {
    adjustedFreq = comfortableHigh;
  }
  
  // Get the adjusted note
  const adjustedNoteInfo = frequencyToNote(adjustedFreq);
  
  // 4. Octave Normalization: Ensure the note is in octave 3-5 for optimal vocal training
  let finalNote = `${adjustedNoteInfo.note}${adjustedNoteInfo.octave}`;
  
  // If the octave is outside the optimal range (3-5), adjust it
  if (adjustedNoteInfo.octave < 3) {
    // Move up to octave 3
    const octaveDiff = 3 - adjustedNoteInfo.octave;
    const normalizedFreq = adjustedFreq * Math.pow(2, octaveDiff);
    const normalizedNoteInfo = frequencyToNote(normalizedFreq);
    finalNote = `${normalizedNoteInfo.note}${normalizedNoteInfo.octave}`;
  } else if (adjustedNoteInfo.octave > 5) {
    // Move down to octave 5
    const octaveDiff = adjustedNoteInfo.octave - 5;
    const normalizedFreq = adjustedFreq / Math.pow(2, octaveDiff);
    const normalizedNoteInfo = frequencyToNote(normalizedFreq);
    finalNote = `${normalizedNoteInfo.note}${normalizedNoteInfo.octave}`;
  }
  
  // Final validation: ensure the note is still within the user's actual range
  const finalNoteInfo = parseNoteString(finalNote);
  const finalFreq = noteToFrequency(finalNoteInfo.note, finalNoteInfo.octave);
  
  // If the normalized note is outside the user's range, find the closest note within range
  if (finalFreq < lowestFreq) {
    // Find the closest note at or above the lowest frequency
    const closestNoteInfo = frequencyToNote(lowestFreq);
    finalNote = `${closestNoteInfo.note}${closestNoteInfo.octave}`;
  } else if (finalFreq > highestFreq) {
    // Find the closest note at or below the highest frequency
    const closestNoteInfo = frequencyToNote(highestFreq);
    finalNote = `${closestNoteInfo.note}${closestNoteInfo.octave}`;
  }
  
  return finalNote;
}

/**
 * Get the middle note of a vocal range (legacy function for backward compatibility)
 * @deprecated Use calculateOptimalRootNote instead for better optimization
 * @param vocalRange User's vocal range data
 * @returns Middle note string
 */
export function getMiddleNote(vocalRange: VocalRange): string | null {
  if (!vocalRange || !vocalRange.lowestNote || !vocalRange.highestNote) {
    return null;
  }
  
  // Simple logic to get a note in the middle of the range
  const lowestFreq = vocalRange.lowestFrequency;
  const highestFreq = vocalRange.highestFrequency;
  const middleFreq = (lowestFreq + highestFreq) / 2;
  const noteInfo = frequencyToNote(middleFreq);
  
  return `${noteInfo.note}${noteInfo.octave}`;
}