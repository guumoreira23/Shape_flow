"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts"
import { formatDateDisplay } from "@/lib/utils/date"
import { formatNumber } from "@/lib/utils/number"

interface DataPoint {
  date: string
  value: number
}

interface MeasureChartProps {
  data: DataPoint[]
  measureName: string
  unit: string
  targetValue?: number
  onGoalChange: (value: number) => void
}

export function MeasureChart({
  data,
  measureName,
  unit,
  targetValue,
  onGoalChange,
}: MeasureChartProps) {
  const chartData = data.map((d) => ({
    date: formatDateDisplay(new Date(d.date + "T00:00:00")),
    value: d.value,
  }))

  // Calcular progresso em relação à meta
  const calculateProgress = () => {
    if (!targetValue || data.length === 0) return null
    
    const latestValue = data[data.length - 1]?.value
    if (!latestValue) return null

    // Para medidas onde menor é melhor (ex: peso), progresso é inverso
    const firstValue = data[0]?.value
    const isDecreasing = firstValue && latestValue < firstValue
    
    if (isDecreasing) {
      // Para peso (diminuir), progresso = quanto já perdeu / quanto precisa perder
      const totalToLose = firstValue - targetValue
      const alreadyLost = firstValue - latestValue
      if (totalToLose <= 0) return 100
      return Math.min(100, Math.max(0, (alreadyLost / totalToLose) * 100))
    } else {
      // Para medidas onde maior é melhor (ex: massa muscular)
      const totalToGain = targetValue - firstValue
      const alreadyGained = latestValue - firstValue
      if (totalToGain <= 0) return latestValue >= targetValue ? 100 : 0
      return Math.min(100, Math.max(0, (alreadyGained / totalToGain) * 100))
    }
  }

  const progress = calculateProgress()
  const latestValue = data.length > 0 ? data[data.length - 1]?.value : null

  return (
    <div className="w-full h-[400px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{
              value: unit,
              angle: -90,
              position: "insideLeft",
              fill: "#94a3b8",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => formatNumber(value, 0)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            name={measureName}
          />
          {targetValue && (
            <ReferenceLine
              y={targetValue}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `Meta: ${targetValue} ${unit}`, fill: "#ef4444", position: "right" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {targetValue && (
        <div className="mt-4 space-y-2">
          <div className="text-center">
            <span className="text-sm text-slate-400">
              Meta: <span className="text-red-400 font-medium">{targetValue} {unit}</span>
              {latestValue !== null && (
                <>
                  {" • "}
                  Valor atual: <span className="text-blue-400 font-medium">{formatNumber(latestValue, 0)} {unit}</span>
                </>
              )}
            </span>
          </div>
          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progresso em relação à meta</span>
                <span className="font-medium">{formatNumber(progress, 1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

