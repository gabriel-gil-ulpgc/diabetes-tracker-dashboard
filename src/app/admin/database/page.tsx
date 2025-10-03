'use client'

import { useState, useEffect } from 'react'
import { Database, Table, Download, Upload, RefreshCw, BarChart3, FileText, HardDrive, Activity, TrendingUp, CheckCircle, AlertTriangle, Clock, Users, Database as DatabaseIcon } from 'lucide-react'
import HybridProtectedRoute from '@/components/HybridProtectedRoute'
import HybridNavigation from '@/components/HybridNavigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppAuth } from '@/contexts/AppAuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function AdminDatabasePage() {
  const { user } = useAuth()
  const { user: appUser } = useAppAuth()
  const { t } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [dbStats, setDbStats] = useState({
    totalTables: 0,
    totalRecords: 0,
    databaseSize: 0,
    lastBackup: '',
    uptime: 0
  })

  const [tables, setTables] = useState([
    { name: 'users', records: 15, size: '2.1 MB' },
    { name: 'insulin_data', records: 2847, size: '1.8 MB' },
    { name: 'food_data', records: 1923, size: '1.2 MB' },
    { name: 'exercise_data', records: 1456, size: '0.9 MB' },
    { name: 'period_records', records: 234, size: '0.3 MB' },
    { name: 'mood_data', records: 1876, size: '0.8 MB' },
    { name: 'kubios_results', records: 456, size: '0.5 MB' }
  ])

  // Determinar si es un usuario individual o administrador
  const isIndividualUser = appUser && !user

  useEffect(() => {
    const loadDbStats = async () => {
      try {
        setLoading(true)
        
        // Simular carga de estadísticas de base de datos
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setDbStats({
          totalTables: 7,
          totalRecords: 8807,
          databaseSize: 7.6,
          lastBackup: '2024-01-15 14:30:00',
          uptime: 99.9
        })
      } catch (error) {
        console.error('Error loading database stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDbStats()
  }, [])

  const databaseFeatures = [
    {
      title: t.admin.tableExplorer,
      description: 'Explorar y visualizar todas las tablas de la base de datos',
      icon: Table,
      color: 'from-blue-500 to-cyan-500',
      stats: `${dbStats.totalTables} tablas`
    },
    {
      title: t.admin.exportData,
      description: 'Exportar datos en formato JSON o CSV',
      icon: Download,
      color: 'from-green-500 to-emerald-500',
      stats: `${dbStats.totalRecords.toLocaleString()} registros`
    },
    {
      title: t.admin.createBackup,
      description: 'Crear respaldo completo de la base de datos',
      icon: Upload,
      color: 'from-purple-500 to-pink-500',
      stats: `${dbStats.databaseSize} GB`
    },
    {
      title: t.admin.refreshStats,
      description: 'Actualizar estadísticas y métricas del sistema',
      icon: RefreshCw,
      color: 'from-orange-500 to-red-500',
      stats: `${dbStats.uptime}% uptime`
    }
  ]

  return (
    <HybridProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <HybridNavigation title={t.admin.databaseManagement} showBackButton={true} />
        
        {/* Selector de idioma */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSelector />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header con estadísticas generales */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start mb-6">
                  <div className="p-5 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg">
                    <DatabaseIcon className="h-12 w-12 text-white" />
                  </div>
                  <div className="ml-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.admin.databaseManagement}</h1>
                    <p className="text-gray-600 text-lg">{t.admin.databaseDescription}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-6 sm:mt-0">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Table className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.admin.tables}</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.totalTables}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.admin.records}</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.totalRecords.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <HardDrive className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.admin.databaseSize}</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.databaseSize} GB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Funcionalidades de base de datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {databaseFeatures.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 font-medium">{feature.stats}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors duration-300">
                    <span>{t.admin.access}</span>
                    <TrendingUp className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablas de la base de datos */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                  <Table className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.admin.tables}</h3>
                  <p className="text-gray-600">{t.admin.tableStructure}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold">{t.admin.operational}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{table.size}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{table.name}</h4>
                  <p className="text-gray-600 text-sm">{table.records.toLocaleString()} {t.admin.records}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.admin.systemStatus}</h3>
                  <p className="text-gray-600">{t.admin.realTimeMonitoring}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold">{t.admin.operational}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <HardDrive className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{dbStats.databaseSize} GB</span>
                </div>
                <p className="text-blue-700 font-medium">{t.admin.databaseSize}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">{dbStats.uptime}%</span>
                </div>
                <p className="text-green-700 font-medium">{t.admin.uptime}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{dbStats.lastBackup}</span>
                </div>
                <p className="text-purple-700 font-medium">{t.admin.lastBackup}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HybridProtectedRoute>
  )
}