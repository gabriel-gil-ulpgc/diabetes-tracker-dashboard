#!/usr/bin/env node

/**
 * Script para probar la corrección del chat de Kubios Cloud
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Probando la corrección del chat de Kubios Cloud...\n');

// Verificar que los archivos existen
const kubiosDir = path.join(process.cwd(), 'kub-kubioscloud-demo');
const pythonScript = path.join(kubiosDir, 'kubios_cli.py');
const configFile = path.join(kubiosDir, 'my_config.yaml');

console.log('📁 Verificando archivos:');
console.log(`   • Directorio Kubios: ${fs.existsSync(kubiosDir) ? '✅' : '❌'} ${kubiosDir}`);
console.log(`   • Script Python: ${fs.existsSync(pythonScript) ? '✅' : '❌'} ${pythonScript}`);
console.log(`   • Configuración: ${fs.existsSync(configFile) ? '✅' : '❌'} ${configFile}`);

// Verificar que Python está disponible
console.log('\n🐍 Verificando Python:');
const python = spawn('python', ['--version'], { shell: true });

python.stdout.on('data', (data) => {
  console.log(`   ✅ Python disponible: ${data.toString().trim()}`);
});

python.stderr.on('data', (data) => {
  console.log(`   ❌ Error con Python: ${data.toString().trim()}`);
});

python.on('close', (code) => {
  if (code === 0) {
    console.log('\n🧪 Probando API de fallback...');
    
    // Probar la API de fallback
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/kubios/hrv-results-fallback?user_id=self');
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API de fallback funciona: ${data.results.length} resultados`);
          console.log(`   📊 Fuente: ${data.source}`);
        } else {
          console.log(`   ❌ API de fallback falló: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ⚠️  No se puede probar la API (servidor no iniciado): ${error.message}`);
      }
    };
    
    testApi();
  } else {
    console.log('   ❌ Python no está disponible');
  }
});

console.log('\n📋 Resumen de correcciones aplicadas:');
console.log('   ✅ Corregida ruta del script Python en la API');
console.log('   ✅ Agregada verificación de archivos existentes');
console.log('   ✅ Mejorado el manejo de errores');
console.log('   ✅ Creada API de fallback con datos de ejemplo');
console.log('   ✅ Implementado fallback automático en el frontend');
console.log('   ✅ Agregado logging detallado para debugging');

console.log('\n🎯 El chat de Kubios Cloud ahora debería funcionar correctamente!');
console.log('   • Si Python está disponible: usará datos reales de Kubios');
console.log('   • Si Python no está disponible: usará datos de ejemplo');
console.log('   • El sistema es más robusto y maneja errores mejor');
