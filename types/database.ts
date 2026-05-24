// types/database.ts
// TypeScript types that match our database tables
// This gives us autocomplete and error checking when working with data

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          unit_preference: 'kg' | 'lbs';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          muscle_group: string | null;
          exercise_type: 'strength' | 'cardio' | 'flexibility' | 'other';
          equipment: string | null;
          notes: string | null;
          is_custom: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          name: string;
          notes: string | null;
          started_at: string;
          completed_at: string | null;
          duration_minutes: number | null;
          total_volume: number;
          is_completed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      exercise_logs: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps: number | null;
          weight: number | null;
          rpe: number | null;
          is_failure: boolean;
          is_warmup: boolean;
          tempo: string | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_logs']['Row'], 'id' | 'logged_at'>;
        Update: Partial<Database['public']['Tables']['exercise_logs']['Insert']>;
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          weight: number | null;
          waist: number | null;
          chest: number | null;
          arms: number | null;
          thighs: number | null;
          body_fat_percentage: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['body_metrics']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['body_metrics']['Insert']>;
      };
      rest_days: {
        Row: {
          id: string;
          user_id: string;
          rest_date: string;
          sleep_hours: number | null;
          energy_level: number | null;
          soreness_level: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rest_days']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rest_days']['Insert']>;
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm';
          value: number;
          achieved_at: string;
          session_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['personal_records']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['personal_records']['Insert']>;
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          split_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['templates']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achieved_at: string;
          metadata: Json | null;
        };
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
    };
  };
}

// Convenience types (shortcuts)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row'];
export type BodyMetric = Database['public']['Tables']['body_metrics']['Row'];
export type RestDay = Database['public']['Tables']['rest_days']['Row'];
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row'];
export type Template = Database['public']['Tables']['templates']['Row'];

// Extended types with joins (when you fetch related data together)
export type WorkoutSessionWithLogs = WorkoutSession & {
  exercise_logs: (ExerciseLog & { exercise: Exercise })[];
};

export type ExerciseWithPR = Exercise & {
  personal_records?: PersonalRecord[];
};
