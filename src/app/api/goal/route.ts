import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { goals, measurementTypes } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { createGoalSchema } from "@/lib/utils/zod"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = createGoalSchema.parse(body)

    const measureType = await db.query.measurementTypes.findFirst({
      where: (types, { eq, and }) =>
        and(
          eq(types.id, validatedData.measureTypeId),
          eq(types.userId, user.id)
        ),
    })

    if (!measureType) {
      return NextResponse.json(
        { error: "Tipo de medida não encontrado" },
        { status: 404 }
      )
    }

    const existingGoal = await db.query.goals.findFirst({
      where: (goals, { eq, and }) =>
        and(
          eq(goals.userId, user.id),
          eq(goals.measureTypeId, validatedData.measureTypeId)
        ),
    })

    const goalData: {
      targetValue: number
      deadline?: Date
      updatedAt: Date
    } = {
      targetValue: validatedData.targetValue,
      updatedAt: new Date(),
    }

    if (validatedData.deadline) {
      goalData.deadline = new Date(validatedData.deadline + "T00:00:00")
    }

    if (existingGoal) {
      const [updatedGoal] = await db
        .update(goals)
        .set(goalData)
        .where(eq(goals.id, existingGoal.id))
        .returning()

      return NextResponse.json(updatedGoal)
    }

    const [newGoal] = await db
      .insert(goals)
      .values({
        userId: user.id,
        measureTypeId: validatedData.measureTypeId,
        targetValue: validatedData.targetValue,
        deadline: goalData.deadline,
      })
      .returning()

    return NextResponse.json(newGoal)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Goal POST error:", error)
    return NextResponse.json(
      { error: "Erro ao salvar meta" },
      { status: 500 }
    )
  }
}

