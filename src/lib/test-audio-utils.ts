/**
 * Test script for audio utilities functionality
 * This can be run in a Node.js environment to test the core functions
 */

import {
  frequencyToNote,
  noteToFrequency,
  isPitchInTolerance,
  calculateVocalRange,
  generateNoteSequence,
  calculateInterval
} from './pitch';

// Test frequency to note conversion
function testFrequencyToNote() {
  console.log('Testing frequency to note conversion...');
  
  const testCases = [
    { freq: 440, expected: 'A4' },
    { freq: 261.63, expected: 'C4' },
    { freq: 523.25, expected: 'C5' },
    { freq: 349.23, expected: 'F4' },
    { freq: 880, expected: 'A5' }
  ];

  let passed = 0;
  testCases.forEach(({ freq, expected }) => {
    const result = frequencyToNote(freq);
    const actual = `${result.note}${result.octave}`;
    const isCorrect = actual === expected;
    console.log(`${isCorrect ? '✅' : '❌'} ${freq}Hz → ${actual} (expected: ${expected}, cents: ${result.cents})`);
    if (isCorrect) passed++;
  });

  console.log(`Frequency to note conversion: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

// Test note to frequency conversion
function testNoteToFrequency() {
  console.log('Testing note to frequency conversion...');
  
  const testCases = [
    { note: 'A4', expected: 440 },
    { note: 'C4', expected: 261.63 },
    { note: 'C5', expected: 523.25 },
    { note: 'F4', expected: 349.23 }
  ];

  let passed = 0;
  testCases.forEach(({ note: expectedNote }) => {
    const noteInfo = expectedNote.match(/([A-G]#?)(\d)/);
    if (noteInfo) {
      const frequency = noteToFrequency(noteInfo[1], parseInt(noteInfo[2]));
      const backToNote = frequencyToNote(frequency);
      const actual = `${backToNote.note}${backToNote.octave}`;
      const isCorrect = actual === expectedNote;
      console.log(`${isCorrect ? '✅' : '❌'} ${expectedNote} → ${frequency.toFixed(2)}Hz → ${actual}`);
      if (isCorrect) passed++;
    }
  });

  console.log(`Note to frequency conversion: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

// Test pitch tolerance
function testPitchTolerance() {
  console.log('Testing pitch tolerance...');
  
  const testFreqs = [
    { freq: 435, expected: true },  // -20 cents
    { freq: 445, expected: true },  // +20 cents
    { freq: 430, expected: false }, // -60 cents
    { freq: 450, expected: false }  // +60 cents
  ];
  
  let passed = 0;
  testFreqs.forEach(({ freq, expected }) => {
    const isInTolerance = isPitchInTolerance(freq, 'A', 4, 50);
    const isCorrect = isInTolerance === expected;
    console.log(`${isCorrect ? '✅' : '❌'} ${freq}Hz vs A4: ${isInTolerance ? 'In tolerance' : 'Out of tolerance'} (expected: ${expected ? 'In' : 'Out of'} tolerance)`);
    if (isCorrect) passed++;
  });

  console.log(`Pitch tolerance: ${passed}/${testFreqs.length} tests passed\n`);
  return passed === testFreqs.length;
}

// Test vocal range calculation
function testVocalRange() {
  console.log('Testing vocal range calculation...');
  
  const testFrequencies = [
    130,  // C3
    165,  // E3
    220,  // A3
    330,  // E4
    440,  // A4
    550,  // C#5
    660,  // E5
    880   // A5
  ];

  const vocalRange = calculateVocalRange(testFrequencies);
  console.log(`Vocal range: ${vocalRange.lowestNote} to ${vocalRange.highestNote}`);
  console.log(`Frequency range: ${vocalRange.lowestFrequency.toFixed(2)}Hz to ${vocalRange.highestFrequency.toFixed(2)}Hz`);
  console.log(`Range in semitones: ${vocalRange.rangeInSemitones}`);
  console.log(`Voice type: ${vocalRange.voiceType}`);
  
  const hasValidRange = vocalRange.lowestFrequency < vocalRange.highestFrequency && 
                      vocalRange.rangeInSemitones > 0;
  console.log(`${hasValidRange ? '✅' : '❌'} Vocal range calculation\n`);
  return hasValidRange;
}

// Test note sequence generation
function testNoteSequence() {
  console.log('Testing note sequence generation...');
  
  const sequence = generateNoteSequence('C4', 'C5', 2); // Whole tones
  
  console.log(`Generated sequence: ${sequence.length} notes`);
  sequence.forEach((freq, index) => {
    const note = frequencyToNote(freq);
    console.log(`  ${index + 1}. ${note.note}${note.octave} (${freq.toFixed(2)}Hz)`);
  });
  
  const hasCorrectLength = sequence.length > 0;
  console.log(`${hasCorrectLength ? '✅' : '❌'} Note sequence generation\n`);
  return hasCorrectLength;
}

// Test interval calculations
function testIntervalCalculations() {
  console.log('Testing interval calculations...');
  
  const testCases = [
    { note1: 'C4', note2: 'D4', expected: 2 },   // Major second
    { note1: 'C4', note2: 'E4', expected: 4 },   // Major third
    { note1: 'C4', note2: 'G4', expected: 7 },   // Perfect fifth
    { note1: 'C4', note2: 'C5', expected: 12 }   // Octave
  ];
  
  let passed = 0;
  testCases.forEach(({ note1, note2, expected }) => {
    const interval = calculateInterval(note1, note2);
    const isCorrect = interval === expected;
    console.log(`${isCorrect ? '✅' : '❌'} ${note1} to ${note2}: ${interval} semitones (expected: ${expected})`);
    if (isCorrect) passed++;
  });

  console.log(`Interval calculations: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

// Run all tests
export function runAudioUtilsTests() {
  console.log('=== Audio Utilities Test Suite ===\n');
  
  const results = [
    testFrequencyToNote(),
    testNoteToFrequency(),
    testPitchTolerance(),
    testVocalRange(),
    testNoteSequence(),
    testIntervalCalculations()
  ];
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passedTests}/${totalTests} test suites`);
  console.log(`Overall: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return passedTests === totalTests;
}

// Export individual test functions for targeted testing
export {
  testFrequencyToNote,
  testNoteToFrequency,
  testPitchTolerance,
  testVocalRange,
  testNoteSequence,
  testIntervalCalculations
};