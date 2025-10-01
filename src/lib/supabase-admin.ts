import { createClient } from '@supabase/supabase-js'

// Configuración para operaciones de administración con permisos de servicio
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://byzrronowbnffarazhps.supabase.co'

// Usar la clave de servicio para operaciones de administración
// En producción, esta clave debe estar en variables de entorno del servidor
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enJyb25vd2JuZmZhcmF6aHBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYzMTExMywiZXhwIjoyMDY1MjA3MTEzfQ.8Yl1kAJu6bBP1ZX0MQ7l5jVqBM6QcMjqP0ADNGnnibI'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default supabaseAdmin
