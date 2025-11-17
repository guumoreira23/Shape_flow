import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { foodItems } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { ilike, or } from "drizzle-orm"
import foodDatabaseData from "@/data/foodDatabase.json"

// Converter para array tipado
const foodDatabase = foodDatabaseData as Array<{
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  servingSize?: number
  unit?: string
}>

// Buscar alimentos do banco de dados ou do JSON estático
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Buscar no banco de dados
    const dbFoods = await db.query.foodItems.findMany({
      where: search
        ? or(
            ilike(foodItems.name, `%${search}%`),
            ilike(foodItems.brand, `%${search}%`)
          )
        : undefined,
      limit: 50,
    })

    // Buscar no JSON estático se não encontrou no banco ou se não há busca específica
    const jsonFoods = search
      ? foodDatabase.filter(
          (food: any) =>
            food.name.toLowerCase().includes(search.toLowerCase())
        )
      : foodDatabase

    // Combinar resultados (priorizar banco de dados)
    const allFoods = [
      ...dbFoods.map((f) => ({
        id: f.id,
        name: f.name,
        brand: f.brand || null,
        barcode: f.barcode || null,
        calories: f.calories,
        protein: Number(f.protein),
        carbs: Number(f.carbs),
        fat: Number(f.fat),
        fiber: Number(f.fiber || 0),
        servingSize: f.servingSize || 100,
        unit: f.unit || "g",
      })),
      ...jsonFoods
        .filter(
          (jsonFood: any) =>
            !dbFoods.some((dbFood) => dbFood.name.toLowerCase() === jsonFood.name.toLowerCase())
        )
        .map((food: any, index: number) => ({
          id: `json-${index}`,
          name: food.name,
          brand: null,
          barcode: null,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber || 0,
          servingSize: food.servingSize || 100,
          unit: food.unit || "g",
        })),
    ]

    return NextResponse.json(allFoods.slice(0, 50))
  } catch (error) {
    console.error("Foods GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar alimentos" },
      { status: 500 }
    )
  }
}

// Criar novo alimento no banco de dados
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { name, brand, barcode, calories, protein, carbs, fat, fiber, servingSize, unit } = body

    if (!name || !calories || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, calories, protein, carbs, fat" },
        { status: 400 }
      )
    }

    const [newFood] = await db
      .insert(foodItems)
      .values({
        name,
        brand: brand || null,
        barcode: barcode || null,
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        fiber: parseFloat(fiber || 0),
        servingSize: parseInt(servingSize || 100),
        unit: unit || "g",
      })
      .returning()

    return NextResponse.json(newFood, { status: 201 })
  } catch (error) {
    console.error("Foods POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar alimento" },
      { status: 500 }
    )
  }
}

