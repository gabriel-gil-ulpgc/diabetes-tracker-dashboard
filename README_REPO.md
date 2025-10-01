# 🩺 Diabetes Tracker Dashboard

Panel de administración y análisis para el sistema de seguimiento de diabetes H2TRAIN.

## 📋 **Contenido del Repositorio**

Este repositorio contiene:

1. **Dashboard**: Panel de administración web completo con Next.js
2. **kub-kubioscloud-demo**: CLI para integración con Kubios Cloud

## 🚀 **Dashboard**

Panel de administración web desarrollado con Next.js, TypeScript y Tailwind CSS.

### **Características Principales:**

- 🔐 **Autenticación dual**: Supabase Auth y autenticación personalizada
- 👥 **Gestión de usuarios**: Administración completa con roles (admin, doctor, user)
- 📊 **Visualización de datos**: Dashboards interactivos con Recharts
- 🔒 **Datos descifrados**: Visualización de datos de salud descifrados
- 🌍 **Internacionalización**: Soporte para español e inglés
- 📈 **Análisis de HRV**: Integración con datos de Kubios Cloud
- 🔬 **Estudios de correlación**: Análisis entre diabetes, ejercicio y HRV

### **Tecnologías:**

- **Framework**: Next.js 15.1.6
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase
- **Gráficos**: Recharts
- **Despliegue**: Vercel

### **Instalación:**

```bash
cd dashboard
npm install
```

### **Variables de Entorno:**

Crear un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
NEXT_PUBLIC_BACKEND_URL=url_del_backend
ENCRYPTION_SECRET_KEY=clave_de_cifrado
ENCRYPTION_SECRET_KEY0=clave_de_cifrado_antigua
```

### **Desarrollo:**

```bash
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`

### **Producción:**

```bash
npm run build
npm start
```

## 🔬 **kub-kubioscloud-demo**

CLI para interactuar con Kubios Cloud API y obtener datos de HRV.

### **Características:**

- 📡 **Obtención de mediciones**: Descarga de datos HRV de usuarios
- 👥 **Gestión de equipos**: Listado de usuarios del equipo
- 📊 **Análisis de HRV**: Cálculo de métricas de variabilidad cardíaca
- 🔐 **Autenticación**: Login automático con credenciales

### **Configuración:**

1. Copiar `sample_config.yaml` a `my_config.yaml`
2. Actualizar las credenciales:

```yaml
username: tu_email@kubios.com
password: tu_contraseña
```

### **Uso:**

```bash
# Listar usuarios del equipo
python kubios_cli.py list-users

# Obtener mediciones de un usuario
python kubios_cli.py get-measurements --username usuario --start-date 2024-01-01 --end-date 2024-12-31

# Contar mediciones
python kubios_cli.py count-measurements --username usuario --start-date 2024-01-01 --end-date 2024-12-31
```

## 📁 **Estructura del Proyecto**

```
diabetes-tracker-dashboard/
├── src/
│   ├── app/                  # Páginas de Next.js
│   │   ├── admin/           # Panel de administración
│   │   ├── analytics/       # Análisis y estadísticas
│   │   ├── data/           # Visualización de datos
│   │   ├── kubios/         # Análisis de HRV
│   │   ├── study/          # Estudios de correlación
│   │   └── users/          # Gestión de usuarios
│   ├── components/          # Componentes React
│   ├── contexts/           # Contextos de React
│   ├── hooks/              # Hooks personalizados
│   └── lib/                # Utilidades y configuración
├── kub-kubioscloud-demo/   # CLI de Kubios
│   ├── kubios_cli.py       # CLI principal
│   ├── kubios_service.py   # Servicio de Kubios
│   └── my_config.yaml      # Configuración
├── public/                  # Archivos estáticos
├── scripts/                # Scripts de utilidad
└── package.json            # Dependencias
```

## 🔐 **Roles y Permisos**

### **Admin:**
- ✅ Acceso completo al sistema
- ✅ Gestión de usuarios
- ✅ Administración de base de datos
- ✅ Configuración del sistema

### **Doctor:**
- ✅ Visualización de todos los datos
- ✅ Análisis de HRV
- ✅ Estudios de correlación
- ❌ Gestión de usuarios

### **User:**
- ✅ Visualización de sus propios datos
- ✅ Análisis personal
- ❌ Acceso a datos de otros usuarios

## 🌍 **Idiomas Soportados**

- 🇪🇸 Español
- 🇬🇧 Inglés

## 📊 **Páginas Principales**

### **Dashboard (`/`)**
Panel principal con estadísticas generales y acceso rápido a funcionalidades.

### **Usuarios (`/users`)**
Gestión completa de usuarios con roles y permisos.

### **Datos (`/data`)**
Visualización de datos de salud descifrados (insulina, comidas, ejercicio, períodos, estado de ánimo).

### **Análisis (`/analytics`)**
Estadísticas y gráficos de análisis de datos de salud.

### **HRV Kubios (`/kubios`)**
Análisis de variabilidad cardíaca con datos de Kubios Cloud.

### **Estudio (`/study`)**
Análisis de correlaciones entre diabetes, ejercicio y HRV.

### **Administración (`/admin`)**
- Gestión de usuarios
- Base de datos
- Configuración del sistema

## 🔒 **Seguridad**

- ✅ TLS 1.3
- ✅ Cifrado AES-256
- ✅ HSTS
- ✅ Headers de seguridad
- ✅ Autenticación dual
- ✅ Control de acceso basado en roles

## 📝 **Licencia**

Este proyecto es parte de la investigación H2TRAIN de la Universidad de Las Palmas de Gran Canaria (ULPGC) y la Fundación Instituto de Investigación Sanitaria de Canarias (FIISC).

## 👥 **Contacto**

Para cualquier consulta:
- gabriel.gil@ulpgc.es
- javier.alayon@ulpgc.es
- jpenate@fciisc.es

## 🚀 **Despliegue**

El dashboard está desplegado en Vercel y se actualiza automáticamente con cada push a `main`.

**URL de producción**: [Por definir]

---

**Nota**: Este repositorio contiene solo el dashboard y la integración con Kubios. El backend de Node.js y la app móvil de Flutter se encuentran en repositorios separados.

