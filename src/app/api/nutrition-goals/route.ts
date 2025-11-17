import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { nutritionGoals } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const goal = await db.query.nutritionGoals.findFirst({
      where: (goals, { eq }) => eq(goals.userId, user.id),
    })

    if (!goal) {
      // Criar meta padrão se não existir
      const [newGoal] = await db
        .insert(nutritionGoals)
        .values({
          userId: user.id,
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 200,
          targetFat: 65,
        })
        .returning()

      return NextResponse.json(newGoal)
    }

    return NextResponse.json(goal)
  } catch (error: any) {
    console.error("Nutrition goals GET error:", error)
    if (error.status === 401 || error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao buscar metas nutricionais", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { targetCalories, targetProtein, targetCarbs, targetFat } = body

    const existingGoal = await db.query.nutritionGoals.findFirst({
      where: (goals, { eq }) => eq(goals.userId, user.id),
    })

    if (existingGoal) {
      const [updatedGoal] = await db
        .update(nutritionGoals)
        .set({
          targetCalories: targetCalories ? parseInt(targetCalories) : undefined,
          targetProtein: targetProtein ? parseFloat(targetProtein) : undefined,
          targetCarbs: targetCarbs ? parseFloat(targetCarbs) : undefined,
          targetFat: targetFat ? parseFloat(targetFat) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(nutritionGoals.id, existingGoal.id))
        .returning()

      return NextResponse.json(updatedGoal)
    }

    const [newGoal] = await db
      .insert(nutritionGoals)
      .values({
        userId: user.id,
        targetCalories: parseInt(targetCalories || 2000),
        targetProtein: parseFloat(targetProtein || 150),
        targetCarbs: parseFloat(targetCarbs || 200),
        targetFat: parseFloat(targetFat || 65),
      })
      .returning()

    return NextResponse.json(newGoal)
  } catch (error) {
    console.error("Nutrition goals PATCH error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar metas nutricionais" },
      { status: 500 }
    )
  }
}

