import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Lista de tablas conocidas de la aplicación
    const knownTables = [
      'users',            // 17 registros
      'insulindata',      // 252 registros - Datos de insulina
      'fooddata',         // 273 registros - Datos de comida
      'exercisedata',     // 44 registros - Datos de ejercicio
      'mooddata',         // 46 registros - Datos de estado de ánimo
      'periodrecords',    // 5 registros - Datos de períodos
      'polar_data',       // 0 registros - Datos del Polar H10
      // Tablas adicionales (probablemente vacías)
      'insulin_data', 
      'food_data', 
      'exercise_data', 
      'period_data', 
      'mood_data',
      'insulin',
      'food',
      'exercise',
      'period',
      'mood',
      'hrv_data',
      'hrv_results',
      'user_data',
      'health_data',
      'medical_data',
      'patient_data',
      'measurements',
      'records',
      'logs',
      'sessions',
      'auth_users',
      'profiles'
    ]

    const accessibleTables = []
    let totalRecords = 0

    // Verificar cada tabla
    for (const table of knownTables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error && count !== null) {
          accessibleTables.push({
            name: table,
            recordCount: count || 0,
            accessible: true
          })
          totalRecords += count || 0
        } else {
          accessibleTables.push({
            name: table,
            recordCount: 0,
            accessible: false,
            error: error?.message || 'Unknown error'
          })
        }
      } catch (e) {
        accessibleTables.push({
          name: table,
          recordCount: 0,
          accessible: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      tables: accessibleTables,
      totalRecords,
      accessibleCount: accessibleTables.filter(t => t.accessible).length,
      totalCount: accessibleTables.length
    })

  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener información de las tablas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
