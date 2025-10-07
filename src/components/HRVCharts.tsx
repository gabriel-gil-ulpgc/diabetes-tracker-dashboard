'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { TrendingUp, Heart, Activity } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface HRVResult {
  result_id: string
  measure_id: string
  measured_timestamp: string
  daily_result: string
  user_id?: string
  user_name?: string
  result: {
    readiness: number
    recovery: number
    mean_hr_bpm: number
    rmssd_ms: number
    pns_index: number
    sns_index: number
    physiological_age: number
    respiratory_rate: number
    stress_index: number
    freq_domain: {
      HF_power: number
      LF_power: number
      VLF_power: number
      tot_power: number
    }
  }
}

interface HRVChartsProps {
  results: HRVResult[]
  selectedUser: string
}

export default function HRVCharts({ results, selectedUser }: HRVChartsProps) {
  const { t } = useLanguage()
  
  if (!results || results.length === 0) {
    return null
  }

  // Preparar datos para los gráficos (ordenados de más antiguo a más nuevo)
  const chartData = results
    .filter(result => result && result.result && result.measured_timestamp) // Filtrar datos válidos
    .sort((a, b) => new Date(a.measured_timestamp).getTime() - new Date(b.measured_timestamp).getTime())
    .map(result => ({
      date: new Date(result.measured_timestamp).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: result.measured_timestamp,
      userName: result.user_name || 'Usuario desconocido',
      userId: result.user_id || '',
      readiness: Math.max(0, result.result?.readiness || 0),
      rmssd: Math.max(0, result.result?.rmssd_ms || 0),
      pnsIndex: Math.max(0, result.result?.pns_index || 0),
      snsIndex: Math.max(0, result.result?.sns_index || 0),
      heartRate: Math.max(0, result.result?.mean_hr_bpm || 0),
      stressIndex: Math.max(0, result.result?.stress_index || 0),
      physiologicalAge: Math.max(0, result.result?.physiological_age || 0),
      respiratoryRate: Math.max(0, result.result?.respiratory_rate || 0),
      hfPower: Math.max(0, result.result?.freq_domain?.HF_power || 0),
      lfPower: Math.max(0, result.result?.freq_domain?.LF_power || 0),
      vlfPower: Math.max(0, result.result?.freq_domain?.VLF_power || 0)
    }))

  // Obtener usuarios únicos para las líneas
  const uniqueUsers = [...new Set(chartData.map(d => d.userName))].filter(Boolean)
  const userColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  // Calcular estadísticas usando los datos filtrados
  const validResults = results.filter(result => result && result.result && result.measured_timestamp)
  const avgReadiness = validResults.length > 0 ? validResults.reduce((sum, r) => sum + (r.result?.readiness || 0), 0) / validResults.length : 0
  const avgRMSSD = validResults.length > 0 ? validResults.reduce((sum, r) => sum + (r.result?.rmssd_ms || 0), 0) / validResults.length : 0
  const avgHeartRate = validResults.length > 0 ? validResults.reduce((sum, r) => sum + (r.result?.mean_hr_bpm || 0), 0) / validResults.length : 0

  // Si no hay datos válidos, no renderizar nada
  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 text-lg">No hay datos válidos para mostrar en los gráficos</p>
      </div>
    )
  }


  const getReadinessColor = (value: number) => {
    if (value >= 80) return '#10B981' // green
    if (value >= 60) return '#3B82F6' // blue
    if (value >= 40) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  return (
    <div className="space-y-12">
      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-400/50 transition-all duration-300">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t.kubios.charts.averageReadiness}</h3>
              <p className="text-sm text-slate-600">{t.kubios.charts.lastRecords.replace('{count}', validResults.length.toString())}</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {avgReadiness.toFixed(1)}%
          </p>
        </div>

        <div className="relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 hover:border-blue-400/50 transition-all duration-300">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t.kubios.charts.averageRmssd}</h3>
              <p className="text-sm text-slate-600">{t.kubios.charts.heartRateVariability}</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {avgRMSSD.toFixed(1)} ms
          </p>
        </div>

        <div className="relative bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t.kubios.charts.averageHeartRate}</h3>
              <p className="text-sm text-slate-600">{t.kubios.charts.heartRate}</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {avgHeartRate.toFixed(0)} bpm
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="space-y-[-24px]">
        {/* Gráfico de Readiness */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-0 hover:border-white/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-0">{t.kubios.charts.readinessEvolution}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.date, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.readinessPercentage, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(1)}%`, 
                  t.kubios.charts.averageReadiness
                ]}
                labelFormatter={(label, payload) => {
                  try {
                    if (payload && Array.isArray(payload) && payload.length > 0 && payload[0] && payload[0].payload) {
                      const data = payload[0].payload
                      return selectedUser === 'all' 
                        ? `${t.kubios.charts.date}: ${label} - Usuario: ${data.userName || 'Desconocido'}`
                        : `${t.kubios.charts.date}: ${label}`
                    }
                  } catch (error) {
                    console.warn('Error en labelFormatter:', error)
                  }
                  return `${t.kubios.charts.date}: ${label}`
                }}
              />
              {uniqueUsers.map((userName, index) => (
                <Line 
                  key={userName}
                  type="monotone" 
                  dataKey={(data) => data.userName === userName ? data.readiness : null}
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={3}
                  dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                  name={userName}
                  connectNulls={true}
                />
              ))}
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de RMSSD */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-0 hover:border-white/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-0">{t.kubios.charts.rmssdEvolution}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.date, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <YAxis 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.rmssdMs, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(1)} ms`, 
                  t.kubios.metrics.rmssd
                ]}
                labelFormatter={(label, payload) => {
                  try {
                    if (payload && Array.isArray(payload) && payload.length > 0 && payload[0] && payload[0].payload) {
                      const data = payload[0].payload
                      return selectedUser === 'all' 
                        ? `${t.kubios.charts.date}: ${label} - Usuario: ${data.userName || 'Desconocido'}`
                        : `${t.kubios.charts.date}: ${label}`
                    }
                  } catch (error) {
                    console.warn('Error en labelFormatter:', error)
                  }
                  return `${t.kubios.charts.date}: ${label}`
                }}
              />
              {uniqueUsers.map((userName, index) => (
                <Line 
                  key={userName}
                  type="monotone" 
                  dataKey={(data) => data.userName === userName ? data.rmssd : null}
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={3}
                  dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                  name={userName}
                  connectNulls={true}
                />
              ))}
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Índices PNS/SNS */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-0 hover:border-white/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-0">{t.kubios.charts.pnsSnsIndices}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.date, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <YAxis 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.pnsSnsIndicesLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(2)}`, 
                  name === 'pnsIndex' ? t.kubios.charts.pnsIndex : t.kubios.charts.snsIndex
                ]}
                labelFormatter={(label, payload) => {
                  try {
                    if (payload && Array.isArray(payload) && payload.length > 0 && payload[0] && payload[0].payload) {
                      const data = payload[0].payload
                      return selectedUser === 'all' 
                        ? `${t.kubios.charts.date}: ${label} - Usuario: ${data.userName || 'Desconocido'}`
                        : `${t.kubios.charts.date}: ${label}`
                    }
                  } catch (error) {
                    console.warn('Error en labelFormatter:', error)
                  }
                  return `${t.kubios.charts.date}: ${label}`
                }}
              />
              {uniqueUsers.map((userName, index) => (
                <Line 
                  key={`${userName}-pns`}
                  type="monotone" 
                  dataKey={(data) => data.userName === userName ? data.pnsIndex : null}
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={3}
                  dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                  name={`${userName} - PNS`}
                  connectNulls={true}
                  strokeDasharray="5 5"
                />
              ))}
              {uniqueUsers.map((userName, index) => (
                <Line 
                  key={`${userName}-sns`}
                  type="monotone" 
                  dataKey={(data) => data.userName === userName ? data.snsIndex : null}
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={3}
                  dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                  name={`${userName} - SNS`}
                  connectNulls={true}
                />
              ))}
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Frecuencia Cardíaca */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-0 hover:border-white/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-0">{t.kubios.charts.heartRateRest}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.date, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <YAxis 
                tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: t.kubios.charts.heartRateBpm, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(0)} bpm`, 
                  t.kubios.charts.heartRateRestLabel
                ]}
                labelFormatter={(label, payload) => {
                  try {
                    if (payload && Array.isArray(payload) && payload.length > 0 && payload[0] && payload[0].payload) {
                      const data = payload[0].payload
                      return selectedUser === 'all' 
                        ? `${t.kubios.charts.date}: ${label} - Usuario: ${data.userName || 'Desconocido'}`
                        : `${t.kubios.charts.date}: ${label}`
                    }
                  } catch (error) {
                    console.warn('Error en labelFormatter:', error)
                  }
                  return `${t.kubios.charts.date}: ${label}`
                }}
              />
              {uniqueUsers.map((userName, index) => (
                <Line 
                  key={userName}
                  type="monotone" 
                  dataKey={(data) => data.userName === userName ? data.heartRate : null}
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={3}
                  dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                  name={userName}
                  connectNulls={true}
                />
              ))}
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Dominio de Frecuencia */}
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-0 hover:border-white/30 transition-all duration-300 -mt-16">
        <h3 className="text-xl font-bold text-slate-800 mb-0">{t.kubios.charts.frequencyDomain}</h3>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              label={{ value: 'Fecha', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
            />
            <YAxis 
              tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 'bold' }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              label={{ value: t.kubios.charts.spectralPower, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#E5E7EB'
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(1)}`, 
                name === 'hfPower' ? t.kubios.charts.hfPower : 
                name === 'lfPower' ? t.kubios.charts.lfPower : t.kubios.charts.vlfPower
              ]}
              labelFormatter={(label, payload) => {
                try {
                  if (payload && Array.isArray(payload) && payload.length > 0 && payload[0] && payload[0].payload) {
                    const data = payload[0].payload
                    return selectedUser === 'all' 
                      ? `Fecha: ${label} - Usuario: ${data.userName || 'Desconocido'}`
                      : `Fecha: ${label}`
                  }
                } catch (error) {
                  console.warn('Error en labelFormatter:', error)
                }
                return `Fecha: ${label}`
              }}
            />
            {uniqueUsers.map((userName, index) => (
              <Line 
                key={`${userName}-hf`}
                type="monotone" 
                dataKey={(data) => data.userName === userName ? data.hfPower : null}
                stroke={userColors[index % userColors.length]}
                strokeWidth={3}
                dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                name={`${userName} - HF`}
                connectNulls={true}
              />
            ))}
            {uniqueUsers.map((userName, index) => (
              <Line 
                key={`${userName}-lf`}
                type="monotone" 
                dataKey={(data) => data.userName === userName ? data.lfPower : null}
                stroke={userColors[index % userColors.length]}
                strokeWidth={3}
                dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                name={`${userName} - LF`}
                connectNulls={true}
                strokeDasharray="5 5"
              />
            ))}
            {uniqueUsers.map((userName, index) => (
              <Line 
                key={`${userName}-vlf`}
                type="monotone" 
                dataKey={(data) => data.userName === userName ? data.vlfPower : null}
                stroke={userColors[index % userColors.length]}
                strokeWidth={3}
                dot={{ fill: userColors[index % userColors.length], strokeWidth: 2, r: 4 }}
                name={`${userName} - VLF`}
                connectNulls={true}
                strokeDasharray="10 5"
              />
            ))}
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px',
                color: '#374151'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
