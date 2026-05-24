// app/dashboard/page.tsx
// The main dashboard — first thing you see after logging in

import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { WorkoutSession } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch recent workout sessions (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .gte('started_at', thirtyDaysAgo)
    .order('started_at', { ascending: false })
    .limit(20) as { data: WorkoutSession[] | null };

  // Fetch latest body metric
  const { data: latestMetric } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get workout count this week
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { count: weeklyCount } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .gte('started_at', sevenDaysAgo);

  // Get total volume this month
  const { data: monthSessions } = await supabase
    .from('workout_sessions')
    .select('total_volume')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .gte('started_at', startOfMonth(new Date()).toISOString())
    .lte('started_at', endOfMonth(new Date()).toISOString()) as { data: { total_volume: number }[] | null };

  const monthlyVolume = monthSessions?.reduce((sum, s) => sum + (s.total_volume || 0), 0) || 0;

  // Calculate current streak
  const sessions = recentSessions || [];
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const day = subDays(today, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const hasWorkout = sessions.some((s) => s.started_at?.startsWith(dayStr));
    if (hasWorkout) {
      streak++;
    } else if (i > 0) {
      break; // Streak broken
    }
  }

  // Profile for greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardClient
      profile={profile}
      recentSessions={recentSessions || []}
      latestMetric={latestMetric}
      weeklyCount={weeklyCount || 0}
      monthlyVolume={monthlyVolume}
      streak={streak}
    />
  );
}
