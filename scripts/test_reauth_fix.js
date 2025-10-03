#!/usr/bin/env node

/**
 * Script para probar la reautenticación corregida
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando reautenticación corregida...\n');

async function testReauthFix() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación inicial...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación inicial exitosa');
      
      // Probar obtención de usuarios del equipo (sin conteo)
      console.log('👥 Obteniendo usuarios del equipo...');
      const teamUsers = await kubiosService.getTeamUsers();
      
      if (teamUsers.length > 0) {
        console.log(`✅ Obtenidos ${teamUsers.length} usuarios del equipo`);
        
        // Probar conteo de mediciones para un usuario específico
        const testUser = teamUsers[0];
        console.log(`\n📊 Probando conteo de mediciones para: ${testUser.name}`);
        
        const measurementCount = await kubiosService.getMeasurementCount(testUser.user_id);
        console.log(`✅ Conteo de mediciones para ${testUser.name}: ${measurementCount}`);
        
        // Probar obtención de resultados HRV
        console.log(`\n📊 Probando obtención de resultados HRV para: ${testUser.name}`);
        const results = await kubiosService.getHRVResults(testUser.user_id);
        console.log(`✅ Obtenidos ${results.length} resultados HRV para ${testUser.name}`);
        
        if (results.length > 0) {
          console.log('🎉 ¡Reautenticación funcionando correctamente!');
        } else {
          console.log('⚠️ No se encontraron resultados, pero la reautenticación funcionó');
        }
      } else {
        console.log('❌ No se obtuvieron usuarios del equipo');
      }
    } else {
      console.error('❌ Error en autenticación inicial');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testReauthFix();
