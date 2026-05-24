// components/layout/AppShell.tsx
// The main application shell with sidebar navigation
// 'use client' because it uses interactive state (sidebar open/close)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, BarChart3, Calendar, Scale,
  BookTemplate, Menu, X, LogOut, Zap, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import type { Profile } from '@/types/database';
import RestTimerWidget from '@/components/ui/RestTimerWidget';

// Navigation items — path, icon, label
const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/dashboard/exercises', icon: Zap, label: 'Exercises' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard/body-stats', icon: Scale, label: 'Body Stats' },
  { href: '/dashboard/templates', icon: BookTemplate, label: 'Templates' },
];

interface AppShellProps {
  children: React.ReactNode;
  profile: Profile | null;
}

export default function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isSidebarOpen, setSidebarOpen, toggleSidebar, setProfile } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (profile) setProfile(profile);
  }, [profile, setProfile]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !isSidebarOpen ? -280 : 0,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed lg:relative z-50 flex flex-col w-[260px] h-full shrink-0"
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">GymTracker</span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User pill */}
        {profile && (
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
              >
                {(profile.display_name || profile.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile.display_name || profile.username}</p>
                <p className="text-xs text-slate-500">{profile.unit_preference}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative"
                style={{
                  color: active ? 'white' : '#94a3b8',
                  background: active ? 'var(--bg-elevated)' : 'transparent',
                }}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: 'var(--accent-blue)' }}
                  />
                )}
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: active ? 'var(--accent-blue)' : 'inherit' }}
                />
                <span>{label}</span>
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto" style={{ color: 'var(--accent-blue)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left text-slate-400 hover:text-white hover:bg-red-500/10 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar (mobile only) */}
        <header
          className="flex items-center gap-4 px-4 py-3 lg:hidden border-b shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
        >
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-white">GymTracker</span>
        </header>

        {/* Rest timer (floats above content) */}
        <RestTimerWidget />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
