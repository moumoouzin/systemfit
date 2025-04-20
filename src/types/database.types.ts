
import { Database as SupabaseDatabase } from "@/integrations/supabase/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database extends Omit<SupabaseDatabase, 'public'> {
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
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
          weight?: number
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
        Relationships: [
          {
            foreignKeyName: "exercise_weights_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
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
