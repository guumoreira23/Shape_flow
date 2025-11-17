import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { waterGoals } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const goal = await db.query.waterGoals.findFirst({
      where: (goals, { eq }) => eq(goals.userId, user.id),
    })

    if (!goal) {
      // Criar meta padrão se não existir
      const [newGoal] = await db
        .insert(waterGoals)
        .values({
          userId: user.id,
          targetAmount: 2000, // 2L por padrão
        })
        .returning()

      return NextResponse.json(newGoal)
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error("Water goals GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar meta de água" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { targetAmount } = body

    if (!targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: "Meta inválida" },
        { status: 400 }
      )
    }

    const existingGoal = await db.query.waterGoals.findFirst({
      where: (goals, { eq }) => eq(goals.userId, user.id),
    })

    if (existingGoal) {
      const [updatedGoal] = await db
        .update(waterGoals)
        .set({
          targetAmount: parseInt(targetAmount),
          updatedAt: new Date(),
        })
        .where(eq(waterGoals.id, existingGoal.id))
        .returning()

      return NextResponse.json(updatedGoal)
    }

    const [newGoal] = await db
      .insert(waterGoals)
      .values({
        userId: user.id,
        targetAmount: parseInt(targetAmount),
      })
      .returning()

    return NextResponse.json(newGoal)
  } catch (error) {
    console.error("Water goals PATCH error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar meta de água" },
      { status: 500 }
    )
  }
}

