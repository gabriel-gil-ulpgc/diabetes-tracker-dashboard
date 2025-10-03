# 📊 Página de Datos de Usuarios - Mejoras Implementadas

## 🎯 Características Principales

### 1. **Interfaz Visual Mejorada** 
- **Vista de Tarjetas Expandibles**: Presentación visual organizada por usuario con tarjetas informativas
- **Expansión de Usuarios**: Click para expandir y ver todos los datos de cada usuario
- **Estadísticas en Tiempo Real**: Métricas clave mostradas en tarjetas destacadas
- **Distribución Visual**: 6 tarjetas mostrando cada tipo de dato
- **Datos Completos**: Vista de todos los registros, no solo los últimos

### 2. **Descifrado de Datos**
- **Datos Descifrados**: Todos los datos se muestran descifrados automáticamente
- **Soporte para IV**: Manejo de vectores de inicialización para descifrado
- **Texto Plano**: Detección automática de datos en texto plano
- **Arrays Descifrados**: Manejo de arrays de síntomas y emociones
- **Fechas Preservadas**: Las fechas se mantienen sin cifrar

### 3. **Filtros Avanzados** 
- **Filtro por Usuario**: Seleccionar usuarios específicos o ver todos
- **Filtro por Tipo de Dato**: Insulina, Comidas, Ejercicio, Períodos, Estado de Ánimo
- **Rango de Tiempo**: Último día, 7 días, 30 días, 90 días o todo el tiempo
- **Fecha Específica**: Filtrar por una fecha particular
- **Combinación de Filtros**: Los filtros funcionan en  conjunto

### 4. **Visualización Completa de Registros**
- **Vista Expandible**: Click en la flecha para expandir cada usuario
- **Todos los Registros**: Ver todos los registros de cada tipo de dato
- **Botón "Ver Todos"**: Mostrar/ocultar todos los registros de cada categoría
- **Contador de Registros**: Muestra el número total de registros por tipo
- **Organización por Tipo**: Datos organizados por categoría dentro de cada usuario

### 5. **Estadísticas Visuales**
- **Total de Registros**: Número total de registros por tipo
- **Distribución por Tipo**: Insulina, Comidas, Ejercicio, Períodos, Estado de Ánimo
- **Actividad por Usuario**: Estadísticas individuales por usuario
- **Última Actividad**: Fecha del registro más reciente por usuario

### 6. **Funcionalidades de Exportación**
- **Exportación CSV**: Descargar datos filtrados en formato CSV
- **Exportación por Tipo**: Exportar solo un tipo específico de datos
- **Datos Completos**: Incluye todos los campos relevantes
- **Formato Español**: Fechas y números en formato local

## 🚀 Cómo Usar

### 1. **Ejecutar el Dashboard**
```bash
cd dashboard
npm run dev
```

### 2. **Insertar Datos de Prueba Reales** (Opcional)
Si no tienes datos en la base de datos, puedes insertar datos de prueba reales:

```bash
# Asegúrate de tener las variables de entorno configuradas en .env.local
npm run insert-real-data
```

### 3. **Navegar a la Página de Datos**
- Ve a `http://localhost:3000/data`
- Inicia sesión con las credenciales de administrador

## 📋 Funcionalidades Detalladas

### **Vista de Tarjetas Expandibles por Usuario**
- **Organización por Usuario**: Cada usuario tiene su propia sección colapsable
- **Botón de Expansión**: Click en la flecha para expandir/colapsar
- **Estadísticas Resumidas**: Total de registros por tipo de dato
- **Datos Completos**: Muestra todos los registros, no solo los últimos
- **Indicadores Visuales**: Colores según el tipo de dato
  - 🔵 Azul: Datos de insulina
  - 🟢 Verde: Datos de comidas
  - 🟠 Naranja: Datos de ejercicio
  - 🟣 Púrpura: Datos de períodos
  - 🩷 Rosa: Datos de estado de ánimo

### **Descifrado Automático de Datos**
- **Detección de Cifrado**: Identifica automáticamente datos cifrados vs texto plano
- **Manejo de IV**: Procesa vectores de inicialización para descifrado
- **Arrays Descifrados**: Maneja arrays de síntomas y emociones correctamente
- **Fechas Preservadas**: Las fechas se mantienen sin cifrar
- **Fallback Seguro**: Si el descifrado falla, muestra el texto original

