# Diabetes Tracker Dashboard

Este es un dashboard de administración para el sistema Diabetes Tracker, construido con Next.js, React y Tailwind CSS.

**Última actualización**: Enero 2025 - Deploy automático configurado ✅ - Monorepo configurado

## Características

- **Gestión de Usuarios**: Ver, editar y eliminar usuarios del sistema
- **Visualización de Datos**: Tabla con todos los datos de salud de los usuarios
- **Análisis y Estadísticas**: Gráficos interactivos con Recharts
- **Resumen General**: Vista general del sistema con métricas clave
- **Filtros Avanzados**: Filtrar por usuario, fecha y rango de tiempo
- **Exportación de Datos**: Exportar datos a formato CSV
- **Diseño Responsivo**: Interfaz adaptada para diferentes dispositivos

## Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utilitario
- **Supabase** - Base de datos y autenticación
- **Recharts** - Biblioteca de gráficos
- **Lucide React** - Iconos

## Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <tu-repositorio>
   cd dashboard
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto con:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. **Ejecutar el proyecto**:
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## Configuración de Supabase

Para que el dashboard funcione correctamente, necesitas configurar Supabase con las siguientes tablas:

### Tabla `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `polar_data`
```sql
CREATE TABLE polar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  glucose_level INTEGER NOT NULL,
  heart_rate INTEGER NOT NULL,
  steps INTEGER NOT NULL,
  sleep_hours DECIMAL(3,1) NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 0 AND mood_score <= 5),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Estructura del Proyecto

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Página principal
│   │   ├── users/
│   │   │   └── page.tsx          # Gestión de usuarios
│   │   ├── data/
│   │   │   └── page.tsx          # Visualización de datos
│   │   ├── analytics/
│   │   │   └── page.tsx          # Análisis y gráficos
│   │   └── overview/
│   │       └── page.tsx          # Resumen general
│   └── lib/
│       └── supabase.ts           # Configuración de Supabase
├── public/                        # Archivos estáticos
├── package.json                   # Dependencias del proyecto
└── README.md                      # Este archivo
```

## Uso

### Página Principal
- Dashboard con navegación a todas las secciones
- Tarjetas informativas con acceso rápido

### Gestión de Usuarios
- Lista de todos los usuarios registrados
- Búsqueda por email
- Acciones de edición y eliminación
- Información de fechas de creación y actualización

### Datos de Usuarios
- Tabla con todos los datos de salud
- Filtros por usuario y fecha
- Exportación a CSV
- Indicadores visuales para niveles de glucosa y estado de ánimo

### Análisis y Estadísticas
- Gráficos de evolución temporal
- Estadísticas generales del sistema
- Filtros por usuario y rango de tiempo
- Gráficos de líneas, barras y pastel

### Resumen General
- Métricas clave del sistema
- Usuarios más activos
- Alertas del sistema
- Datos recientes

## Personalización

### Colores
Los colores se pueden personalizar modificando las clases de Tailwind CSS en los componentes.

### Gráficos
Los gráficos se pueden personalizar modificando las opciones de Recharts en `src/app/analytics/page.tsx`.

### Filtros
Se pueden agregar más filtros modificando los componentes de filtrado en cada página.

## Despliegue

### Vercel (Recomendado)
1. Conectar tu repositorio a Vercel
2. Configurar las variables de entorno
3. Desplegar automáticamente

### Otros Proveedores
El proyecto se puede desplegar en cualquier proveedor que soporte Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## Soporte

Para soporte técnico o preguntas sobre el dashboard, contacta al equipo de desarrollo.

## Licencia

Este proyecto está bajo la licencia MIT.
