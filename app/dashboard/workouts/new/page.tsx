// app/dashboard/workouts/new/page.tsx
// The workout logger — where you log sets, reps, weight
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Check, Loader2, Timer, ChevronDown,
  Trash2, Copy, Save, ArrowLeft, Dumbbell
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getMuscleColor, calculate1RM } from '@/utils/helpers';
import { useAppStore } from '@/lib/store';
import type { Exercise, ExerciseLog } from '@/types/database';

// A single set row
interface SetData {
  id: string; // temp local id
  set_number: number;
  reps: string;
  weight: string;
  rpe: string;
  is_failure: boolean;
  is_warmup: boolean;
  notes: string;
}

// An exercise block (one exercise + all its sets)
interface ExerciseBlock {
  id: string;
  exercise: Exercise;
  sets: SetData[];
}

function newSet(setNumber: number, prevSet?: SetData): SetData {
  return {
    id: crypto.randomUUID(),
    set_number: setNumber,
    reps: prevSet?.reps || '',
    weight: prevSet?.weight || '',
    rpe: '',
    is_failure: false,
    is_warmup: false,
    notes: '',
  };
}

// Exercise search dropdown
function ExerciseSearch({
  exercises,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  onSelect: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <Search className="w-4 h-4 text-slate-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
        />
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-6">No exercises found</p>
        ) : (
          filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getMuscleColor(ex.muscle_group || 'Other') }}
              />
              <div>
                <p className="text-sm text-white">{ex.name}</p>
                {ex.muscle_group && (
                  <p className="text-xs text-slate-500">{ex.muscle_group} · {ex.equipment || 'No equipment'}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// One exercise block with sets
function ExerciseBlockCard({
  block,
  onChange,
  onRemove,
  onStartTimer,
}: {
  block: ExerciseBlock;
  onChange: (updated: ExerciseBlock) => void;
  onRemove: () => void;
  onStartTimer: () => void;
}) {
  function updateSet(setId: string, field: keyof SetData, value: string | boolean) {
    onChange({
      ...block,
      sets: block.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s),
    });
  }

  function addSet() {
    const last = block.sets[block.sets.length - 1];
    onChange({
      ...block,
      sets: [...block.sets, newSet(block.sets.length + 1, last)],
    });
  }

  function removeSet(setId: string) {
    onChange({
      ...block,
      sets: block.sets
        .filter((s) => s.id !== setId)
        .map((s, i) => ({ ...s, set_number: i + 1 })),
    });
  }

  const color = getMuscleColor(block.exercise.muscle_group || 'Other');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      {/* Exercise header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Dumbbell className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white text-sm">{block.exercise.name}</p>
          {block.exercise.muscle_group && (
            <p className="text-xs text-slate-500">{block.exercise.muscle_group}</p>
          )}
        </div>
        <button onClick={onStartTimer} className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all" title="Start rest timer">
          <Timer className="w-4 h-4" />
        </button>
        <button onClick={onRemove} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sets table */}
      <div className="p-4">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 mb-2 px-2">
          <div className="col-span-1 text-xs text-slate-600 text-center">SET</div>
          <div className="col-span-4 text-xs text-slate-600 text-center">WEIGHT (kg)</div>
          <div className="col-span-4 text-xs text-slate-600 text-center">REPS</div>
          <div className="col-span-2 text-xs text-slate-600 text-center">RPE</div>
          <div className="col-span-1" />
        </div>

        {/* Set rows */}
        <div className="space-y-2">
          {block.sets.map((set) => (
            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
              {/* Set number */}
              <div className="col-span-1 text-center">
                <button
                  onClick={() => updateSet(set.id, 'is_warmup', !set.is_warmup)}
                  className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center mx-auto transition-all"
                  style={{
                    background: set.is_warmup ? 'rgba(251,191,36,0.15)' : 'var(--bg-elevated)',
                    color: set.is_warmup ? 'var(--accent-amber)' : '#64748b',
                  }}
                  title={set.is_warmup ? 'Warmup set' : 'Working set'}
                >
                  {set.is_warmup ? 'W' : set.set_number}
                </button>
              </div>

              {/* Weight */}
              <div className="col-span-4">
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 rounded-lg text-center text-sm text-white font-medium"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
                />
              </div>

              {/* Reps */}
              <div className="col-span-4">
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 rounded-lg text-center text-sm text-white font-medium"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
                />
              </div>

              {/* RPE */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={set.rpe}
                  onChange={(e) => updateSet(set.id, 'rpe', e.target.value)}
                  placeholder="—"
                  min="1"
                  max="10"
                  className="w-full px-2 py-2 rounded-lg text-center text-xs text-slate-400"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
                />
              </div>

              {/* Delete set */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeSet(set.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add set button */}
        <button
          onClick={addSet}
          className="w-full mt-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:text-white text-slate-400"
          style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-default)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Set
        </button>
      </div>
    </div>
  );
}

// ---- MAIN PAGE ----
export default function NewWorkoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { startRestTimer } = useAppStore();

  const [workoutName, setWorkoutName] = useState('');
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(new Date());

  // Load exercises
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setExercises(data || []);
    }
    load();

    // Default workout name based on time of day
    const hour = new Date().getHours();
    const prefix = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    setWorkoutName(`${prefix} Session`);
  }, []);

  function addExercise(exercise: Exercise) {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exercise,
        sets: [newSet(1)],
      },
    ]);
  }

  function updateBlock(id: string, updated: ExerciseBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleSave(completed: boolean) {
    if (!workoutName.trim()) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      // Calculate total volume
      let totalVolume = 0;
      blocks.forEach((block) => {
        block.sets.forEach((set) => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps) || 0;
          if (!set.is_warmup) totalVolume += w * r;
        });
      });

      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          name: workoutName,
          started_at: startTime.toISOString(),
          completed_at: completed ? endTime.toISOString() : null,
          duration_minutes: durationMinutes,
          total_volume: totalVolume,
          is_completed: completed,
        })
        .select()
        .single();

      if (sessionError || !session) throw sessionError;

      // Insert exercise logs
      const logRows: Omit<ExerciseLog, 'id' | 'logged_at'>[] = [];

      for (const block of blocks) {
        for (const set of block.sets) {
          if (!set.reps && !set.weight) continue; // Skip empty sets

          logRows.push({
            session_id: session.id,
            exercise_id: block.exercise.id,
            set_number: set.set_number,
            reps: parseInt(set.reps) || null,
            weight: parseFloat(set.weight) || null,
            rpe: parseFloat(set.rpe) || null,
            is_failure: set.is_failure,
            is_warmup: set.is_warmup,
            tempo: null,
            notes: set.notes || null,
          });
        }
      }

      if (logRows.length > 0) {
        await supabase.from('exercise_logs').insert(logRows as any);
      }

      // Check for PRs
      for (const block of blocks) {
        const workingSets = block.sets.filter((s) => !s.is_warmup && s.weight && s.reps);
        for (const set of workingSets) {
          const w = parseFloat(set.weight);
          const r = parseInt(set.reps);
          const est1rm = calculate1RM(w, r);

          await supabase
            .from('personal_records')
            .upsert({
              user_id: user.id,
              exercise_id: block.exercise.id,
              record_type: 'estimated_1rm',
              value: est1rm,
              achieved_at: new Date().toISOString(),
              session_id: session.id,
            }, { onConflict: 'user_id,exercise_id,record_type', ignoreDuplicates: false });
        }
      }

      router.push(`/dashboard/workouts/${session.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalVolume = blocks.reduce((sum, block) =>
    sum + block.sets.reduce((s2, set) => {
      if (set.is_warmup) return s2;
      return s2 + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
    }, 0), 0);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <input
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="flex-1 text-xl font-display font-bold text-white bg-transparent outline-none placeholder-slate-600"
          placeholder="Workout name..."
        />
      </div>

      {/* Volume badge */}
      {totalVolume > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 mb-6"
        >
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--accent-blue)' }}
          >
            {totalVolume.toLocaleString()}kg total volume
          </div>
        </motion.div>
      )}

      {/* Exercise blocks */}
      <div className="space-y-4 mb-4">
        <AnimatePresence mode="popLayout">
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ExerciseBlockCard
                block={block}
                onChange={(updated) => updateBlock(block.id, updated)}
                onRemove={() => removeBlock(block.id)}
                onStartTimer={() => startRestTimer(90)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add exercise */}
      <AnimatePresence>
        {showSearch ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExerciseSearch
              exercises={exercises}
              onSelect={addExercise}
              onClose={() => setShowSearch(false)}
            />
          </motion.div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all"
            style={{ border: '1px dashed var(--border-default)' }}
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        )}
      </AnimatePresence>

      {/* Save buttons — sticky at bottom */}
      {blocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 lg:left-[260px]"
          style={{ background: 'linear-gradient(to top, var(--bg-primary) 80%, transparent)' }}
        >
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-medium text-sm text-slate-300 transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !workoutName.trim()}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Finish Workout
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
