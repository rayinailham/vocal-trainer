import React, { useEffect, useState } from 'react';
import { PitchData } from '@/types/audio';

interface PitchMeterProps {
  currentPitch?: PitchData | null;
  targetNote?: string;
  tolerance?: number; // in cents
  showCents?: boolean;
  showFrequency?: boolean;
  className?: string;
}

export const PitchMeter: React.FC<PitchMeterProps> = ({
  currentPitch,
  targetNote,
  tolerance = 50,
  showCents = true,
  showFrequency = true,
  className = ''
}) => {
  const [accuracy, setAccuracy] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'accurate' | 'inaccurate'>('idle');

  useEffect(() => {
    if (!currentPitch || !targetNote) {
      setAccuracy(0);
      setStatus('idle');
      return;
    }

    const { cents } = currentPitch;
    const absoluteCents = Math.abs(cents);
    
    // Calculate accuracy percentage (100% = perfect, 0% = at tolerance limit)
    const accuracyPercent = Math.max(0, 100 - (absoluteCents / tolerance) * 100);
    setAccuracy(accuracyPercent);

    // Determine status
    if (absoluteCents <= tolerance) {
      setStatus('accurate');
    } else {
      setStatus('inaccurate');
    }
  }, [currentPitch, targetNote, tolerance]);

  const getStatusColor = () => {
    switch (status) {
      case 'accurate':
        return 'bg-green-500';
      case 'inaccurate':
        return 'bg-red-500';
      case 'detecting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getMeterColor = () => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 70) return 'bg-yellow-500';
    if (accuracy >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCentsColor = () => {
    if (!currentPitch) return 'text-gray-500';
    const { cents } = currentPitch;
    if (Math.abs(cents) <= tolerance) return 'text-green-600';
    if (Math.abs(cents) <= tolerance * 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`pitch-meter ${className}`}>
      <div className="bg-gray-900 rounded-lg p-4 shadow-lg">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${status === 'detecting' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-gray-300 capitalize">
              {status === 'idle' && 'No Signal'}
              {status === 'detecting' && 'Detecting...'}
              {status === 'accurate' && 'On Pitch'}
              {status === 'inaccurate' && 'Off Pitch'}
            </span>
          </div>
          
          {targetNote && (
            <div className="text-sm font-mono text-gray-300">
              Target: {targetNote}
            </div>
          )}
        </div>

        {/* Accuracy meter */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-200 ease-out ${getMeterColor()}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Pitch information */}
        {currentPitch && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Note:</span>
              <span className="text-lg font-mono text-white">
                {currentPitch.note}{currentPitch.octave}
              </span>
            </div>
            
            {showFrequency && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Frequency:</span>
                <span className="text-sm font-mono text-white">
                  {currentPitch.frequency.toFixed(1)} Hz
                </span>
              </div>
            )}
            
            {showCents && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Cents:</span>
                <span className={`text-sm font-mono ${getCentsColor()}`}>
                  {currentPitch.cents > 0 ? '+' : ''}{currentPitch.cents}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Visual pitch indicator */}
        <div className="mt-4 relative h-8 bg-gray-800 rounded-full overflow-hidden">
          {/* Center line (perfect pitch) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-400 transform -translate-x-1/2" />
          
          {/* Tolerance zones */}
          <div 
            className="absolute top-0 bottom-0 bg-green-900 opacity-30"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${(tolerance / 50) * 10}%`
            }}
          />
          
          {/* Current pitch indicator */}
          {currentPitch && (
            <div 
              className={`absolute top-1 bottom-1 w-1 rounded-full ${getStatusColor()} transition-all duration-100`}
              style={{
                left: '50%',
                transform: `translateX(calc(-50% + ${currentPitch.cents * 2}px))`
              }}
            />
          )}
        </div>

        {/* Tolerance indicator */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          ±{tolerance} cents tolerance
        </div>
      </div>
    </div>
  );
};

export default PitchMeter;