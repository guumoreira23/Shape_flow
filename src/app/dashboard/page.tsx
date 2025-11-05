import { requireAuth } from "@/lib/auth/middleware"
import { isAdmin } from "@/lib/auth/permissions"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Shield, ArrowRight } from "lucide-react"
import { formatNumber } from "@/lib/utils/number"
import { formatDateDisplay, formatDate } from "@/lib/utils/date"
import { WeightChart } from "@/components/charts/WeightChart"
import { MultiLineChart } from "@/components/charts/MultiLineChart"
import { MainLayout } from "@/components/layout/MainLayout"

export default async function DashboardPage() {
  const { user } = await requireAuth()
  const userIsAdmin = await isAdmin()

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

  // Calcular diferença entre valor atual e meta
  const getDifference = (measureId: number, goalValue: number | undefined) => {
    if (!goalValue) return null
    const currentValue = getLatestValue(measureId)
    if (currentValue === null) return null
    const diff = currentValue - goalValue
    return diff
  }

  const weightDifference = weightMeasure && weightGoal
    ? getDifference(weightMeasure.id, weightGoal.targetValue)
    : null

  const waistGoal = waistMeasure
    ? userGoals.find((g) => g.measureTypeId === waistMeasure.id)
    : null

  const waistDifference = waistMeasure && waistGoal
    ? getDifference(waistMeasure.id, waistGoal.targetValue)
    : null

  // Preparar dados para gráfico múltiplo (Peso e Cintura)
  const multiChartData = entries
    .slice(-30) // Últimos 30 dias
    .map((entry) => {
      const weightValue = values.find(
        (v) => v.entryId === entry.id && weightMeasure && v.measureTypeId === weightMeasure.id
      )
      const waistValue = values.find(
        (v) => v.entryId === entry.id && waistMeasure && v.measureTypeId === waistMeasure.id
      )
      return {
        date: formatDate(entry.date),
        peso: weightValue ? weightValue.value : null,
        cintura: waistValue ? waistValue.value : null,
      }
    })
    .filter((d) => d.peso !== null || d.cintura !== null)

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Bem-vindo de volta, {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Último Peso</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {weightMeasure && getLatestValue(weightMeasure.id)
                ? `${formatNumber(getLatestValue(weightMeasure.id)!)} ${weightMeasure.unit}`
                : "N/A"}
            </p>
            {weightGoal && weightMeasure && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-minimal-muted">
                  Meta: <span className="text-blue-400 font-medium">{weightGoal.targetValue} {weightMeasure.unit}</span>
                </p>
                {weightDifference !== null && (
                  <p className={`text-sm font-medium ${
                    weightDifference > 0 ? "text-red-400" : weightDifference < 0 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {weightDifference > 0 ? "+" : ""}{formatNumber(weightDifference)} {weightMeasure.unit}
                    {weightDifference > 0 ? " acima da meta" : weightDifference < 0 ? " abaixo da meta" : " na meta"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Última Cintura</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {waistMeasure && getLatestValue(waistMeasure.id)
                ? `${formatNumber(getLatestValue(waistMeasure.id)!)} ${waistMeasure.unit}`
                : "N/A"}
            </p>
            {waistGoal && waistMeasure && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-minimal-muted">
                  Meta: <span className="text-blue-400 font-medium">{waistGoal.targetValue} {waistMeasure.unit}</span>
                </p>
                {waistDifference !== null && (
                  <p className={`text-sm font-medium ${
                    waistDifference > 0 ? "text-red-400" : waistDifference < 0 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {waistDifference > 0 ? "+" : ""}{formatNumber(waistDifference)} {waistMeasure.unit}
                    {waistDifference > 0 ? " acima da meta" : waistDifference < 0 ? " abaixo da meta" : " na meta"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Total de Lançamentos</h3>
            <p className="text-3xl font-semibold text-white">{entries.length}</p>
            <p className="text-sm text-minimal-muted mt-2">Registros totais</p>
          </div>
        </div>

        {weightData.length > 0 && (
          <div className="card-minimal p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Evolução do Peso
                </h2>
                <p className="text-sm text-minimal-muted">Últimos 7 dias</p>
              </div>
            </div>
            <WeightChart data={weightData} goal={weightGoal?.targetValue} />
          </div>
        )}

        {multiChartData.length > 0 && weightMeasure && waistMeasure && (
          <div className="card-minimal p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Comparativo Peso e Cintura
                </h2>
                <p className="text-sm text-minimal-muted">Últimos 30 dias</p>
              </div>
            </div>
            <MultiLineChart
              data={multiChartData}
              lines={[
                {
                  dataKey: "peso",
                  name: "Peso",
                  color: "#3b82f6",
                  unit: weightMeasure.unit,
                },
                {
                  dataKey: "cintura",
                  name: "Cintura",
                  color: "#10b981",
                  unit: waistMeasure.unit,
                },
              ]}
            />
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/tracker">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Gerenciar Medidas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {userIsAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Painel Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

