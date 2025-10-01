import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!tableName) {
      return NextResponse.json(
        { success: false, error: 'Nombre de tabla requerido' },
        { status: 400 }
      )
    }

    // Verificar que la tabla existe y es accesible
    const { data, error, count } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al acceder a la tabla ${tableName}`,
          details: error.message
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      tableName,
      data: data || [],
      totalRecords: count || 0,
      returnedRecords: data?.length || 0,
      limit
    })

  } catch (error) {
    console.error('Error fetching table data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener datos de la tabla',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
