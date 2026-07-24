import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface StreamTimerProps {
  startedAt: number;
}

export const StreamTimer: React.FC<StreamTimerProps> = ({ startedAt }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt]);

  const formatTime = (totalSec: number): string => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-200">
      <Clock className="w-3.5 h-3.5 text-indigo-400" />
      <span>{formatTime(elapsedSeconds)}</span>
    </span>
  );
};
