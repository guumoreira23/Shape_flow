import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and, desc } from "drizzle-orm"
import { getTodayDate, formatDate } from "@/lib/utils/date"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const measures = await db.query.measurementTypes.findMany({
      where: (measurementTypes, { eq }) => eq(measurementTypes.userId, user.id),
      orderBy: (measurementTypes, { asc }) => [asc(measurementTypes.createdAt)],
    })

    const entries = await db.query.measurementEntries.findMany({
      where: (measurementEntries, { eq }) =>
        eq(measurementEntries.userId, user.id),
      orderBy: (measurementEntries, { desc }) => [desc(measurementEntries.date)],
      limit: 60,
    })

    const values = await db.query.measurementValues.findMany({
      where: (measurementValues, { inArray }) =>
        inArray(
          measurementValues.entryId,
          entries.map((e) => e.id)
        ),
    })

    const userGoals = await db.query.goals.findMany({
      where: (goals, { eq }) => eq(goals.userId, user.id),
    })

    const today = formatDate(getTodayDate())

    return NextResponse.json({
      measures,
      entries: entries.map((e) => ({
        ...e,
        date: formatDate(e.date),
      })),
      values,
      goals: userGoals,
      today,
    })
  } catch (error) {
    console.error("Tracker GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    )
  }
}

