'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, Database, Shield, Mail, Bell, Globe, Lock, Users, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // Configuración general
    appName: 'Diabetes Tracker',
    appVersion: '1.0.0',
    maintenanceMode: false,
    debugMode: false,
    
    // Configuración de base de datos
    dbBackupFrequency: 'daily',
    dbRetentionDays: 30,
    dbMaxConnections: 100,
    
    // Configuración de seguridad
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    
    // Configuración de notificaciones
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationFrequency: 'immediate',
    
    // Configuración de usuarios
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'user',
    maxUsersPerTeam: 50,
    
    // Configuración de HRV
    hrvDataRetention: 365,
    hrvSyncFrequency: 'hourly',
    hrvAlertThreshold: 0.7,
    
    // Configuración de análisis
    analyticsEnabled: true,
    dataAnonymization: false,
    reportGeneration: 'weekly',
    aiInsightsEnabled: true
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Simular carga de configuración desde API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Configuración cargada correctamente' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar la configuración' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1500))
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setSettings({
        appName: 'Diabetes Tracker',
        appVersion: '1.0.0',
        maintenanceMode: false,
        debugMode: false,
        dbBackupFrequency: 'daily',
        dbRetentionDays: 30,
        dbMaxConnections: 100,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireTwoFactor: false,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notificationFrequency: 'immediate',
        allowRegistration: true,
        requireEmailVerification: true,
        defaultUserRole: 'user',
        maxUsersPerTeam: 50,
        hrvDataRetention: 365,
        hrvSyncFrequency: 'hourly',
        hrvAlertThreshold: 0.7,
        analyticsEnabled: true,
        dataAnonymization: false,
        reportGeneration: 'weekly',
        aiInsightsEnabled: true
      })
      setMessage({ type: 'success', text: 'Configuración restaurada por defecto' })
    }
  }

  const settingSections = [
    {
      title: 'Configuración General',
      icon: Settings,
      color: 'from-blue-500 to-blue-600',
      fields: [
        { key: 'appName', label: 'Nombre de la Aplicación', type: 'text' },
        { key: 'appVersion', label: 'Versión', type: 'text', disabled: true },
        { key: 'maintenanceMode', label: 'Modo Mantenimiento', type: 'toggle' },
        { key: 'debugMode', label: 'Modo Debug', type: 'toggle' }
      ]
    },
    {
      title: 'Base de Datos',
      icon: Database,
      color: 'from-green-500 to-emerald-500',
      fields: [
        { key: 'dbBackupFrequency', label: 'Frecuencia de Respaldo', type: 'select', options: ['hourly', 'daily', 'weekly', 'monthly'] },
        { key: 'dbRetentionDays', label: 'Días de Retención', type: 'number', min: 1, max: 365 },
        { key: 'dbMaxConnections', label: 'Conexiones Máximas', type: 'number', min: 10, max: 1000 }
      ]
    },
    {
      title: 'Seguridad',
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      fields: [
        { key: 'sessionTimeout', label: 'Timeout de Sesión (min)', type: 'number', min: 5, max: 480 },
        { key: 'maxLoginAttempts', label: 'Intentos de Login Máximos', type: 'number', min: 3, max: 10 },
        { key: 'passwordMinLength', label: 'Longitud Mínima de Contraseña', type: 'number', min: 6, max: 32 },
        { key: 'requireTwoFactor', label: 'Requerir Autenticación de Dos Factores', type: 'toggle' }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      color: 'from-purple-500 to-pink-500',
      fields: [
        { key: 'emailNotifications', label: 'Notificaciones por Email', type: 'toggle' },
        { key: 'pushNotifications', label: 'Notificaciones Push', type: 'toggle' },
        { key: 'smsNotifications', label: 'Notificaciones SMS', type: 'toggle' },
        { key: 'notificationFrequency', label: 'Frecuencia de Notificaciones', type: 'select', options: ['immediate', 'hourly', 'daily', 'weekly'] }
      ]
    },
    {
      title: 'Gestión de Usuarios',
      icon: Users,
      color: 'from-cyan-500 to-blue-500',
      fields: [
        { key: 'allowRegistration', label: 'Permitir Registro', type: 'toggle' },
        { key: 'requireEmailVerification', label: 'Requerir Verificación de Email', type: 'toggle' },
        { key: 'defaultUserRole', label: 'Rol por Defecto', type: 'select', options: ['user', 'admin', 'moderator'] },
        { key: 'maxUsersPerTeam', label: 'Usuarios Máximos por Equipo', type: 'number', min: 1, max: 1000 }
      ]
    },
    {
      title: 'Configuración HRV',
      icon: Activity,
      color: 'from-indigo-500 to-purple-500',
      fields: [
        { key: 'hrvDataRetention', label: 'Retención de Datos HRV (días)', type: 'number', min: 30, max: 1095 },
        { key: 'hrvSyncFrequency', label: 'Frecuencia de Sincronización', type: 'select', options: ['realtime', 'hourly', 'daily'] },
        { key: 'hrvAlertThreshold', label: 'Umbral de Alerta HRV', type: 'number', min: 0.1, max: 1.0, step: 0.1 }
      ]
    },
    {
      title: 'Análisis y Reportes',
      icon: Globe,
      color: 'from-teal-500 to-green-500',
      fields: [
        { key: 'analyticsEnabled', label: 'Analytics Habilitado', type: 'toggle' },
        { key: 'dataAnonymization', label: 'Anonimización de Datos', type: 'toggle' },
        { key: 'reportGeneration', label: 'Generación de Reportes', type: 'select', options: ['daily', 'weekly', 'monthly', 'quarterly'] },
        { key: 'aiInsightsEnabled', label: 'Insights de IA Habilitados', type: 'toggle' }
      ]
    }
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
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                  <p className="text-gray-600">Gestiona la configuración general de la plataforma</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={resetToDefaults}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Restaurar</span>
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mx-8 mt-4 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Contenido principal */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Cargando configuración...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {settingSections.map((section, index) => (
                  <div key={index} className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center mb-6">
                      <div className={`p-3 bg-gradient-to-br ${section.color} rounded-xl shadow-lg mr-4`}>
                        <section.icon className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {section.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                          </label>
                          
                          {field.type === 'toggle' ? (
                            <div className="flex items-center">
                              <button
                                onClick={() => handleInputChange(field.key, !settings[field.key as keyof typeof settings])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settings[field.key as keyof typeof settings] 
                                    ? 'bg-blue-600' 
                                    : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    settings[field.key as keyof typeof settings] 
                                      ? 'translate-x-6' 
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="ml-3 text-sm text-gray-600">
                                {settings[field.key as keyof typeof settings] ? 'Habilitado' : 'Deshabilitado'}
                              </span>
                            </div>
                          ) : field.type === 'select' ? (
                            <select
                              value={settings[field.key as keyof typeof settings] as string}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              disabled={field.disabled}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={settings[field.key as keyof typeof settings] as number}
                              onChange={(e) => handleInputChange(field.key, parseInt(e.target.value) || 0)}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              disabled={field.disabled}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="text"
                              value={settings[field.key as keyof typeof settings] as string}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              disabled={field.disabled}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
