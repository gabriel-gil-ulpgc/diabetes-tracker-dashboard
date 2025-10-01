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

// Datos de prueba para insulina
const insulinTypes = ['Rápida', 'Lenta', 'Mixta', 'Basal']
const insulinDoses = ['5', '10', '15', '20', '25', '30']

// Datos de prueba para comidas
const foodTypes = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre']
const foodQuantities = ['1 porción', '2 porciones', 'Media porción', '1 taza', '1 plato']

// Datos de prueba para ejercicio
const exerciseTypes = ['Caminata', 'Correr', 'Nadar', 'Ciclismo', 'Yoga', 'Pesas']
const exerciseIntensities = ['Baja', 'Moderada', 'Alta']
const exerciseDescriptions = [
  'Ejercicio cardiovascular',
  'Entrenamiento de fuerza',
  'Actividad recreativa',
  'Deporte competitivo'
]

// Datos de prueba para períodos
const periodIntensities = ['Leve', 'Moderada', 'Intensa']
const periodSymptoms = [
  ['Cólicos', 'Fatiga'],
  ['Dolor de cabeza', 'Cambios de humor'],
  ['Hinchazón', 'Acné'],
  ['Dolor de espalda', 'Sensibilidad en senos']
]

// Datos de prueba para estado de ánimo
const moodValues = [1, 2, 3, 4, 5]
const routineDescriptions = [
  'Día normal en casa',
  'Trabajo desde casa',
  'Salida con amigos',
  'Ejercicio matutino',
  'Día de descanso'
]
const emotions = [
  ['Feliz', 'Energético'],
  ['Tranquilo', 'Relajado'],
  ['Estresado', 'Ansioso'],
  ['Motivado', 'Productivo'],
  ['Cansado', 'Agotado']
]

// Generar datos de prueba
function generateTestData() {
  const now = new Date()
  const data = {
    insulin: [],
    food: [],
    exercise: [],
    periods: [],
    mood: []
  }
  
  testUsers.forEach((username) => {
    // Generar entre 5-15 registros por tipo por usuario
    const numRecords = Math.floor(Math.random() * 11) + 5
    
    for (let i = 0; i < numRecords; i++) {
      // Generar fecha aleatoria en los últimos 30 días
      const randomDays = Math.floor(Math.random() * 30)
      const randomHours = Math.floor(Math.random() * 24)
      const randomMinutes = Math.floor(Math.random() * 60)
      
      const timestamp = new Date(now)
      timestamp.setDate(timestamp.getDate() - randomDays)
      timestamp.setHours(randomHours, randomMinutes, 0, 0)
      
      // Datos de insulina
      data.insulin.push({
        username,
        insulinType: insulinTypes[Math.floor(Math.random() * insulinTypes.length)],
        dose: insulinDoses[Math.floor(Math.random() * insulinDoses.length)],
        date_time: timestamp.toISOString(),
        actualDateTime: timestamp.toISOString()
      })
      
      // Datos de comida
      data.food.push({
        username,
        food_type: foodTypes[Math.floor(Math.random() * foodTypes.length)],
        quantity: foodQuantities[Math.floor(Math.random() * foodQuantities.length)],
        carbs: (Math.floor(Math.random() * 50) + 10).toString(),
        date_time: timestamp.toISOString()
      })
      
      // Datos de ejercicio
      data.exercise.push({
        username,
        exercise_type: exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)],
        intensity: exerciseIntensities[Math.floor(Math.random() * exerciseIntensities.length)],
        exercise_start_time: timestamp.toISOString(),
        exercise_end_time: new Date(timestamp.getTime() + (Math.floor(Math.random() * 120) + 30) * 60000).toISOString(),
        exercise_description: exerciseDescriptions[Math.floor(Math.random() * exerciseDescriptions.length)],
        date_time: timestamp.toISOString()
      })
      
      // Datos de período (solo para algunos usuarios)
      if (Math.random() < 0.3) { // 30% de probabilidad
        const startDate = new Date(timestamp)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 3)
        
        data.periods.push({
          username,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          intensity: periodIntensities[Math.floor(Math.random() * periodIntensities.length)],
          symptoms: periodSymptoms[Math.floor(Math.random() * periodSymptoms.length)],
          notes: 'Notas del período',
          date_time: timestamp.toISOString()
        })
      }
      
      // Datos de estado de ánimo
      data.mood.push({
        username,
        mood_value: moodValues[Math.floor(Math.random() * moodValues.length)],
        out_of_routine: Math.random() < 0.3,
        routine_description: routineDescriptions[Math.floor(Math.random() * routineDescriptions.length)],
        emotions: emotions[Math.floor(Math.random() * emotions.length)],
        other_emotion: 'Otra emoción',
        date_time: timestamp.toISOString()
      })
    }
  })
  
  return data
}

