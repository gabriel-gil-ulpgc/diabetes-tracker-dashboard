#!/usr/bin/env node

/**
 * Script para probar el conteo de mediciones por usuario
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando conteo de mediciones por usuario...\n');

async function testMeasurementCount() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación exitosa');
      
      console.log('👥 Obteniendo usuarios del equipo con conteos...');
      const teamUsers = await kubiosService.getTeamUsers();
      
      if (teamUsers.length > 0) {
        console.log(`✅ Obtenidos ${teamUsers.length} usuarios del equipo`);
        
        console.log('\n📊 Conteo de mediciones por usuario:');
        teamUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}): ${user.measurement_count} mediciones`);
        });
        
        // Mostrar usuarios con mediciones
        const usersWithMeasurements = teamUsers.filter(user => user.measurement_count > 0);
        console.log(`\n📈 Usuarios con mediciones: ${usersWithMeasurements.length}/${teamUsers.length}`);
        
        if (usersWithMeasurements.length > 0) {
          console.log('\n🎯 Usuarios con datos:');
          usersWithMeasurements.forEach(user => {
            console.log(`  - ${user.name}: ${user.measurement_count} mediciones`);
          });
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

testMeasurementCount();
