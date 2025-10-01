import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBackendUrl, config } from '@/lib/config'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://byzrronowbnffarazhps.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enJyb25vd2JuZmZhcmF6aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzExMTMsImV4cCI6MjA2NTIwNzExM30.8Yl1kAJu6bBP1ZX0MQ7l5jVqBM6QcMjqP0ADNGnnibI'
const supabase = createClient(supabaseUrl, supabaseKey)

// Función de descifrado exactamente como en el servidor original
function decryptData(encryptedData: string, iv: string | null): string {
  return decryptOrPlain(encryptedData, iv)
}

// Helper para descifrar o devolver texto plano (exactamente como en el servidor)
function decryptOrPlain(text: string, iv: string | null): string {
  if (!text) return text
  if (typeof text !== 'string') return text
  if (text.startsWith('__PLAIN__')) return text.replace('__PLAIN__', '')
  if (!iv) return text // Si no hay IV, asume texto plano
  try {
    return decrypt(text, iv)
  } catch (e) {
    console.log('⚠️ Fallo descifrado, devolviendo texto original:', text.substring(0, 20) + '...')
    return text // Si falla el descifrado, devuelve el texto original
  }
}

// Función decrypt exactamente como en el servidor
function decrypt(encryptedData: string, iv: string): string {
  // Clave vieja (la que se usaba antes)
  const oldKey = process.env.ENCRYPTION_SECRET_KEY0 || '60a50cbe834cda3dc25fb9cede898cb20ffc76c9647e26022ceb2fece1e09b02'
  // Clave nueva (actual) - la que usa el servidor para cifrar
  const currentKey = process.env.ENCRYPTION_SECRET_KEY || 'db0fdd8f597a24d13796c50d79cc2ea1965d6ab0301cdda78782e2e0d8e48dcc'
  const algorithm = 'aes-256-cbc'

  // Función auxiliar para intentar descifrar con una clave
  function tryDecrypt(key: string, data: string, iv: string): string | null {
    try {
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'))
      let decrypted = decipher.update(data, 'hex', 'utf-8')
      decrypted += decipher.final('utf-8')
      return decrypted
    } catch (error) {
      return null
    }
  }

  // Intentar primero con la clave vieja
  let result = tryDecrypt(oldKey, encryptedData, iv)
  if (result) {
    // Si el resultado sigue siendo hexadecimal largo (doble-cifrado), intentar descifrar de nuevo
    if (/^[0-9a-fA-F]+$/.test(result) && result.length > 32) {
      console.log('🔄 Detectado doble-cifrado con clave vieja, descifrando de nuevo...')
      const doubleResult = tryDecrypt(oldKey, result, iv)
      if (doubleResult) {
        console.log('✅ Segundo descifrado con clave vieja')
        return doubleResult
      }
    }
    console.log('✅ Descifrado con clave vieja')
    return result
  }

  // Si falla con la clave vieja, intentar con la clave nueva
  result = tryDecrypt(currentKey, encryptedData, iv)
  if (result) {
    // Si el resultado sigue siendo hexadecimal largo (doble-cifrado), intentar descifrar de nuevo
    if (/^[0-9a-fA-F]+$/.test(result) && result.length > 32) {
      console.log('🔄 Detectado doble-cifrado con clave nueva, descifrando de nuevo...')
      const doubleResult = tryDecrypt(currentKey, result, iv)
      if (doubleResult) {
        console.log('✅ Segundo descifrado con clave nueva')
        return doubleResult
      }
    }
    console.log('✅ Descifrado con clave nueva')
    return result
  }

  throw new Error('No se pudo descifrar con ninguna clave')
}


