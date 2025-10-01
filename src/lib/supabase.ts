import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://byzrronowbnffarazhps.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enJyb25vd2JuZmZhcmF6aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzExMTMsImV4cCI6MjA2NTIwNzExM30.8Yl1kAJu6bBP1ZX0MQ7l5jVqBM6QcMjqP0ADNGnnibI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  UserID: number
  Username: string
  PasswordHash: string
  UUID: string | null
  GDPRConsent: boolean
  GDPRConsentDate: string | null
  sexo: string | null
  bomba_insulina: boolean
  role: 'admin' | 'doctor' | 'user'
}

// Interfaces para los datos reales de la aplicación
export interface InsulinData {
  id: string
  username: string
  insulinType: string
  dose: string
  date_time: string
  actualDateTime: string
  insulintype_iv?: string
  dose_iv?: string
}

export interface FoodData {
  id: string
  username: string
  food_type: string
  quantity: string
  carbs: string
  date_time: string
  food_type_iv?: string
  quantity_iv?: string
  carbs_iv?: string
}

export interface ExerciseData {
  id: string
  username: string
  exercise_type: string
  intensity: string
  exercise_start_time: string
  exercise_end_time: string
  exercise_description: string
  date_time: string
  exercise_type_iv?: string
  exercise_description_iv?: string
}

export interface PeriodRecord {
  id: string
  username: string
  startDate: string
  endDate: string
  intensity: string
  symptoms: string[]
  notes: string
  date_time: string
  intensity_iv?: string
  symptoms_iv?: string[]
  notes_iv?: string
}

export interface MoodData {
  id: string
  username: string
  mood_value: number
  out_of_routine: boolean
  routine_description: string
  emotions: string[]
  other_emotion: string
  date_time: string
  routine_description_iv?: string
  emotions_iv?: string[]
  other_emotion_iv?: string
}

// Tipos de roles disponibles
export type UserRole = 'admin' | 'doctor' | 'user'

// Permisos por rol
export const ROLE_PERMISSIONS = {
  admin: [
    'view_dashboard',
    'view_users',
    'manage_users',
    'view_data',
    'export_data',
    'view_analytics',
    'view_kubios',
    'view_study',
    'view_admin',
    'manage_database',
    'manage_settings',
    'view_all_data'
  ],
  doctor: [
    'view_dashboard',
    'view_users',
    'view_data',
    'export_data',
    'view_analytics',
    'view_kubios',
    'view_study',
    'view_patient_data'
  ],
  user: [
    'view_dashboard',
    'view_own_data',
    'view_own_analytics'
  ]
} as const 