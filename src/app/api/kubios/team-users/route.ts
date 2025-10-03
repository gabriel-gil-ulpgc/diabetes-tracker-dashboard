import { NextRequest, NextResponse } from 'next/server'
import { KubiosService } from '@/lib/kubios-service'

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Obteniendo usuarios del equipo...')
    
    // Crear instancia del servicio de Kubios
    const kubiosService = new KubiosService()

    try {
      // Intentar obtener usuarios reales del equipo
      const teamUsers = await kubiosService.getTeamUsers()
      
      if (teamUsers.length > 0) {
        console.log(`✅ Obtenidos ${teamUsers.length} usuarios reales del equipo`)
        
        // Calcular el conteo de mediciones para cada usuario y filtrar los que no tienen datos
        const usersWithCounts = await Promise.all(
          teamUsers.map(async (user: any) => {
            try {
              console.log(`📊 Calculando mediciones para ${user.name}...`)
              
              // Obtener el conteo de mediciones de forma eficiente
              const measurementCount = await kubiosService.getHRVResultsCount(user.user_id)
              
              console.log(`📊 ${user.name}: ${measurementCount} mediciones encontradas`)
              
              return {
                ...user,
                measurement_count: measurementCount,
                has_measurements: measurementCount > 0
              }
            } catch (error) {
              console.warn(`⚠️ Error obteniendo mediciones para ${user.name}:`, error)
              return {
                ...user,
                measurement_count: 0,
                has_measurements: false
              }
            }
          })
        )
        
        // Filtrar usuarios que no tienen mediciones
        const usersWithMeasurements = usersWithCounts.filter(user => user.has_measurements)
        
        console.log(`📋 Usuarios con mediciones: ${usersWithMeasurements.length}/${usersWithCounts.length}`)
        console.log(`📋 Usuarios filtrados:`, JSON.stringify(usersWithMeasurements.slice(0, 3), null, 2))
        
        return NextResponse.json({ 
          users: usersWithMeasurements,
          total_users: usersWithCounts.length,
          users_with_measurements: usersWithMeasurements.length,
          source: 'kubios_api'
        })
      } else {
        throw new Error('No se encontraron usuarios del equipo')
      }
    } catch (error) {
      console.log('🔄 Usando datos estáticos debido a error:', error)
      
      // Usar datos estáticos como fallback (solo usuarios con mediciones)
      const realUsers = [
        { user_id: 'd485bbca-20dc-4d69-b471-ee9c5833829c', name: 'Hugo Duran Miguel', email: 'hugoduranmiguel13@gmail.com', measurement_count: 33, has_measurements: true },
        { user_id: 'ccb2ebf3-ab5a-4cc6-8fa0-7f666955dc96', name: 'Beatriz Montesdeoca Henriquez', email: 'beatrizmh27@gmail.com', measurement_count: 46, has_measurements: true },
        { user_id: '89ae06a6-567d-4e55-864c-66731067d0b4', name: 'Cristina Montiel', email: 'montielcaminoscristina@gmail.com', measurement_count: 11, has_measurements: true }
      ]

      return NextResponse.json({ 
        users: realUsers,
        total_users: realUsers.length,
        users_with_measurements: realUsers.length,
        source: 'static_data',
        message: 'Datos estáticos - Servicio de Kubios no disponible'
      })
    }
  } catch (error) {
    console.error('Error en API team-users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generateUserIdFromName(name: string): string {
  // Mapeo de nombres reales a user_ids conocidos
  const nameToIdMap: { [key: string]: string } = {
    'Hugo Duran Miguel': 'd485bbca-20dc-4d69-b471-ee9c5833829c',
    'Beatriz Montesdeoca Henriquez': 'ccb2ebf3-ab5a-4cc6-8fa0-7f666955dc96',
    'Cristina Montiel': '89ae06a6-567d-4e55-864c-66731067d0b4'
  }
  
  // Si tenemos un mapeo conocido, usarlo
  if (nameToIdMap[name]) {
    return nameToIdMap[name]
  }
  
  // Para nombres nuevos, generar un ID único basado en el nombre
  const nameHash = name.toLowerCase().replace(/\s+/g, '').substring(0, 8)
  return `${nameHash}-${Math.random().toString(36).substring(2, 15)}`
}

function generateEmailFromName(name: string): string {
  // Generar un email basado en el nombre
  const namePart = name.toLowerCase().replace(/\s+/g, '.').substring(0, 20)
  return `${namePart}@example.com`
}

