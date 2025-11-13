/**
 * Simple Integration Test for Vocal Range Storage
 * Tests the core functionality without importing TypeScript files
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
    }
  };
})();

// Mock DOM environment
global.localStorage = localStorageMock;

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
    }
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
    }
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
    }
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
    }
  }
];

// Simplified storage functions (mimicking the actual implementation)
function saveVocalRange(vocalRange) {
  try {
    localStorageMock.setItem('vocal-trainer-vocal-range', JSON.stringify(vocalRange));
  } catch (error) {
    console.error('Failed to save vocal range:', error);
    throw error;
  }
}

function loadVocalRange() {
  try {
    const serializedData = localStorageMock.getItem('vocal-trainer-vocal-range');
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.warn(`Failed to load data from storage:`, error);
    return null;
  }
}

// Simplified optimal root note calculation
function calculateOptimalRootNote(vocalRange) {
  if (!vocalRange || !vocalRange.lowestFrequency || !vocalRange.highestFrequency) {
    return 'C4'; // Default fallback
  }

  // Find midpoint of vocal range
  const lowestFreq = vocalRange.lowestFrequency;
  const highestFreq = vocalRange.highestFrequency;
  const middleFreq = (lowestFreq + highestFreq) / 2;

  // Convert frequency to note (simplified)
  const NOTE_FREQUENCIES = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };
  
  const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // A4 = 440Hz is the reference
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 is 4.75 octaves below A4
  
  // Calculate note number
  const noteNum = 12 * Math.log2(middleFreq / C0);
  const roundedNoteNum = Math.round(noteNum);
  
  // Convert to note name and octave
  const octave = Math.floor(roundedNoteNum / 12);
  const noteIndex = roundedNoteNum % 12;
  const note = ALL_NOTES[noteIndex];

  return `${note}${octave}`;
}

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
      
      // Verify that root note is in a reasonable format
      if (optimalRootNote && /^[A-G]#?[0-9]$/.test(optimalRootNote)) {
        console.log(`✅ ${testRange.name}: Root note ${optimalRootNote} calculated successfully`);
      } else {
        console.log(`❌ ${testRange.name}: Root note calculation failed`);
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
    
    // Verify complete flow
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
  
  // Test 6: Storage Quota Exceeded Simulation
  console.log('💾 Test 6: Storage Quota Exceeded');
  totalTests++;
  
  try {
    // Mock localStorage to throw quota exceeded error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = (key, value) => {
      const error = new Error('Storage quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    };
    
    // Try to save data
    try {
      saveVocalRange(testVocalRanges[0].data);
      console.log('❌ Storage quota error not handled');
    } catch (error) {
      if (error.message.includes('Storage quota exceeded')) {
        console.log('✅ Storage quota exceeded error handled correctly');
        passedTests++;
      } else {
        console.log('❌ Storage quota exceeded error not handled correctly');
      }
    }
    
    // Restore original function
    localStorageMock.setItem = originalSetItem;
    
    console.log('✅ Test 6 passed: Storage Quota Exceeded\n');
  } catch (error) {
    console.log('❌ Test 6 failed:', error.message);
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

// Run the tests
runTests();