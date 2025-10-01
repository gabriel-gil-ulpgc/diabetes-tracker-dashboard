import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

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

    // Ejecutar el script Python para obtener resultados HRV
    const pythonScript = path.join(process.cwd(), '..', 'kub-kubioscloud-demo', 'kubios_cli.py')
    
    const args = [
      pythonScript,
      '--action', 'hrv-results-direct',
      '--user-id', userId,
      '--count', '10000'  // Aumentar el límite para obtener más datos
    ]

    console.log(`🔍 HRV Results API - Usuario: ${userId}, Fechas: ${fromDate || 'sin filtro'} - ${toDate || 'sin filtro'}`)
    console.log(`📝 Comando Python: python ${args.join(' ')}`)

    return new Promise((resolve, reject) => {
      const python = spawn('python', args, {
        cwd: path.join(process.cwd(), '..', 'kub-kubioscloud-demo')
      })

      let output = ''
      let errorOutput = ''

      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Error ejecutando script Python:', errorOutput)
          resolve(NextResponse.json(
            { error: 'Error al obtener resultados HRV', details: errorOutput },
            { status: 500 }
          ))
          return
        }

        try {
          console.log(`📊 Output del script Python para usuario ${userId}:`)
          console.log(`📄 Output completo: ${output}`)
          console.log(`❌ Error output: ${errorOutput}`)
          
          // Parsear la salida JSON del script Python
          const jsonMatch = output.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            console.log(`❌ No se encontró JSON válido en la salida del script`)
            resolve(NextResponse.json(
              { error: 'No se pudo parsear la respuesta del script Python', output, errorOutput },
              { status: 500 }
            ))
            return
          }

          const pythonResponse = JSON.parse(jsonMatch[0])
          console.log(`📋 Respuesta parseada:`, JSON.stringify(pythonResponse, null, 2))
          
          if (!pythonResponse.success) {
            console.log(`❌ Script Python reportó error: ${pythonResponse.message}`)
            resolve(NextResponse.json(
              { error: pythonResponse.message || 'Error en el script Python' },
              { status: 500 }
            ))
            return
          }

          const results = pythonResponse.data?.results || []
          console.log(`📈 Resultados encontrados: ${results.length} para usuario ${userId}`)
          
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

          resolve(NextResponse.json({ 
            results: filteredResults,
            total: filteredResults.length,
            user_id: userId
          }))
        } catch (parseError) {
          console.error('Error parseando salida Python:', parseError)
          console.error('Output completo:', output)
          resolve(NextResponse.json(
            { error: 'Error al procesar resultados HRV', details: parseError instanceof Error ? parseError.message : 'Error desconocido' },
            { status: 500 }
          ))
        }
      })
    })
  } catch (error) {
    console.error('Error en API hrv-results:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


