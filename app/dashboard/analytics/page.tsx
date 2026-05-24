// app/dashboard/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { TrendingUp, Dumbbell, Calendar, Trophy, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getMuscleColor, formatVolume } from '@/utils/helpers';
import type { WorkoutSession, ExerciseLog } from '@/types/database';

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
    >
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium" style={{ color: p.color }}>
          {p.value?.toLocaleString()} {p.name === 'volume' ? 'kg' : ''}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [volumeData, setVolumeData] = useState<{ date: string; volume: number }[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<{ week: string; count: number }[]>([]);
  const [muscleFrequency, setMuscleFrequency] = useState<{ muscle: string; count: number }[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalVolume: 0,
    avgDuration: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 90 days of sessions
      const since = subDays(new Date(), 90).toISOString();
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('started_at', since)
        .order('started_at', { ascending: true }) as { data: WorkoutSession[] | null };

      if (!sessions) { setLoading(false); return; }

      // Volume over time (daily)
      const dailyVolume: Record<string, number> = {};
      sessions.forEach((s) => {
        const day = format(parseISO(s.started_at), 'MMM d');
        dailyVolume[day] = (dailyVolume[day] || 0) + s.total_volume;
      });
      setVolumeData(Object.entries(dailyVolume).map(([date, volume]) => ({ date, volume })));

      // Weekly workout count
      const weekMap: Record<string, number> = {};
      sessions.forEach((s) => {
        const week = `W${format(parseISO(s.started_at), 'w')}`;
        weekMap[week] = (weekMap[week] || 0) + 1;
      });
      setWeeklyWorkouts(Object.entries(weekMap).slice(-8).map(([week, count]) => ({ week, count })));

      // Stats
      const totalVol = sessions.reduce((sum, s) => sum + s.total_volume, 0);
      const totalDur = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      setStats({
        totalSessions: sessions.length,
        totalVolume: totalVol,
        avgDuration: sessions.length ? Math.round(totalDur / sessions.length) : 0,
        longestStreak: calculateLongestStreak(sessions),
      });

      // Muscle frequency (from exercise logs)
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('exercise_id, exercises(muscle_group)')
          .in('session_id', sessionIds) as any;

        if (logs) {
          const muscleMap: Record<string, number> = {};
          logs.forEach((log: any) => {
            const m = log.exercises?.muscle_group || 'Other';
            muscleMap[m] = (muscleMap[m] || 0) + 1;
          });
          const sorted = Object.entries(muscleMap)
            .sort((a, b) => b[1] - a[1])
            .map(([muscle, count]) => ({ muscle, count }));
          setMuscleFrequency(sorted);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-40">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-slate-500 text-sm">Last 90 days</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: stats.totalSessions, icon: Dumbbell, color: 'var(--accent-blue)' },
          { label: 'Total Volume', value: `${formatVolume(stats.totalVolume)}kg`, icon: TrendingUp, color: 'var(--accent-purple)' },
          { label: 'Avg Duration', value: `${stats.avgDuration}m`, icon: Calendar, color: 'var(--accent-emerald)' },
          { label: 'Best Streak', value: `${stats.longestStreak}d`, icon: Trophy, color: 'var(--accent-amber)' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <Icon className="w-5 h-5 mb-3" style={{ color }} />
            <div className="text-2xl font-display font-bold text-white">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Volume chart */}
      {volumeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        >
          <h2 className="font-display font-semibold text-white mb-6">Volume Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                dot={false}
                name="volume"
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f8ef7" />
                  <stop offset="100%" stopColor="#9b6df9" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly sessions */}
        {weeklyWorkouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <h2 className="font-display font-semibold text-white mb-6">Weekly Sessions</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyWorkouts}>
                <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#4f8ef7" name="sessions" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Muscle frequency */}
        {muscleFrequency.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <h2 className="font-display font-semibold text-white mb-5">Muscle Frequency</h2>
            <div className="space-y-3">
              {muscleFrequency.slice(0, 6).map(({ muscle, count }) => {
                const max = muscleFrequency[0].count;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={muscle} className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 w-20 shrink-0">{muscle}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: getMuscleColor(muscle) }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {stats.totalSessions === 0 && (
        <div className="text-center py-20">
          <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No data yet</p>
          <p className="text-slate-600 text-sm mt-1">Complete workouts to see your analytics</p>
        </div>
      )}
    </div>
  );
}

// Calculate longest streak from sessions array
function calculateLongestStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;
  const dates = new Set(sessions.map((s) => format(parseISO(s.started_at), 'yyyy-MM-dd')));
  let longest = 0, current = 0;
  let check = new Date();

  for (let i = 0; i < 365; i++) {
    const d = format(subDays(check, i), 'yyyy-MM-dd');
    if (dates.has(d)) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}
