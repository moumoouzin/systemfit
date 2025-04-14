
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          level: number
          xp: number
          strength: number
          vitality: number
          focus: number
          days_trained_this_week: number
          streak_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          level?: number
          xp?: number
          strength?: number
          vitality?: number
          focus?: number
          days_trained_this_week?: number
          streak_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          level?: number
          xp?: number
          strength?: number
          vitality?: number
          focus?: number
          days_trained_this_week?: number
          streak_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          workout_id: string
          name: string
          sets: number
          reps: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          name: string
          sets?: number
          reps?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          name?: string
          sets?: number
          reps?: number
          created_at?: string
          updated_at?: string
        }
      }
      exercise_weights: {
        Row: {
          id: string
          exercise_id: string
          user_id: string
          weight: number
          is_latest: boolean
          created_at: string
        }
        Insert: {
          id?: string
          exercise_id: string
          user_id: string
          weight: number
          is_latest?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          exercise_id?: string
          user_id?: string
          weight?: number
          is_latest?: boolean
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          date: string
          completed: boolean
          xp_earned: number | null
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          date?: string
          completed?: boolean
          xp_earned?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          date?: string
          completed?: boolean
          xp_earned?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
