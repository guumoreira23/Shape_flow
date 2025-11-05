"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatDateDisplay } from "@/lib/utils/date"
import { formatNumber } from "@/lib/utils/number"

interface DataPoint {
  date: string
  [key: string]: string | number | null
}

interface MultiLineChartProps {
  data: DataPoint[]
  lines: Array<{
    dataKey: string
    name: string
    color: string
    unit: string
  }>
}

export function MultiLineChart({ data, lines }: MultiLineChartProps) {
  const chartData = data.map((d) => ({
    date: formatDateDisplay(new Date(d.date + "T00:00:00")),
    ...Object.fromEntries(
      lines.map((line) => [line.dataKey, d[line.dataKey] ?? null])
    ),
  }))

  return (
    <div className="w-full h-[400px]">
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
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, r: 4 }}
              name={`${line.name} (${line.unit})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

