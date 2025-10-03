# Integración con Kubios Cloud para Diabetes Tracker

## 📋 Descripción

Este directorio contiene la integración completa con la API de Kubios Cloud para obtener datos de variabilidad de la frecuencia cardíaca (HRV) y análisis de estrés.

## 🗂️ Estructura de Archivos

```
kub-kubioscloud-demo/
├── kubios_service.py          # Servicio principal de integración
├── kubios_cli.py             # CLI para pruebas y operaciones
├── test_kubios.py            # Script de pruebas
├── my_config.yaml            # Archivo de configuración (crear con tus credenciales)
├── sample_config.yaml        # Plantilla de configuración
└── README_KUBIOS.md          # Este archivo
```

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
pip install requests jsons msgpack pyyaml
```

### 2. Configurar Credenciales

Copia `sample_config.yaml` a `my_config.yaml` y completa con tus credenciales:

```yaml
username: tu_usuario_kubios
password: tu_contraseña
client_id: tu_client_id
```

## 🚀 Uso

### Desde Python

```python
from kubios_service import KubiosService

# Crear servicio
service = KubiosService()

# Autenticar
if service.authenticate():
    # Obtener información del usuario
    user_info = service.get_user_info()
    
    # Obtener mediciones recientes
    measurements = service.get_recent_measurements(10)
    
    # Obtener resultados HRV
    hrv_results = service.get_hrv_results()
```

### Desde CLI

```bash
# Autenticar
python kubios_cli.py --action authenticate

# Obtener información del usuario
python kubios_cli.py --action user-info

# Obtener mediciones
python kubios_cli.py --action measurements --limit 5

# Obtener detalles de una medición específica
python kubios_cli.py --action measurement-details --measurement-id "id-de-la-medicion"

# Descargar datos de una medición
python kubios_cli.py --action download-data --measurement-id "id-de-la-medicion"

# Obtener resultados HRV
python kubios_cli.py --action hrv-results
```

### Desde el Backend Node.js

El backend ya incluye endpoints para interactuar con Kubios:

- `POST /kubios/authenticate` - Autenticar con Kubios
- `GET /kubios/user-info` - Obtener información del usuario
- `GET /kubios/measurements` - Obtener mediciones
- `GET /kubios/measurement/:id` - Obtener detalles de medición
- `GET /kubios/measurement/:id/download` - Descargar datos de medición
- `GET /kubios/hrv-results` - Obtener resultados HRV

### Desde Flutter

El servicio `ApiService` ya incluye métodos para Kubios:

```dart
final apiService = ApiService();

// Autenticar
final authResult = await apiService.authenticateKubios(
  username: 'tu_usuario',
  password: 'tu_contraseña',
  clientId: 'tu_client_id',
);

// Obtener mediciones
final measurements = await apiService.getKubiosMeasurements(
  username: 'tu_usuario',
  password: 'tu_contraseña',
  clientId: 'tu_client_id',
  limit: 10,
);

// Obtener resultados HRV
final hrvResults = await apiService.getKubiosHrvResults(
  username: 'tu_usuario',
  password: 'tu_contraseña',
  clientId: 'tu_client_id',
);
```

## 🧪 Pruebas

Ejecuta el script de pruebas para verificar que todo funciona:

```bash
python test_kubios.py
```

Este script verificará:
- ✅ Carga de configuración
- ✅ Presencia de credenciales
- ✅ Autenticación con Kubios
- ✅ Obtención de información del usuario
- ✅ Obtención de mediciones
- ✅ Obtención de resultados HRV

## 📊 Tipos de Datos Disponibles

### Mediciones
- **ID**: Identificador único de la medición
- **Estado**: Estado de la medición (completed, processing, etc.)
- **Fecha de creación**: Cuándo se creó la medición
- **Canales**: Datos de frecuencia cardíaca, RRI, etc.

### Resultados HRV
- **Análisis de estrés**: Nivel de estrés detectado
- **Variabilidad de frecuencia cardíaca**: Métricas HRV
- **Parámetros autonómicos**: Actividad del sistema nervioso autónomo
- **Recomendaciones**: Sugerencias basadas en el análisis

## 🔧 Solución de Problemas

### Error de Autenticación
- Verifica que las credenciales en `my_config.yaml` sean correctas
- Asegúrate de que el client_id sea válido
- Verifica que tu cuenta de Kubios esté activa

### Error de Conexión
- Verifica tu conexión a internet
- Comprueba que los endpoints de Kubios estén disponibles
- Revisa los logs del servidor para más detalles

### Error de Permisos
- Asegúrate de que tu cuenta tenga permisos para acceder a la API
- Verifica que el client_id tenga los scopes necesarios

## 📚 Documentación Adicional

- [Documentación oficial de Kubios Cloud](https://analysis.kubioscloud.com/v1/portal/documentation/apis.html)
- [Guía de autenticación OAuth2](https://analysis.kubioscloud.com/v1/portal/documentation/apis.html#authentication)

## 🤝 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Ejecuta `python test_kubios.py` para diagnóstico
3. Verifica la configuración en `my_config.yaml`
4. Consulta la documentación oficial de Kubios



