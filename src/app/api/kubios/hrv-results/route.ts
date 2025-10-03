import { NextRequest, NextResponse } from 'next/server'
import { KubiosService } from '@/lib/kubios-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    console.log(`🔍 HRV Results API - Usuario: ${userId}, Fechas: ${fromDate || 'sin filtro'} - ${toDate || 'sin filtro'}`)

    // Crear instancia del servicio de Kubios
    const kubiosService = new KubiosService()

    // Intentar obtener resultados reales de Kubios usando el método directo
    const directResults = await kubiosService.getHRVResultsDirect(userId)
    
    if (directResults && directResults.results && directResults.results.length > 0) {
      console.log(`✅ Obtenidos ${directResults.results.length} resultados reales de Kubios`)
      
      // Filtrar por fechas si se proporcionan
      let filteredResults = directResults.results
      if (fromDate || toDate) {
        filteredResults = directResults.results.filter((result: any) => {
          const resultDate = new Date(result.measured_timestamp)
          const from = fromDate ? new Date(fromDate) : null
          const to = toDate ? new Date(toDate) : null
          
          if (from && resultDate < from) return false
          if (to && resultDate > to) return false
          return true
        })
      }

      // Ordenar por fecha (más reciente primero)
      filteredResults.sort((a: any, b: any) => 
        new Date(b.measured_timestamp).getTime() - new Date(a.measured_timestamp).getTime()
      )

      return NextResponse.json({ 
        results: filteredResults,
        total: filteredResults.length,
        user_id: userId,
        source: 'kubios_api'
      })
    } else {
      // Si el método directo no funciona, intentar con el método original
      const results = await kubiosService.getHRVResults(userId)
      
      if (results.length > 0) {
        console.log(`✅ Obtenidos ${results.length} resultados reales de Kubios (método alternativo)`)
        
        // Filtrar por fechas si se proporcionan
        let filteredResults = results
        if (fromDate || toDate) {
          filteredResults = results.filter((result: any) => {
            const resultDate = new Date(result.measured_timestamp)
            const from = fromDate ? new Date(fromDate) : null
            const to = toDate ? new Date(toDate) : null
            
            if (from && resultDate < from) return false
            if (to && resultDate > to) return false
            return true
          })
        }

        // Ordenar por fecha (más reciente primero)
        filteredResults.sort((a: any, b: any) => 
          new Date(b.measured_timestamp).getTime() - new Date(a.measured_timestamp).getTime()
        )

        return NextResponse.json({ 
          results: filteredResults,
          total: filteredResults.length,
          user_id: userId,
          source: 'kubios_api'
        })
      } else {
        console.log('⚠️ No se encontraron resultados reales para este usuario')
        return NextResponse.json({ 
          results: [],
          total: 0,
          user_id: userId,
          source: 'kubios_api',
          message: 'No hay datos disponibles para este usuario'
        })
      }
    }
  } catch (error) {
    console.error('Error en API hrv-results:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


