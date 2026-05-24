// app/dashboard/templates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, BookTemplate, ChevronRight, Loader2, Dumbbell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Template } from '@/types/database';

const SPLIT_COLORS: Record<string, string> = {
  push: 'var(--accent-blue)',
  pull: 'var(--accent-purple)',
  legs: 'var(--accent-emerald)',
  upper: 'var(--accent-amber)',
  lower: 'var(--accent-cyan)',
  custom: 'var(--accent-red)',
};

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTemplates(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const presets = [
    { name: 'Push Day', split: 'push', desc: 'Chest, shoulders, triceps' },
    { name: 'Pull Day', split: 'pull', desc: 'Back, biceps' },
    { name: 'Leg Day', split: 'legs', desc: 'Quads, hamstrings, calves' },
    { name: 'Upper Body', split: 'upper', desc: 'Full upper body' },
    { name: 'Lower Body', split: 'lower', desc: 'Full lower body' },
  ];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Templates</h1>
          <p className="text-slate-500 text-sm mt-1">Save and reuse your workout structures</p>
        </div>
      </div>

      {/* Quick starts */}
      <div>
        <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Start Splits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {presets.map(({ name, split, desc }) => {
            const color = SPLIT_COLORS[split] || 'var(--accent-blue)';
            return (
              <Link
                key={name}
                href={`/dashboard/workouts/new?template=${split}`}
                className="p-4 rounded-xl transition-all group hover:border-blue-500/30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${color}20` }}
                >
                  <Dumbbell className="w-4 h-4" style={{ color }} />
                </div>
                <p className="font-medium text-white text-sm">{name}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Saved templates */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : templates.length > 0 ? (
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Saved Templates</h2>
          <div className="space-y-3">
            {templates.map((t, i) => {
              const color = SPLIT_COLORS[t.split_type || 'custom'] || 'var(--accent-blue)';
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                      <BookTemplate className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{t.name}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                    </div>
                    <Link
                      href={`/dashboard/workouts/new?templateId=${t.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${color}15`, color }}
                    >
                      Use
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <BookTemplate className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No saved templates yet</p>
          <p className="text-slate-600 text-xs mt-1">Complete workouts and save them as templates</p>
        </div>
      )}
    </div>
  );
}
