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

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n')
    
    // Verificar conexión
    console.log('📡 Probando conexión a Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message)
      return
    }
    
    console.log('✅ Conexión exitosa a Supabase\n')
    
    // Verificar tabla de usuarios
    console.log('👥 Verificando tabla de usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('UserID')
    
    if (usersError) {
      console.error('❌ Error al consultar usuarios:', usersError.message)
    } else {
      console.log(`✅ Usuarios encontrados: ${users.length}`)
      if (users.length > 0) {
        console.log('📋 Lista de usuarios:')
        users.forEach(user => {
          console.log(`   - ${user.Username} (ID: ${user.UserID})`)
        })
      }
    }
    console.log()
    
    // Verificar tablas de datos reales
    console.log('💊 Verificando tabla de datos de insulina...')
    const { data: insulinData, error: insulinError } = await supabase
      .from('insulindata')
      .select('*')
      .order('date_time', { ascending: false })
    
    if (insulinError) {
      console.error('❌ Error al consultar datos de insulina:', insulinError.message)
    } else {
      console.log(`✅ Registros de insulina encontrados: ${insulinData.length}`)
    }

    console.log('🍽️ Verificando tabla de datos de comidas...')
    const { data: foodData, error: foodError } = await supabase
      .from('fooddata')
      .select('*')
      .order('date_time', { ascending: false })
    
    if (foodError) {
      console.error('❌ Error al consultar datos de comidas:', foodError.message)
    } else {
      console.log(`✅ Registros de comidas encontrados: ${foodData.length}`)
    }

    console.log('🏃 Verificando tabla de datos de ejercicio...')
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercisedata')
      .select('*')
      .order('date_time', { ascending: false })
    
    if (exerciseError) {
      console.error('❌ Error al consultar datos de ejercicio:', exerciseError.message)
    } else {
      console.log(`✅ Registros de ejercicio encontrados: ${exerciseData.length}`)
    }

    console.log('📅 Verificando tabla de datos de períodos...')
    const { data: periodData, error: periodError } = await supabase
      .from('periodrecords')
      .select('*')
      .order('date_time', { ascending: false })
    
    if (periodError) {
      console.error('❌ Error al consultar datos de períodos:', periodError.message)
    } else {
      console.log(`✅ Registros de períodos encontrados: ${periodData.length}`)
    }

    console.log('😊 Verificando tabla de datos de estado de ánimo...')
    const { data: moodData, error: moodError } = await supabase
      .from('mooddata')
      .select('*')
      .order('date_time', { ascending: false })
    
    if (moodError) {
      console.error('❌ Error al consultar datos de estado de ánimo:', moodError.message)
    } else {
      console.log(`✅ Registros de estado de ánimo encontrados: ${moodData.length}`)
    }

    // Estadísticas generales
    const totalRecords = (insulinData?.length || 0) + (foodData?.length || 0) + 
                        (exerciseData?.length || 0) + (periodData?.length || 0) + 
                        (moodData?.length || 0)
    
    if (totalRecords > 0) {
      console.log('\n📊 Estadísticas generales:')
      console.log(`   - Total de registros: ${totalRecords}`)
      console.log(`   - Insulina: ${insulinData?.length || 0}`)
      console.log(`   - Comidas: ${foodData?.length || 0}`)
      console.log(`   - Ejercicio: ${exerciseData?.length || 0}`)
      console.log(`   - Períodos: ${periodData?.length || 0}`)
      console.log(`   - Estado de ánimo: ${moodData?.length || 0}`)
      
      // Usuarios únicos
      const allData = [
        ...(insulinData || []),
        ...(foodData || []),
        ...(exerciseData || []),
        ...(periodData || []),
        ...(moodData || [])
      ]
      const uniqueUsers = [...new Set(allData.map(d => d.username))]
      console.log(`   - Usuarios únicos: ${uniqueUsers.length}`)
      
      // Datos más recientes
      console.log('\n🕒 Registros más recientes:')
      allData.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      allData.slice(0, 5).forEach((record, index) => {
        const date = new Date(record.date_time).toLocaleDateString('es-ES')
        const time = new Date(record.date_time).toLocaleTimeString('es-ES')
        console.log(`   ${index + 1}. ${record.username} - ${date} ${time}`)
      })
    } else {
      console.log('⚠️  No hay datos en la base de datos')
      console.log('💡 Ejecuta "npm run insert-real-data" para agregar datos de prueba reales')
    }
    
    console.log('\n🎯 Recomendaciones:')
    if (users.length === 0) {
      console.log('   - No hay usuarios en la base de datos')
      console.log('   - Ejecuta "npm run insert-test-data" para crear usuarios y datos de prueba')
    } else if (polarData.length === 0) {
      console.log('   - Hay usuarios pero no hay datos de ritmo cardíaco')
      console.log('   - Ejecuta "npm run insert-test-data" para agregar datos de prueba')
    } else {
      console.log('   - La base de datos está configurada correctamente')
      console.log('   - Puedes acceder al dashboard en http://localhost:3000')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
checkDatabase() 