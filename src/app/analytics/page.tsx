'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, User, InsulinData, FoodData, ExerciseData, PeriodRecord, MoodData } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Activity, Heart, Calendar, User as UserIcon, Filter, Pill, Utensils, Dumbbell, CalendarDays, Smile, Clock, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import HybridProtectedRoute from '@/components/HybridProtectedRoute'
import HybridNavigation from '@/components/HybridNavigation'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [insulinData, setInsulinData] = useState<InsulinData[]>([])
  const [foodData, setFoodData] = useState<FoodData[]>([])
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([])
  const [periodData, setPeriodData] = useState<PeriodRecord[]>([])
  const [moodData, setMoodData] = useState<MoodData[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [selectedDataType, setSelectedDataType] = useState<string>('all')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Construir parámetros para la API
      const params = new URLSearchParams({
        selectedUser,
        timeRange,
        selectedDataType
      })

      // Llamar al endpoint que descifra los datos
      const response = await fetch(`/api/decrypted-data?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener datos descifrados')
      }

      const data = await response.json()
      
      // Los datos ya vienen descifrados del servidor
      setInsulinData(data.insulinData || [])
      setFoodData(data.foodData || [])
      setExerciseData(data.exerciseData || [])
      setPeriodData(data.periodData || [])
      setMoodData(data.moodData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedUser, timeRange, selectedDataType])

  const fetchUsers = useCallback(async () => {
    try {
      const { data: result, error } = await supabase
        .from('users')
        .select('*')
        .order('Username')

      if (error) throw error
      setUsers(result || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchUsers()
  }, [fetchData, fetchUsers])

  // Función para agrupar datos por fecha
  const groupDataByDate = (data: any[], dateField: string = 'date_time') => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = { date, count: 0 }
      }
      acc[date].count++
      return acc
    }, {})

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }

  // Función para agrupar datos por tipo
  const groupDataByType = (data: any[], typeField: string) => {
    const grouped = data.reduce((acc, item) => {
      const type = item[typeField] || 'Sin especificar'
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {})

    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }

  // Estadísticas generales
  const stats = {
    totalInsulin: insulinData.length,
    totalFood: foodData.length,
    totalExercise: exerciseData.length,
    totalPeriods: periodData.length,
    totalMood: moodData.length,
    totalRecords: insulinData.length + foodData.length + exerciseData.length + periodData.length + moodData.length,
    
    // Promedios de dosis de insulina
    avgInsulinDose: insulinData.length > 0 
      ? Math.round(insulinData.reduce((sum, item) => sum + parseFloat(item.dose || '0'), 0) / insulinData.length * 10) / 10 
      : 0,
    
    // Promedio de carbohidratos
    avgCarbs: foodData.length > 0 
      ? Math.round(foodData.reduce((sum, item) => sum + parseFloat(item.carbs || '0'), 0) / foodData.length * 10) / 10 
      : 0,
    
    // Promedio de estado de ánimo
    avgMood: moodData.length > 0 
      ? Math.round(moodData.reduce((sum, item) => sum + parseFloat(item.mood_value || '0'), 0) / moodData.length * 10) / 10 
      : 0,
    
    // Última actividad
    lastActivity: null as Date | null
  }

  // Encontrar la actividad más reciente
  const allDates = [
    ...insulinData.map(d => new Date(d.date_time)),
    ...foodData.map(d => new Date(d.date_time)),
    ...exerciseData.map(d => new Date(d.date_time)),
    ...periodData.map(d => new Date(d.startDate)),
    ...moodData.map(d => new Date(d.date_time))
  ]

  if (allDates.length > 0) {
    stats.lastActivity = new Date(Math.max(...allDates.map(d => d.getTime())))
  }

  // Datos para gráficos
  const insulinByDate = groupDataByDate(insulinData)
  const foodByDate = groupDataByDate(foodData)
  const exerciseByDate = groupDataByDate(exerciseData)
  const moodByDate = groupDataByDate(moodData)

  const insulinByType = groupDataByType(insulinData, 'insulinType')
  const foodByType = groupDataByType(foodData, 'food_type')
  const exerciseByType = groupDataByType(exerciseData, 'exercise_type')
  const moodByValue = groupDataByType(moodData, 'mood_value')

  // Datos combinados para gráfico de actividad general
  const activityData = [...insulinByDate, ...foodByDate, ...exerciseByDate, ...moodByDate].reduce((acc, item) => {
    const existing = acc.find(x => x.date === item.date)
    if (existing) {
      existing.count += item.count
    } else {
      acc.push({ ...item })
    }
    return acc
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Colores para gráficos
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  return (
    <HybridProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <HybridNavigation title={t.dashboard.advancedAnalytics} showBackButton={true} />
        
        {/* Selector de idioma */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSelector />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start mb-6">
                  <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                    <BarChart3 className="h-12 w-12 text-white" />
                  </div>
                  <div className="ml-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                      {t.dashboard.advancedAnalytics}
                    </h1>
                    <p className="text-gray-600 text-xl font-light">{t.dashboard.advancedAnalyticsDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{t.dashboard.dataFilters}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {t.dashboard.user}
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-lg hover:border-slate-400 transition-all duration-300 cursor-pointer appearance-none bg-gradient-to-r from-slate-50 to-blue-50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="all" className="bg-white text-slate-700 py-2">{t.dashboard.allUsers}</option>
                    {users.map(user => (
                      <option key={user.UserID} value={user.Username} className="bg-white text-slate-700">
                        {user.Username}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    {t.dashboard.dataType}
                  </label>
                  <select
                    value={selectedDataType}
                    onChange={(e) => setSelectedDataType(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-lg hover:border-slate-400 transition-all duration-300 cursor-pointer appearance-none bg-gradient-to-r from-slate-50 to-blue-50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="all" className="bg-white text-slate-700 py-2">{t.dashboard.allTypes}</option>
                    <option value="insulin" className="bg-white text-slate-700">{t.dashboard.insulin}</option>
                    <option value="food" className="bg-white text-slate-700">{t.dashboard.meals}</option>
                    <option value="exercise" className="bg-white text-slate-700">{t.dashboard.exercise}</option>
                    <option value="period" className="bg-white text-slate-700">{t.dashboard.periods}</option>
                    <option value="mood" className="bg-white text-slate-700">{t.dashboard.mood}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {t.dashboard.timeRange}
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-lg hover:border-slate-400 transition-all duration-300 cursor-pointer appearance-none bg-gradient-to-r from-slate-50 to-blue-50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="7d" className="bg-white text-slate-700 py-2">{t.data.last7Days}</option>
                    <option value="30d" className="bg-white text-slate-700">{t.data.last30Days}</option>
                    <option value="90d" className="bg-white text-slate-700">{t.data.last90Days}</option>
                    <option value="all" className="bg-white text-slate-700">{t.dashboard.allTime}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                    <Pill className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t.dashboard.insulin}</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalInsulin}</p>
                  <p className="text-sm text-slate-600">Promedio: {stats.avgInsulinDose} unidades</p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-green-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.meals}</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.totalFood}</p>
                  <p className="text-sm text-slate-600">Promedio: {stats.avgCarbs} carbohidratos</p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.exercise}</h3>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalExercise}</p>
                  <p className="text-sm text-slate-600">Sesiones registradas</p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-pink-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                    <Smile className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.mood}</h3>
                  <p className="text-3xl font-bold text-pink-600">{stats.totalMood}</p>
                  <p className="text-sm text-slate-600">Promedio: {stats.avgMood}/10</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.periods}</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalPeriods}</p>
                  <p className="text-sm text-slate-600">Registros de ciclo</p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-indigo-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.total}</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalRecords}</p>
                  <p className="text-sm text-slate-600">Todos los tipos</p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">{t.dashboard.lastActivity}</h3>
                  <p className="text-xl font-bold text-red-600">
                    {stats.lastActivity ? 
                      new Date(stats.lastActivity).toLocaleDateString('es-ES') : 
                      'N/A'
                    }
                  </p>
                  <p className="text-sm text-slate-600">Fecha más reciente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          {loading ? (
            <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-12 text-center shadow-xl">
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-700 text-lg font-medium">{t.dashboard.loadingData}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Gráfico de actividad general */}
              <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                      <LineChartIcon className="h-5 w-5 text-white" />
                    </div>
                    Actividad General por Fecha
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '12px',
                          color: '#1e293b',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#1e293b' }}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráficos por tipo de dato */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Insulina por tipo */}
                {insulinByType.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        Tipos de Insulina Utilizados
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra qué tipos de insulina se usan más frecuentemente. 
                        <strong className="text-blue-600"> Cada sector:</strong> Porcentaje de uso de cada tipo
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={insulinByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {insulinByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} inyecciones`, 
                              'Tipo de Insulina'
                            ]}
                            labelFormatter={(label) => `Tipo: ${label}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Comidas por tipo */}
                {foodByType.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-3">
                          <Utensils className="h-5 w-5 text-white" />
                        </div>
                        Tipos de Comida Registrados
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra qué tipos de comida se registran más frecuentemente. 
                        <strong className="text-green-600"> Eje X:</strong> Tipos de comida | 
                        <strong className="text-green-600"> Eje Y:</strong> Número de registros
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={foodByType}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Tipos de Comida', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Registros', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            itemStyle={{ color: 'white' }}
                            labelStyle={{ color: 'white' }}
                            formatter={(value, name) => [
                              `${value} registros`, 
                              'Tipo de Comida'
                            ]}
                            labelFormatter={(label) => `Tipo: ${label}`}
                          />
                          <Bar dataKey="value" fill="#10B981" name="Registros de Comida" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Promedio de dosis de insulina por día */}
                {insulinByDate.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        Promedio de Dosis de Insulina por Día
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra la cantidad promedio de insulina administrada cada día. 
                        <strong className="text-blue-600"> Eje X:</strong> Fechas | 
                        <strong className="text-blue-600"> Eje Y:</strong> Número de inyecciones
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={insulinByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Fechas', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Inyecciones', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} inyecciones`, 
                              'Cantidad'
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Bar dataKey="count" fill="#3B82F6" name="Inyecciones de Insulina" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tendencias de Estado de Ánimo */}
                {moodByValue.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg mr-3">
                          <Smile className="h-5 w-5 text-white" />
                        </div>
                        Distribución de Estado de Ánimo
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra qué tan frecuente es cada nivel de estado de ánimo (0=Muy triste, 10=Muy feliz). 
                        <strong className="text-pink-600"> Cada sector:</strong> Porcentaje de registros con ese nivel
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={moodByValue}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}/10 ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {moodByValue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} registros`, 
                              'Estado de Ánimo'
                            ]}
                            labelFormatter={(label) => `Nivel: ${label}/10`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Gráficos de evolución temporal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Correlación Insulina vs Carbohidratos */}
                {insulinData.length > 0 && foodData.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg mr-3">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        Evolución de Registros de Insulina
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra cuántas inyecciones de insulina se registraron cada día. 
                        <strong className="text-blue-600"> Eje X:</strong> Fechas | 
                        <strong className="text-blue-600"> Eje Y:</strong> Número de inyecciones
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={insulinByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Fechas', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Inyecciones', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} inyecciones`, 
                              'Insulina'
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Inyecciones de Insulina" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Patrones de Actividad Diaria */}
                {foodByDate.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        Evolución de Registros de Comidas
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra cuántas comidas se registraron cada día. 
                        <strong className="text-green-400"> Eje X:</strong> Fechas | 
                        <strong className="text-green-400"> Eje Y:</strong> Número de comidas
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={foodByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Fechas', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Comidas', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} comidas`, 
                              'Registros'
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Comidas Registradas" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tendencias de Ejercicio */}
                {exerciseByDate.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg mr-3">
                          <Dumbbell className="h-5 w-5 text-white" />
                        </div>
                        Evolución de Registros de Ejercicio
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra cuántas sesiones de ejercicio se registraron cada día. 
                        <strong className="text-orange-600"> Eje X:</strong> Fechas | 
                        <strong className="text-orange-600"> Eje Y:</strong> Número de sesiones
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={exerciseByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Fechas', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Sesiones', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} sesiones`, 
                              'Ejercicio'
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} name="Sesiones de Ejercicio" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Bienestar Emocional */}
                {moodByDate.length > 0 && (
                  <div className="relative bg-white/90 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-8 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg mr-3">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        Evolución de Registros de Estado de Ánimo
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Muestra cuántos registros de estado de ánimo se hicieron cada día. 
                        <strong className="text-pink-600"> Eje X:</strong> Fechas | 
                        <strong className="text-pink-600"> Eje Y:</strong> Número de registros
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={moodByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Fechas', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            label={{ value: 'Número de Registros', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '12px',
                              color: '#1e293b',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            labelStyle={{ color: '#1e293b' }}
                            formatter={(value, name) => [
                              `${value} registros`, 
                              'Estado de Ánimo'
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Line type="monotone" dataKey="count" stroke="#EC4899" strokeWidth={2} name="Registros de Estado de Ánimo" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </HybridProtectedRoute>
  )
} 