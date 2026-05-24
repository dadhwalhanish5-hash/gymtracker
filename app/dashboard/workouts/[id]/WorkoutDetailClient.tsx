// app/dashboard/workouts/[id]/WorkoutDetailClient.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock, TrendingUp, Dumbbell, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { WorkoutSession } from '@/types/database';
import { formatDuration, formatVolume, getMuscleColor, calculate1RM } from '@/utils/helpers';

interface Log {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  is_warmup: boolean;
  is_failure: boolean;
  exercises: {
    name: string;
    muscle_group: string | null;
  };
}

export default function WorkoutDetailClient({
  session,
  logs,
}: {
  session: WorkoutSession;
  logs: Log[];
}) {
  // Group logs by exercise
  const grouped: Record<string, { name: string; muscle: string; sets: Log[] }> = {};
  logs.forEach((log) => {
    const key = log.exercise_id;
    if (!grouped[key]) {
      grouped[key] = {
        name: log.exercises.name,
        muscle: log.exercises.muscle_group || 'Other',
        sets: [],
      };
    }
    grouped[key].sets.push(log);
  });

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/workouts" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> All Workouts
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{session.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {format(parseISO(session.started_at), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {session.is_completed && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--accent-emerald)' }}>
              <Check className="w-3 h-3" /> Completed
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-5">
          {session.duration_minutes && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-white font-medium">{formatDuration(session.duration_minutes)}</span>
            </div>
          )}
          {session.total_volume > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span className="text-white font-medium">{formatVolume(session.total_volume)}kg</span>
              <span className="text-slate-500">total volume</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="w-4 h-4 text-slate-500" />
            <span className="text-white font-medium">{Object.keys(grouped).length}</span>
            <span className="text-slate-500">exercises</span>
          </div>
        </div>
      </motion.div>

      {/* Exercise blocks */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([id, { name, muscle, sets }], i) => {
          const color = getMuscleColor(muscle);
          const workingSets = sets.filter((s) => !s.is_warmup);
          const bestSet = workingSets.reduce((best, s) => {
            if (!s.weight || !s.reps) return best;
            const vol = s.weight * s.reps;
            return !best || vol > (best.weight! * best.reps!) ? s : best;
          }, null as Log | null);

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
            >
              {/* Exercise header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Dumbbell className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{name}</p>
                  <p className="text-xs" style={{ color }}>{muscle}</p>
                </div>
                {bestSet && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Best</p>
                    <p className="text-sm font-medium text-white">{bestSet.weight}kg × {bestSet.reps}</p>
                  </div>
                )}
              </div>

              {/* Sets table */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2 mb-2 px-1">
                  {['Set', 'Weight', 'Reps', 'Vol'].map((h) => (
                    <div key={h} className="text-xs text-slate-600 text-center">{h}</div>
                  ))}
                </div>
                {sets.map((set) => {
                  const vol = (set.weight || 0) * (set.reps || 0);
                  return (
                    <div key={set.id} className="grid grid-cols-4 gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="text-center">
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: set.is_warmup ? 'rgba(251,191,36,0.1)' : 'var(--bg-elevated)',
                            color: set.is_warmup ? 'var(--accent-amber)' : '#94a3b8',
                          }}
                        >
                          {set.is_warmup ? 'W' : set.set_number}
                        </span>
                      </div>
                      <div className="text-center text-sm text-white">{set.weight ? `${set.weight}kg` : '—'}</div>
                      <div className="text-center text-sm text-white">{set.reps || '—'}</div>
                      <div className="text-center text-sm text-slate-400">{vol > 0 ? `${vol}` : '—'}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm">No exercises logged in this session</p>
        </div>
      )}
    </div>
  );
}
