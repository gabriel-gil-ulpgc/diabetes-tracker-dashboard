'use client'

import { useState, useEffect } from 'react'
import { supabase, User } from '@/lib/supabase'
import { Edit, Trash2, Search, Save, X, RefreshCw, User as UserIcon, Key, Shield, CheckCircle, AlertCircle, Users, Sparkles, Zap, Plus, Mail, Lock } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navigation from '@/components/Navigation'
import { getBackendUrl } from '@/lib/config'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function UsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    Username: '',
    GDPRConsent: false,
    role: 'user'
  })
  const [saving, setSaving] = useState(false)
  const [clearingUUID, setClearingUUID] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    password: '',
    role: 'user',
    username: '',
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('UserID', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('UserID', userId)

        if (error) throw error
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error al eliminar el usuario')
      }
    }
  }

  const startEditing = (user: User) => {
    setEditingUser(user)
      setEditForm({
        Username: user.Username,
        GDPRConsent: user.GDPRConsent,
        role: user.role || 'user'
      })
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setEditForm({
      Username: '',
      GDPRConsent: false,
      role: 'user'
    })
  }

  const saveUser = async () => {
    if (!editingUser) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('users')
        .update({
          Username: editForm.Username,
          GDPRConsent: editForm.GDPRConsent
        })
        .eq('UserID', editingUser.UserID)

      if (error) throw error
      
      setEditingUser(null)
      setEditForm({
        Username: '',
        GDPRConsent: false,
        role: 'user'
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error al actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const clearUUID = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres limpiar el UUID de este usuario? Esto invalidará el UUID actual.')) {
      return
    }

    try {
      setClearingUUID(true)
      
      const { error } = await supabase
        .from('users')
        .update({
          UUID: null
        })
        .eq('UserID', userId)

      if (error) throw error
      
      fetchUsers()
      alert('UUID limpiado exitosamente')
    } catch (error) {
      console.error('Error clearing UUID:', error)
      alert('Error al limpiar el UUID')
    } finally {
      setClearingUUID(false)
    }
  }

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: newRole
        })
        .eq('UserID', userId)

      if (error) throw error
      
      fetchUsers()
      setMessage({
        type: 'success',
        text: t.dashboard.roleUpdated
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      setMessage({
        type: 'error',
        text: t.dashboard.errorOccurred
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.Username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('UUID copiado al portapapeles')
    }).catch(() => {
      alert('Error al copiar al portapapeles')
    })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createForm.username || !createForm.password) {
      setMessage({ type: 'error', text: 'Nombre de usuario y contraseña son requeridos' })
      return
    }

    try {
      setCreateLoading(true)
      setMessage(null)

      // Obtener la sesión actual para el token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: 'error', text: 'No hay sesión activa' })
        return
      }

      // Usar el backend para crear usuario
      const response = await fetch(getBackendUrl('/admin/users'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: createForm.username,
          password: createForm.password,
          role: createForm.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creando usuario')
      }

      setMessage({ type: 'success', text: 'Usuario creado exitosamente' })
      setCreateForm({ password: '', username: '', role: 'user' })
      setShowCreateForm(false)
      fetchUsers() // Recargar la lista
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: `Error creando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <Navigation title={t.dashboard.userManagement} showBackButton={true} />
        
        {/* Selector de idioma */}
        <div className="absolute top-6 right-6 z-50">
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <LanguageSelector />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header con estadísticas */}
          <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    {t.dashboard.userManagement}
                  </h2>
                  <p className="text-gray-600 text-xl font-light">Administra usuarios, edita información y regenera UUIDs</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 px-6 py-3 rounded-xl shadow-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-base text-gray-800 font-semibold">
                    {users.length} usuarios registrados
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold text-lg">{t.dashboard.createUser}</span>
                </button>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative z-10">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.dashboard.searchUsers}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/70"
                />
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>

            <div className="relative z-10">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 px-10 py-6 rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span className="text-gray-800 font-semibold text-lg">Cargando usuarios...</span>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider w-1/4">
                        {t.dashboard.username}
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider w-2/5">
                        UUID
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider w-1/6">
                        Estado
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider w-1/6">
                        GDPR
                      </th>
                      <th className="px-8 py-6 text-right text-sm font-bold text-gray-800 uppercase tracking-wider w-1/6">
                        {t.dashboard.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.UserID} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300">
                        <td className="px-8 py-8">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                                <span className="text-xl font-bold text-white">
                                  {user.Username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xl font-bold text-gray-900">
                                {user.Username}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {user.UserID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-800 font-mono bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 break-all">
                                {user.UUID ?? 'Sin UUID'}
                              </div>
                            </div>
                            {user.UUID && (
                              <button
                                onClick={() => copyToClipboard(user.UUID!)}
                                className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex-shrink-0 shadow-lg"
                                title="Copiar UUID"
                              >
                                <Key className="h-5 w-5 text-white" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <span className="text-base font-semibold text-gray-900">Activo</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center space-x-3">
                            {user.GDPRConsent ? (
                              <>
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <span className="text-base font-semibold text-green-700">Sí</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-6 w-6 text-red-500" />
                                <span className="text-base font-semibold text-red-700">No</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <div className="flex flex-col items-end space-y-3">
                            {/* Selector de rol */}
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => updateUserRole(user.UserID, e.target.value)}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            >
                              <option value="admin">{t.dashboard.admin}</option>
                              <option value="doctor">{t.dashboard.doctor}</option>
                              <option value="user">{t.dashboard.user}</option>
                            </select>
                            
                            {/* Botones de acción */}
                            <div className="flex items-center space-x-3">
                            <button
                              onClick={() => startEditing(user)}
                              className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title={t.dashboard.edit}
                            >
                              <Edit className="h-5 w-5 text-white" />
                            </button>
                            <button
                              onClick={() => clearUUID(user.UserID)}
                              disabled={clearingUUID}
                              className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
                              title={t.dashboard.clearUUID}
                            >
                              <RefreshCw className={`h-5 w-5 text-white ${clearingUUID ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.UserID)}
                              className="p-3 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg hover:from-red-500 hover:to-rose-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title={t.dashboard.delete}
                            >
                              <Trash2 className="h-5 w-5 text-white" />
                            </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="relative z-10 text-center py-20">
                <div className="p-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl inline-block shadow-lg">
                  <UserIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <p className="text-gray-600 text-xl font-semibold">No se encontraron usuarios</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal de edición */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="relative bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 w-full max-w-lg mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-gray-900">Editar Usuario</h3>
                  <button
                    onClick={cancelEditing}
                    className="p-3 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-500 hover:border-red-500/50 transition-all duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={editForm.Username}
                      onChange={(e) => setEditForm({ ...editForm, Username: e.target.value })}
                      className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/70"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id="gdpr-consent"
                      checked={editForm.GDPRConsent}
                      onChange={(e) => setEditForm({ ...editForm, GDPRConsent: e.target.checked })}
                      className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label htmlFor="gdpr-consent" className="block text-base font-semibold text-gray-700">
                      Consentimiento GDPR
                    </label>
                  </div>

                  <div className="bg-white/50 border border-gray-200 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <Shield className="h-6 w-6 text-blue-600 mr-3" />
                      <span className="text-base font-semibold text-gray-700">UUID Actual</span>
                    </div>
                    <div className="text-sm text-gray-600 font-mono break-all bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      {editingUser.UUID || 'Sin UUID asignado'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-6 mt-10">
                  <button
                    onClick={cancelEditing}
                    className="px-8 py-4 text-base font-semibold text-gray-600 bg-white/50 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveUser}
                    disabled={saving || !editForm.Username.trim()}
                    className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-3" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de creación de usuario */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="relative bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 w-full max-w-lg mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-3 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-500 hover:border-red-500/50 transition-all duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      <UserIcon className="h-5 w-5 inline mr-2" />
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/70"
                      placeholder="Nombre de usuario único"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      <Lock className="h-5 w-5 inline mr-2" />
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/70"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      <Shield className="h-5 w-5 inline mr-2" />
                      {t.dashboard.role} *
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/70"
                    >
                      <option value="user">{t.dashboard.user}</option>
                      <option value="doctor">{t.dashboard.doctor}</option>
                      <option value="admin">{t.dashboard.admin}</option>
                    </select>
                  </div>

                  <div className="bg-white/50 border border-gray-200 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <Shield className="h-6 w-6 text-blue-600 mr-3" />
                      <span className="text-base font-semibold text-gray-700">Información</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      El usuario será creado con nombre de usuario y contraseña. Podrá acceder a la aplicación móvil usando estas credenciales.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-6 mt-10">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-8 py-4 text-base font-semibold text-gray-600 bg-white/50 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading || !createForm.username || !createForm.password}
                      className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      {createLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-3" />
                          {t.dashboard.createUser}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
} 