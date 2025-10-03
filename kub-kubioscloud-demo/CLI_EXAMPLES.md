# Ejemplos de Uso del CLI de Kubios Cloud

## 📋 Comandos Básicos

### 1. Autenticación
```bash
python kubios_cli.py --action authenticate
```

### 2. Información del Usuario
```bash
python kubios_cli.py --action user-info
```

### 3. Obtener Mediciones Básicas
```bash
python kubios_cli.py --action measurements --limit 5
```

## 🔍 Mediciones Avanzadas

### 4. Obtener Mediciones con Filtros
```bash
# Mediciones de los últimos 7 días
python kubios_cli.py --action measurements-advanced --from-date "2024-01-01T00:00:00Z" --count 50

# Mediciones en estado "finalized"
python kubios_cli.py --action measurements-advanced --state "finalized" --details

# Mediciones entre fechas específicas
python kubios_cli.py --action measurements-advanced \
  --from-date "2024-01-01T00:00:00Z" \
  --to-date "2024-01-31T23:59:59Z" \
  --details
```

### 5. Detalles de una Medición Específica
```bash
# Detalles básicos
python kubios_cli.py --action measurement-details --measurement-id "a60079e5-5032-4341-a58f-693952864b81"

# Detalles completos (incluye canales, datos, etc.)
python kubios_cli.py --action measurement-details-full --measurement-id "a60079e5-5032-4341-a58f-693952864b81"
```

### 6. Descargar Datos de una Medición
```bash
python kubios_cli.py --action download-data --measurement-id "a60079e5-5032-4341-a58f-693952864b81"
```

## 👥 Gestión de Sujetos

### 7. Listar Sujetos
```bash
python kubios_cli.py --action subjects
```

### 8. Detalles de un Sujeto
```bash
python kubios_cli.py --action subject-details --subject-id "a2dedabc-9006-431b-99f5-8e42d800ccb8"
```

### 9. Crear un Nuevo Sujeto
```bash
python kubios_cli.py --action create-subject \
  --subject-data '{
    "name": "Paciente Test",
    "weight": 70.0,
    "height": 1.75,
    "gender": "male",
    "birthdate": "1990-01-01",
    "comment": "Paciente de prueba para diabetes tracker"
  }'
```

### 10. Actualizar un Sujeto
```bash
python kubios_cli.py --action update-subject \
  --subject-id "a2dedabc-9006-431b-99f5-8e42d800ccb8" \
  --subject-data '{
    "weight": 72.0,
    "comment": "Peso actualizado"
  }'
```

### 11. Eliminar un Sujeto
```bash
python kubios_cli.py --action delete-subject --subject-id "a2dedabc-9006-431b-99f5-8e42d800ccb8"
```

## 📊 Resultados HRV

### 12. Obtener Resultados HRV
```bash
python kubios_cli.py --action hrv-results
```

## 🎯 Ejemplos Prácticos

### Obtener todas las mediciones de la última semana
```bash
python kubios_cli.py --action measurements-advanced \
  --from-date "$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --details
```

### Buscar mediciones por estado
```bash
# Solo mediciones activas
python kubios_cli.py --action measurements-advanced --state "active"

# Solo mediciones finalizadas
python kubios_cli.py --action measurements-advanced --state "finalized"
```

### Crear un sujeto completo
```bash
python kubios_cli.py --action create-subject \
  --subject-data '{
    "name": "Gabriel Gil",
    "phone_number": "+34612345678",
    "weight": 75.0,
    "height": 1.80,
    "hr_max": 180,
    "hr_rest": 60,
    "vo2max": 45.0,
    "gender": "male",
    "birthdate": "1985-05-15",
    "comment": "Paciente con diabetes tipo 1",
    "custom_id": "DT-001"
  }'
```

## 🔧 Parámetros Disponibles

### Filtros de Fecha
- `--from-date`: Fecha de inicio (ISO8601)
- `--to-date`: Fecha de fin (ISO8601)

### Filtros de Estado
- `--state`: Estado de mediciones (`active`, `finalized`)

### Límites
- `--count`: Número máximo de elementos (default: 1000)
- `--limit`: Límite para mediciones básicas (default: 10)

### Detalles
- `--details`: Incluir detalles completos en las mediciones

### IDs
- `--measurement-id`: ID de medición específica
- `--subject-id`: ID de sujeto específico

### Datos JSON
- `--subject-data`: Datos del sujeto en formato JSON

## 📝 Notas Importantes

1. **Fechas**: Usar formato ISO8601 (ej: `2024-01-01T00:00:00Z`)
2. **JSON**: Los datos JSON deben estar entre comillas simples para evitar problemas con el shell
3. **Autenticación**: Se requiere autenticación previa para todas las operaciones
4. **Errores**: Todos los comandos devuelven JSON con `success: true/false`

## 🚀 Integración con Scripts

### Ejemplo de script bash
```bash
#!/bin/bash

# Obtener mediciones de hoy
TODAY=$(date -u +%Y-%m-%dT00:00:00Z)
TOMORROW=$(date -u -d '+1 day' +%Y-%m-%dT00:00:00Z)

python kubios_cli.py --action measurements-advanced \
  --from-date "$TODAY" \
  --to-date "$TOMORROW" \
  --details > mediciones_hoy.json

echo "Mediciones de hoy guardadas en mediciones_hoy.json"
```

### Ejemplo de script Python
```python
import subprocess
import json

# Obtener mediciones
result = subprocess.run([
    'python', 'kubios_cli.py', 
    '--action', 'measurements-advanced',
    '--count', '10',
    '--details'
], capture_output=True, text=True)

data = json.loads(result.stdout)
if data['success']:
    print(f"Encontradas {len(data['data']['measures'])} mediciones")
else:
    print(f"Error: {data['message']}")
```



