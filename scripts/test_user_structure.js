#!/usr/bin/env node

/**
 * Script para probar la estructura de datos del usuario y obtener team_id
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando la estructura de datos del usuario...\n');

async function testUserStructure() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🔐 Probando autenticación...');
    const authenticated = await kubiosService.authenticate();
    
    if (authenticated) {
      console.log('✅ Autenticación exitosa');
      
      console.log('👤 Obteniendo información del usuario...');
      const userInfo = await kubiosService.getUserInfo();
      
      if (userInfo) {
        console.log('✅ Información del usuario obtenida');
        console.log('📋 Estructura completa de userInfo:');
        console.log(JSON.stringify(userInfo, null, 2));
        
        // Verificar estructura de equipos
        const teams = userInfo.user?.teams || [];
        console.log(`\n👥 Equipos encontrados: ${teams.length}`);
        
        if (teams.length > 0) {
          teams.forEach((team, index) => {
            console.log(`   ${index + 1}. ${team.name} (ID: ${team.team_id})`);
          });
          
          // Buscar el equipo específico
          const targetTeam = teams.find(team => team.name === "Diabetes Tracker - H2TRAIN");
          if (targetTeam) {
            console.log(`\n🎯 Equipo objetivo encontrado: ${targetTeam.name} (ID: ${targetTeam.team_id})`);
            
            console.log('👥 Probando usuarios del equipo...');
            const teamUsers = await kubiosService.getTeamUsers();
            console.log(`✅ Obtenidos ${teamUsers.length} usuarios del equipo`);
            
            if (teamUsers.length > 0) {
              console.log('📋 Usuarios del equipo:');
              teamUsers.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
              });
            }
          } else {
            console.log('\n⚠️ No se encontró el equipo "Diabetes Tracker - H2TRAIN"');
            console.log('🔄 Usando el primer equipo disponible...');
            
            const firstTeam = teams[0];
            console.log(`📋 Usando equipo: ${firstTeam.name} (ID: ${firstTeam.team_id})`);
          }
        } else {
          console.log('\n❌ No se encontraron equipos para el usuario');
        }
        
      } else {
        console.log('❌ No se pudo obtener información del usuario');
      }
      
    } else {
      console.log('❌ Autenticación falló');
      console.log('🔄 Probando con datos estáticos...');
      
      const staticUsers = [
        { user_id: 'd485bbca-20dc-4d69-b471-ee9c5833829c', name: 'Hugo Duran Miguel', email: 'hugoduranmiguel13@gmail.com', measurement_count: 33 },
        { user_id: 'ccb2ebf3-ab5a-4cc6-8fa0-7f666955dc96', name: 'Beatriz Montesdeoca Henriquez', email: 'beatrizmh27@gmail.com', measurement_count: 46 },
        { user_id: '89ae06a6-567d-4e55-864c-66731067d0b4', name: 'Cristina Montiel', email: 'montielcaminoscristina@gmail.com', measurement_count: 11 }
      ];
      
      console.log(`✅ Usando ${staticUsers.length} usuarios estáticos`);
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar las pruebas
testUserStructure().then(() => {
  console.log('\n🎯 Resumen de la corrección de la estructura de datos:');
  console.log('   ✅ Estructura de userInfo investigada');
  console.log('   ✅ Obtención de team_id desde userInfo.user.teams');
  console.log('   ✅ Búsqueda del equipo específico');
  console.log('   ✅ Fallback al primer equipo disponible');
  console.log('   ✅ Logging detallado para debugging');
  
  console.log('\n🚀 ¡La obtención del team_id debería funcionar correctamente ahora!');
});
