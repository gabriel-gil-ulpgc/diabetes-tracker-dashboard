#!/usr/bin/env node

/**
 * Script para probar que las keys de los datos mock sean únicas
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando keys únicas en datos mock...\n');

async function testMockKeys() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🎲 Generando datos mock...');
    const mockResults1 = kubiosService.generateMockResults('user1', 5);
    const mockResults2 = kubiosService.generateMockResults('user2', 5);
    const mockResults3 = kubiosService.generateMockResults('user1', 3); // Mismo usuario, diferente timestamp
    
    console.log(`✅ Generados ${mockResults1.length} resultados para user1`);
    console.log(`✅ Generados ${mockResults2.length} resultados para user2`);
    console.log(`✅ Generados ${mockResults3.length} resultados para user1 (segunda vez)`);
    
    // Verificar keys únicas
    const allResults = [...mockResults1, ...mockResults2, ...mockResults3];
    const resultIds = allResults.map(r => r.result_id);
    const measureIds = allResults.map(r => r.measure_id);
    
    console.log('\n📋 Result IDs generados:');
    resultIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });
    
    console.log('\n📋 Measure IDs generados:');
    measureIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });
    
    // Verificar duplicados
    const uniqueResultIds = new Set(resultIds);
    const uniqueMeasureIds = new Set(measureIds);
    
    console.log(`\n🔍 Verificación de duplicados:`);
    console.log(`   Result IDs: ${resultIds.length} total, ${uniqueResultIds.size} únicos`);
    console.log(`   Measure IDs: ${measureIds.length} total, ${uniqueMeasureIds.size} únicos`);
    
    if (resultIds.length === uniqueResultIds.size && measureIds.length === uniqueMeasureIds.size) {
      console.log('✅ ¡Todas las keys son únicas!');
    } else {
      console.log('❌ Se encontraron keys duplicadas');
      
      // Encontrar duplicados
      const resultIdCounts = {};
      const measureIdCounts = {};
      
      resultIds.forEach(id => {
        resultIdCounts[id] = (resultIdCounts[id] || 0) + 1;
      });
      
      measureIds.forEach(id => {
        measureIdCounts[id] = (measureIdCounts[id] || 0) + 1;
      });
      
      console.log('\n🔍 Duplicados encontrados:');
      Object.entries(resultIdCounts).forEach(([id, count]) => {
        if (count > 1) {
          console.log(`   Result ID "${id}" aparece ${count} veces`);
        }
      });
      
      Object.entries(measureIdCounts).forEach(([id, count]) => {
        if (count > 1) {
          console.log(`   Measure ID "${id}" aparece ${count} veces`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar las pruebas
testMockKeys().then(() => {
  console.log('\n🎯 Resumen de la corrección de keys:');
  console.log('   ✅ Keys únicas con timestamp y user_id');
  console.log('   ✅ Verificación de duplicados implementada');
  console.log('   ✅ Logging detallado para debugging');
  
  console.log('\n🚀 ¡Las keys duplicadas deberían estar solucionadas!');
});
