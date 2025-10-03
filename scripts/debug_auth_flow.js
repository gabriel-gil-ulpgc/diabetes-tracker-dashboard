#!/usr/bin/env node

/**
 * Script de debug detallado para el flujo de autenticación de Kubios Cloud
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug detallado del flujo de autenticación de Kubios Cloud...\n');

// Verificar archivo de configuración
const configPath = path.join(process.cwd(), 'kub-kubioscloud-demo', 'my_config.yaml');
console.log('📁 Verificando archivo de configuración:');
console.log(`   Ruta: ${configPath}`);
console.log(`   Existe: ${fs.existsSync(configPath) ? '✅' : '❌'}`);

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Parsear configuración
  const lines = configContent.split('\n');
  const config = {};
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      if (key && value) {
        config[key] = value;
      }
    }
  });
  
  console.log('\n🔧 Configuración parseada:');
  console.log(`   Username: ${config.username ? '✅ Configurado' : '❌ Faltante'}`);
  console.log(`   Password: ${config.password ? '✅ Configurado' : '❌ Faltante'}`);
  console.log(`   Client ID: ${config.client_id ? '✅ Configurado' : '❌ Faltante'}`);
  
  if (config.username && config.password && config.client_id) {
    console.log('\n🧪 Simulando flujo de autenticación...');
    
    const csrf = require('crypto').randomUUID();
    const redirectUri = 'https://analysis.kubioscloud.com/v1/portal/login';
    
    console.log('📋 Datos de autenticación:');
    console.log(`   CSRF: ${csrf}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Client ID: ${config.client_id}`);
    
    const loginData = {
      client_id: config.client_id,
      redirect_uri: redirectUri,
      username: config.username,
      password: config.password,
      response_type: 'token',
      scope: 'openid',
      _csrf: csrf
    };
    
    console.log('\n🌐 Flujo de autenticación esperado:');
    console.log('   1. POST a https://kubioscloud.auth.eu-west-1.amazoncognito.com/login');
    console.log('   2. Respuesta 302 con header Location');
    console.log('   3. URL de redirección contiene tokens en fragment');
    console.log('   4. Extraer id_token y access_token del fragment');
    
    console.log('\n📤 Headers esperados:');
    console.log(`   Content-Type: application/x-www-form-urlencoded`);
    console.log(`   Cookie: XSRF-TOKEN=${csrf}`);
    console.log(`   User-Agent: DiabetesTracker 1.0`);
    
    console.log('\n📥 Respuesta esperada:');
    console.log('   Status: 302');
    console.log('   Location: https://analysis.kubioscloud.com/v1/portal/login#id_token=...&access_token=...');
    
    console.log('\n🔑 Proceso de extracción de tokens:');
    console.log('   1. Obtener header Location de la respuesta');
    console.log('   2. Parsear URL de redirección');
    console.log('   3. Extraer fragment (#id_token=...&access_token=...)');
    console.log('   4. Parsear parámetros del fragment');
    console.log('   5. Extraer id_token y access_token');
    
    console.log('\n⚠️ Posibles problemas:');
    console.log('   - Credenciales incorrectas');
    console.log('   - Client ID incorrecto');
    console.log('   - Problemas de CORS en el navegador');
    console.log('   - URL de redirección mal formada');
    console.log('   - Tokens no presentes en el fragment');
    
  } else {
    console.log('\n❌ Configuración incompleta');
  }
} else {
  console.log('\n❌ Archivo de configuración no encontrado');
}

console.log('\n📋 Resumen del debug:');
console.log('   ✅ Verificación de configuración');
console.log('   ✅ Simulación del flujo de autenticación');
console.log('   ✅ Identificación de posibles problemas');
console.log('   ✅ Preparación para pruebas reales');
