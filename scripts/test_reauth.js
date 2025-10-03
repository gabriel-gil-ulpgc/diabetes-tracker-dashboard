#!/usr/bin/env node

/**
 * Script para probar la reautenticación automática
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando reautenticación automática...\n');

async function testReauth() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación inicial...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación inicial exitosa');
      
      // Simular token expirado forzando una nueva autenticación
      console.log('🔄 Simulando token expirado...');
      kubiosService.tokens = null;
      
      console.log('📊 Probando obtención de resultados HRV (debería reautenticar automáticamente)...');
      const results = await kubiosService.getHRVResults('82fed5be-7326-48d5-87c0-1649ffb4312c');
      
      console.log(`✅ Obtenidos ${results.length} resultados HRV`);
      
      if (results.length > 0) {
        console.log('🎉 ¡Reautenticación automática funcionando correctamente!');
        console.log('📋 Primer resultado:', JSON.stringify(results[0], null, 2));
      } else {
        console.log('⚠️ No se encontraron resultados, pero la reautenticación funcionó');
      }
    } else {
      console.error('❌ Error en autenticación inicial');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testReauth();
