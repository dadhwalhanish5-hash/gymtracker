// app/login/page.tsx
// Login page — handles email + password authentication
// 'use client' means this runs in the BROWSER (not server)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); // Prevent page refresh (default form behavior)
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard'); // Navigate to dashboard on success
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const username = email.split('@')[0];
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setError('Check your email for a confirmation link!');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-5 shadow-lg shadow-blue-500/25">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">GymTracker</h1>
          <p className="text-slate-400 text-sm">Your personal fitness journey</p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-slate-500 text-sm transition-colors"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-center py-2 px-3 rounded-lg"
                style={{
                  color: error.includes('Check your email') ? 'var(--accent-emerald)' : 'var(--accent-red)',
                  background: error.includes('Check your email')
                    ? 'rgba(52, 211, 153, 0.1)'
                    : 'rgba(248, 113, 113, 0.1)',
                }}
              >
                {error}
              </motion.p>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign In
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
            </div>

            {/* Sign up button */}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-slate-300 transition-all hover:text-white disabled:opacity-60"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Quick access hints */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Two users: om@gymtracker.app & pinky@gymtracker.app
        </p>
      </motion.div>
    </div>
  );
}
