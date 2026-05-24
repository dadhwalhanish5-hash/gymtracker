// components/ui/RestTimerWidget.tsx
// Floating rest timer that appears when you start a rest countdown

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function RestTimerWidget() {
  const { restTimerSeconds, isTimerRunning, stopRestTimer, tickTimer } = useAppStore();

  // Tick the timer down every second
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval); // Cleanup when component unmounts
  }, [isTimerRunning, tickTimer]);

  // Format seconds into MM:SS
  const minutes = Math.floor(restTimerSeconds / 60);
  const seconds = restTimerSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (assuming 90s default)
  const progress = isTimerRunning ? (restTimerSeconds / 90) * 100 : 0;

  return (
    <AnimatePresence>
      {isTimerRunning && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 0 30px rgba(79, 142, 247, 0.2)',
          }}
        >
          <Timer className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          <span className="font-mono text-lg font-bold text-white">{display}</span>
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--border-default)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent-blue)', width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <button onClick={stopRestTimer} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
