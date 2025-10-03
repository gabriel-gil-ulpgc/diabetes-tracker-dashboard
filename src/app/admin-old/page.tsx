'use client'

import Link from 'next/link'
import { Users, Settings, Database, Shield, Activity, TrendingUp, CheckCircle, Sparkles, Zap, BarChart3 } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGuard from '@/components/RoleGuard'
import SimpleNavigation from '@/components/SimpleNavigation'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminPage() {
  const { t } = useLanguage()
  const adminFeatures = [
    

    {
      title: 'Base de Datos',
      description: 'Gestionar datos y realizar respaldos',
      icon: Database,
      href: '/admin/database',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Elementos decorativos de fondo */}
        <SimpleNavigation title={t.dashboard.administration} showBackButton={true} />
        
        {/* Selector de idioma */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSelector />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">


          {/* Funcionalidad de Base de Datos */}
          <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                  <Database className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.admin.database}</h2>
                  <p className="text-gray-600 text-lg">{t.admin.databaseDescription}</p>
                </div>
              </div>
              <RoleGuard requiredPermission="manage_database">
                <Link href="/admin/database" className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-3">
                  <span className="font-semibold">{t.admin.manageDatabase}</span>
                  <BarChart3 className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Link>
              </RoleGuard>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}