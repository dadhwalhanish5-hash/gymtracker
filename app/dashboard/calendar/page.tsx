// app/dashboard/calendar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday, parseISO, subMonths, addMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Dumbbell, Moon, Loader2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { WorkoutSession, RestDay } from '@/types/database';

export default function CalendarPage() {
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [restDays, setRestDays] = useState<RestDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [savingRest, setSavingRest] = useState(false);

  async function load(month: Date) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = startOfMonth(month).toISOString();
    const end = endOfMonth(month).toISOString();

    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('workout_sessions').select('*').eq('user_id', user.id).gte('started_at', start).lte('started_at', end),
      supabase.from('rest_days').select('*').eq('user_id', user.id).gte('rest_date', start.slice(0, 10)).lte('rest_date', end.slice(0, 10)),
    ]);

    setSessions(s || []);
    setRestDays(r || []);
    setLoading(false);
  }

  useEffect(() => { load(currentMonth); }, [currentMonth]);

  async function markRestDay(date: Date) {
    setSavingRest(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    await supabase.from('rest_days').upsert({ user_id: user.id, rest_date: dateStr }, { onConflict: 'user_id,rest_date' });
    setSavingRest(false);
    load(currentMonth);
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = getDay(days[0]);

  const sessionDates = new Set(sessions.map((s) => s.started_at.slice(0, 10)));
  const restDates = new Set(restDays.map((r) => r.rest_date));

  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedSessions = sessions.filter((s) => s.started_at.startsWith(selectedDateStr || 'x'));
  const isRestDay = selectedDateStr ? restDates.has(selectedDateStr) : false;
  const isWorkoutDay = selectedDateStr ? sessionDates.has(selectedDateStr) : false;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-8">Calendar</h1>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-semibold text-white text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-slate-600 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty slots before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const hasWorkout = sessionDates.has(key);
          const isRest = restDates.has(key);
          const today = isToday(day);
          const selected = selectedDay && format(selectedDay, 'yyyy-MM-dd') === key;

          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDay(selected ? null : day)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all"
              style={{
                background: hasWorkout
                  ? 'linear-gradient(135deg, rgba(79,142,247,0.25), rgba(155,109,249,0.25))'
                  : isRest
                  ? 'rgba(52,211,153,0.1)'
                  : selected
                  ? 'var(--bg-elevated)'
                  : 'transparent',
                border: today
                  ? '1px solid var(--accent-blue)'
                  : selected
                  ? '1px solid var(--border-strong)'
                  : '1px solid transparent',
                color: hasWorkout ? 'white' : isRest ? 'var(--accent-emerald)' : today ? 'var(--accent-blue)' : '#94a3b8',
              }}
            >
              <span className="font-medium text-xs">{format(day, 'd')}</span>
              {hasWorkout && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--accent-blue)' }} />}
              {isRest && !hasWorkout && <Moon className="w-2.5 h-2.5 mt-0.5" />}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(79,142,247,0.3)' }} />
          <span className="text-xs text-slate-500">Workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(52,211,153,0.15)' }} />
          <span className="text-xs text-slate-500">Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border" style={{ borderColor: 'var(--accent-blue)' }} />
          <span className="text-xs text-slate-500">Today</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{format(selectedDay, 'EEEE, MMMM d')}</h3>
            {!isRestDay && !isWorkoutDay && (
              <button
                onClick={() => markRestDay(selectedDay)}
                disabled={savingRest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--accent-emerald)' }}
              >
                <Moon className="w-3 h-3" /> Mark Rest Day
              </button>
            )}
          </div>

          {isWorkoutDay ? (
            <div className="space-y-2">
              {selectedSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <Dumbbell className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                  <div>
                    <p className="text-sm text-white">{s.name}</p>
                    {s.total_volume > 0 && <p className="text-xs text-slate-500">{s.total_volume}kg volume</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : isRestDay ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-emerald)' }}>
              <Moon className="w-4 h-4" /> Rest day logged
            </div>
          ) : (
            <p className="text-sm text-slate-500">No activity logged</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
