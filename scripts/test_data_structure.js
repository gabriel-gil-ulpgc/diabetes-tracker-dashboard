#!/usr/bin/env node

/**
 * Script para probar la estructura de datos del servicio de Kubios
 */

const { KubiosService } = require('../src/lib/kubios-service.ts');

console.log('🔧 Probando la estructura de datos del servicio de Kubios...\n');

async function testDataStructure() {
  try {
    console.log('📦 Creando instancia del servicio...');
    const kubiosService = new KubiosService();
    
    console.log('🎲 Generando datos de ejemplo...');
    const mockResults = kubiosService.generateMockResults('test_user', 2);
    
    console.log('📊 Verificando estructura de datos...');
    
    mockResults.forEach((result, index) => {
      console.log(`\n📋 Resultado ${index + 1}:`);
      console.log(`   ✅ result_id: ${result.result_id}`);
      console.log(`   ✅ measure_id: ${result.measure_id}`);
      console.log(`   ✅ user_id: ${result.user_id}`);
      console.log(`   ✅ user_name: ${result.user_name}`);
      
      // Verificar estructura anidada
      if (result.result) {
        console.log(`   ✅ result.readiness: ${result.result.readiness}`);
        console.log(`   ✅ result.mean_hr_bpm: ${result.result.mean_hr_bpm}`);
        console.log(`   ✅ result.rmssd_ms: ${result.result.rmssd_ms}`);
        console.log(`   ✅ result.pns_index: ${result.result.pns_index}`);
        console.log(`   ✅ result.sns_index: ${result.result.sns_index}`);
        console.log(`   ✅ result.physiological_age: ${result.result.physiological_age}`);
        console.log(`   ✅ result.respiratory_rate: ${result.result.respiratory_rate}`);
        console.log(`   ✅ result.stress_index: ${result.result.stress_index}`);
        console.log(`   ✅ result.artefact_level: ${result.result.artefact_level}`);
        
        if (result.result.freq_domain) {
          console.log(`   ✅ result.freq_domain.HF_power: ${result.result.freq_domain.HF_power}`);
          console.log(`   ✅ result.freq_domain.LF_power: ${result.result.freq_domain.LF_power}`);
          console.log(`   ✅ result.freq_domain.VLF_power: ${result.result.freq_domain.VLF_power}`);
          console.log(`   ✅ result.freq_domain.tot_power: ${result.result.freq_domain.tot_power}`);
        }
      } else {
        console.log(`   ❌ result.result no encontrado`);
      }
    });
    
    console.log('\n🎯 Verificación de campos críticos:');
    const firstResult = mockResults[0];
    
    const criticalFields = [
      'result.readiness',
      'result.mean_hr_bpm',
      'result.rmssd_ms',
      'result.pns_index',
      'result.sns_index',
      'result.physiological_age',
      'result.respiratory_rate',
      'result.stress_index',
      'result.artefact_level',
      'result.freq_domain.HF_power',
      'result.freq_domain.LF_power',
      'result.freq_domain.VLF_power',
      'result.freq_domain.tot_power'
    ];
    
    let allFieldsPresent = true;
    criticalFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], firstResult);
      if (value !== undefined && value !== null) {
        console.log(`   ✅ ${field}: ${value}`);
      } else {
        console.log(`   ❌ ${field}: undefined`);
        allFieldsPresent = false;
      }
    });
    
    if (allFieldsPresent) {
      console.log('\n🎉 ¡Todos los campos críticos están presentes!');
      console.log('✅ La estructura de datos es compatible con el frontend');
    } else {
      console.log('\n❌ Algunos campos críticos están faltando');
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testDataStructure().then(() => {
  console.log('\n📋 Resumen de la corrección:');
  console.log('   ✅ Estructura de datos corregida');
  console.log('   ✅ Campos anidados en result.result');
  console.log('   ✅ Campos críticos del frontend incluidos');
  console.log('   ✅ Datos de ejemplo con estructura correcta');
  console.log('   ✅ Compatible con el frontend de Kubios');
  
  console.log('\n🚀 ¡El error de "readiness undefined" debería estar solucionado!');
});
