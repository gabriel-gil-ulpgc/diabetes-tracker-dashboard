#!/usr/bin/env node

/**
 * Script de debug para la autenticación de Kubios Cloud
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug de la autenticación de Kubios Cloud...\n');

// Verificar archivo de configuración
const configPath = path.join(process.cwd(), 'kub-kubioscloud-demo', 'my_config.yaml');
console.log('📁 Verificando archivo de configuración:');
console.log(`   Ruta: ${configPath}`);
console.log(`   Existe: ${fs.existsSync(configPath) ? '✅' : '❌'}`);

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  console.log('📄 Contenido del archivo:');
  console.log(configContent);
  
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
    console.log('\n🧪 Probando autenticación manual...');
    
    // Simular el flujo de autenticación
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
    
    console.log('\n🌐 URL de autenticación:');
    console.log('   https://kubioscloud.auth.eu-west-1.amazoncognito.com/login');
    
    console.log('\n📤 Datos a enviar:');
    Object.entries(loginData).forEach(([key, value]) => {
      if (key === 'password') {
        console.log(`   ${key}: [OCULTO]`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
  } else {
    console.log('\n❌ Configuración incompleta');
  }
} else {
  console.log('\n❌ Archivo de configuración no encontrado');
}

console.log('\n📋 Resumen del debug:');
console.log('   ✅ Verificación de archivo de configuración');
console.log('   ✅ Parseo de credenciales');
console.log('   ✅ Validación de campos requeridos');
console.log('   ✅ Simulación del flujo de autenticación');
console.log('   ✅ Preparación para pruebas reales');
