import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/middleware"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { MeasureChartClient } from "./MeasureChartClient"

export default async function MeasureDetailPage({
  params,
}: {
  params: Promise<{ measureId: string }>
}) {
  const { user } = await requireAuth()
  const { measureId } = await params
  const id = parseInt(measureId, 10)

  if (isNaN(id)) {
    redirect("/tracker")
  }

  const measure = await db.query.measurementTypes.findFirst({
    where: (types, { eq, and }) =>
      and(eq(types.id, id), eq(types.userId, user.id)),
  })

  if (!measure) {
    redirect("/tracker")
  }

  const entries = await db.query.measurementEntries.findMany({
    where: (entries, { eq }) => eq(entries.userId, user.id),
    orderBy: (entries, { asc }) => [asc(entries.date)],
  })

  const values = await db.query.measurementValues.findMany({
    where: (values, { inArray, eq, and }) =>
      and(
        inArray(values.entryId, entries.map((e) => e.id)),
        eq(values.measureTypeId, id)
      ),
  })

  const goal = await db.query.goals.findFirst({
    where: (goals, { eq, and }) =>
      and(eq(goals.userId, user.id), eq(goals.measureTypeId, id)),
  })

  const chartData = entries
    .map((entry) => {
      const value = values.find((v) => v.entryId === entry.id)
      return value
        ? {
            date: entry.date.toISOString().split("T")[0],
            value: value.value,
          }
        : null
    })
    .filter((d): d is { date: string; value: number } => d !== null)

  return (
    <MeasureChartClient
      measure={measure}
      data={chartData}
      goal={goal}
      measureId={id}
    />
  )
}

