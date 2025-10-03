import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo para cuando Python no esté disponible
const MOCK_HRV_RESULTS = [
  {
    result_id: "mock_result_1",
    measure_id: "mock_measure_1",
    measured_timestamp: new Date().toISOString(),
    user_id: "self",
    user_name: "Usuario Demo",
    stress_level: 45,
    recovery_time: 72,
    hrv_score: 85,
    resting_hr: 65,
    rmssd: 42.5,
    pns_index: 75,
    sns_index: 25,
    mean_rr: 920,
    sdnn: 58.3,
    respiratory_rate: 14.2,
    lf_power: 0.35,
    hf_power: 0.65,
    quality: "good",
    readiness_percentage: 78,
    readiness_level: "good",
    feeling_score: 7,
    acute_fatigue: 2.1,
    chronic_fatigue: 1.8,
    user_happiness: 8
  },
  {
    result_id: "mock_result_2",
    measure_id: "mock_measure_2",
    measured_timestamp: new Date(Date.now() - 86400000).toISOString(), // Ayer
    user_id: "self",
    user_name: "Usuario Demo",
    stress_level: 38,
    recovery_time: 68,
    hrv_score: 92,
    resting_hr: 62,
    rmssd: 48.2,
    pns_index: 82,
    sns_index: 18,
    mean_rr: 950,
    sdnn: 62.1,
    respiratory_rate: 13.8,
    lf_power: 0.28,
    hf_power: 0.72,
    quality: "excellent",
    readiness_percentage: 85,
    readiness_level: "excellent",
    feeling_score: 8,
    acute_fatigue: 1.5,
    chronic_fatigue: 1.2,
    user_happiness: 9
  }
]

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

    console.log(`🔄 Usando datos de ejemplo para usuario: ${userId}`)
    console.log(`📅 Filtros: ${fromDate || 'sin filtro'} - ${toDate || 'sin filtro'}`)

    // Filtrar por fechas si se proporcionan
    let filteredResults = MOCK_HRV_RESULTS
    if (fromDate || toDate) {
      filteredResults = MOCK_HRV_RESULTS.filter((result: any) => {
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
      source: 'mock_data',
      message: 'Datos de ejemplo - Python no disponible'
    })
  } catch (error) {
    console.error('Error en API hrv-results-fallback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
