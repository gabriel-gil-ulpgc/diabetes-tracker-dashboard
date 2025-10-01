import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Usar datos estáticos de usuarios que realmente tienen datos en Kubios
    const realUsers = [
      { user_id: 'd485bbca-20dc-4d69-b471-ee9c5833829c', name: 'Hugo Duran Miguel', email: 'hugoduranmiguel13@gmail.com', measurement_count: 33 },
      { user_id: 'ccb2ebf3-ab5a-4cc6-8fa0-7f666955dc96', name: 'Beatriz Montesdeoca Henriquez', email: 'beatrizmh27@gmail.com', measurement_count: 46 },
      { user_id: '89ae06a6-567d-4e55-864c-66731067d0b4', name: 'Cristina Montiel', email: 'montielcaminoscristina@gmail.com', measurement_count: 11 }
    ]

    return NextResponse.json({ users: realUsers })
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

