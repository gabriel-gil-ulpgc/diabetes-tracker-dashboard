'use client'

import Link from 'next/link'
import { Users, Settings, Database, Shield, Activity, TrendingUp, CheckCircle, Sparkles, Zap, BarChart3 } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGuard from '@/components/RoleGuard'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminPage() {
  const { t } = useLanguage()
  const adminFeatures = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y eliminar usuarios del sistema',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Configuración del Sistema',
      description: 'Configurar parámetros generales del sistema',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Base de Datos',
      description: 'Gestionar datos y realizar respaldos',
      icon: Database,
      href: '/admin/database',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Seguridad',
      description: 'Configurar políticas de seguridad y permisos',
      icon: Shield,
      href: '/admin/security',
      color: 'from-red-500 to-orange-500',
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000 transform -translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="w-full relative z-10">
          {/* Header con selector de idioma */}
          <div className="flex justify-end p-6">
            <LanguageSelector />
          </div>
          
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-full px-8 py-4 mb-8 shadow-lg">
              <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
              <span className="text-blue-800 font-semibold text-lg">{t.dashboard.adminPanel}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 bg-clip-text text-transparent mb-8 leading-tight">
              {t.dashboard.administration}
            </h1>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
              {t.dashboard.adminDescription}
            </p>
          </div>

          {/* Tarjetas de administración - Primera fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {adminFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group"
              >
                <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 hover:border-blue-300/70 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg group-hover:shadow-blue-600/50 transition-all duration-300`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-800 group-hover:text-blue-600 transition-colors">-</div>
                        <div className="text-xs text-blue-600/70">Admin</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      <span>Acceder</span>
                      <Zap className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sección de características premium */}
          <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-16 text-gray-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
            <div className="relative z-10">
              <div className="text-center mb-16">
                <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-full px-8 py-4 mb-8 shadow-lg">
                  <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                  <span className="text-blue-800 font-semibold text-lg">Herramientas Avanzadas</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 bg-clip-text text-transparent mb-8">
                  Control Total
                </h2>
                <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                  Administra todos los aspectos del sistema con herramientas profesionales 
                  diseñadas para el control y supervisión completa de la plataforma.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <RoleGuard requiredPermission="manage_settings">
                  <Link href="/admin/settings" className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-10 hover:border-blue-300/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 block">
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-blue-700 transition-colors">
                      Seguridad Avanzada
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                      Configura políticas de seguridad, gestiona permisos y supervisa 
                      el acceso al sistema con herramientas de grado empresarial.
                    </p>
                    <div className="flex items-center text-blue-600 text-base font-medium">
                      <span>Configurar</span>
                      <Zap className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </RoleGuard>

                <RoleGuard requiredPermission="manage_users">
                  <Link href="/admin/roles" className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-10 hover:border-blue-300/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 block">
                    <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-blue-700 transition-colors">
                      Gestión de Roles
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                      Administra roles y permisos de usuarios del sistema con control total 
                      sobre niveles de acceso y configuraciones de seguridad.
                    </p>
                    <div className="flex items-center text-blue-600 text-base font-medium">
                      <span>Administrar</span>
                      <Activity className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />
                    </div>
                  </Link>
                </RoleGuard>

                <RoleGuard requiredPermission="manage_database">
                  <Link href="/admin/database" className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-10 hover:border-blue-300/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 block">
                    <div className="p-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-300">
                      <Database className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-blue-700 transition-colors">
                      Base de Datos
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                      Gestiona datos, realiza respaldos y supervisa el rendimiento 
                      de la base de datos con herramientas profesionales.
                    </p>
                    <div className="flex items-center text-blue-600 text-base font-medium">
                      <span>Gestionar</span>
                      <BarChart3 className="h-5 w-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </div>
                  </Link>
                </RoleGuard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}