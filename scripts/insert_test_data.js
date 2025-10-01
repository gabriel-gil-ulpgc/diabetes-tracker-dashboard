const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.log('Por favor, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Datos de prueba
const testUsers = [
  'ggilbordon@gmail.com',
  'usuario1@test.com',
  'usuario2@test.com',
  'usuario3@test.com'
]

// Generar datos de ritmo cardíaco de prueba
function generateTestData() {
  const data = []
  const now = new Date()
  
  testUsers.forEach((username, userIndex) => {
    // Generar entre 10-30 registros por usuario
    const numRecords = Math.floor(Math.random() * 21) + 10
    
    for (let i = 0; i < numRecords; i++) {
      // Generar fecha aleatoria en los últimos 30 días
      const randomDays = Math.floor(Math.random() * 30)
      const randomHours = Math.floor(Math.random() * 24)
      const randomMinutes = Math.floor(Math.random() * 60)
      
      const timestamp = new Date(now)
      timestamp.setDate(timestamp.getDate() - randomDays)
      timestamp.setHours(randomHours, randomMinutes, 0, 0)
      
      // Generar ritmo cardíaco realista (50-180 bpm)
      let heartRate
      const rand = Math.random()
      if (rand < 0.7) {
        // 70% de probabilidad de ritmo normal (60-100 bpm)
        heartRate = Math.floor(Math.random() * 41) + 60
      } else if (rand < 0.85) {
        // 15% de probabilidad de ritmo alto (100-140 bpm)
        heartRate = Math.floor(Math.random() * 41) + 100
      } else if (rand < 0.95) {
        // 10% de probabilidad de ritmo muy alto (140-180 bpm)
        heartRate = Math.floor(Math.random() * 41) + 140
      } else {
        // 5% de probabilidad de ritmo bajo (50-60 bpm)
        heartRate = Math.floor(Math.random() * 11) + 50
      }
      
      // Generar datos RRi simulados
      const rriData = []
      const numRRi = Math.floor(Math.random() * 10) + 5
      for (let j = 0; j < numRRi; j++) {
        // RRi típico entre 600-1200ms
        const rri = Math.floor(Math.random() * 601) + 600
        rriData.push(rri)
      }
      
      data.push({
        username,
        timestamp: timestamp.toISOString(),
        heart_rate: heartRate,
        rri_data: rriData,
        device_id: 'polar_h10',
        data_type: 'heart_rate_reading',
        created_at: new Date().toISOString()
      })
    }
  })
  
  return data
}

async function insertTestData() {
  try {
    console.log('🚀 Iniciando inserción de datos de prueba...')
    
    // Verificar si ya existen usuarios
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('Username')
    
    if (usersError) {
      console.error('❌ Error al verificar usuarios:', usersError)
      return
    }
    
    const existingUsernames = existingUsers.map(u => u.Username)
    console.log('👥 Usuarios existentes:', existingUsernames)
    
    // Insertar usuarios de prueba si no existen
    const usersToInsert = testUsers.filter(username => !existingUsernames.includes(username))
    
    if (usersToInsert.length > 0) {
      console.log('➕ Insertando usuarios de prueba:', usersToInsert)
      
      const userData = usersToInsert.map(username => ({
        Username: username,
        PasswordHash: 'test_hash_' + Math.random().toString(36).substring(7),
        created_at: new Date().toISOString()
      }))
      
      const { error: insertUsersError } = await supabase
        .from('users')
        .insert(userData)
      
      if (insertUsersError) {
        console.error('❌ Error al insertar usuarios:', insertUsersError)
        return
      }
      
      console.log('✅ Usuarios insertados correctamente')
    }
    
    // Generar datos de prueba
    const testData = generateTestData()
    console.log(`📊 Generando ${testData.length} registros de ritmo cardíaco...`)
    
    // Insertar datos en lotes de 50 para evitar límites de tamaño
    const batchSize = 50
    for (let i = 0; i < testData.length; i += batchSize) {
      const batch = testData.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('polar_data')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote ${Math.floor(i / batchSize) + 1}:`, insertError)
        continue
      }
      
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
    }
    
    console.log('🎉 ¡Datos de prueba insertados correctamente!')
    console.log(`📈 Total de registros insertados: ${testData.length}`)
    
    // Mostrar estadísticas
    const { data: finalData, error: statsError } = await supabase
      .from('polar_data')
      .select('*')
    
    if (!statsError && finalData) {
      console.log('\n📊 Estadísticas finales:')
      console.log(`- Total de registros en la base de datos: ${finalData.length}`)
      
      const users = [...new Set(finalData.map(d => d.username))]
      console.log(`- Usuarios con datos: ${users.length}`)
      
      const avgHeartRate = Math.round(
        finalData.reduce((sum, d) => sum + d.heart_rate, 0) / finalData.length
      )
      console.log(`- Promedio de ritmo cardíaco: ${avgHeartRate} bpm`)
      
      const maxHeartRate = Math.max(...finalData.map(d => d.heart_rate))
      const minHeartRate = Math.min(...finalData.map(d => d.heart_rate))
      console.log(`- Rango de ritmo cardíaco: ${minHeartRate} - ${maxHeartRate} bpm`)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
insertTestData() 