#!/usr/bin/env python3
"""
Script para obtener todas las mediciones del equipo "Diabetes Tracker - H2TRAIN"
"""
import json
import sys
from kubios_service import KubiosService

def get_team_measurements():
    """Obtener todas las mediciones del equipo Diabetes Tracker - H2TRAIN"""
    
    print("🏥 Obteniendo mediciones del equipo 'Diabetes Tracker - H2TRAIN'...")
    
    # Crear servicio
    service = KubiosService()
    
    # Autenticar
    if not service.authenticate():
        print("❌ Error: No se pudo autenticar")
        return
    
    print("✅ Autenticación exitosa")
    
    # Obtener información del usuario para ver los equipos
    user_info = service.get_user_info()
    if user_info:
        print(f"👤 Usuario: {user_info.get('user', {}).get('given_name', 'N/A')} {user_info.get('user', {}).get('family_name', 'N/A')}")
        
        # Mostrar equipos disponibles
        teams = user_info.get('user', {}).get('teams', [])
        print(f"🏢 Equipos disponibles: {len(teams)}")
        
        diabetes_team = None
        for team in teams:
            print(f"   - {team.get('name', 'N/A')} (ID: {team.get('team_id', 'N/A')})")
            if 'Diabetes Tracker' in team.get('name', ''):
                diabetes_team = team
                print(f"   ✅ Equipo objetivo encontrado: {team.get('name')}")
        
        if not diabetes_team:
            print("⚠️  No se encontró el equipo 'Diabetes Tracker - H2TRAIN'")
            return
    
    # Obtener todos los sujetos
    print("\n👥 Obteniendo lista de sujetos...")
    subjects = service.get_subjects()
    if subjects:
        print(f"✅ Encontrados {len(subjects)} sujetos:")
        for subject in subjects:
            print(f"   - {subject.get('name', 'N/A')} (ID: {subject.get('subject_id', 'N/A')})")
    else:
        print("⚠️  No se encontraron sujetos")
        subjects = []
    
    # Obtener todas las mediciones con detalles
    print("\n📊 Obteniendo todas las mediciones...")
    measurements_result = service.get_measurements_with_params(
        count=1000,
        details=True
    )
    
    if measurements_result and measurements_result.get('measures'):
        measures = measurements_result['measures']
        print(f"✅ Encontradas {len(measures)} mediciones:")
        
        # Organizar mediciones por sujeto
        measurements_by_subject = {}
        measurements_without_subject = []
        
        for measure in measures:
            subject_info = measure.get('subject')
            if subject_info:
                subject_id = subject_info.get('subject_id', 'unknown')
                subject_name = subject_info.get('name', 'Sin nombre')
                
                if subject_id not in measurements_by_subject:
                    measurements_by_subject[subject_id] = {
                        'subject_name': subject_name,
                        'subject_info': subject_info,
                        'measurements': []
                    }
                
                measurements_by_subject[subject_id]['measurements'].append(measure)
            else:
                measurements_without_subject.append(measure)
        
        # Mostrar resumen por sujeto
        print(f"\n📋 Resumen de mediciones por sujeto:")
        for subject_id, data in measurements_by_subject.items():
            print(f"\n👤 {data['subject_name']} (ID: {subject_id})")
            print(f"   📊 Mediciones: {len(data['measurements'])}")
            
            for i, measurement in enumerate(data['measurements'][:3]):  # Mostrar solo las primeras 3
                print(f"   {i+1}. ID: {measurement.get('measure_id', 'N/A')}")
                print(f"      Estado: {measurement.get('state', 'N/A')}")
                print(f"      Fecha: {measurement.get('measured_timestamp', 'N/A')}")
                print(f"      Descripción: {measurement.get('description', 'Sin descripción')}")
                
                # Mostrar canales si están disponibles
                channels = measurement.get('channels', [])
                if channels:
                    print(f"      Canales: {len(channels)}")
                    for channel in channels:
                        print(f"        - {channel.get('type', 'N/A')} ({channel.get('label', 'Sin etiqueta')})")
            
            if len(data['measurements']) > 3:
                print(f"   ... y {len(data['measurements']) - 3} mediciones más")
        
        # Mostrar mediciones sin sujeto
        if measurements_without_subject:
            print(f"\n⚠️  Mediciones sin sujeto asignado: {len(measurements_without_subject)}")
            for measurement in measurements_without_subject[:3]:
                print(f"   - ID: {measurement.get('measure_id', 'N/A')}")
                print(f"     Estado: {measurement.get('state', 'N/A')}")
                print(f"     Fecha: {measurement.get('measured_timestamp', 'N/A')}")
        
        # Guardar resultados en archivo JSON
        output_data = {
            'team': 'Diabetes Tracker - H2TRAIN',
            'subjects': subjects,
            'measurements_by_subject': measurements_by_subject,
            'measurements_without_subject': measurements_without_subject,
            'total_measurements': len(measures),
            'total_subjects': len(measurements_by_subject)
        }
        
        with open('team_measurements.json', 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultados guardados en 'team_measurements.json'")
        print(f"📊 Resumen final:")
        print(f"   - Total de sujetos: {len(measurements_by_subject)}")
        print(f"   - Total de mediciones: {len(measures)}")
        print(f"   - Mediciones sin sujeto: {len(measurements_without_subject)}")
        
    else:
        print("⚠️  No se encontraron mediciones")
        print("   Esto puede ser normal si:")
        print("   - El equipo es nuevo")
        print("   - No se han registrado mediciones aún")
        print("   - Las mediciones están en otro equipo")

if __name__ == "__main__":
    get_team_measurements()


