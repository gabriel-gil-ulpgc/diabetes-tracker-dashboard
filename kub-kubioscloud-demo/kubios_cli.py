#!/usr/bin/env python3
"""
CLI para el servicio de Kubios Cloud
"""
import argparse
import json
import sys
from kubios_service import KubiosService

def main():
    parser = argparse.ArgumentParser(description='CLI para Kubios Cloud Service')
    parser.add_argument('--config', default='my_config.yaml', help='Archivo de configuración')
    parser.add_argument('--username', help='Usuario de Kubios')
    parser.add_argument('--password', help='Contraseña de Kubios')
    parser.add_argument('--client-id', help='Client ID de Kubios')
    parser.add_argument('--action', required=True, choices=[
        'authenticate', 'user-info', 'measurements', 'measurements-advanced', 
        'measurement-details', 'measurement-details-full', 'download-data', 
        'hrv-results', 'hrv-results-measurement', 'hrv-results-direct', 'complete-measurement-data',
        'subjects', 'subject-details', 'create-subject', 
        'update-subject', 'delete-subject', 'team-measurements', 'team-members-measurements', 'all-team-measurements', 'debug-member', 'list-measure-ids'
    ], help='Acción a realizar')
    parser.add_argument('--measurement-id', help='ID de medición (para acciones específicas)')
    parser.add_argument('--subject-id', help='ID de sujeto (para acciones específicas)')
    parser.add_argument('--limit', type=int, default=10, help='Límite de resultados')
    parser.add_argument('--from-date', help='Fecha de inicio (ISO8601) para filtrar mediciones')
    parser.add_argument('--to-date', help='Fecha de fin (ISO8601) para filtrar mediciones')
    parser.add_argument('--count', type=int, default=1000, help='Número máximo de elementos a retornar')
    parser.add_argument('--state', help='Estado de mediciones (active, finalized)')
    parser.add_argument('--details', action='store_true', help='Incluir detalles completos en las mediciones')
    parser.add_argument('--team-id', help='ID del equipo para obtener mediciones del equipo completo')
    parser.add_argument('--team-name', help='Nombre del equipo para obtener mediciones (default: Diabetes Tracker - H2TRAIN)')
    parser.add_argument('--subject-data', help='Datos del sujeto en formato JSON para crear/actualizar')
    parser.add_argument('--user-id', help='ID de usuario específico (para acciones de HRV)')
    
    args = parser.parse_args()
    
    # Crear servicio
    service = KubiosService(args.config)
    
    # Si se proporcionan credenciales por línea de comandos, actualizar configuración
    if args.username and args.password and args.client_id:
        service.config = {
            'username': args.username,
            'password': args.password,
            'client_id': args.client_id
        }
    
    try:
        if args.action == 'authenticate':
            result = service.authenticate()
            if result:
                print(json.dumps({
                    'success': True,
                    'message': 'Autenticación exitosa',
                    'tokens': service.tokens
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error en autenticación'
                }))
                sys.exit(1)
        
        elif args.action == 'user-info':
            user_info = service.get_user_info()
            if user_info:
                print(json.dumps({
                    'success': True,
                    'data': user_info
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener información del usuario'
                }))
                sys.exit(1)
        
        elif args.action == 'measurements':
            measurements = service.get_recent_measurements(args.limit)
            if measurements is not None:
                print(json.dumps({
                    'success': True,
                    'data': measurements,
                    'count': len(measurements)
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener mediciones'
                }))
                sys.exit(1)
        
        elif args.action == 'measurement-details':
            if not args.measurement_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de medición requerido'
                }))
                sys.exit(1)
            
            details = service.get_measurement_details(args.measurement_id)
            if details:
                print(json.dumps({
                    'success': True,
                    'data': details
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener detalles de la medición'
                }))
                sys.exit(1)
        
        elif args.action == 'download-data':
            if not args.measurement_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de medición requerido'
                }))
                sys.exit(1)
            
            data = service.download_measurement_data(args.measurement_id)
            if data:
                print(json.dumps({
                    'success': True,
                    'data': data
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al descargar datos de la medición'
                }))
                sys.exit(1)
        
        elif args.action == 'hrv-results':
            results = service.get_hrv_results()
            if results is not None:
                print(json.dumps({
                    'success': True,
                    'data': results
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener resultados HRV'
                }))
                sys.exit(1)
        
        elif args.action == 'hrv-results-measurement':
            if not args.measurement_id:
                print(json.dumps({
                    'success': False,
                    'message': 'Se requiere --measurement-id para esta acción'
                }, indent=2, ensure_ascii=False))
                sys.exit(1)
            
            result = service.get_hrv_results_for_measurement(args.measurement_id)
            if result:
                print(json.dumps({
                    'success': True,
                    'data': result
                }, indent=2, ensure_ascii=False))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener resultados HRV para medición {args.measurement_id}'
                }, indent=2, ensure_ascii=False))
                sys.exit(1)
        
        elif args.action == 'hrv-results-direct':
            user_id = args.user_id or "self"
            result = service.get_hrv_results_direct(user_id)
            if result:
                print(json.dumps({
                    'success': True,
                    'data': result
                }, indent=2, ensure_ascii=False))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener resultados HRV directos para usuario {user_id}'
                }, indent=2, ensure_ascii=False))
                sys.exit(1)
        
        elif args.action == 'complete-measurement-data':
            if not args.measurement_id:
                print(json.dumps({
                    'success': False,
                    'message': 'Se requiere --measurement-id para esta acción'
                }, indent=2, ensure_ascii=False))
                sys.exit(1)
            
            result = service.get_complete_measurement_data(args.measurement_id)
            if result:
                # Mostrar datos formateados como en la app de Kubios
                formatted = result.get('formatted_data', {})
                
                print("=" * 80)
                print(f"📊 DATOS COMPLETOS DE MEDICIÓN: {args.measurement_id}")
                print("=" * 80)
                
                # Información básica
                basic_info = formatted.get('basic_info', {})
                print(f"📅 Fecha de medición: {basic_info.get('measured_timestamp', 'N/A')}")
                print(f"📝 Estado: {basic_info.get('state', 'N/A')}")
                print(f"📄 Descripción: {basic_info.get('description', 'Sin descripción')}")
                print()
                
                # Información del sujeto
                subject_info = formatted.get('subject_info', {})
                if subject_info:
                    print("👤 INFORMACIÓN DEL SUJETO:")
                    print(f"   • Nombre: {subject_info.get('name', 'N/A')}")
                    print(f"   • Edad: {subject_info.get('age', 'N/A')} años")
                    print(f"   • Altura: {subject_info.get('height', 'N/A')} cm")
                    print(f"   • Peso: {subject_info.get('weight', 'N/A')} kg")
                    print(f"   • Género: {subject_info.get('gender', 'N/A')}")
                    print(f"   • Edad fisiológica: {subject_info.get('physiological_age', 'N/A')}")
                    print()
                
                # Información del sensor
                sensor_info = formatted.get('sensor_info', {})
                if sensor_info:
                    print("🔧 INFORMACIÓN DEL SENSOR:")
                    print(f"   • Modelo: {sensor_info.get('model', 'N/A')}")
                    print(f"   • Fabricante: {sensor_info.get('manufacturer', 'N/A')}")
                    print(f"   • Firmware: {sensor_info.get('firmware', 'N/A')}")
                    print(f"   • Software: {sensor_info.get('software', 'N/A')}")
                    print()
                
                # Métricas de HRV
                hrv_metrics = formatted.get('hrv_metrics', {})
                if hrv_metrics:
                    print("💓 MÉTRICAS DE HRV:")
                    print(f"   • Frecuencia cardíaca en reposo: {hrv_metrics.get('resting_hr', 'N/A')} bpm")
                    print(f"   • RMSSD: {hrv_metrics.get('rmssd', 'N/A')} ms")
                    print(f"   • Índice PNS: {hrv_metrics.get('pns_index', 'N/A')}")
                    print(f"   • Índice SNS: {hrv_metrics.get('sns_index', 'N/A')}")
                    print(f"   • RR medio: {hrv_metrics.get('mean_rr', 'N/A')} ms")
                    print(f"   • SDNN: {hrv_metrics.get('sdnn', 'N/A')} ms")
                    print(f"   • Frecuencia respiratoria: {hrv_metrics.get('respiratory_rate', 'N/A')} min⁻¹")
                    print(f"   • Potencia LF: {hrv_metrics.get('lf_power', 'N/A')} n.u.")
                    print(f"   • Potencia HF: {hrv_metrics.get('hf_power', 'N/A')} n.u.")
                    print(f"   • Calidad: {hrv_metrics.get('quality', 'N/A')}")
                    print()
                
                # Datos de readiness
                readiness_data = formatted.get('readiness_data', {})
                if readiness_data:
                    print("🎯 DATOS DE READINESS:")
                    readiness_percentage = readiness_data.get('readiness_percentage', 'N/A')
                    readiness_level = readiness_data.get('readiness_level', 'N/A')
                    
                    print(f"   • READINESS: {readiness_percentage}% ({readiness_level})")
                    print(f"   • Sensación: {readiness_data.get('feeling_score', 'N/A')}")
                    print(f"   • Fatiga aguda: {readiness_data.get('acute_fatigue', 'N/A')}")
                    print(f"   • Fatiga crónica: {readiness_data.get('chronic_fatigue', 'N/A')}")
                    print()
                
                print("=" * 80)
                print("✅ Datos completos disponibles en formato JSON:")
                print("=" * 80)
                
                # También mostrar el JSON completo
                print(json.dumps({
                    'success': True,
                    'data': result
                }, indent=2, ensure_ascii=False))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener datos completos de medición {args.measurement_id}'
                }, indent=2, ensure_ascii=False))
                sys.exit(1)
        
        elif args.action == 'list-measure-ids':
            team_name = args.team_name or "Diabetes Tracker - H2TRAIN"
            result = service.get_all_team_measurements(team_name)
            if result:
                print("MEDICIONES DISPONIBLES:")
                print("=" * 80)
                
                measurements_by_member = result.get('measurements_by_member', {})
                for member_id, member_data in measurements_by_member.items():
                    member_name = member_data.get('member_name', 'Desconocido')
                    measurements = member_data.get('measurements', [])
                    
                    if measurements:
                        print(f"\n{member_name} ({len(measurements)} mediciones):")
                        for measurement in measurements[:5]:  # Solo las primeras 5
                            measure_id = measurement.get('measure_id', 'N/A')
                            timestamp = measurement.get('measured_timestamp', 'N/A')
                            print(f"  • {measure_id} - {timestamp}")
                        if len(measurements) > 5:
                            print(f"  ... y {len(measurements) - 5} más")
            else:
                print("Error al obtener mediciones del equipo")
                sys.exit(1)
        
        elif args.action == 'measurements-advanced':
            result = service.get_measurements_with_params(
                from_date=args.from_date,
                to_date=args.to_date,
                count=args.count,
                state=args.state,
                details=args.details,
                team_id=args.team_id
            )
            if result is not None:
                print(json.dumps({
                    'success': True,
                    'data': result
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener mediciones avanzadas'
                }))
                sys.exit(1)
        
        elif args.action == 'measurement-details-full':
            if not args.measurement_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de medición requerido'
                }))
                sys.exit(1)
            
            details = service.get_measurement_details_full(args.measurement_id)
            if details:
                print(json.dumps({
                    'success': True,
                    'data': details
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener detalles completos de la medición'
                }))
                sys.exit(1)
        
        elif args.action == 'subjects':
            subjects = service.get_subjects()
            if subjects is not None:
                print(json.dumps({
                    'success': True,
                    'data': subjects,
                    'count': len(subjects)
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener sujetos'
                }))
                sys.exit(1)
        
        elif args.action == 'subject-details':
            if not args.subject_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de sujeto requerido'
                }))
                sys.exit(1)
            
            details = service.get_subject_details(args.subject_id)
            if details:
                print(json.dumps({
                    'success': True,
                    'data': details
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al obtener detalles del sujeto'
                }))
                sys.exit(1)
        
        elif args.action == 'create-subject':
            if not args.subject_data:
                print(json.dumps({
                    'success': False,
                    'message': 'Datos del sujeto requeridos (--subject-data)'
                }))
                sys.exit(1)
            
            try:
                subject_data = json.loads(args.subject_data)
                result = service.create_subject(subject_data)
                if result:
                    print(json.dumps({
                        'success': True,
                        'data': result
                    }))
                else:
                    print(json.dumps({
                        'success': False,
                        'message': 'Error al crear sujeto'
                    }))
                    sys.exit(1)
            except json.JSONDecodeError:
                print(json.dumps({
                    'success': False,
                    'message': 'Error: Datos del sujeto deben ser JSON válido'
                }))
                sys.exit(1)
        
        elif args.action == 'update-subject':
            if not args.subject_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de sujeto requerido'
                }))
                sys.exit(1)
            
            if not args.subject_data:
                print(json.dumps({
                    'success': False,
                    'message': 'Datos del sujeto requeridos (--subject-data)'
                }))
                sys.exit(1)
            
            try:
                subject_data = json.loads(args.subject_data)
                result = service.update_subject(args.subject_id, subject_data)
                if result:
                    print(json.dumps({
                        'success': True,
                        'data': result
                    }))
                else:
                    print(json.dumps({
                        'success': False,
                        'message': 'Error al actualizar sujeto'
                    }))
                    sys.exit(1)
            except json.JSONDecodeError:
                print(json.dumps({
                    'success': False,
                    'message': 'Error: Datos del sujeto deben ser JSON válido'
                }))
                sys.exit(1)
        
        elif args.action == 'delete-subject':
            if not args.subject_id:
                print(json.dumps({
                    'success': False,
                    'message': 'ID de sujeto requerido'
                }))
                sys.exit(1)
            
            success = service.delete_subject(args.subject_id)
            if success:
                print(json.dumps({
                    'success': True,
                    'message': 'Sujeto eliminado correctamente'
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': 'Error al eliminar sujeto'
                }))
                sys.exit(1)
        
        elif args.action == 'team-measurements':
            team_name = args.team_name or "Diabetes Tracker - H2TRAIN"
            result = service.get_team_measurements(team_name)
            if result:
                print(json.dumps({
                    'success': True,
                    'data': result
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener mediciones del equipo "{team_name}"'
                }))
                sys.exit(1)
        
        elif args.action == 'team-members-measurements':
            team_name = args.team_name or "Diabetes Tracker - H2TRAIN"
            result = service.get_team_members_measurements(team_name)
            if result:
                print(json.dumps({
                    'success': True,
                    'data': result
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener mediciones de los miembros del equipo "{team_name}"'
                }))
                sys.exit(1)
        
        elif args.action == 'all-team-measurements':
            team_name = args.team_name or "Diabetes Tracker - H2TRAIN"
            result = service.get_all_team_measurements(team_name)
            if result:
                # Mostrar resumen organizado
                print("=" * 80)
                print(f"📊 RESUMEN DE MEDICIONES DEL EQUIPO: {result['team']['name']}")
                print("=" * 80)
                
                organized = result.get('organized_summary', {})
                stats = organized.get('estadisticas', {})
                
                print(f"📈 ESTADÍSTICAS GENERALES:")
                print(f"   • Total de mediciones: {stats.get('total_mediciones', 0)}")
                print(f"   • Miembros con mediciones: {stats.get('miembros_con_mediciones', 0)}")
                print(f"   • Fechas únicas: {len(stats.get('fechas_unicas', []))}")
                print(f"   • Tipos de análisis: {', '.join(stats.get('tipos_analisis', []))}")
                print()
                
                # Mostrar resumen por miembro
                resumen_miembros = organized.get('resumen_por_miembro', {})
                if resumen_miembros:
                    print("👥 MEDICIONES POR MIEMBRO:")
                    print("-" * 60)
                    for member_name, member_data in resumen_miembros.items():
                        print(f"🔹 {member_name}")
                        print(f"   Email: {member_data.get('email', 'N/A')}")
                        print(f"   Roles: {', '.join(member_data.get('roles', []))}")
                        print(f"   Total mediciones: {member_data.get('total_mediciones', 0)}")
                        
                        # Mostrar detalles de cada medición
                        mediciones = member_data.get('mediciones', [])
                        if mediciones:
                            print("   📋 Detalles de mediciones:")
                            for i, medicion in enumerate(mediciones, 1):
                                print(f"      {i}. ID: {medicion.get('measure_id', 'N/A')}")
                                print(f"         Fecha: {medicion.get('fecha_medicion', 'N/A')}")
                                print(f"         Estado: {medicion.get('estado', 'N/A')}")
                                print(f"         Análisis: {', '.join(medicion.get('tipos_analisis', []))}")
                                print(f"         Canales: {medicion.get('canales', 0)}")
                                if medicion.get('sujeto') != 'N/A':
                                    print(f"         Sujeto: {medicion.get('sujeto', 'N/A')}")
                                if medicion.get('sensor') != 'N/A':
                                    print(f"         Sensor: {medicion.get('sensor', 'N/A')}")
                                print()
                        print()
                else:
                    print("❌ No se encontraron mediciones para ningún miembro")
                
                # Mostrar mediciones por fecha
                mediciones_por_fecha = organized.get('mediciones_por_fecha', {})
                if mediciones_por_fecha:
                    print("📅 MEDICIONES POR FECHA:")
                    print("-" * 40)
                    for fecha in sorted(mediciones_por_fecha.keys()):
                        mediciones_fecha = mediciones_por_fecha[fecha]
                        print(f"📆 {fecha}: {len(mediciones_fecha)} medición(es)")
                        for medicion in mediciones_fecha:
                            print(f"   • {medicion.get('miembro', 'N/A')} - {medicion.get('measure_id', 'N/A')} ({medicion.get('estado', 'N/A')})")
                        print()
                
                print("=" * 80)
                print("✅ Datos completos disponibles en formato JSON:")
                print("=" * 80)
                
                # También mostrar el JSON completo para referencia
                print(json.dumps({
                    'success': True,
                    'data': result
                }, indent=2, ensure_ascii=False))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al obtener todas las mediciones del equipo "{team_name}"'
                }))
                sys.exit(1)
        
        elif args.action == 'debug-member':
            member_email = args.team_name or "lucy.jr.93@gmail.com"  # Usar team_name como email para debug
            result = service.debug_member_measurements(member_email)
            if result:
                print(json.dumps({
                    'success': True,
                    'data': result
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'message': f'Error al hacer debug del miembro "{member_email}"'
                }))
                sys.exit(1)
    
    except Exception as e:
        print(json.dumps({
            'success': False,
            'message': f'Error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
