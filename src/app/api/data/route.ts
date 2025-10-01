import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const range = searchParams.get('range') || '30'

    // Calcular fecha de inicio basada en el rango
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(range))

    let data: any[] = []

    switch (type) {
      case 'exercise':
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercise_data')
          .select('*')
          .gte('date_time', startDate.toISOString())
          .lte('date_time', endDate.toISOString())
          .order('date_time', { ascending: false })
        
        if (exerciseError) {
          console.error('Error obteniendo datos de ejercicio:', exerciseError)
          data = []
        } else {
          data = exerciseData || []
        }
        break

      case 'mood':
        const { data: moodData, error: moodError } = await supabase
          .from('mood_data')
          .select('*')
          .gte('date_time', startDate.toISOString())
          .lte('date_time', endDate.toISOString())
          .order('date_time', { ascending: false })
        
        if (moodError) {
          console.error('Error obteniendo datos de estado de ánimo:', moodError)
          data = []
        } else {
          data = moodData || []
        }
        break

      case 'insulin':
        const { data: insulinData, error: insulinError } = await supabase
          .from('insulin_data')
          .select('*')
          .gte('date_time', startDate.toISOString())
          .lte('date_time', endDate.toISOString())
          .order('date_time', { ascending: false })
        
        if (insulinError) {
          console.error('Error obteniendo datos de insulina:', insulinError)
          data = []
        } else {
          data = insulinData || []
        }
        break

      case 'meal':
        const { data: mealData, error: mealError } = await supabase
          .from('food_data')
          .select('*')
          .gte('date_time', startDate.toISOString())
          .lte('date_time', endDate.toISOString())
          .order('date_time', { ascending: false })
        
        if (mealError) {
          console.error('Error obteniendo datos de comida:', mealError)
          data = []
        } else {
          data = mealData || []
        }
        break

      default:
        // Devolver todos los tipos de datos
        const [exerciseRes, moodRes, insulinRes, mealRes] = await Promise.all([
          supabase.from('exercise_data').select('*').gte('date_time', startDate.toISOString()).lte('date_time', endDate.toISOString()).order('date_time', { ascending: false }),
          supabase.from('mood_data').select('*').gte('date_time', startDate.toISOString()).lte('date_time', endDate.toISOString()).order('date_time', { ascending: false }),
          supabase.from('insulin_data').select('*').gte('date_time', startDate.toISOString()).lte('date_time', endDate.toISOString()).order('date_time', { ascending: false }),
          supabase.from('food_data').select('*').gte('date_time', startDate.toISOString()).lte('date_time', endDate.toISOString()).order('date_time', { ascending: false })
        ])

        return NextResponse.json({
          exercise: exerciseRes.data || [],
          mood: moodRes.data || [],
          insulin: insulinRes.data || [],
          meal: mealRes.data || []
        })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en API /data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

