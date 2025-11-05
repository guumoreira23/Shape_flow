import { requireAuth } from "@/lib/auth/middleware"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, TrendingUp } from "lucide-react"
import { formatNumber } from "@/lib/utils/number"
import { formatDateDisplay } from "@/lib/utils/date"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default async function DashboardPage() {
  const { user } = await requireAuth()

  const measures = await db.query.measurementTypes.findMany({
    where: (types, { eq }) => eq(types.userId, user.id),
    orderBy: (types, { desc }) => [desc(types.createdAt)],
  })

  const entries = await db.query.measurementEntries.findMany({
    where: (entries, { eq }) => eq(entries.userId, user.id),
    orderBy: (entries, { desc }) => [desc(entries.date)],
    limit: 30,
  })

  const values = await db.query.measurementValues.findMany({
    where: (values, { inArray }) =>
      inArray(
        values.entryId,
        entries.map((e) => e.id)
      ),
  })

  const userGoals = await db.query.goals.findMany({
    where: (goals, { eq }) => eq(goals.userId, user.id),
  })

  const weightMeasure = measures.find((m) => m.name.toLowerCase().includes("peso"))
  const waistMeasure = measures.find((m) => m.name.toLowerCase().includes("cintura"))

  const getLatestValue = (measureId: number) => {
    const measureValues = values.filter((v) => v.measureTypeId === measureId)
    if (measureValues.length === 0) return null
    const entryIds = measureValues.map((v) => v.entryId)
    const latestEntry = entries.find((e) => entryIds.includes(e.id))
    if (!latestEntry) return null
    const latestValue = measureValues.find((v) => v.entryId === latestEntry.id)
    return latestValue?.value || null
  }

  const weightData = weightMeasure
    ? entries
        .map((entry) => {
          const value = values.find(
            (v) => v.entryId === entry.id && v.measureTypeId === weightMeasure.id
          )
          return value
            ? {
                date: formatDateDisplay(entry.date),
                value: value.value,
              }
            : null
        })
        .filter((d): d is { date: string; value: number } => d !== null)
        .slice(-7)
    : []

  const weightGoal = weightMeasure
    ? userGoals.find((g) => g.measureTypeId === weightMeasure.id)
    : null

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm text-slate-400 mb-2">Último Peso</h3>
            <p className="text-2xl font-bold text-white">
              {weightMeasure && getLatestValue(weightMeasure.id)
                ? `${formatNumber(getLatestValue(weightMeasure.id)!)} ${weightMeasure.unit}`
                : "N/A"}
            </p>
            {weightGoal && weightMeasure && (
              <p className="text-xs text-slate-500 mt-1">
                Meta: {weightGoal.targetValue} {weightMeasure.unit}
              </p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm text-slate-400 mb-2">Última Cintura</h3>
            <p className="text-2xl font-bold text-white">
              {waistMeasure && getLatestValue(waistMeasure.id)
                ? `${formatNumber(getLatestValue(waistMeasure.id)!)} ${waistMeasure.unit}`
                : "N/A"}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm text-slate-400 mb-2">Total de Lançamentos</h3>
            <p className="text-2xl font-bold text-white">{entries.length}</p>
          </div>
        </div>

        {weightData.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Peso (últimos 7 dias)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                  {weightGoal && (
                    <Line
                      type="monotone"
                      dataKey={() => weightGoal.targetValue}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/tracker">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Medidas
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