### **Visualización de Registros Completos**
- **Botón "Ver Todos"**: Para cada tipo de dato, muestra un botón para ver todos los registros
- **Contador Dinámico**: Muestra "Ver todos los X registros" con el número real
- **Vista Expandida**: Al hacer click, muestra todos los registros de esa categoría
- **Vista Colapsada**: Por defecto muestra solo los 2 primeros registros
- **Botón "Mostrar Menos"**: Para colapsar la vista completa

### **Filtros Avanzados**
- **Usuario**: Dropdown con todos los usuarios disponibles
- **Tipo de Dato**: Filtra por tipo específico o todos
- **Rango de Tiempo**: Selección rápida de períodos comunes
- **Fecha Específica**: Input de fecha para filtrado preciso
- **Combinación**: Los filtros se aplican simultáneamente

### **Exportación Inteligente**
- **Formato CSV**: Exporta todos los datos filtrados
- **Exportación por Tipo**: Puedes exportar solo un tipo específico
- **Incluye Encabezados**: Columnas con nombres descriptivos
- **Datos Formateados**: Fechas en formato legible

## 📊 Tipos de Datos Mostrados (Descifrados)

### **1. Datos de Insulina**
- **Tipo de Insulina**: Rápida, Lenta, Mixta, Basal (descifrado)
- **Dosis**: Cantidad administrada (descifrado)
- **Fecha y Hora**: Timestamp del registro
- **Usuario**: Propietario de los datos

### **2. Datos de Comidas**
- **Tipo de Comida**: Desayuno, Almuerzo, Cena, Snack, Postre (descifrado)
- **Cantidad**: Porciones consumidas (descifrado)
- **Carbohidratos**: Contenido de carbohidratos (descifrado)
- **Fecha y Hora**: Timestamp del registro

### **3. Datos de Ejercicio**
- **Tipo de Ejercicio**: Caminata, Correr, Nadar, Ciclismo, Yoga, Pesas (descifrado)
- **Intensidad**: Baja, Moderada, Alta
- **Descripción**: Detalles del ejercicio (descifrado)
- **Horario**: Hora de inicio y fin
- **Fecha**: Timestamp del registro

### **4. Datos de Períodos**
- **Fecha de Inicio**: Comienzo del período
- **Fecha de Fin**: Finalización del período
- **Intensidad**: Leve, Moderada, Intensa (descifrado)
- **Síntomas**: Lista de síntomas experimentados (descifrado)
- **Notas**: Comentarios adicionales (descifrado)

### **5. Datos de Estado de Ánimo**
- **Valor**: Escala del 1 al 5
- **Fuera de Rutina**: Indicador booleano
- **Descripción de Rutina**: Detalles del día (descifrado)
- **Emociones**: Lista de emociones experimentadas (descifrado)
- **Otra Emoción**: Emoción adicional (descifrado)

## 🎨 Diseño Visual

### **Paleta de Colores**
- **Azul**: Datos de insulina
- **Verde**: Datos de comidas
- **Naranja**: Datos de ejercicio
- **Púrpura**: Datos de períodos
- **Rosa**: Datos de estado de ánimo
- **Índigo**: Total general

### **Iconografía**
- **Pill**: Datos de insulina
- **Utensils**: Datos de comidas
- **Dumbbell**: Datos de ejercicio
- **CalendarDays**: Datos de períodos
- **Smile**: Datos de estado de ánimo
- **Activity**: Total general
- **User**: Filtros de usuario
- **Calendar**: Filtros de fecha
- **Clock**: Filtros de tiempo
- **ChevronDown/Up**: Expansión de usuarios
- **Eye/EyeOff**: Mostrar/ocultar registros

## 🔧 Configuración Técnica

