// app/dashboard/workouts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Dumbbell, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDuration, formatVolume, getRelativeDate } from '@/utils/helpers';
import type { WorkoutSession } from '@/types/database';

export default function WorkoutsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      setSessions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Workouts</h1>
          <p className="text-slate-500 text-sm mt-1">{sessions.length} sessions logged</p>
        </div>
        <Link
          href="/dashboard/workouts/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          <Plus className="w-4 h-4" /> Log Workout
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-default)' }}
        >
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No workouts yet</p>
          <p className="text-slate-600 text-sm mt-1">Log your first session</p>
          <Link
            href="/dashboard/workouts/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
          >
            <Plus className="w-4 h-4" /> Start Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/dashboard/workouts/${session.id}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all group hover:border-blue-500/30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: session.is_completed ? 'rgba(79,142,247,0.12)' : 'rgba(251,191,36,0.1)' }}
                  >
                    <Dumbbell
                      className="w-5 h-5"
                      style={{ color: session.is_completed ? 'var(--accent-blue)' : 'var(--accent-amber)' }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{session.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{getRelativeDate(session.started_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {session.duration_minutes && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.duration_minutes)}
                    </div>
                  )}
                  {session.total_volume > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <TrendingUp className="w-3 h-3" />
                      {formatVolume(session.total_volume)}kg
                    </div>
                  )}
                  {!session.is_completed && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--accent-amber)' }}
                    >
                      In progress
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
