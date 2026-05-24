// lib/store.ts
// Zustand is a state management library — think of it as a shared notepad
// that all components can read from and write to

import { create } from 'zustand';
import type { Profile, WorkoutSession, Exercise } from '@/types/database';

interface AppState {
  // User
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Active workout session
  activeSession: WorkoutSession | null;
  setActiveSession: (session: WorkoutSession | null) => void;

  // Timer
  restTimerSeconds: number;
  isTimerRunning: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickTimer: () => void;

  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Exercises cache
  exercises: Exercise[];
  setExercises: (exercises: Exercise[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  restTimerSeconds: 0,
  isTimerRunning: false,
  startRestTimer: (seconds) => set({ restTimerSeconds: seconds, isTimerRunning: true }),
  stopRestTimer: () => set({ restTimerSeconds: 0, isTimerRunning: false }),
  tickTimer: () =>
    set((state) => ({
      restTimerSeconds: state.restTimerSeconds > 0 ? state.restTimerSeconds - 1 : 0,
      isTimerRunning: state.restTimerSeconds > 1,
    })),

  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  exercises: [],
  setExercises: (exercises) => set({ exercises }),
}));
