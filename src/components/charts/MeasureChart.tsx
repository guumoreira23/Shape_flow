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
              label={{ value: `Meta: ${targetValue}`, fill: "#ef4444" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {targetValue && (
        <div className="mt-4 text-center">
          <span className="text-sm text-slate-400">
            Meta atual: <span className="text-red-400 font-medium">{targetValue} {unit}</span>
          </span>
        </div>
      )}
    </div>
  )
}

