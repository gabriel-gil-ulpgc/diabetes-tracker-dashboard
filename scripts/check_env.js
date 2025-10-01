require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando variables de entorno...\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ENCRYPTION_SECRET_KEY'
]

let allConfigured = true

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Configurada`)
    if (varName === 'ENCRYPTION_SECRET_KEY') {
      console.log(`   Longitud: ${value.length} caracteres`)
      console.log(`   Formato: ${value.length === 64 ? 'Hex válido (32 bytes)' : 'Formato incorrecto'}`)
    }
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
    allConfigured = false
  }
})

console.log('\n' + '='.repeat(50))

if (allConfigured) {
  console.log('🎉 Todas las variables de entorno están configuradas correctamente')
  console.log('💡 Puedes ejecutar el dashboard con: npm run dev')
} else {
  console.log('⚠️  Faltan variables de entorno requeridas')
  console.log('📝 Asegúrate de tener un archivo .env.local con las siguientes variables:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase')
  console.log('   ENCRYPTION_SECRET_KEY=tu_clave_de_cifrado_hex_32_bytes')
  console.log('\n🔑 Para generar una clave de cifrado:')
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
} 