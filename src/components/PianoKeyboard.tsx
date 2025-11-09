import React, { useState, useCallback } from 'react';
import { ALL_NOTES, noteToFrequency } from '@/lib/pitch';

interface PianoKeyboardProps {
  startOctave?: number;
  endOctave?: number;
  highlightedNotes?: string[];
  onNoteClick?: (note: string, frequency: number) => void;
  className?: string;
}

interface KeyProps {
  note: string;
  octave: number;
  isBlack: boolean;
  isHighlighted: boolean;
  onClick: (note: string, frequency: number) => void;
  position?: number;
}

const PianoKey: React.FC<KeyProps> = ({
  note,
  octave,
  isBlack,
  isHighlighted,
  onClick
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const noteWithOctave = `${note}${octave}`;
  const frequency = noteToFrequency(note, octave);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    onClick(noteWithOctave, frequency);
  }, [onClick, noteWithOctave, frequency]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const baseClasses = `
    relative border cursor-pointer transition-all duration-75
    ${isBlack 
      ? 'bg-gray-900 hover:bg-gray-700 border-gray-800 z-10' 
      : 'bg-white hover:bg-gray-100 border-gray-300'
    }
    ${isHighlighted 
      ? 'ring-2 ring-blue-500 ring-opacity-75' 
      : ''
    }
    ${isPressed 
      ? 'transform scale-95' 
      : 'transform scale-100'
    }
  `;

  const style = isBlack 
    ? {
        width: '30px',
        height: '120px',
        marginLeft: '-15px',
        marginRight: '-15px',
        zIndex: 10
      }
    : {
        width: '40px',
        height: '180px'
      };

  return (
    <div
      className={baseClasses}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      title={`${noteWithOctave} - ${frequency.toFixed(2)}Hz`}
    >
      {isHighlighted && (
        <div className="absolute inset-0 bg-blue-500 opacity-20 rounded" />
      )}
      <div className={`absolute bottom-2 left-0 right-0 text-center text-xs font-mono ${
        isBlack ? 'text-white' : 'text-gray-700'
      }`}>
        {note}
      </div>
    </div>
  );
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startOctave = 3,
  endOctave = 5,
  highlightedNotes = [],
  onNoteClick,
  className = ''
}) => {
  const handleNoteClick = useCallback((note: string, frequency: number) => {
    if (onNoteClick) {
      onNoteClick(note, frequency);
    }
  }, [onNoteClick]);

  const renderOctave = (octave: number) => {
    const whiteKeys = ALL_NOTES.filter(note => !note.includes('#'));
    const blackKeys = ALL_NOTES.filter(note => note.includes('#'));
    
    const blackKeyPositions: { [key: string]: number } = {
      'C#': 0.5,
      'D#': 1.5,
      'F#': 3.5,
      'G#': 4.5,
      'A#': 5.5
    };

    return (
      <div key={octave} className="relative">
        {/* White keys */}
        <div className="flex">
          {whiteKeys.map((note) => {
            const noteWithOctave = `${note}${octave}`;
            const isHighlighted = highlightedNotes.includes(noteWithOctave);
            
            return (
              <PianoKey
                key={`${note}${octave}`}
                note={note}
                octave={octave}
                isBlack={false}
                isHighlighted={isHighlighted}
                onClick={handleNoteClick}
              />
            );
          })}
        </div>
        
        {/* Black keys */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: '120px' }}>
          {blackKeys.map((note) => {
            const noteWithOctave = `${note}${octave}`;
            const isHighlighted = highlightedNotes.includes(noteWithOctave);
            const position = blackKeyPositions[note];
            
            if (position === undefined) return null;
            
            return (
              <div
                key={`${note}${octave}`}
                className="absolute"
                style={{ left: `${position * 40}px` }}
              >
                <PianoKey
                  note={note}
                  octave={octave}
                  isBlack={true}
                  isHighlighted={isHighlighted}
                  onClick={handleNoteClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const octaves = [];
  for (let octave = startOctave; octave <= endOctave; octave++) {
    octaves.push(octave);
  }

  return (
    <div className={`piano-keyboard ${className}`}>
      <div className="flex flex-col gap-4">
        {octaves.map(octave => (
          <div key={octave} className="flex items-center gap-2">
            <div className="text-sm font-mono text-gray-600 w-12">
              C{octave}
            </div>
            <div className="relative">
              {renderOctave(octave)}
            </div>
          </div>
        ))}
      </div>
      
      {highlightedNotes.length > 0 && (
        <div className="mt-4 p-2 bg-blue-50 rounded">
          <div className="text-sm font-medium text-blue-800">Highlighted Notes:</div>
          <div className="text-xs text-blue-600 font-mono">
            {highlightedNotes.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PianoKeyboard;