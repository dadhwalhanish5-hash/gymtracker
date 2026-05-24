// app/dashboard/body-stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Scale, Loader2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { BodyMetric } from '@/types/database';

function MetricInput({ label, value, onChange, unit = 'cm' }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div className="flex">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="flex-1 px-3 py-2.5 rounded-l-xl text-white text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
        />
        <span
          className="px-3 flex items-center text-xs text-slate-500 rounded-r-xl"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderLeft: 'none' }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function BodyStatsPage() {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    weight: '', waist: '', chest: '', arms: '', thighs: '', body_fat: '', notes: '',
  });

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true })
      .limit(60);
    setMetrics(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('body_metrics') as any).upsert({
      user_id: user.id,
      recorded_at: format(new Date(), 'yyyy-MM-dd'),
      weight: form.weight ? parseFloat(form.weight) : null,
      waist: form.waist ? parseFloat(form.waist) : null,
      chest: form.chest ? parseFloat(form.chest) : null,
      arms: form.arms ? parseFloat(form.arms) : null,
      thighs: form.thighs ? parseFloat(form.thighs) : null,
      body_fat_percentage: form.body_fat ? parseFloat(form.body_fat) : null,
      notes: form.notes || null,
    }, { onConflict: 'user_id,recorded_at' });

    setForm({ weight: '', waist: '', chest: '', arms: '', thighs: '', body_fat: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  const weightData = metrics
    .filter((m) => m.weight)
    .map((m) => ({ date: format(parseISO(m.recorded_at), 'MMM d'), weight: m.weight }));

  const latest = metrics[metrics.length - 1];
  const first = metrics[0];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Body Stats</h1>
          <p className="text-slate-500 text-sm mt-1">Track your physical changes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          <Plus className="w-4 h-4" /> Log Today
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-medium text-white">Log {format(new Date(), 'MMM d, yyyy')}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <MetricInput label="Weight" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} unit="kg" />
            <MetricInput label="Waist" value={form.waist} onChange={(v) => setForm({ ...form, waist: v })} />
            <MetricInput label="Chest" value={form.chest} onChange={(v) => setForm({ ...form, chest: v })} />
            <MetricInput label="Arms" value={form.arms} onChange={(v) => setForm({ ...form, arms: v })} />
            <MetricInput label="Thighs" value={form.thighs} onChange={(v) => setForm({ ...form, thighs: v })} />
            <MetricInput label="Body Fat" value={form.body_fat} onChange={(v) => setForm({ ...form, body_fat: v })} unit="%" />
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (optional)..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-600 resize-none mb-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', outline: 'none' }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Entry
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-20">
          <Scale className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No measurements yet</p>
          <p className="text-slate-600 text-sm mt-1">Log today to start tracking</p>
        </div>
      ) : (
        <>
          {/* Weight trend chart */}
          {weightData.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-white">Weight Trend</h2>
                {latest?.weight && first?.weight && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: latest.weight < first.weight ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                      color: latest.weight < first.weight ? 'var(--accent-emerald)' : 'var(--accent-red)',
                    }}
                  >
                    {latest.weight < first.weight ? '↓' : '↑'} {Math.abs(latest.weight - first.weight).toFixed(1)}kg
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 12 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ fill: 'var(--accent-cyan)', r: 3 }} name="Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Recent entries */}
          <div>
            <h2 className="font-display font-semibold text-white mb-4">History</h2>
            <div className="space-y-3">
              {[...metrics].reverse().slice(0, 10).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">{format(parseISO(m.recorded_at), 'MMMM d, yyyy')}</p>
                    {m.weight && <span className="text-sm font-bold" style={{ color: 'var(--accent-cyan)' }}>{m.weight}kg</span>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {m.waist && <span className="text-xs text-slate-400">Waist: <strong className="text-white">{m.waist}cm</strong></span>}
                    {m.chest && <span className="text-xs text-slate-400">Chest: <strong className="text-white">{m.chest}cm</strong></span>}
                    {m.arms && <span className="text-xs text-slate-400">Arms: <strong className="text-white">{m.arms}cm</strong></span>}
                    {m.thighs && <span className="text-xs text-slate-400">Thighs: <strong className="text-white">{m.thighs}cm</strong></span>}
                    {m.body_fat_percentage && <span className="text-xs text-slate-400">BF: <strong className="text-white">{m.body_fat_percentage}%</strong></span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
