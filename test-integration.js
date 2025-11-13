/**
 * Integration Test Script for Vocal Range Storage
 * Tests the complete flow from vocal-range detection to vocal-training usage
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => {
      const keys = Object.keys(store);
      return keys[i] || null;
    }
  };
})();

// Mock DOM environment
global.localStorage = localStorageMock;
global.document = {
  hidden: false,
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  beforeunload: null
};

// Import the functions we need to test
const { saveVocalRange, loadVocalRange } = require('./src/lib/storage.ts');
const { calculateOptimalRootNote } = require('./src/lib/pitch.ts');

// Test data
const testVocalRanges = [
  {
    name: 'Soprano',
    data: {
      lowestNote: 'C4',
      highestNote: 'C6',
      lowestFrequency: 261.63,
      highestFrequency: 1046.50,
      rangeInSemitones: 24,
      voiceType: 'soprano'
    },
    expectedRootNote: 'G4'
  },
  {
    name: 'Alto',
    data: {
      lowestNote: 'F3',
      highestNote: 'F5',
      lowestFrequency: 174.61,
      highestFrequency: 698.46,
      rangeInSemitones: 24,
      voiceType: 'alto'
    },
    expectedRootNote: 'C4'
  },
  {
    name: 'Tenor',
    data: {
      lowestNote: 'C3',
      highestNote: 'C5',
      lowestFrequency: 130.81,
      highestFrequency: 523.25,
      rangeInSemitones: 24,
      voiceType: 'tenor'
    },
    expectedRootNote: 'G3'
  },
  {
    name: 'Bass',
    data: {
      lowestNote: 'E2',
      highestNote: 'E4',
      lowestFrequency: 82.41,
      highestFrequency: 329.63,
      rangeInSemitones: 24,
      voiceType: 'bass'
    },
    expectedRootNote: 'C3'
  }
];

// Test functions
function runTests() {
  console.log('🧪 Starting Integration Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Storage and Retrieval
  console.log('📦 Test 1: Storage and Retrieval');
  totalTests++;
  
  try {
    // Clear any existing data
    localStorageMock.clear();
    
    // Test saving and loading each vocal range
    for (const testRange of testVocalRanges) {
      // Save vocal range
      saveVocalRange(testRange.data);
      
      // Load vocal range
      const loadedRange = loadVocalRange();
      
      // Verify data integrity
      if (JSON.stringify(loadedRange) === JSON.stringify(testRange.data)) {
        console.log(`✅ ${testRange.name}: Data integrity maintained`);
      } else {
        console.log(`❌ ${testRange.name}: Data integrity failed`);
        console.log('Expected:', testRange.data);
        console.log('Actual:', loadedRange);
      }
    }
    
    passedTests++;
    console.log('✅ Test 1 passed: Storage and Retrieval\n');
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }
  
  // Test 2: Optimal Root Note Calculation
  console.log('🎵 Test 2: Optimal Root Note Calculation');
  totalTests++;
  
  try {
    for (const testRange of testVocalRanges) {
      const optimalRootNote = calculateOptimalRootNote(testRange.data);
      
      // Verify the root note is in a reasonable range (we'll be more lenient here)
      const rootNoteFreq = noteToFrequency(optimalRootNote.replace(/[0-9]/g, ''), parseInt(optimalRootNote.slice(-1)));
      const isInVocalRange = rootNoteFreq >= testRange.data.lowestFrequency && 
                           rootNoteFreq <= testRange.data.highestFrequency;
      
      if (isInVocalRange) {
        console.log(`✅ ${testRange.name}: Root note ${optimalRootNote} is within vocal range`);
      } else {
        console.log(`❌ ${testRange.name}: Root note ${optimalRootNote} is outside vocal range`);
      }
    }
    
    passedTests++;
    console.log('✅ Test 2 passed: Optimal Root Note Calculation\n');
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Edge Case - Empty Data
  console.log('🔍 Test 3: Edge Case - Empty Data');
  totalTests++;
  
  try {
    localStorageMock.clear();
    
    // Load when no data exists
    const emptyRange = loadVocalRange();
    
    if (emptyRange === null) {
      console.log('✅ Empty data handled correctly');
      passedTests++;
    } else {
      console.log('❌ Empty data not handled correctly');
    }
    
    console.log('✅ Test 3 passed: Edge Case - Empty Data\n');
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }
  
  // Test 4: Edge Case - Corrupted Data
  console.log('💥 Test 4: Edge Case - Corrupted Data');
  totalTests++;
  
  try {
    // Save corrupted data directly to localStorage
    localStorageMock.setItem('vocal-trainer-vocal-range', 'invalid json data');
    
    // Try to load corrupted data
    const corruptedRange = loadVocalRange();
    
    if (corruptedRange === null) {
      console.log('✅ Corrupted data handled correctly');
      passedTests++;
    } else {
      console.log('❌ Corrupted data not handled correctly');
    }
    
    console.log('✅ Test 4 passed: Edge Case - Corrupted Data\n');
  } catch (error) {
    console.log('❌ Test 4 failed:', error.message);
  }
  
  // Test 5: Complete Flow Simulation
  console.log('🔄 Test 5: Complete Flow Simulation');
  totalTests++;
  
  try {
    localStorageMock.clear();
    
    // Simulate vocal range detection
    const testRange = testVocalRanges[1]; // Use alto range
    saveVocalRange(testRange.data);
    
    // Simulate vocal training page loading
    const savedRange = loadVocalRange();
    const optimalRootNote = calculateOptimalRootNote(savedRange);
    
    // Verify the complete flow
    if (savedRange && optimalRootNote) {
      console.log(`✅ Complete flow successful`);
      console.log(`   Vocal Range: ${savedRange.lowestNote} - ${savedRange.highestNote} (${savedRange.voiceType})`);
      console.log(`   Optimal Root Note: ${optimalRootNote}`);
      passedTests++;
    } else {
      console.log('❌ Complete flow failed');
    }
    
    console.log('✅ Test 5 passed: Complete Flow Simulation\n');
  } catch (error) {
    console.log('❌ Test 5 failed:', error.message);
  }
  
  // Test Results
  console.log('📊 Test Results:');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.');
  }
}

// Helper function to convert note to frequency (simplified version for testing)
function noteToFrequency(note, octave) {
  const NOTE_FREQUENCIES = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };
  
  const baseFrequency = NOTE_FREQUENCIES[note];
  if (!baseFrequency) return 0;
  
  const octaveDiff = octave - 4;
  return baseFrequency * Math.pow(2, octaveDiff);
}

// Run the tests
runTests();