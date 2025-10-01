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

async function testDecryption() {
  try {
    console.log('🧪 Probando funcionalidad de descifrado...\n')
    
    // 1. Verificar que el servidor backend esté ejecutándose
    console.log('📡 Verificando conexión al servidor backend...')
    try {
      const response = await fetch('http://localhost:3001/')
      if (response.ok) {
        console.log('✅ Servidor backend está ejecutándose')
      } else {
        console.log('⚠️  Servidor backend responde pero con error')
      }
    } catch (error) {
      console.error('❌ No se puede conectar al servidor backend en http://localhost:3001')
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose:')
      console.log('   cd backend && npm start')
      return
    }
    
    // 2. Obtener algunos datos cifrados de la base de datos
    console.log('\n📊 Obteniendo datos cifrados de la base de datos...')
    const { data: insulinData, error: insulinError } = await supabase
      .from('insulindata')
      .select('insulinType, insulintype_iv, dose, dose_iv')
      .limit(2)
    
    if (insulinError) {
      console.error('❌ Error al obtener datos de insulina:', insulinError)
      return
    }
    
    if (!insulinData || insulinData.length === 0) {
      console.log('⚠️  No hay datos de insulina para probar')
      return
    }
    
    console.log(`✅ Encontrados ${insulinData.length} registros de insulina`)
    
    // 3. Probar el descifrado
    console.log('\n🔓 Probando descifrado...')
    for (let i = 0; i < insulinData.length; i++) {
      const item = insulinData[i]
      console.log(`\n📝 Registro ${i + 1}:`)
      console.log(`   Tipo cifrado: ${item.insulinType}`)
      console.log(`   IV del tipo: ${item.insulintype_iv}`)
      console.log(`   Dosis cifrada: ${item.dose}`)
      console.log(`   IV de dosis: ${item.dose_iv}`)
      
      // Probar descifrado del tipo
      try {
        const decryptResponse = await fetch('http://localhost:3001/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            encryptedData: item.insulinType,
            iv: item.insulintype_iv
          })
        })
        
        if (decryptResponse.ok) {
          const result = await decryptResponse.json()
          console.log(`   ✅ Tipo descifrado: ${result.decryptedData}`)
        } else {
          console.log(`   ❌ Error al descifrar tipo: ${decryptResponse.status}`)
        }
      } catch (error) {
        console.log(`   ❌ Error en descifrado: ${error.message}`)
      }
      
      // Probar descifrado de dosis
      try {
        const decryptResponse = await fetch('http://localhost:3001/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            encryptedData: item.dose,
            iv: item.dose_iv
          })
        })
        
        if (decryptResponse.ok) {
          const result = await decryptResponse.json()
          console.log(`   ✅ Dosis descifrada: ${result.decryptedData}`)
        } else {
          console.log(`   ❌ Error al descifrar dosis: ${decryptResponse.status}`)
        }
      } catch (error) {
        console.log(`   ❌ Error en descifrado: ${error.message}`)
      }
    }
    
    // 4. Probar el endpoint completo de datos descifrados
    console.log('\n🌐 Probando endpoint completo de datos descifrados...')
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
        }
      } else {
        console.log(`❌ Error en endpoint: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Error al probar endpoint: ${error.message}`)
    }
    
    console.log('\n🎉 Prueba de descifrado completada')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la prueba
testDecryption() 