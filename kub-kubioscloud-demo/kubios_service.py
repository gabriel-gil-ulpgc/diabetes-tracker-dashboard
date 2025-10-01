#!/usr/bin/env python3
"""
Servicio de integración con Kubios Cloud para Diabetes Tracker
"""
import os
import sys
import yaml
import logging
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime

# Agregar el directorio actual al path para importar los módulos de kubioscloud_demos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from kubioscloud_demos.auth import user_login, AuthenticationError
    from kubioscloud_demos.kubcloud import (
        user_info, measurement_list, measurement_info, 
        results_list, get_channel_data
    )
except ImportError as e:
    print(f"Error importando módulos de kubioscloud_demos: {e}")
    print("Intentando importación alternativa...")
    
    # Importación alternativa directa
    import requests
    import uuid
    from urllib.parse import parse_qs, urlparse
    
    # Definir funciones básicas si no se pueden importar
    def user_login(username, password, client_id, redirect_uri=None):
        """Función de login simplificada"""
        if not redirect_uri:
            redirect_uri = "https://analysis.kubioscloud.com/v1/portal/login"
        
        LOGIN_URL = "https://kubioscloud.auth.eu-west-1.amazoncognito.com/login"
        csrf = str(uuid.uuid4())
        
        session = requests.session()
        login_data = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "username": username,
            "password": password,
            "response_type": "token",
            "scope": "openid",
            "_csrf": csrf,
        }
        
        login_response = session.post(
            LOGIN_URL,
            data=login_data,
            allow_redirects=False,
            headers={"Cookie": f"XSRF-TOKEN={csrf}", "User-Agent": "DemoApp 1.0"},
        )
        
        login_response.raise_for_status()
        location_url = login_response.headers["Location"]
        
        if location_url == LOGIN_URL:
            raise Exception("Authentication failed")
        
        parsed = urlparse(location_url)
        parameters = parse_qs(parsed.fragment)
        tokens = {
            "id_token": parameters["id_token"][0],
            "access_token": parameters["access_token"][0],
        }
        return tokens
    
    class AuthenticationError(Exception):
        pass
    
    def user_info(id_token, user_id="self"):
        """Función simplificada para obtener info del usuario"""
        KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
        response = requests.get(
            KUBIOSCLOUD_BASE_URL + f"v1/user/{user_id}",
            headers={
                "Authorization": id_token,
                "User-Agent": "DemoApp 1.0"
            }
        )
        response.raise_for_status()
        return response.json()
    
    def measurement_list(id_token, user_id="self", state=None):
        """Función simplificada para obtener mediciones"""
        KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
        params = {}
        if state is not None:
            params["state"] = state
        
        response = requests.get(
            KUBIOSCLOUD_BASE_URL + f"v2/measure/{user_id}/session",
            params=params,
            headers={
                "Authorization": id_token,
                "User-Agent": "DemoApp 1.0"
            }
        )
        response.raise_for_status()
        return response.json()
    
    def measurement_info(id_token, measurement_id, user_id="self"):
        """Función simplificada para obtener detalles de medición"""
        KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
        response = requests.get(
            f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session/{measurement_id}",
            headers={
                "Authorization": id_token,
                "User-Agent": "DemoApp 1.0"
            }
        )
        response.raise_for_status()
        return response.json()
    
    def results_list(id_token, user_id="self"):
        """Función simplificada para obtener resultados HRV"""
        KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
        response = requests.get(
            KUBIOSCLOUD_BASE_URL + f"v1/result/{user_id}",
            headers={
                "Authorization": id_token,
                "User-Agent": "DemoApp 1.0"
            }
        )
        response.raise_for_status()
        return response.json()
    
    def get_channel_data(s3_url, data_enc=None):
        """Función simplificada para descargar datos"""
        data = requests.get(s3_url).content
        return data

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KubiosService:
    """Servicio para interactuar con la API de Kubios Cloud"""
    
    def __init__(self, config_file: str = "my_config.yaml"):
        self.config_file = config_file
        self.tokens = None
        self.config = None
        self.load_config()
    
    def load_config(self):
        """Cargar configuración desde archivo YAML"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            logger.info(f"Configuración cargada desde {self.config_file}")
        except FileNotFoundError:
            logger.error(f"Archivo de configuración {self.config_file} no encontrado")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Error al parsear YAML: {e}")
            raise
    
    def authenticate(self) -> bool:
        """Autenticar con Kubios Cloud y obtener tokens"""
        try:
            if not self.config:
                raise ValueError("Configuración no cargada")
            
            username = self.config.get('username')
            password = self.config.get('password')
            client_id = self.config.get('client_id')
            
            if not all([username, password, client_id]):
                raise ValueError("Faltan credenciales en la configuración")
            
            logger.info("Autenticando con Kubios Cloud...")
            self.tokens = user_login(username, password, client_id)
            logger.info("Autenticación exitosa")
            return True
            
        except AuthenticationError as e:
            logger.error(f"Error de autenticación: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado durante autenticación: {e}")
            return False
    
    def get_user_info(self) -> Optional[Dict]:
        """Obtener información del usuario"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            return user_info(self.tokens['id_token'])
        except Exception as e:
            logger.error(f"Error al obtener información del usuario: {e}")
            return None
    
    def get_measurements(self, state: Optional[str] = None) -> Optional[List[Dict]]:
        """Obtener lista de mediciones del usuario"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            result = measurement_list(self.tokens['id_token'], state=state)
            # La respuesta puede tener diferentes estructuras
            if isinstance(result, dict):
                if 'measurements' in result:
                    return result['measurements']
                elif 'sessions' in result:
                    return result['sessions']
                else:
                    return []
            elif isinstance(result, list):
                return result
            else:
                return []
        except Exception as e:
            logger.error(f"Error al obtener mediciones: {e}")
            return None
    
    def get_measurement_details(self, measurement_id: str) -> Optional[Dict]:
        """Obtener detalles de una medición específica"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            return measurement_info(self.tokens['id_token'], measurement_id)
        except Exception as e:
            logger.error(f"Error al obtener detalles de medición {measurement_id}: {e}")
            return None
    
    def download_measurement_data(self, measurement_id: str) -> Optional[Dict]:
        """Descargar datos de una medición"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Primero obtener información de la medición
            measurement_info = self.get_measurement_details(measurement_id)
            if not measurement_info:
                return None
            
            # Descargar datos si hay URL disponible
            data_url = measurement_info.get('data_url')
            if data_url:
                data_enc = measurement_info.get('channels', [{}])[0].get('data_enc')
                raw_data = get_channel_data(data_url, data_enc)
                return {
                    'measurement_id': measurement_id,
                    'data': raw_data,
                    'metadata': measurement_info
                }
            else:
                logger.warning(f"No hay URL de datos disponible para medición {measurement_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error al descargar datos de medición {measurement_id}: {e}")
            return None
    
    def get_hrv_results(self) -> Optional[List[Dict]]:
        """Obtener resultados de análisis HRV"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            result = results_list(self.tokens['id_token'])
            return result.get('results', [])
        except Exception as e:
            logger.error(f"Error al obtener resultados HRV: {e}")
            return None

    def get_hrv_results_direct(self, user_id: str = "self") -> Optional[Dict]:
        """Obtener resultados HRV directamente usando requests"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Usar el endpoint correcto según el SDK de Kubios
            endpoint = f"https://analysis.kubioscloud.com/v1/result/{user_id}"
            logger.info(f"🔍 Probando endpoint: {endpoint}")
            
            # Usar el formato de header correcto según el SDK
            headers = {
                'Authorization': self.tokens['id_token'],  # Sin "Bearer"
                'User-Agent': 'DemoApp 1.0'
            }
            
            response = requests.get(endpoint, headers=headers)
            logger.info(f"📊 Respuesta HTTP {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Datos recibidos: {data}")
                return data
            else:
                logger.warning(f"❌ Error HTTP {response.status_code}: {response.text}")
                return None
            
        except Exception as e:
            logger.error(f"Error al obtener resultados HRV directos: {e}")
            return None

    def get_hrv_results_for_measurement(self, measure_id: str, user_id: str = "self") -> Optional[Dict]:
        """Obtener resultados de HRV para una medición específica"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Probar con diferentes tokens y endpoints
            tokens_to_try = [
                ('id_token', f"https://analysis.kubioscloud.com/v2/measure/{user_id}/session/{measure_id}/hrv-results"),
                ('access_token', f"https://analysis.kubioscloud.com/v2/measure/{user_id}/session/{measure_id}/hrv-results"),
                ('id_token', f"https://analysis.kubioscloud.com/v2/measure/self/session/{measure_id}/hrv-results"),
                ('access_token', f"https://analysis.kubioscloud.com/v2/measure/self/session/{measure_id}/hrv-results"),
            ]
            
            for token_type, url in tokens_to_try:
                logger.info(f"🔍 Probando HRV results con {token_type} en {url}")
                headers = {
                    'Authorization': f'Bearer {self.tokens[token_type]}',
                    'Content-Type': 'application/json'
                }
                
                response = requests.get(url, headers=headers)
                logger.info(f"📊 Respuesta HTTP {response.status_code} para {token_type}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Datos recibidos: {data}")
                    if data.get('status') == 'ok':
                        hrv_data = data.get('hrv_results', {})
                        if hrv_data:
                            logger.info(f"🎯 Resultados HRV encontrados con {token_type}")
                            return hrv_data
                    else:
                        logger.warning(f"⚠️ Error en respuesta: {data}")
                elif response.status_code == 404:
                    logger.warning(f"❌ No encontrado con {token_type}")
                else:
                    logger.warning(f"❌ Error HTTP {response.status_code} con {token_type}: {response.text}")
            
            logger.warning(f"No se encontraron resultados HRV para la medición {measure_id} con ningún método")
            return None
                
        except Exception as e:
            logger.error(f"Error al obtener resultados HRV para medición {measure_id}: {e}")
            return None

    def get_complete_measurement_data(self, measure_id: str) -> Optional[Dict]:
        """Obtener datos completos de una medición (detalles + HRV results)"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Primero intentar con 'self'
            measurement_details = self.get_measurement_details_full(measure_id, "self")
            user_id = "self"
            
            # Si no funciona con 'self', buscar en el equipo
            if not measurement_details:
                logger.info(f"No se encontró la medición con 'self', buscando en el equipo...")
                team_data = self.get_all_team_measurements()
                if team_data:
                    # Buscar la medición en todos los miembros del equipo
                    for member_id, member_data in team_data.get('measurements_by_member', {}).items():
                        measurements = member_data.get('measurements', [])
                        for measurement in measurements:
                            if measurement.get('measure_id') == measure_id:
                                user_id = member_id
                                logger.info(f"Medición encontrada en miembro {user_id}")
                                break
                        if user_id != "self":
                            break
                    
                    # Intentar obtener detalles con el user_id correcto
                    if user_id != "self":
                        measurement_details = self.get_measurement_details_full(measure_id, user_id)
            
            if not measurement_details:
                logger.error(f"No se pudieron obtener detalles de la medición {measure_id}")
                return None
            
            # Obtener resultados de HRV
            hrv_results = self.get_hrv_results_for_measurement(measure_id, user_id)
            
            # Combinar toda la información
            complete_data = {
                'measurement_id': measure_id,
                'user_id': user_id,
                'measurement_details': measurement_details.get('measure', {}),
                'hrv_results': hrv_results,
                'formatted_data': self._format_measurement_for_display(measurement_details.get('measure', {}), hrv_results)
            }
            
            return complete_data
            
        except Exception as e:
            logger.error(f"Error al obtener datos completos de medición {measure_id}: {e}")
            return None

    def _format_measurement_for_display(self, measurement_details: Dict, hrv_results: Optional[Dict]) -> Dict:
        """Formatear datos de medición para mostrar como en la app de Kubios"""
        formatted = {
            'basic_info': {
                'measure_id': measurement_details.get('measure_id', 'N/A'),
                'measured_timestamp': self._format_timestamp(measurement_details.get('measured_timestamp')),
                'create_timestamp': self._format_timestamp(measurement_details.get('create_timestamp')),
                'state': measurement_details.get('state', 'N/A'),
                'description': measurement_details.get('description', 'Sin descripción')
            },
            'subject_info': {},
            'sensor_info': {},
            'hrv_metrics': {},
            'readiness_data': {}
        }
        
        # Información del sujeto
        subject = measurement_details.get('subject', {})
        if subject:
            formatted['subject_info'] = {
                'name': subject.get('name', 'N/A'),
                'age': subject.get('age', 'N/A'),
                'height': subject.get('height', 'N/A'),
                'weight': subject.get('weight', 'N/A'),
                'gender': subject.get('gender', 'N/A'),
                'physiological_age': subject.get('physiological_age', 'N/A')
            }
        
        # Información del sensor
        sensor = measurement_details.get('sensor', {})
        if sensor:
            formatted['sensor_info'] = {
                'model': sensor.get('model', 'N/A'),
                'manufacturer': sensor.get('manufacturer', 'N/A'),
                'firmware': sensor.get('firmware', 'N/A'),
                'software': sensor.get('software', 'N/A')
            }
        
        # Métricas de HRV si están disponibles
        if hrv_results:
            formatted['hrv_metrics'] = {
                'resting_hr': hrv_results.get('resting_hr', 'N/A'),
                'rmssd': hrv_results.get('rmssd', 'N/A'),
                'pns_index': hrv_results.get('pns_index', 'N/A'),
                'sns_index': hrv_results.get('sns_index', 'N/A'),
                'mean_rr': hrv_results.get('mean_rr', 'N/A'),
                'sdnn': hrv_results.get('sdnn', 'N/A'),
                'respiratory_rate': hrv_results.get('respiratory_rate', 'N/A'),
                'lf_power': hrv_results.get('lf_power', 'N/A'),
                'hf_power': hrv_results.get('hf_power', 'N/A'),
                'readiness_percentage': hrv_results.get('readiness_percentage', 'N/A'),
                'feeling': hrv_results.get('feeling', 'N/A'),
                'quality': hrv_results.get('quality', 'N/A')
            }
            
            # Datos de readiness
            formatted['readiness_data'] = {
                'readiness_percentage': hrv_results.get('readiness_percentage', 'N/A'),
                'readiness_level': self._get_readiness_level(hrv_results.get('readiness_percentage')),
                'feeling_score': hrv_results.get('feeling', 'N/A'),
                'acute_fatigue': hrv_results.get('acute_fatigue', 'N/A'),
                'chronic_fatigue': hrv_results.get('chronic_fatigue', 'N/A')
            }
        
        return formatted

    def _get_readiness_level(self, percentage: Optional[float]) -> str:
        """Determinar el nivel de readiness basado en el porcentaje"""
        if percentage is None:
            return 'N/A'
        
        if percentage >= 80:
            return 'HIGH'
        elif percentage >= 60:
            return 'NORMAL'
        elif percentage >= 40:
            return 'LOW'
        else:
            return 'VERY LOW'
    
    def get_measurements_with_params(self, 
                                   from_date: Optional[str] = None,
                                   to_date: Optional[str] = None,
                                   count: int = 1000,
                                   state: Optional[str] = None,
                                   details: bool = False,
                                   team_id: Optional[str] = None,
                                   offset: int = 0) -> Optional[Dict]:
        """Obtener mediciones con parámetros de filtrado"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            params = {}
            
            if from_date:
                params['from'] = from_date
            if to_date:
                params['to'] = to_date
            if count != 1000:
                params['count'] = count
            if state:
                params['state'] = state
            if details:
                params['details'] = 'yes'
            if offset > 0:
                params['offset'] = offset
            
            # Usar team_id si se proporciona, sino usar 'self'
            user_id = team_id if team_id else "self"
            
            response = requests.get(
                KUBIOSCLOUD_BASE_URL + f"v2/measure/{user_id}/session",
                params=params,
                headers={
                    "Authorization": self.tokens['id_token'],
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error al obtener mediciones con parámetros: {e}")
            return None
    
    def get_team_measurements(self, team_name: str = "Diabetes Tracker - H2TRAIN") -> Optional[Dict]:
        """Obtener todas las mediciones de un equipo específico"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Obtener información del usuario para encontrar el equipo
            user_info = self.get_user_info()
            if not user_info:
                return None
            
            # Buscar el equipo por nombre
            teams = user_info.get('user', {}).get('teams', [])
            target_team = None
            for team in teams:
                if team_name in team.get('name', ''):
                    target_team = team
                    break
            
            if not target_team:
                logger.error(f"Equipo '{team_name}' no encontrado")
                return None
            
            logger.info(f"Equipo encontrado: {target_team.get('name')} (ID: {target_team.get('team_id')})")
            
            # Obtener todos los sujetos del equipo
            subjects = self.get_subjects()
            if not subjects:
                logger.warning("No se encontraron sujetos")
                return {"team": target_team, "subjects": [], "measurements": []}
            
            # Obtener mediciones de cada sujeto
            all_measurements = []
            measurements_by_subject = {}
            
            for subject in subjects:
                subject_id = subject.get('subject_id')
                subject_name = subject.get('name')
                
                logger.info(f"Obteniendo mediciones para sujeto: {subject_name} (ID: {subject_id})")
                
                # Obtener mediciones del sujeto específico usando su ID como user_id
                subject_measurements = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id=subject_id  # Usar el subject_id como user_id
                )
                
                if subject_measurements and subject_measurements.get('measures'):
                    measures = subject_measurements['measures']
                    measurements_by_subject[subject_id] = {
                        'subject': subject,
                        'measurements': measures
                    }
                    all_measurements.extend(measures)
                    logger.info(f"Encontradas {len(measures)} mediciones para {subject_name}")
                else:
                    measurements_by_subject[subject_id] = {
                        'subject': subject,
                        'measurements': []
                    }
                    logger.info(f"No se encontraron mediciones para {subject_name}")
            
            return {
                "team": target_team,
                "subjects": subjects,
                "measurements_by_subject": measurements_by_subject,
                "all_measurements": all_measurements,
                "total_measurements": len(all_measurements),
                "total_subjects": len(subjects)
            }
            
        except Exception as e:
            logger.error(f"Error al obtener mediciones del equipo: {e}")
            return None
    
    def get_team_members_measurements(self, team_name: str = "Diabetes Tracker - H2TRAIN") -> Optional[Dict]:
        """Obtener mediciones de todos los miembros del equipo usando sus user IDs"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Obtener información del usuario para encontrar el equipo
            user_info = self.get_user_info()
            if not user_info:
                return None
            
            # Buscar el equipo por nombre
            teams = user_info.get('user', {}).get('teams', [])
            target_team = None
            for team in teams:
                if team_name in team.get('name', ''):
                    target_team = team
                    break
            
            if not target_team:
                logger.error(f"Equipo '{team_name}' no encontrado")
                return None
            
            logger.info(f"Equipo encontrado: {target_team.get('name')} (ID: {target_team.get('team_id')})")
            
            # Obtener información del equipo para ver los miembros
            team_id = target_team.get('team_id')
            logger.info(f"Intentando obtener información del equipo con ID: {team_id}")
            
            # Intentar obtener mediciones del equipo directamente
            team_measurements = self.get_measurements_with_params(
                count=1000,
                details=True,
                team_id=team_id
            )
            
            if team_measurements and team_measurements.get('measures'):
                measures = team_measurements['measures']
                logger.info(f"Encontradas {len(measures)} mediciones del equipo")
                
                # Organizar mediciones por sujeto
                measurements_by_subject = {}
                for measure in measures:
                    subject_info = measure.get('subject')
                    if subject_info:
                        subject_id = subject_info.get('subject_id', 'unknown')
                        if subject_id not in measurements_by_subject:
                            measurements_by_subject[subject_id] = {
                                'subject': subject_info,
                                'measurements': []
                            }
                        measurements_by_subject[subject_id]['measurements'].append(measure)
                
                return {
                    "team": target_team,
                    "measurements_by_subject": measurements_by_subject,
                    "all_measurements": measures,
                    "total_measurements": len(measures),
                    "total_subjects": len(measurements_by_subject)
                }
            else:
                logger.warning("No se encontraron mediciones del equipo")
                return {
                    "team": target_team,
                    "measurements_by_subject": {},
                    "all_measurements": [],
                    "total_measurements": 0,
                    "total_subjects": 0
                }
            
        except Exception as e:
            logger.error(f"Error al obtener mediciones del equipo: {e}")
            return None
    
    def get_team_members(self, team_id: str) -> Optional[Dict]:
        """Obtener lista de miembros del equipo usando la API de Teams"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            url = f"https://analysis.kubioscloud.com/v2/team/team/{team_id}?members=yes"
            
            # Usar el token ID en lugar del access token para la API de Teams
            token_to_use = self.tokens.get("id_token", self.tokens.get("access_token"))
            
            headers = {
                'Authorization': f'Bearer {token_to_use}',
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Obteniendo miembros del equipo {team_id}")
            logger.info(f"Usando token: {token_to_use[:20]}...")
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    members = data.get('members', [])
                    logger.info(f"✅ Encontrados {len(members)} miembros del equipo")
                    return data
                else:
                    logger.error(f"Error en respuesta de API: {data}")
                    return None
            else:
                logger.error(f"Error HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error al obtener miembros del equipo: {e}")
            return None
    
    def get_measurements_for_user_id(self, user_id: str, user_name: str) -> List[Dict]:
        """Obtener mediciones usando el user_id real del miembro"""
        all_measurements = []
        offset = 0
        limit = 1000  # Tamaño de página
        
        logger.info(f"🔍 Obteniendo mediciones para {user_name} usando user_id: {user_id}")
        
        while True:
            try:
                logger.info(f"Obteniendo mediciones para {user_name} - página {offset//limit + 1} (offset: {offset})")
                
                # Usar el endpoint correcto: /v2/measure/{user_id}/session
                url = f"https://analysis.kubioscloud.com/v2/measure/{user_id}/session"
                headers = {
                    'Authorization': f'Bearer {self.tokens["id_token"]}',
                    'Content-Type': 'application/json'
                }
                params = {
                    'count': limit,
                    'details': 'yes',
                    'offset': offset,
                    'from': '2020-01-01T00:00:00Z'  # Fecha muy antigua para obtener TODAS las mediciones
                }
                
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'ok' and data.get('measures'):
                        measures = data['measures']
                        
                        # Enriquecer cada medición con información básica (sin detalles completos para ser más rápido)
                        enriched_measures = []
                        for measure in measures:
                            # Solo agregar información básica formateada
                            enriched_measure = {
                                **measure,
                                'formatted_timestamp': self._format_timestamp(measure.get('measured_timestamp')),
                                'formatted_created': self._format_timestamp(measure.get('create_timestamp'))
                            }
                            enriched_measures.append(enriched_measure)
                        
                        all_measurements.extend(enriched_measures)
                        logger.info(f"✅ Obtenidas {len(enriched_measures)} mediciones en esta página (total acumulado: {len(all_measurements)})")
                        
                        # Si obtenemos menos mediciones que el límite, hemos llegado al final
                        if len(measures) < limit:
                            break
                        
                        offset += limit
                    else:
                        logger.info(f"❌ No se encontraron mediciones en esta página")
                        break
                elif response.status_code == 401:
                    logger.warning(f"❌ Error 401: No autorizado para acceder a las mediciones de {user_name}")
                    break
                elif response.status_code == 403:
                    logger.warning(f"❌ Error 403: Sin permisos para acceder a las mediciones de {user_name}")
                    break
                else:
                    logger.error(f"❌ Error HTTP {response.status_code}: {response.text}")
                    break
                    
            except Exception as e:
                logger.warning(f"❌ Error obteniendo mediciones para {user_name} en offset {offset}: {e}")
                break
        
        logger.info(f"📊 Total de mediciones obtenidas para {user_name}: {len(all_measurements)}")
        return all_measurements

    def _format_timestamp(self, timestamp: str) -> str:
        """Formatear timestamp para mostrar de forma legible"""
        if not timestamp:
            return "N/A"
        try:
            from datetime import datetime
            # Parsear el timestamp ISO
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return dt.strftime("%d/%m/%Y %H:%M:%S")
        except:
            return timestamp

    def get_all_measurements_for_member(self, member_id: str, member_name: str) -> List[Dict]:
        """Obtener TODAS las mediciones de un miembro específico usando su user_id real"""
        # El member_id que recibimos es el team_user_id, pero necesitamos el user_id real
        # Vamos a intentar usar el team_user_id directamente como user_id
        return self.get_measurements_for_user_id(member_id, member_name)
    
    def debug_member_measurements(self, member_email: str = "lucy.jr.93@gmail.com") -> Optional[Dict]:
        """Método de debug para investigar las mediciones de un miembro específico"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Obtener información del usuario para encontrar el equipo
            user_info = self.get_user_info()
            if not user_info:
                return None
            
            # Buscar el equipo por nombre
            teams = user_info.get('user', {}).get('teams', [])
            target_team = None
            for team in teams:
                if "Diabetes Tracker - H2TRAIN" in team.get('name', ''):
                    target_team = team
                    break
            
            if not target_team:
                logger.error("Equipo 'Diabetes Tracker - H2TRAIN' no encontrado")
                return None
            
            team_id = target_team.get('team_id')
            logger.info(f"Equipo encontrado: {target_team.get('name')} (ID: {team_id})")
            
            # Obtener miembros del equipo
            team_data = self.get_team_members(team_id)
            if not team_data:
                logger.error("No se pudieron obtener los miembros del equipo")
                return None
            
            members = team_data.get('members', [])
            target_member = None
            
            # Buscar el miembro específico
            for member in members:
                if member.get('email') == member_email:
                    target_member = member
                    break
            
            if not target_member:
                logger.error(f"Miembro con email {member_email} no encontrado")
                return None
            
            logger.info(f"Miembro encontrado: {target_member.get('given_name')} {target_member.get('family_name')}")
            logger.info(f"Team User ID: {target_member.get('team_user_id')}")
            logger.info(f"Roles: {target_member.get('roles')}")
            
            # Probar diferentes enfoques para obtener mediciones
            results = {}
            
            # Enfoque 1: Usar team_user_id
            logger.info("🔍 Enfoque 1: Usando team_user_id")
            try:
                measurements_1 = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id=target_member.get('team_user_id')
                )
                results['team_user_id'] = measurements_1
                logger.info(f"Resultado con team_user_id: {len(measurements_1.get('measures', [])) if measurements_1 else 0} mediciones")
            except Exception as e:
                logger.error(f"Error con team_user_id: {e}")
                results['team_user_id'] = None
            
            # Enfoque 2: Usar 'self'
            logger.info("🔍 Enfoque 2: Usando 'self'")
            try:
                measurements_2 = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id='self'
                )
                results['self'] = measurements_2
                logger.info(f"Resultado con 'self': {len(measurements_2.get('measures', [])) if measurements_2 else 0} mediciones")
            except Exception as e:
                logger.error(f"Error con 'self': {e}")
                results['self'] = None
            
            # Enfoque 3: Intentar con diferentes tokens
            logger.info("🔍 Enfoque 3: Probando con access_token")
            try:
                # Usar access_token en lugar de id_token
                original_token = self.tokens.get('id_token')
                self.tokens['id_token'] = self.tokens.get('access_token')
                
                measurements_3 = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id=target_member.get('team_user_id')
                )
                results['access_token'] = measurements_3
                logger.info(f"Resultado con access_token: {len(measurements_3.get('measures', [])) if measurements_3 else 0} mediciones")
                
                # Restaurar token original
                self.tokens['id_token'] = original_token
            except Exception as e:
                logger.error(f"Error con access_token: {e}")
                results['access_token'] = None
            
            # Enfoque 4: Probar sin especificar team_id (usar endpoint general)
            logger.info("🔍 Enfoque 4: Probando endpoint general sin team_id")
            try:
                # Probar el endpoint general de mediciones
                url = "https://analysis.kubioscloud.com/v2/measure/session"
                headers = {
                    'Authorization': f'Bearer {self.tokens["id_token"]}',
                    'Content-Type': 'application/json'
                }
                params = {
                    'count': 1000,
                    'details': 'yes'
                }
                
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results['general_endpoint'] = data
                    logger.info(f"Resultado con endpoint general: {len(data.get('measures', [])) if data else 0} mediciones")
                else:
                    logger.error(f"Error HTTP {response.status_code}: {response.text}")
                    results['general_endpoint'] = None
            except Exception as e:
                logger.error(f"Error con endpoint general: {e}")
                results['general_endpoint'] = None
            
            # Enfoque 5: Probar con diferentes rangos de fechas
            logger.info("🔍 Enfoque 5: Probando con rangos de fechas específicos")
            try:
                # Probar con fechas de julio y agosto 2025
                measurements_july = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id='self',
                    from_date='2025-07-01T00:00:00Z',
                    to_date='2025-07-31T23:59:59Z'
                )
                results['july_2025'] = measurements_july
                logger.info(f"Resultado julio 2025: {len(measurements_july.get('measures', [])) if measurements_july else 0} mediciones")
                
                measurements_august = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id='self',
                    from_date='2025-08-01T00:00:00Z',
                    to_date='2025-08-31T23:59:59Z'
                )
                results['august_2025'] = measurements_august
                logger.info(f"Resultado agosto 2025: {len(measurements_august.get('measures', [])) if measurements_august else 0} mediciones")
                
            except Exception as e:
                logger.error(f"Error con rangos de fechas: {e}")
                results['july_2025'] = None
                results['august_2025'] = None
            
            # Enfoque 6: Probar usando la API de Teams para obtener mediciones del equipo
            logger.info("🔍 Enfoque 6: Probando API de Teams para mediciones del equipo")
            try:
                # Intentar obtener mediciones usando el team_id directamente
                team_measurements = self.get_measurements_with_params(
                    count=1000,
                    details=True,
                    team_id=team_id
                )
                results['team_measurements'] = team_measurements
                logger.info(f"Resultado con team_id: {len(team_measurements.get('measures', [])) if team_measurements else 0} mediciones")
                
                # Si encontramos mediciones del equipo, filtrar por el miembro específico
                if team_measurements and team_measurements.get('measures'):
                    member_measures = []
                    for measure in team_measurements.get('measures', []):
                        # Buscar mediciones que pertenezcan a este miembro
                        # Esto puede requerir inspeccionar la estructura de la medición
                        member_measures.append(measure)
                    
                    results['filtered_member_measures'] = {
                        'measures': member_measures,
                        'count': len(member_measures)
                    }
                    logger.info(f"Mediciones filtradas para {target_member.get('given_name')}: {len(member_measures)}")
                
            except Exception as e:
                logger.error(f"Error con API de Teams: {e}")
                results['team_measurements'] = None
            
            return {
                'member': target_member,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error en debug: {e}")
            return None

    def get_all_team_measurements(self, team_name: str = "Diabetes Tracker - H2TRAIN") -> Optional[Dict]:
        """Obtener TODAS las mediciones del equipo usando la API de Teams con paginación"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            # Obtener información del usuario para encontrar el equipo
            user_info = self.get_user_info()
            if not user_info:
                return None
            
            # Buscar el equipo por nombre
            teams = user_info.get('user', {}).get('teams', [])
            target_team = None
            for team in teams:
                if team_name in team.get('name', ''):
                    target_team = team
                    break
            
            if not target_team:
                logger.error(f"Equipo '{team_name}' no encontrado")
                return None
            
            team_id = target_team.get('team_id')
            logger.info(f"Equipo encontrado: {target_team.get('name')} (ID: {team_id})")
            
            # Obtener miembros del equipo usando la API de Teams
            team_data = self.get_team_members(team_id)
            if not team_data:
                logger.error("No se pudieron obtener los miembros del equipo")
                return None
            
            members = team_data.get('members', [])
            logger.info(f"Encontrados {len(members)} miembros en el equipo")
            
            # Obtener mediciones de cada miembro del equipo
            all_measurements = []
            measurements_by_member = {}
            
            for member in members:
                member_id = member.get('team_user_id')
                member_name = f"{member.get('given_name', '')} {member.get('family_name', '')}".strip()
                member_email = member.get('email', '')
                member_roles = member.get('roles', [])
                
                logger.info(f"🔍 Procesando miembro: {member_name} ({member_email}) - Roles: {member_roles}")
                
                # Obtener TODAS las mediciones del miembro usando paginación
                try:
                    member_measurements = self.get_all_measurements_for_member(member_id, member_name)
                    
                    if member_measurements:
                        measurements_by_member[member_id] = {
                            'member': member,
                            'measurements': member_measurements
                        }
                        all_measurements.extend(member_measurements)
                        logger.info(f"✅ Total de mediciones para {member_name}: {len(member_measurements)}")
                    else:
                        measurements_by_member[member_id] = {
                            'member': member,
                            'measurements': []
                        }
                        logger.info(f"❌ No se encontraron mediciones para {member_name}")
                        
                except Exception as e:
                    logger.warning(f"❌ Error obteniendo mediciones para {member_name}: {e}")
                    measurements_by_member[member_id] = {
                        'member': member,
                        'measurements': []
                    }
            
            logger.info(f"🎉 RESUMEN FINAL: {len(all_measurements)} mediciones totales de {len(members)} miembros")
            
            # Crear resumen organizado
            organized_data = self._organize_measurements_data(measurements_by_member, all_measurements)
            
            return {
                "team": target_team,
                "team_details": team_data.get('details', {}),
                "members": members,
                "measurements_by_member": measurements_by_member,
                "all_measurements": all_measurements,
                "organized_summary": organized_data,
                "total_measurements": len(all_measurements),
                "total_members": len(members)
            }
            
        except Exception as e:
            logger.error(f"Error al obtener mediciones del equipo: {e}")
            return None

    def _organize_measurements_data(self, measurements_by_member: Dict, all_measurements: List[Dict]) -> Dict:
        """Organizar los datos de mediciones de forma legible"""
        organized = {
            "resumen_por_miembro": {},
            "mediciones_por_fecha": {},
            "estadisticas": {
                "total_mediciones": len(all_measurements),
                "miembros_con_mediciones": 0,
                "fechas_unicas": set(),
                "tipos_analisis": set()
            }
        }
        
        # Organizar por miembro
        for member_id, data in measurements_by_member.items():
            member = data['member']
            measurements = data['measurements']
            
            member_name = f"{member.get('given_name', '')} {member.get('family_name', '')}".strip()
            
            if measurements:
                organized["resumen_por_miembro"][member_name] = {
                    "email": member.get('email'),
                    "roles": member.get('roles'),
                    "total_mediciones": len(measurements),
                    "mediciones": []
                }
                
                organized["estadisticas"]["miembros_con_mediciones"] += 1
                
                # Organizar mediciones del miembro
                for measurement in measurements:
                    formatted_measurement = {
                        "measure_id": measurement.get('measure_id'),
                        "fecha_medicion": measurement.get('formatted_timestamp', 'N/A'),
                        "fecha_creacion": measurement.get('formatted_created', 'N/A'),
                        "estado": measurement.get('state', 'N/A'),
                        "tipos_analisis": measurement.get('analysis_types', []),
                        "canales": len(measurement.get('channels', [])),
                        "descripcion": measurement.get('description', 'Sin descripción')
                    }
                    
                    # Agregar información básica disponible
                    formatted_measurement.update({
                        "sujeto": measurement.get('subject', {}).get('name', 'N/A') if measurement.get('subject') else 'N/A',
                        "sensor": measurement.get('sensor', {}).get('model', 'N/A') if measurement.get('sensor') else 'N/A',
                        "tags": measurement.get('tags', [])
                    })
                    
                    organized["resumen_por_miembro"][member_name]["mediciones"].append(formatted_measurement)
                    
                    # Organizar por fecha
                    fecha = measurement.get('formatted_timestamp', 'N/A')
                    if fecha not in organized["mediciones_por_fecha"]:
                        organized["mediciones_por_fecha"][fecha] = []
                    organized["mediciones_por_fecha"][fecha].append({
                        "miembro": member_name,
                        "measure_id": measurement.get('measure_id'),
                        "estado": measurement.get('state')
                    })
                    
                    # Actualizar estadísticas
                    organized["estadisticas"]["fechas_unicas"].add(fecha)
                    organized["estadisticas"]["tipos_analisis"].update(measurement.get('analysis_types', []))
        
        # Convertir sets a listas para JSON
        organized["estadisticas"]["fechas_unicas"] = list(organized["estadisticas"]["fechas_unicas"])
        organized["estadisticas"]["tipos_analisis"] = list(organized["estadisticas"]["tipos_analisis"])
        
        return organized
    
    def get_measurement_details_full(self, measurement_id: str, user_id: str = "self") -> Optional[Dict]:
        """Obtener detalles completos de una medición específica"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.get(
                f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session/{measurement_id}",
                headers={
                    "Authorization": self.tokens['id_token'],
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error al obtener detalles completos de medición {measurement_id}: {e}")
            return None
    
    def get_subjects(self) -> Optional[List[Dict]]:
        """Obtener lista de sujetos de medición"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.get(
                KUBIOSCLOUD_BASE_URL + "v2/measure/self/subject",
                headers={
                    "Authorization": self.tokens['id_token'],
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            result = response.json()
            return result.get('subjects', [])
        except Exception as e:
            logger.error(f"Error al obtener sujetos: {e}")
            return None
    
    def get_subject_details(self, subject_id: str) -> Optional[Dict]:
        """Obtener detalles de un sujeto específico"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.get(
                f"{KUBIOSCLOUD_BASE_URL}v2/measure/self/subject/{subject_id}",
                headers={
                    "Authorization": self.tokens['id_token'],
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error al obtener detalles del sujeto {subject_id}: {e}")
            return None
    
    def create_subject(self, subject_data: Dict) -> Optional[Dict]:
        """Crear un nuevo sujeto de medición"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.post(
                KUBIOSCLOUD_BASE_URL + "v2/measure/self/subject",
                json=subject_data,
                headers={
                    "Authorization": self.tokens['id_token'],
                    "Content-Type": "application/json",
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error al crear sujeto: {e}")
            return None
    
    def update_subject(self, subject_id: str, subject_data: Dict) -> Optional[Dict]:
        """Actualizar un sujeto existente"""
        if not self.tokens:
            if not self.authenticate():
                return None
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.patch(
                f"{KUBIOSCLOUD_BASE_URL}v2/measure/self/subject/{subject_id}",
                json=subject_data,
                headers={
                    "Authorization": self.tokens['id_token'],
                    "Content-Type": "application/json",
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error al actualizar sujeto {subject_id}: {e}")
            return None
    
    def delete_subject(self, subject_id: str) -> bool:
        """Eliminar un sujeto"""
        if not self.tokens:
            if not self.authenticate():
                return False
        
        try:
            KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
            response = requests.delete(
                f"{KUBIOSCLOUD_BASE_URL}v2/measure/self/subject/{subject_id}",
                headers={
                    "Authorization": self.tokens['id_token'],
                    "User-Agent": "DemoApp 1.0"
                }
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Error al eliminar sujeto {subject_id}: {e}")
            return False
    
    def get_recent_measurements(self, limit: int = 10) -> Optional[List[Dict]]:
        """Obtener mediciones recientes con límite"""
        measurements = self.get_measurements()
        if measurements is not None:  # Cambiar de 'if measurements:' a 'if measurements is not None:'
            # Ordenar por fecha de creación (más recientes primero)
            sorted_measurements = sorted(
                measurements, 
                key=lambda x: x.get('created_at', ''), 
                reverse=True
            )
            return sorted_measurements[:limit]
        return None

def main():
    """Función principal para pruebas"""
    service = KubiosService()
    
    # Autenticar
    if not service.authenticate():
        print("Error: No se pudo autenticar")
        return
    
    # Obtener información del usuario
    user_info = service.get_user_info()
    if user_info:
        print(f"Usuario: {user_info.get('username', 'N/A')}")
        print(f"Email: {user_info.get('email', 'N/A')}")
    
    # Obtener mediciones recientes
    measurements = service.get_recent_measurements(5)
    if measurements:
        print(f"\nMediciones recientes ({len(measurements)}):")
        for measurement in measurements:
            print(f"- ID: {measurement.get('id', 'N/A')}")
            print(f"  Estado: {measurement.get('state', 'N/A')}")
            print(f"  Creado: {measurement.get('created_at', 'N/A')}")
    
    # Obtener resultados HRV
    hrv_results = service.get_hrv_results()
    if hrv_results:
        print(f"\nResultados HRV ({len(hrv_results)}):")
        for result in hrv_results[:3]:  # Mostrar solo los primeros 3
            print(f"- ID: {result.get('id', 'N/A')}")
            print(f"  Tipo: {result.get('type', 'N/A')}")

if __name__ == "__main__":
    main()