// Función para descifrar arrays de datos
function decryptArray(data: any[] | null, iv: string | null): string[] {
  if (!data || !Array.isArray(data)) return []
  
  const decryptedArray = []
  for (const item of data) {
    if (item && typeof item === 'string' && item !== 'undefined' && item !== 'null') {
      const decrypted = decryptData(item, iv)
      decryptedArray.push(decrypted)
    } else {
      decryptedArray.push(item || '')
    }
  }
  return decryptedArray
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Redirigiendo al backend Node.js')
    
    const { searchParams } = new URL(request.url)
    const selectedUser = searchParams.get('selectedUser') || 'all'
    const timeRange = searchParams.get('timeRange') || '30d'
    const selectedDataType = searchParams.get('selectedDataType') || 'all'
    
    console.log(`📊 Parámetros: usuario=${selectedUser}, timeRange=${timeRange}, selectedDataType=${selectedDataType}`)

    // Redirigir al backend Node.js que ya tiene la lógica de descifrado
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    
    // Si es 'all', obtener datos directamente de Supabase
    if (selectedUser === 'all') {
      console.log('📊 Obteniendo datos directamente de Supabase')
      
      // Calcular fecha límite basada en timeRange
      let dateFilter = null
    if (timeRange !== 'all') {
      const now = new Date()
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        dateFilter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
      }
      
      // Construir filtros de fecha para cada tabla
      const dateTimeFilter = dateFilter ? { gte: dateFilter } : undefined
      const startDateFilter = dateFilter ? { gte: dateFilter } : undefined
      
      // Obtener todos los datos directamente de Supabase con filtros
      const [insulinRes, foodRes, exerciseRes, periodRes, moodRes] = await Promise.all([
        supabase.from('insulindata')
          .select('*')
          .order('date_time', { ascending: false })
          .gte('date_time', dateFilter || '1900-01-01'),
        supabase.from('fooddata')
          .select('*')
          .order('date_time', { ascending: false })
          .gte('date_time', dateFilter || '1900-01-01'),
        supabase.from('exercisedata')
          .select('*')
          .order('date_time', { ascending: false })
          .gte('date_time', dateFilter || '1900-01-01'),
        supabase.from('periodrecords')
          .select('*')
          .order('startDate', { ascending: false })
          .gte('startDate', dateFilter || '1900-01-01'),
        supabase.from('mooddata')
          .select('*')
          .order('date_time', { ascending: false })
          .gte('date_time', dateFilter || '1900-01-01')
      ])
      
      // Descifrar datos usando la función decryptData
      let insulinData = (insulinRes.data || []).map((item) => ({
        ...item,
        insulinType: decryptData(item.insulinType, item.insulintype_iv),
        dose: decryptData(item.dose, item.dose_iv),
      }))
      
      let foodData = (foodRes.data || []).map((item) => ({
        ...item,
        food_type: decryptData(item.food_type, item.food_type_iv),
        quantity: decryptData(item.quantity, item.quantity_iv),
        carbs: decryptData(item.carbs, item.carbs_iv),
      }))
      
      let exerciseData = (exerciseRes.data || []).map((item) => ({
        ...item,
        exercise_type: decryptData(item.exercise_type, item.exercise_type_iv),
        exercise_description: decryptData(item.exercise_description, item.exercise_description_iv),
      }))
      
      let periodData = (periodRes.data || []).map((item) => {
        // Procesar symptoms como array
        let symptomsArr = item.symptoms
        if (typeof symptomsArr === 'string') {
          try {
            symptomsArr = JSON.parse(symptomsArr)
          } catch (e) {
            symptomsArr = symptomsArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
          }
        }
        if (!Array.isArray(symptomsArr)) symptomsArr = []
        
        let symptomsIvArr = item.symptoms_iv
        if (typeof symptomsIvArr === 'string') {
          try {
            symptomsIvArr = JSON.parse(symptomsIvArr)
          } catch (e) {
            symptomsIvArr = symptomsIvArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
          }
        }
        if (!Array.isArray(symptomsIvArr)) symptomsIvArr = []

        return {
          ...item,
          intensity: decryptData(item.intensity, item.intensity_iv),
          notes: decryptData(item.notes, item.notes_iv),
          symptoms: symptomsArr.map((s: string, idx: number) => (s ? decryptData(s, symptomsIvArr[idx]) : "")),
        }
      })
      
      let moodData = (moodRes.data || []).map((item) => {
        // Procesar emotions como array
        let emotionsArr = item.emotions
        if (typeof emotionsArr === 'string') {
          try {
            emotionsArr = JSON.parse(emotionsArr)
          } catch (e) {
            emotionsArr = emotionsArr.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
          }
        }
        if (!Array.isArray(emotionsArr)) emotionsArr = []
        
        let emotionsIvArr = item.emotions_iv
        if (typeof emotionsIvArr === 'string') {
          try {
            emotionsIvArr = JSON.parse(emotionsIvArr)
          } catch (e) {
            emotionsIvArr = emotionsIvArr.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
          }
        }
        if (!Array.isArray(emotionsIvArr)) emotionsIvArr = []

        return {
          ...item,
          routine_description: decryptData(item.routine_description, item.routine_description_iv),
          other_emotion: decryptData(item.other_emotion, item.other_emotion_iv),
          emotions: emotionsArr.map((e: string, idx: number) => (e ? decryptData(e, emotionsIvArr[idx]) : "")),
        }
      })

      // Aplicar filtro por tipo de dato
      if (selectedDataType !== 'all') {
        switch (selectedDataType) {
          case 'insulin':
            foodData = []
            exerciseData = []
            periodData = []
            moodData = []
            break
          case 'food':
            insulinData = []
            exerciseData = []
            periodData = []
            moodData = []
            break
          case 'exercise':
            insulinData = []
            foodData = []
            periodData = []
            moodData = []
            break
          case 'period':
            insulinData = []
            foodData = []
            exerciseData = []
            moodData = []
            break
          case 'mood':
            insulinData = []
            foodData = []
            exerciseData = []
            periodData = []
            break
        }
      }
      
      // Debug: mostrar un ejemplo de descifrado
      if (insulinData.length > 0) {
        console.log('🔍 DEBUG - Datos de insulina:')
        console.log('🔍 Original:', insulinRes.data?.[0]?.insulinType)
        console.log('🔍 IV:', insulinRes.data?.[0]?.insulintype_iv)
        console.log('🔍 Descifrado:', insulinData[0].insulinType)
      }

      return NextResponse.json({
        insulinData,
        foodData,
        exerciseData,
        periodData,
        moodData
      })
    }

    // Para usuarios específicos, obtener datos directamente de Supabase con filtros
    console.log(`📡 Obteniendo datos para usuario específico: ${selectedUser}`)
    
    // Calcular fecha límite basada en timeRange
    let dateFilter = null
    if (timeRange !== 'all') {
      const now = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      dateFilter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Obtener datos del usuario específico con filtros
    const [insulinRes, foodRes, exerciseRes, periodRes, moodRes] = await Promise.all([
      supabase.from('insulindata')
        .select('*')
        .eq('username', selectedUser)
        .order('date_time', { ascending: false })
        .gte('date_time', dateFilter || '1900-01-01'),
      supabase.from('fooddata')
        .select('*')
        .eq('username', selectedUser)
        .order('date_time', { ascending: false })
        .gte('date_time', dateFilter || '1900-01-01'),
      supabase.from('exercisedata')
        .select('*')
        .eq('username', selectedUser)
        .order('date_time', { ascending: false })
        .gte('date_time', dateFilter || '1900-01-01'),
      supabase.from('periodrecords')
        .select('*')
        .eq('username', selectedUser)
        .order('startDate', { ascending: false })
        .gte('startDate', dateFilter || '1900-01-01'),
      supabase.from('mooddata')
        .select('*')
        .eq('username', selectedUser)
        .order('date_time', { ascending: false })
        .gte('date_time', dateFilter || '1900-01-01')
    ])
    
    // Descifrar datos usando la función decryptData
    let insulinData = (insulinRes.data || []).map((item) => ({
      ...item,
      insulinType: decryptData(item.insulinType, item.insulintype_iv),
      dose: decryptData(item.dose, item.dose_iv),
    }))
    
    let foodData = (foodRes.data || []).map((item) => ({
      ...item,
      food_type: decryptData(item.food_type, item.food_type_iv),
      quantity: decryptData(item.quantity, item.quantity_iv),
      carbs: decryptData(item.carbs, item.carbs_iv),
    }))
    
    let exerciseData = (exerciseRes.data || []).map((item) => ({
      ...item,
      exercise_type: decryptData(item.exercise_type, item.exercise_type_iv),
      exercise_description: decryptData(item.exercise_description, item.exercise_description_iv),
    }))
    
    let periodData = (periodRes.data || []).map((item) => {
      // Procesar symptoms como array
      let symptomsArr = item.symptoms
      if (typeof symptomsArr === 'string') {
        try {
          symptomsArr = JSON.parse(symptomsArr)
        } catch (e) {
        symptomsArr = symptomsArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
        }
      }
      if (!Array.isArray(symptomsArr)) symptomsArr = []
      
      let symptomsIvArr = item.symptoms_iv
      if (typeof symptomsIvArr === 'string') {
        try {
          symptomsIvArr = JSON.parse(symptomsIvArr)
        } catch (e) {
        symptomsIvArr = symptomsIvArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
        }
      }
      if (!Array.isArray(symptomsIvArr)) symptomsIvArr = []

      return {
        ...item,
        intensity: decryptData(item.intensity, item.intensity_iv),
        notes: decryptData(item.notes, item.notes_iv),
        symptoms: symptomsArr.map((s: string, idx: number) => (s ? decryptData(s, symptomsIvArr[idx]) : "")),
      }
    })
    
    let moodData = (moodRes.data || []).map((item) => {
      // Procesar emotions como array
      let emotionsArr = item.emotions
      if (typeof emotionsArr === 'string') {
        try {
          emotionsArr = JSON.parse(emotionsArr)
        } catch (e) {
          emotionsArr = emotionsArr.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
        }
      }
      if (!Array.isArray(emotionsArr)) emotionsArr = []
      
      let emotionsIvArr = item.emotions_iv
      if (typeof emotionsIvArr === 'string') {
        try {
          emotionsIvArr = JSON.parse(emotionsIvArr)
        } catch (e) {
          emotionsIvArr = emotionsIvArr.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
        }
      }
      if (!Array.isArray(emotionsIvArr)) emotionsIvArr = []

      return {
        ...item,
        routine_description: decryptData(item.routine_description, item.routine_description_iv),
        other_emotion: decryptData(item.other_emotion, item.other_emotion_iv),
        emotions: emotionsArr.map((e: string, idx: number) => (e ? decryptData(e, emotionsIvArr[idx]) : "")),
      }
    })

    // Aplicar filtro por tipo de dato
    if (selectedDataType !== 'all') {
      switch (selectedDataType) {
        case 'insulin':
          foodData = []
          exerciseData = []
          periodData = []
          moodData = []
          break
        case 'food':
          insulinData = []
          exerciseData = []
          periodData = []
          moodData = []
          break
        case 'exercise':
          insulinData = []
          foodData = []
          periodData = []
          moodData = []
          break
        case 'period':
          insulinData = []
          foodData = []
          exerciseData = []
          moodData = []
          break
        case 'mood':
          insulinData = []
          foodData = []
          exerciseData = []
          periodData = []
          break
      }
    }
    
    return NextResponse.json({
      insulinData,
      foodData,
      exerciseData,
      periodData,
      moodData
    })

  } catch (error) {
    console.error('❌ Error en API de datos descifrados:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error al obtener datos descifrados', details: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Error al obtener datos descifrados' },
      { status: 500 }
    )
  }
} 