### **Variables de Entorno Requeridas**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
ENCRYPTION_SECRET_KEY=tu_clave_de_cifrado_hex_32_bytes
```

**Nota importante**: La variable `ENCRYPTION_SECRET_KEY` debe ser la misma clave que se usa en el backend para cifrar los datos. Debe ser una cadena hexadecimal de 64 caracteres (32 bytes).

Para generar una nueva clave de cifrado:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Estructura de la Base de Datos**
- **Tabla `users`**: Información de usuarios
- **Tabla `insulindata`**: Datos de insulina (con campos _iv para descifrado)
- **Tabla `fooddata`**: Datos de comidas (con campos _iv para descifrado)
- **Tabla `exercisedata`**: Datos de ejercicio (con campos _iv para descifrado)
- **Tabla `periodrecords`**: Datos de períodos (con campos _iv para descifrado)
- **Tabla `mooddata`**: Datos de estado de ánimo (con campos _iv para descifrado)

### **Dependencias**
- **Supabase**: Base de datos y autenticación
- **Lucide React**: Iconos
- **Tailwind CSS**: Estilos
- **React Hooks**: Estado y efectos

## 📊 Métricas y Estadísticas

### **Cálculos Automáticos**
- **Total por Tipo**: Conteo de registros por tipo de dato
- **Actividad por Usuario**: Registros y última actividad
- **Distribución**: Conteo por tipo de dato
- **Tendencias Temporales**: Actividad reciente

### **Indicadores de Actividad**
- **Alta Actividad**: Usuarios con muchos registros
- **Actividad Reciente**: Última actividad en los últimos días
- **Distribución Equilibrada**: Usuarios con datos en múltiples categorías

## 🔧 Scripts Disponibles

### **1. Verificar Base de Datos**
```bash
npm run check-db
```
- Verifica la conexión a Supabase
- Muestra estadísticas de datos existentes
- Lista usuarios registrados
- Muestra datos más recientes por tipo

### **2. Verificar Variables de Entorno**
```bash
npm run check-env
```
- Verifica que todas las variables de entorno estén configuradas
- Valida el formato de la clave de cifrado
- Muestra instrucciones si falta alguna variable

### **3. Insertar Datos de Prueba Reales**
```bash
npm run insert-real-data
```
- Inserta datos de prueba para todas las tablas reales
- Crea usuarios de prueba si no existen
- Genera datos realistas con fechas variadas
- Muestra estadísticas después de la inserción

## 🚨 Solución de Problemas

### **No se muestran datos**
1. Verifica la conexión a Supabase
2. Confirma que existen datos en las tablas correspondientes
3. Ejecuta el script de datos de prueba reales si es necesario
4. Verifica que los datos estén correctamente cifrados

### **Datos no se descifran correctamente**
1. Verifica que la variable `ENCRYPTION_SECRET_KEY` esté configurada en `.env.local`
2. Confirma que la clave de cifrado sea la misma que se usa en el backend
3. Ejecuta `npm run check-env` para verificar la configuración
4. Revisa la consola del navegador para errores de descifrado

### **Filtros no funcionan**
1. Verifica que los usuarios existan en la tabla `users`
2. Confirma el formato de fecha en los filtros
3. Revisa la consola del navegador para errores

### **Error de exportación**
1. Verifica que haya datos para exportar
2. Confirma permisos de escritura en el navegador
3. Revisa el formato de fecha en los datos

## 🔄 Actualizaciones Futuras

### **Funcionalidades Planificadas**
- **Gráficos Interactivos**: Visualización temporal por tipo de dato
- **Alertas Automáticas**: Notificaciones para patrones anómalos
- **Comparación entre Usuarios**: Análisis comparativo
- **Exportación Avanzada**: Múltiples formatos y filtros
- **Dashboard en Tiempo Real**: Actualizaciones automáticas

### **Mejoras de UX**
- **Búsqueda Avanzada**: Filtros por texto libre
- **Ordenamiento Personalizado**: Múltiples criterios
- **Vista de Calendario**: Visualización por fechas
- **Notificaciones Push**: Alertas en tiempo real
- **Descifrado en Tiempo Real**: Descifrado automático sin recarga

## 🔐 Seguridad y Privacidad

### **Manejo de Datos Cifrados**
- **Descifrado Cliente**: Los datos se descifran en el frontend
- **Claves Seguras**: Las claves de cifrado se manejan en el backend
- **Datos Sensibles**: Información médica protegida por cifrado
- **Acceso Controlado**: Solo usuarios autorizados pueden ver los datos

### **Buenas Prácticas**
- **Logs Seguros**: No se registran datos sensibles en logs
- **Transmisión Segura**: Datos transmitidos por HTTPS
- **Almacenamiento Seguro**: Datos cifrados en la base de datos
- **Auditoría**: Registro de accesos y modificaciones 