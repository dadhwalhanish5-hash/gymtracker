-- ================================================
-- GymTracker Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------
-- USERS TABLE (extends Supabase auth.users)
-- ------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  unit_preference TEXT DEFAULT 'kg' CHECK (unit_preference IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- EXERCISES TABLE (user-created exercises)
-- ------------------------------------------------
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  exercise_type TEXT DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'other')),
  equipment TEXT,
  notes TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- WORKOUT TEMPLATES
-- ------------------------------------------------
CREATE TABLE public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  split_type TEXT, -- 'push', 'pull', 'legs', 'upper', 'lower', 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.template_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  target_sets INTEGER,
  target_reps TEXT, -- e.g. "8-12"
  target_weight DECIMAL,
  rest_seconds INTEGER DEFAULT 90
);

-- ------------------------------------------------
-- WORKOUT SESSIONS
-- ------------------------------------------------
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume DECIMAL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- EXERCISE LOGS (sets within a session)
-- ------------------------------------------------
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL,
  rpe DECIMAL CHECK (rpe >= 1 AND rpe <= 10),
  is_failure BOOLEAN DEFAULT false,
  is_warmup BOOLEAN DEFAULT false,
  tempo TEXT, -- e.g. "3-1-2-0"
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- PERSONAL RECORDS
-- ------------------------------------------------
CREATE TABLE public.personal_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'estimated_1rm')),
  value DECIMAL NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  UNIQUE(user_id, exercise_id, record_type)
);

-- ------------------------------------------------
-- BODY METRICS
-- ------------------------------------------------
CREATE TABLE public.body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE,
  weight DECIMAL,
  waist DECIMAL,
  chest DECIMAL,
  arms DECIMAL,
  thighs DECIMAL,
  body_fat_percentage DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_at)
);

-- ------------------------------------------------
-- REST DAYS
-- ------------------------------------------------
CREATE TABLE public.rest_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rest_date DATE NOT NULL,
  sleep_hours DECIMAL,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  soreness_level INTEGER CHECK (soreness_level BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rest_date)
);

-- ------------------------------------------------
-- ACHIEVEMENTS / BADGES
-- ------------------------------------------------
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- ------------------------------------------------
-- INDEXES for performance
-- ------------------------------------------------
CREATE INDEX idx_exercise_logs_session ON public.exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise ON public.exercise_logs(exercise_id);
CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON public.workout_sessions(started_at);
CREATE INDEX idx_body_metrics_user ON public.body_metrics(user_id);
CREATE INDEX idx_body_metrics_date ON public.body_metrics(recorded_at);
CREATE INDEX idx_exercises_user ON public.exercises(user_id);
CREATE INDEX idx_personal_records_user ON public.personal_records(user_id, exercise_id);

-- ------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data
-- ------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rest_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Exercises policies
CREATE POLICY "Users can manage own exercises" ON public.exercises FOR ALL USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own template exercises" ON public.template_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM public.templates WHERE id = template_id AND user_id = auth.uid()));

-- Workout sessions policies
CREATE POLICY "Users can manage own sessions" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can manage own logs" ON public.exercise_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE id = session_id AND user_id = auth.uid()));

-- Personal records
CREATE POLICY "Users can manage own PRs" ON public.personal_records FOR ALL USING (auth.uid() = user_id);

-- Body metrics
CREATE POLICY "Users can manage own metrics" ON public.body_metrics FOR ALL USING (auth.uid() = user_id);

-- Rest days
CREATE POLICY "Users can manage own rest days" ON public.rest_days FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users can view own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ------------------------------------------------

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed default exercises for new users
CREATE OR REPLACE FUNCTION public.seed_default_exercises(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.exercises (user_id, name, muscle_group, exercise_type, is_custom) VALUES
    (p_user_id, 'Bench Press', 'Chest', 'strength', false),
    (p_user_id, 'Incline Bench Press', 'Chest', 'strength', false),
    (p_user_id, 'Incline Smith Press', 'Chest', 'strength', false),
    (p_user_id, 'Cable Fly', 'Chest', 'strength', false),
    (p_user_id, 'Machine Fly', 'Chest', 'strength', false),
    (p_user_id, 'Squat', 'Legs', 'strength', false),
    (p_user_id, 'Leg Press', 'Legs', 'strength', false),
    (p_user_id, 'Romanian Deadlift', 'Legs', 'strength', false),
    (p_user_id, 'Leg Curl', 'Legs', 'strength', false),
    (p_user_id, 'Leg Extension', 'Legs', 'strength', false),
    (p_user_id, 'Deadlift', 'Back', 'strength', false),
    (p_user_id, 'Pull-up', 'Back', 'strength', false),
    (p_user_id, 'Lat Pulldown', 'Back', 'strength', false),
    (p_user_id, 'Cable Row', 'Back', 'strength', false),
    (p_user_id, 'Barbell Row', 'Back', 'strength', false),
    (p_user_id, 'Overhead Press', 'Shoulders', 'strength', false),
    (p_user_id, 'Lateral Raise', 'Shoulders', 'strength', false),
    (p_user_id, 'Face Pull', 'Shoulders', 'strength', false),
    (p_user_id, 'Bicep Curl', 'Arms', 'strength', false),
    (p_user_id, 'Hammer Curl', 'Arms', 'strength', false),
    (p_user_id, 'Tricep Pushdown', 'Arms', 'strength', false),
    (p_user_id, 'Skull Crusher', 'Arms', 'strength', false),
    (p_user_id, 'Plank', 'Core', 'strength', false),
    (p_user_id, 'Treadmill', 'Cardio', 'cardio', false);
END;
$$ LANGUAGE plpgsql;
