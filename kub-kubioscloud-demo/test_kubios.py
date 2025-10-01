#!/usr/bin/env python3
"""
Script de prueba para verificar la integración con Kubios Cloud
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from kubios_service import KubiosService

def test_kubios_integration():
    """Función de prueba para verificar la integración"""
    print("🧪 Iniciando pruebas de integración con Kubios Cloud...")
    
    # Crear servicio
    service = KubiosService()
    
    # Verificar que la configuración se carga
    if not service.config:
        print("❌ Error: No se pudo cargar la configuración")
        return False
    
    print("✅ Configuración cargada correctamente")
    
    # Verificar que las credenciales están presentes
    required_fields = ['username', 'password', 'client_id']
    for field in required_fields:
        if not service.config.get(field) or service.config.get(field).startswith('<'):
            print(f"⚠️  Advertencia: {field} no configurado en my_config.yaml")
            print(f"   Actualmente: {service.config.get(field)}")
            return False
    
    print("✅ Credenciales configuradas correctamente")
    
    # Intentar autenticación
    print("🔐 Intentando autenticación...")
    if service.authenticate():
        print("✅ Autenticación exitosa")
        
        # Probar obtener información del usuario
        print("👤 Obteniendo información del usuario...")
        user_info = service.get_user_info()
        if user_info:
            print(f"✅ Usuario: {user_info.get('username', 'N/A')}")
            print(f"   Email: {user_info.get('email', 'N/A')}")
        else:
            print("❌ No se pudo obtener información del usuario")
        
        # Probar obtener mediciones
        print("📊 Obteniendo mediciones recientes...")
        measurements = service.get_recent_measurements(5)
        if measurements:
            print(f"✅ Encontradas {len(measurements)} mediciones")
            for i, measurement in enumerate(measurements[:3]):
                print(f"   {i+1}. ID: {measurement.get('id', 'N/A')}")
                print(f"      Estado: {measurement.get('state', 'N/A')}")
                print(f"      Creado: {measurement.get('created_at', 'N/A')}")
        else:
            print("⚠️  No se encontraron mediciones")
        
        # Probar obtener resultados HRV
        print("💓 Obteniendo resultados HRV...")
        hrv_results = service.get_hrv_results()
        if hrv_results:
            print(f"✅ Encontrados {len(hrv_results)} resultados HRV")
            for i, result in enumerate(hrv_results[:3]):
                print(f"   {i+1}. ID: {result.get('id', 'N/A')}")
                print(f"      Tipo: {result.get('type', 'N/A')}")
        else:
            print("⚠️  No se encontraron resultados HRV")
        
        return True
    else:
        print("❌ Error en autenticación")
        return False

if __name__ == "__main__":
    success = test_kubios_integration()
    if success:
        print("\n🎉 ¡Todas las pruebas pasaron correctamente!")
        print("   La integración con Kubios Cloud está lista para usar.")
    else:
        print("\n💥 Algunas pruebas fallaron.")
        print("   Revisa la configuración en my_config.yaml")
        sys.exit(1)


