// app/dashboard/workouts/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import WorkoutDetailClient from './WorkoutDetailClient';

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) notFound();

  const { data: logs } = await supabase
    .from('exercise_logs')
    .select('*, exercises(*)')
    .eq('session_id', id)
    .order('exercise_id')
    .order('set_number') as any;

  return <WorkoutDetailClient session={session} logs={logs || []} />;
}
