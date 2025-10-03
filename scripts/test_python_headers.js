#!/usr/bin/env node

/**
 * Script para probar con headers iguales al código de Python
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando con headers iguales al código de Python...\n');

async function testPythonHeaders() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación exitosa');
      
      // Probar con el usuario principal
      const testUserId = '82fed5be-7326-48d5-87c0-1649ffb4312c';
      console.log(`📊 Probando obtención de mediciones para usuario: ${testUserId}`);
      
      const results = await kubiosService.getHRVResults(testUserId);
      
      console.log(`✅ Obtenidos ${results.length} resultados HRV`);
      
      if (results.length > 0) {
        console.log('🎉 ¡Headers funcionando correctamente!');
        console.log('📋 Primer resultado:', JSON.stringify(results[0], null, 2));
      } else {
        console.log('⚠️ No se encontraron resultados para este usuario');
      }
      
      // Probar con usuarios del equipo
      console.log('\n👥 Probando obtención de usuarios del equipo...');
      const teamUsers = await kubiosService.getTeamUsers();
      
      if (teamUsers.length > 0) {
        console.log(`✅ Obtenidos ${teamUsers.length} usuarios del equipo`);
        
        // Probar con el primer usuario que tenga mediciones
        const userWithData = teamUsers.find(user => user.measurement_count > 0);
        if (userWithData) {
          console.log(`\n📊 Probando con usuario que tiene datos: ${userWithData.name} (${userWithData.measurement_count} mediciones)`);
          const userResults = await kubiosService.getHRVResults(userWithData.user_id);
          console.log(`✅ Obtenidos ${userResults.length} resultados para ${userWithData.name}`);
        } else {
          console.log('⚠️ No se encontraron usuarios con mediciones');
        }
      } else {
        console.log('❌ No se obtuvieron usuarios del equipo');
      }
      
    } else {
      console.error('❌ Error en autenticación');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testPythonHeaders();