async function insertTestData() {
  try {
    console.log('🚀 Iniciando inserción de datos de prueba reales...')
    
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
    console.log(`📊 Generando datos de prueba:`)
    console.log(`   - Insulina: ${testData.insulin.length} registros`)
    console.log(`   - Comidas: ${testData.food.length} registros`)
    console.log(`   - Ejercicio: ${testData.exercise.length} registros`)
    console.log(`   - Períodos: ${testData.periods.length} registros`)
    console.log(`   - Estado de ánimo: ${testData.mood.length} registros`)
    
    // Insertar datos en lotes
    const batchSize = 50
    
    // Insertar datos de insulina
    for (let i = 0; i < testData.insulin.length; i += batchSize) {
      const batch = testData.insulin.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('insulindata')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote de insulina ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        console.log(`✅ Lote de insulina ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
      }
    }
    
    // Insertar datos de comida
    for (let i = 0; i < testData.food.length; i += batchSize) {
      const batch = testData.food.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('fooddata')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote de comida ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        console.log(`✅ Lote de comida ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
      }
    }
    
    // Insertar datos de ejercicio
    for (let i = 0; i < testData.exercise.length; i += batchSize) {
      const batch = testData.exercise.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('exercisedata')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote de ejercicio ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        console.log(`✅ Lote de ejercicio ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
      }
    }
    
    // Insertar datos de períodos
    for (let i = 0; i < testData.periods.length; i += batchSize) {
      const batch = testData.periods.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('periodrecords')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote de períodos ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        console.log(`✅ Lote de períodos ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
      }
    }
    
    // Insertar datos de estado de ánimo
    for (let i = 0; i < testData.mood.length; i += batchSize) {
      const batch = testData.mood.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('mooddata')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error al insertar lote de estado de ánimo ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        console.log(`✅ Lote de estado de ánimo ${Math.floor(i / batchSize) + 1} insertado (${batch.length} registros)`)
      }
    }
    
    console.log('🎉 ¡Datos de prueba reales insertados correctamente!')
    
    // Mostrar estadísticas finales
    const [insulinRes, foodRes, exerciseRes, periodRes, moodRes] = await Promise.all([
      supabase.from('insulindata').select('*'),
      supabase.from('fooddata').select('*'),
      supabase.from('exercisedata').select('*'),
      supabase.from('periodrecords').select('*'),
      supabase.from('mooddata').select('*')
    ])
    
    console.log('\n📊 Estadísticas finales:')
    console.log(`- Insulina: ${insulinRes.data?.length || 0} registros`)
    console.log(`- Comidas: ${foodRes.data?.length || 0} registros`)
    console.log(`- Ejercicio: ${exerciseRes.data?.length || 0} registros`)
    console.log(`- Períodos: ${periodRes.data?.length || 0} registros`)
    console.log(`- Estado de ánimo: ${moodRes.data?.length || 0} registros`)
    
    const totalRecords = (insulinRes.data?.length || 0) + (foodRes.data?.length || 0) + 
                        (exerciseRes.data?.length || 0) + (periodRes.data?.length || 0) + 
                        (moodRes.data?.length || 0)
    console.log(`- Total: ${totalRecords} registros`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
insertTestData() 