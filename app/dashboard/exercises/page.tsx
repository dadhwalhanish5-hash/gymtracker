// app/dashboard/exercises/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Loader2, Dumbbell, ChevronDown, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS, getMuscleColor } from '@/utils/helpers';
import type { Exercise } from '@/types/database';

// Modal for creating/editing exercises
function ExerciseModal({
  open,
  onClose,
  onSave,
  editExercise,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (ex: Partial<Exercise>) => Promise<void>;
  editExercise?: Exercise | null;
}) {
  const [name, setName] = useState(editExercise?.name || '');
  const [muscleGroup, setMuscleGroup] = useState(editExercise?.muscle_group || '');
  const [equipment, setEquipment] = useState(editExercise?.equipment || '');
  const [type, setType] = useState<Exercise['exercise_type']>(editExercise?.exercise_type || 'strength');
  const [notes, setNotes] = useState(editExercise?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editExercise) {
      setName(editExercise.name);
      setMuscleGroup(editExercise.muscle_group || '');
      setEquipment(editExercise.equipment || '');
      setType(editExercise.exercise_type);
      setNotes(editExercise.notes || '');
    } else {
      setName(''); setMuscleGroup(''); setEquipment('');
      setType('strength'); setNotes('');
    }
  }, [editExercise, open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), muscle_group: muscleGroup, equipment, exercise_type: type, notes });
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">
            {editExercise ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Exercise Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Incline Smith Press"
            className="w-full px-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-600"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {/* Muscle group */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Muscle Group</label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setMuscleGroup(m === muscleGroup ? '' : m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: muscleGroup === m ? `${getMuscleColor(m)}20` : 'var(--bg-elevated)',
                  border: `1px solid ${muscleGroup === m ? getMuscleColor(m) : 'var(--border-default)'}`,
                  color: muscleGroup === m ? getMuscleColor(m) : '#94a3b8',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Equipment</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEquipment(e === equipment ? '' : e)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: equipment === e ? 'rgba(79,142,247,0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${equipment === e ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  color: equipment === e ? 'var(--accent-blue)' : '#94a3b8',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Type</label>
          <div className="flex gap-2">
            {(['strength', 'cardio', 'flexibility', 'other'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                style={{
                  background: type === t ? 'rgba(79,142,247,0.15)' : 'var(--bg-elevated)',
                  border: `1px solid ${type === t ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  color: type === t ? 'var(--accent-blue)' : '#94a3b8',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cues, technique notes..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-600 resize-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {editExercise ? 'Save Changes' : 'Create Exercise'}
        </button>
      </motion.div>
    </div>
  );
}

// Exercise card
function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
}) {
  const color = getMuscleColor(exercise.muscle_group || 'Other');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      onClick={() => onEdit(exercise)}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Dumbbell className="w-4 h-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {exercise.muscle_group && (
            <span className="text-xs" style={{ color }}>{exercise.muscle_group}</span>
          )}
          {exercise.equipment && (
            <span className="text-xs text-slate-600">· {exercise.equipment}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(exercise.id); }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ---- MAIN PAGE ----
export default function ExercisesPage() {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);

  async function loadExercises() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    setExercises(data || []);
    setLoading(false);
  }

  useEffect(() => { loadExercises(); }, []);

  async function handleSave(exercise: Partial<Exercise>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editExercise) {
        await (supabase.from('exercises') as any).update(exercise).eq('id', editExercise.id);
      } else {
        await (supabase.from('exercises') as any).insert({ ...exercise, user_id: user.id });
      }
      setEditExercise(null);
      loadExercises();
    }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exercise?')) return;
    await supabase.from('exercises').delete().eq('id', id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function openEdit(ex: Exercise) {
    setEditExercise(ex);
    setModalOpen(true);
  }

  // Filter exercises
  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = !filterMuscle || ex.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  // Group by muscle
  const grouped = MUSCLE_GROUPS.reduce((acc, group) => {
    const items = filtered.filter((e) => e.muscle_group === group);
    if (items.length) acc[group] = items;
    return acc;
  }, {} as Record<string, Exercise[]>);

  const ungrouped = filtered.filter((e) => !e.muscle_group || !MUSCLE_GROUPS.includes(e.muscle_group));
  if (ungrouped.length) grouped['Other'] = ungrouped;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Exercises</h1>
          <p className="text-slate-500 text-sm mt-1">{exercises.length} exercises in your library</p>
        </div>
        <button
          onClick={() => { setEditExercise(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          <Plus className="w-4 h-4" /> New Exercise
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-600"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', outline: 'none' }}
          />
        </div>
        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-slate-300 appearance-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', outline: 'none' }}
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Exercise list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No exercises found</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search or create one</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: getMuscleColor(group) }}
                />
                <h3 className="text-sm font-semibold text-slate-400">{group}</h3>
                <span className="text-xs text-slate-600">({items.length})</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ExerciseModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditExercise(null); }}
            onSave={handleSave}
            editExercise={editExercise}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
