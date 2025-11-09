import React, { useEffect, useRef, useState } from 'react';
import { PitchData } from '@/types/audio';

interface AudioVisualizerProps {
  width?: number;
  height?: number;
  currentPitch?: PitchData | null;
  targetNote?: string;
  isRecording?: boolean;
  isMonitoring?: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  width = 800,
  height = 200,
  currentPitch,
  targetNote,
  isRecording = false,
  isMonitoring = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate mock waveform data for visualization
  useEffect(() => {
    if (!isRecording && !isMonitoring) {
      setWaveformData([]);
      return;
    }

    const interval = setInterval(() => {
      const newData = Array.from({ length: width }, () => {
        // Generate random waveform data with some structure
        const base = Math.random() * 0.3;
        const wave = Math.sin(Date.now() * 0.001) * 0.2;
        return base + wave + (Math.random() - 0.5) * 0.1;
      });
      setWaveformData(newData);
    }, 50);

    return () => clearInterval(interval);
  }, [isRecording, isMonitoring, width]);

  // Draw waveform and pitch indicator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform
    if (waveformData.length > 0 && (isRecording || isMonitoring)) {
      ctx.strokeStyle = isMonitoring ? '#4ade80' : '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();

      waveformData.forEach((value, index) => {
        const x = (index / waveformData.length) * width;
        const y = height / 2 + value * height * 0.3;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw current pitch indicator
    if (currentPitch && (isRecording || isMonitoring)) {
      const { frequency, note, octave, cents } = currentPitch;
      
      // Calculate position based on frequency (logarithmic scale)
      const minFreq = 80; // C2
      const maxFreq = 800; // G5
      const logFreq = Math.log2(frequency);
      const logMin = Math.log2(minFreq);
      const logMax = Math.log2(maxFreq);
      const normalizedFreq = (logFreq - logMin) / (logMax - logMin);
      const x = normalizedFreq * width;

      // Draw pitch line
      ctx.strokeStyle = isMonitoring ? '#3b82f6' : '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw pitch info
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`${note}${octave}`, x + 10, 30);
      ctx.fillText(`${frequency.toFixed(1)}Hz`, x + 10, 50);
      ctx.fillText(`${cents > 0 ? '+' : ''}${cents} cents`, x + 10, 70);
    }

    // Draw target note indicator
    if (targetNote) {
      ctx.fillStyle = '#ffd93d';
      ctx.font = '16px monospace';
      ctx.fillText(`Target: ${targetNote}`, 10, 30);
    }

    // Draw recording indicator
    if (isRecording) {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(width - 20, 20, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw monitoring indicator
    if (isMonitoring && !isRecording) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(width - 20, 20, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformData, currentPitch, targetNote, isRecording, isMonitoring, width, height]);

  return (
    <div className={`audio-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full rounded-lg border border-gray-700"
      />
    </div>
  );
};

export default AudioVisualizer;