import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { mealEntries, mealFoods, foodItems } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and } from "drizzle-orm"

// Buscar refeições do usuário
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") // Formato: YYYY-MM-DD

    let entries
    if (date) {
      const startDate = new Date(date + "T00:00:00")
      const endDate = new Date(date + "T23:59:59")
      entries = await db.query.mealEntries.findMany({
        where: (entries, { eq, and, gte, lte }) =>
          and(
            eq(entries.userId, user.id),
            gte(entries.date, startDate),
            lte(entries.date, endDate)
          ),
        orderBy: (entries, { asc }) => [asc(entries.date)],
      })
    } else {
      entries = await db.query.mealEntries.findMany({
        where: (entries, { eq }) => eq(entries.userId, user.id),
        orderBy: (entries, { desc }) => [desc(entries.date)],
        limit: 100,
      })
    }

    // Buscar alimentos de cada refeição
    const entriesWithFoods = await Promise.all(
      entries.map(async (entry) => {
        const foods = await db.query.mealFoods.findMany({
          where: (foods, { eq }) => eq(foods.mealEntryId, entry.id),
        })

        const foodsWithDetails = await Promise.all(
          foods.map(async (mealFood) => {
            const foodItem = await db.query.foodItems.findFirst({
              where: (items, { eq }) => eq(items.id, mealFood.foodItemId),
            })

            if (!foodItem) {
              // Se não encontrou no banco, pode ser do JSON (id começa com "json-")
              return null
            }

            const quantity = Number(mealFood.quantity)
            const ratio = quantity / (foodItem.servingSize || 100)

            return {
              id: mealFood.id,
              foodItemId: mealFood.foodItemId,
              foodName: foodItem.name,
              quantity,
              unit: foodItem.unit || "g",
              calories: Math.round(foodItem.calories * ratio),
              protein: Number((foodItem.protein * ratio).toFixed(1)),
              carbs: Number((foodItem.carbs * ratio).toFixed(1)),
              fat: Number((foodItem.fat * ratio).toFixed(1)),
              fiber: Number(((foodItem.fiber || 0) * ratio).toFixed(1)),
            }
          })
        )

        const validFoods = foodsWithDetails.filter((f): f is NonNullable<typeof f> => f !== null)

        const totals = validFoods.reduce(
          (acc, food) => ({
            calories: acc.calories + food.calories,
            protein: acc.protein + food.protein,
            carbs: acc.carbs + food.carbs,
            fat: acc.fat + food.fat,
            fiber: acc.fiber + food.fiber,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        )

        return {
          id: entry.id,
          date: entry.date.toISOString().split("T")[0],
          mealType: entry.mealType,
          foods: validFoods,
          totals,
        }
      })
    )

    return NextResponse.json(entriesWithFoods)
  } catch (error) {
    console.error("Meals GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar refeições" },
      { status: 500 }
    )
  }
}

// Criar nova refeição
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { date, mealType, foods } = body

    if (!date || !mealType || !Array.isArray(foods) || foods.length === 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios: date, mealType, foods[]" },
        { status: 400 }
      )
    }

    const mealDate = new Date(date + "T12:00:00")

    // Verificar se já existe refeição para esta data/tipo
    const existingEntry = await db.query.mealEntries.findFirst({
      where: (entries, { eq, and }) =>
        and(
          eq(entries.userId, user.id),
          eq(entries.date, mealDate),
          eq(entries.mealType, mealType)
        ),
    })

    let mealEntryId: number

    if (existingEntry) {
      mealEntryId = existingEntry.id
      // Limpar alimentos existentes
      await db.delete(mealFoods).where(eq(mealFoods.mealEntryId, mealEntryId))
    } else {
      const [newEntry] = await db
        .insert(mealEntries)
        .values({
          userId: user.id,
          date: mealDate,
          mealType,
        })
        .returning()
      mealEntryId = newEntry.id
    }

    // Adicionar alimentos (apenas os que têm ID numérico - do banco de dados)
    const validFoods = foods.filter((f: any) => typeof f.foodItemId === "number")
    
    if (validFoods.length > 0) {
      await db.insert(mealFoods).values(
        validFoods.map((food: any) => ({
          mealEntryId,
          foodItemId: food.foodItemId,
          quantity: parseFloat(food.quantity || 100),
        }))
      )
    }

    return NextResponse.json({ success: true, mealEntryId }, { status: 201 })
  } catch (error) {
    console.error("Meals POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar refeição" },
      { status: 500 }
    )
  }
}

