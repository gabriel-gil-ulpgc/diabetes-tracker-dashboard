const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://byzrronowbnffarazhps.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enJyb25vd2JuZmZhcmF6aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzExMTMsImV4cCI6MjA2NTIwNzExM30.8Yl1kAJu6bBP1ZX0MQ7l5jVqBM6QcMjqP0ADNGnnibI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFrontendAPI() {
  try {
    console.log('🧪 Probando endpoint API del frontend...\n')
    
    // 1. Verificar que el servidor de desarrollo esté ejecutándose
    console.log('📡 Verificando servidor de desarrollo...')
    try {
      const response = await fetch('http://localhost:3000/')
      if (response.ok) {
        console.log('✅ Servidor de desarrollo está ejecutándose')
      } else {
        console.log(`⚠️  Servidor responde pero con error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ No se puede conectar al servidor de desarrollo en http://localhost:3000')
      console.log('💡 Asegúrate de que el servidor esté ejecutándose:')
      console.log('   cd dashboard && npm run dev')
      return
    }
    
    // 2. Probar el endpoint de datos descifrados
    console.log('\n🌐 Probando endpoint de datos descifrados...')
    try {
      const response = await fetch('http://localhost:3000/api/decrypted-data?selectedUser=all&timeRange=all')
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Endpoint de datos descifrados funciona correctamente')
        console.log(`   - Insulina: ${data.insulinData?.length || 0} registros`)
        console.log(`   - Comidas: ${data.foodData?.length || 0} registros`)
        console.log(`   - Ejercicio: ${data.exerciseData?.length || 0} registros`)
        console.log(`   - Períodos: ${data.periodData?.length || 0} registros`)
        console.log(`   - Estado de ánimo: ${data.moodData?.length || 0} registros`)
        
        // Mostrar un ejemplo de datos descifrados
        if (data.insulinData && data.insulinData.length > 0) {
          const example = data.insulinData[0]
          console.log('\n📋 Ejemplo de datos descifrados:')
          console.log(`   Usuario: ${example.username}`)
          console.log(`   Tipo: ${example.insulinType}`)
          console.log(`   Dosis: ${example.dose}`)
          console.log(`   Fecha: ${example.date_time}`)
          
          // Verificar si los datos están descifrados
          if (example.insulinType && example.insulinType.length < 50 && !example.insulinType.includes('__PLAIN__')) {
            console.log('✅ Los datos están correctamente descifrados')
          } else {
            console.log('⚠️  Los datos pueden no estar descifrados correctamente')
          }
        }
      } else {
        console.log(`❌ Error en endpoint: ${response.status}`)
        const errorText = await response.text()
        console.log(`   Error: ${errorText}`)
      }
    } catch (error) {
      console.log(`❌ Error al probar endpoint: ${error.message}`)
    }
    
    // 3. Probar con filtros específicos
    console.log('\n🔍 Probando con filtros específicos...')
    try {
      const response = await fetch('http://localhost:3000/api/decrypted-data?selectedUser=ggilbordon@gmail.com&timeRange=30d')
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Filtros funcionan correctamente')
        console.log(`   - Registros filtrados: ${data.insulinData?.length || 0} insulina`)
      } else {
        console.log(`❌ Error con filtros: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Error con filtros: ${error.message}`)
    }
    
    console.log('\n🎉 Prueba del frontend API completada')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la prueba
testFrontendAPI() 