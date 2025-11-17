import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { fastingSchedules } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and } from "drizzle-orm"

const FASTING_TYPES = {
  "16:8": { fastingHours: 16, eatingHours: 8 },
  "14:10": { fastingHours: 14, eatingHours: 10 },
  "18:6": { fastingHours: 18, eatingHours: 6 },
  "20:4": { fastingHours: 20, eatingHours: 4 },
  "12:12": { fastingHours: 12, eatingHours: 12 },
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const schedules = await db.query.fastingSchedules.findMany({
      where: (schedules, { eq }) => eq(schedules.userId, user.id),
      orderBy: (schedules, { desc }) => [desc(schedules.createdAt)],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Fasting GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar jejuns" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { fastingType, startTime } = body

    if (!fastingType || !startTime) {
      return NextResponse.json(
        { error: "Tipo de jejum e horário de início são obrigatórios" },
        { status: 400 }
      )
    }

    // Desativar jejuns ativos anteriores
    const activeSchedules = await db.query.fastingSchedules.findMany({
      where: (schedules, { eq, and }) =>
        and(eq(schedules.userId, user.id), eq(schedules.isActive, 1)),
    })

    for (const schedule of activeSchedules) {
      await db
        .update(fastingSchedules)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(fastingSchedules.id, schedule.id))
    }

    const start = new Date(startTime)
    let end: Date

    if (fastingType === "custom") {
      if (!body.endTime) {
        return NextResponse.json(
          { error: "Horário de fim é obrigatório para jejum customizado" },
          { status: 400 }
        )
      }
      end = new Date(body.endTime)
    } else {
      const config = FASTING_TYPES[fastingType as keyof typeof FASTING_TYPES]
      if (!config) {
        return NextResponse.json(
          { error: "Tipo de jejum inválido" },
          { status: 400 }
        )
      }
      end = new Date(start)
      end.setHours(end.getHours() + config.fastingHours)
    }

    const [newSchedule] = await db
      .insert(fastingSchedules)
      .values({
        userId: user.id,
        fastingType,
        startTime: start,
        endTime: end,
        isActive: 1,
      })
      .returning()

    return NextResponse.json(newSchedule, { status: 201 })
  } catch (error) {
    console.error("Fasting POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar jejum" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido" },
        { status: 400 }
      )
    }

    const schedule = await db.query.fastingSchedules.findFirst({
      where: (schedules, { eq, and }) =>
        and(eq(schedules.id, parseInt(id)), eq(schedules.userId, user.id)),
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Jejum não encontrado" },
        { status: 404 }
      )
    }

    const updateData: any = { updatedAt: new Date() }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive ? 1 : 0
    }

    const [updatedSchedule] = await db
      .update(fastingSchedules)
      .set(updateData)
      .where(eq(fastingSchedules.id, schedule.id))
      .returning()

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error("Fasting PATCH error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar jejum" },
      { status: 500 }
    )
  }
}

