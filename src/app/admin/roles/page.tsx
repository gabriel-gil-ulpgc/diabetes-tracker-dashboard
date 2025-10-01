'use client'

import { useState, useEffect } from 'react'
import { Shield, User, Stethoscope, Crown, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGuard from '@/components/RoleGuard'
import Navigation from '@/components/Navigation'
import { supabase, User as AppUser } from '@/lib/supabase'

export default function RolesPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('UserID, Username, role')
        .order('Username')
      
      if (error) throw error
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setMessage({ type: 'error', text: 'Error al cargar usuarios' })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: number, newRole: 'admin' | 'doctor' | 'user') => {
    try {
      setSaving(userId.toString())
      
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('UserID', userId)
      
      if (error) throw error
      
      // Actualizar el estado local
      setUsers(prev => prev.map(user => 
        user.UserID === userId ? { ...user, role: newRole } : user
      ))
      
      setMessage({ type: 'success', text: `Rol actualizado correctamente` })
    } catch (error) {
      console.error('Error updating role:', error)
      setMessage({ type: 'error', text: 'Error al actualizar el rol' })
    } finally {
      setSaving(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-5 w-5 text-yellow-500" />
      case 'doctor': return <Stethoscope className="h-5 w-5 text-green-500" />
      default: return <User className="h-5 w-5 text-blue-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'doctor': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'doctor': return 'Médico'
      default: return 'Usuario'
    }
  }

  return (
    <ProtectedRoute>
      <RoleGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {/* Elementos decorativos de fondo */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000 transform -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <Navigation title="Gestión de Roles" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-gray-200/50">
                  <Shield className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Gestión de Roles
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Administra los permisos y roles de acceso de los usuarios del sistema
              </p>
            </div>

            {/* Mensaje de estado */}
            {message && (
              <div className={`mx-8 mb-8 p-4 rounded-lg flex items-center space-x-2 ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Estadísticas de roles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Administradores</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Médicos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {users.filter(u => u.role === 'doctor').length}
                    </p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {users.filter(u => u.role === 'user').length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h2>
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando usuarios...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.UserID}
                      className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-200/50 hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.Username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.Username}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getRoleIcon(user.role)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                              {getRoleName(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.UserID, e.target.value as 'admin' | 'doctor' | 'user')}
                          disabled={saving === user.UserID.toString()}
                          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="user">Usuario</option>
                          <option value="doctor">Médico</option>
                          <option value="admin">Administrador</option>
                        </select>
                        
                        {saving === user.UserID.toString() && (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información sobre roles */}
            <div className="mt-12 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información sobre Roles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrador</h3>
                  <p className="text-gray-600 text-sm">
                    Acceso completo al sistema, gestión de usuarios, base de datos y configuraciones.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Médico</h3>
                  <p className="text-gray-600 text-sm">
                    Acceso a datos de pacientes, análisis médicos y herramientas de diagnóstico.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuario</h3>
                  <p className="text-gray-600 text-sm">
                    Acceso básico a sus propios datos y funcionalidades limitadas del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  )
}
