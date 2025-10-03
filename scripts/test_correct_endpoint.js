#!/usr/bin/env node

/**
 * Script para probar el endpoint correcto de mediciones
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando endpoint correcto de mediciones...\n');

async function testCorrectEndpoint() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación exitosa');
      
      // Probar con un usuario específico que sabemos que tiene datos
      const testUserId = '82fed5be-7326-48d5-87c0-1649ffb4312c';
      console.log(`📊 Probando obtención de mediciones para usuario: ${testUserId}`);
      
      const results = await kubiosService.getHRVResults(testUserId);
      
      console.log(`✅ Obtenidos ${results.length} resultados HRV`);
      
      if (results.length > 0) {
        console.log('🎉 ¡Endpoint funcionando correctamente!');
        console.log('📋 Primer resultado:', JSON.stringify(results[0], null, 2));
      } else {
        console.log('⚠️ No se encontraron resultados para este usuario');
      }
      
      // Probar con otro usuario
      const testUserId2 = 'd485bbca-20dc-4d69-b471-ee9c5833829c';
      console.log(`\n📊 Probando con otro usuario: ${testUserId2}`);
      
      const results2 = await kubiosService.getHRVResults(testUserId2);
      console.log(`✅ Obtenidos ${results2.length} resultados HRV para el segundo usuario`);
      
    } else {
      console.error('❌ Error en autenticación');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testCorrectEndpoint();
