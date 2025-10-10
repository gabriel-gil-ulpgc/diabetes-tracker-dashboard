# 📊 Uploader - Procesadores de Datos Médicos

Esta carpeta contiene procesadores especializados para extraer y procesar datos médicos de diferentes dispositivos y sistemas. Cada procesador está diseñado para manejar formatos específicos y convertir los datos a un formato estandarizado.

## 🔬 Procesadores de Glucosa

### 📱 Dexcom.py

**Función:** Extrae datos de glucosa de archivos CSV del sistema Dexcom Clarity

[URL](https://clarity.dexcom.eu/)

**¿Qué hace?**

- Lee archivos CSV con formato específico de Dexcom
- Extrae marcas temporales y niveles de glucosa en mg/dL
- Limpia datos nulos y valores de texto ("Nivel alto" → 400, "Nivel bajo" → 40)
- Convierte fechas al formato estándar de pandas
- Elimina duplicados y ordena por tiempo
- Devuelve un DataFrame con columnas `time` y `glucose`

**Archivos que procesa:** `clarity.csv`

### 📱 Libreview.py

**Función:** Extrae datos de glucosa de archivos CSV del sistema Libreview

[URL](https://www.libreview.com/)

**¿Qué hace?**

- Lee archivos CSV con formato específico de Libreview
- Extrae sellos de tiempo del dispositivo y historial de glucosa
- Limpia datos nulos y convierte tipos de datos
- Maneja formato de fechas mixto
- Elimina duplicados y ordena cronológicamente
- Devuelve un DataFrame con columnas `time` y `glucose`

**Archivos que procesa:** `libreview.csv`

### 🏥 Tandem.py

**Función:** Extrae datos completos de glucosa e insulina de archivos CSV del sistema Tandem (Exportado desde Glooko)



[URL](https://my.glooko.com/users/sign_in)

**¿Qué hace?**

#### Datos de Glucosa:

- Busca y procesa múltiples archivos `cgm_data_*.csv`
- Extrae marcas de tiempo y valores de glucosa
- Limita valores máximos a 400 mg/dL
- Combina datos de múltiples archivos

#### Datos de Insulina Basal:

- Procesa archivos `basal_data_*.csv` de la carpeta "Insulin data"
- Maneja tasas de insulina por hora y suspensiones
- Divide administraciones en intervalos de 5 minutos
- Calcula unidades de insulina por intervalo: $insulina = tasa(U/h) \times duración(h)$

#### Datos de Insulina Bolus:

- Procesa archivos `bolus_data_*.csv` de la carpeta "Insulin data"
- Extrae administraciones de insulina, carbohidratos y valores de glucosa
- Maneja bolus iniciales y extendidos

**Archivos que procesa:**

- `cgm_data_*.csv` (glucosa)
- `Insulin data/basal_data_*.csv` (insulina basal)
- `Insulin data/bolus_data_*.csv` (insulina bolus)

### Ypsompupm

Similiar a Tandem. Pendiente de verificar

## ❤️ Procesador de Frecuencia Cardíaca

### 🏃‍♂️ polar.py

**Función:** Extrae datos de frecuencia cardíaca de archivos CSV de Polar Flow

**¿Qué hace?**

- Lee archivos CSV con formato específico de Polar Flow
- Extrae información de sesión (fecha y hora de inicio)
- Combina fecha de sesión con offset de tiempo de cada medición
- Convierte offsets de tiempo a objetos timedelta
- Calcula timestamps absolutos: $timestamp = inicio\_sesión + offset$
- Limpia datos nulos y convierte frecuencia cardíaca a enteros
- Devuelve un DataFrame con columnas `time` y `heart_rate`

**Archivos que procesa:** `polar.csv`
