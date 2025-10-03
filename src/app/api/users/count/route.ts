import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://byzrronowbnffarazhps.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enJyb25vd2JuZmZhcmF6aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzExMTMsImV4cCI6MjA2NTIwNzExM30.8Yl1kAJu6bBP1ZX0MQ7l5jVqBM6QcMjqP0ADNGnnibI'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Obtener el conteo de usuarios de la tabla users
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching user count:', error)
      return NextResponse.json({ count: 0, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error in users count API:', error)
    return NextResponse.json({ count: 0, error: 'Internal server error' }, { status: 500 })
  }
}

