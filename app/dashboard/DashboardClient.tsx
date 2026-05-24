// app/dashboard/DashboardClient.tsx
// The interactive dashboard UI (runs in browser)

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import {
  Flame, TrendingUp, Dumbbell, Scale, Plus, ChevronRight,
  BarChart3, Calendar, Zap, Trophy, Clock,
} from 'lucide-react';
import type { Profile, WorkoutSession, BodyMetric } from '@/types/database';
import {
  getGreeting, formatVolume, formatDuration, getRelativeDate, formatDate
} from '@/utils/helpers';

// ---- TYPES ----
interface DashboardClientProps {
  profile: Profile | null;
  recentSessions: WorkoutSession[];
  latestMetric: BodyMetric | null;
  weeklyCount: number;
  monthlyVolume: number;
  streak: number;
}

// ---- COMPONENTS ----

// A single stat card
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="metric-card rounded-2xl p-5 transition-all cursor-default"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-display font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

// Mini calendar heatmap (last 35 days)
function ConsistencyCalendar({ sessions }: { sessions: WorkoutSession[] }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, i) => subDays(today, 34 - i));

  const sessionDates = new Set(
    sessions.map((s) => s.started_at ? format(new Date(s.started_at), 'yyyy-MM-dd') : '')
  );

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const isToday = key === format(today, 'yyyy-MM-dd');
          const hasWorkout = sessionDates.has(key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01, duration: 0.2 }}
              className="w-6 h-6 rounded-md"
              title={`${format(day, 'MMM d')}${hasWorkout ? ' — Workout' : ''}`}
              style={{
                background: hasWorkout
                  ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                  : 'var(--bg-elevated)',
                border: isToday ? '1px solid var(--accent-blue)' : '1px solid transparent',
                opacity: hasWorkout ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--bg-elevated)' }} />
          <span className="text-xs text-slate-500">Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--accent-blue)' }} />
          <span className="text-xs text-slate-500">Workout</span>
        </div>
      </div>
    </div>
  );
}

// Quick action button
function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-xs text-slate-300 font-medium text-center">{label}</span>
    </Link>
  );
}

// ---- MAIN COMPONENT ----
export default function DashboardClient({
  profile,
  recentSessions,
  latestMetric,
  weeklyCount,
  monthlyVolume,
  streak,
}: DashboardClientProps) {
  const name = profile?.display_name || profile?.username || 'Athlete';
  const lastSession = recentSessions[0];

  const insights = [
    weeklyCount >= 4 ? `🔥 Crushing it — ${weeklyCount} workouts this week!` : null,
    streak >= 3 ? `⚡ ${streak}-day streak going strong` : null,
    monthlyVolume > 0 ? `📦 ${formatVolume(monthlyVolume)}kg total volume this month` : null,
  ].filter(Boolean);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-slate-400 text-sm mb-1">{getGreeting()},</p>
          <h1 className="font-display text-3xl font-bold text-white">
            {name} <span className="text-slate-600">👋</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>

        <Link
          href="/dashboard/workouts/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          <Plus className="w-4 h-4" />
          New Workout
        </Link>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak}d`}
          sub={streak > 0 ? 'Keep going!' : 'Start today'}
          color="var(--accent-amber)"
          delay={0.1}
        />
        <StatCard
          icon={Dumbbell}
          label="This week"
          value={`${weeklyCount}`}
          sub="workouts"
          color="var(--accent-blue)"
          delay={0.15}
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly volume"
          value={`${formatVolume(monthlyVolume)}kg`}
          sub="total lifted"
          color="var(--accent-purple)"
          delay={0.2}
        />
        <StatCard
          icon={Scale}
          label="Body weight"
          value={latestMetric?.weight ? `${latestMetric.weight}kg` : '—'}
          sub={latestMetric ? formatDate(latestMetric.recorded_at) : 'Not logged'}
          color="var(--accent-emerald)"
          delay={0.25}
        />
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Consistency calendar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-white">Consistency</h2>
            <Link href="/dashboard/calendar" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View calendar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ConsistencyCalendar sessions={recentSessions} />
        </motion.div>

        {/* AI insights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <h2 className="font-display font-semibold text-white">Insights</h2>
          </div>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="text-sm text-slate-300 p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Start logging workouts to see your insights.</p>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickAction href="/dashboard/workouts/new" icon={Dumbbell} label="Log Workout" color="var(--accent-blue)" />
          <QuickAction href="/dashboard/exercises" icon={Zap} label="Exercises" color="var(--accent-purple)" />
          <QuickAction href="/dashboard/analytics" icon={BarChart3} label="Analytics" color="var(--accent-emerald)" />
          <QuickAction href="/dashboard/calendar" icon={Calendar} label="Calendar" color="var(--accent-amber)" />
          <QuickAction href="/dashboard/body-stats" icon={Scale} label="Body Stats" color="var(--accent-cyan)" />
          <QuickAction href="/dashboard/templates" icon={Trophy} label="Templates" color="var(--accent-red)" />
        </div>
      </motion.div>

      {/* Recent workouts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white">Recent Workouts</h2>
          <Link href="/dashboard/workouts" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-default)' }}
          >
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No workouts yet</p>
            <p className="text-slate-600 text-sm mt-1">Log your first session to see history</p>
            <Link
              href="/dashboard/workouts/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
            >
              <Plus className="w-4 h-4" /> Start Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <Link
                  href={`/dashboard/workouts/${session.id}`}
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:border-blue-500/30 group"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <Dumbbell className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{session.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {getRelativeDate(session.started_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    {session.duration_minutes && (
                      <div className="hidden sm:block">
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(session.duration_minutes)}
                        </div>
                      </div>
                    )}
                    {session.total_volume > 0 && (
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                          {formatVolume(session.total_volume)}kg
                        </div>
                        <div className="text-xs text-slate-600">volume</div>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
