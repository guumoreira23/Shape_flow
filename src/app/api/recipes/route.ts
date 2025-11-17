import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { recipes, recipeIngredients } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { ilike, or } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const tags = searchParams.get("tags") // JSON array de tags
    const maxCalories = searchParams.get("maxCalories")

    let query = db.query.recipes.findMany({
      limit: 50,
    })

    // Aplicar filtros
    if (search) {
      query = db.query.recipes.findMany({
        where: (recipes, { ilike }) => ilike(recipes.name, `%${search}%`),
        limit: 50,
      })
    }

    let allRecipes = await query

    // Filtrar por tags se fornecido
    if (tags) {
      try {
        const tagArray = JSON.parse(tags) as string[]
        allRecipes = allRecipes.filter((recipe) => {
          if (!recipe.tags) return false
          const recipeTags = JSON.parse(recipe.tags) as string[]
          return tagArray.some((tag) => recipeTags.includes(tag))
        })
      } catch (e) {
        // Ignorar erro de parsing
      }
    }

    // Filtrar por calorias máximas
    if (maxCalories) {
      allRecipes = allRecipes.filter(
        (recipe) => recipe.calories <= parseInt(maxCalories)
      )
    }

    // Buscar ingredientes para cada receita
    const recipesWithIngredients = await Promise.all(
      allRecipes.map(async (recipe) => {
        const ingredients = await db.query.recipeIngredients.findMany({
          where: (ingredients, { eq }) => eq(ingredients.recipeId, recipe.id),
        })

        return {
          ...recipe,
          ingredients: ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            quantity: Number(ing.quantity),
            unit: ing.unit,
            foodItemId: ing.foodItemId,
          })),
        }
      })
    )

    return NextResponse.json(recipesWithIngredients)
  } catch (error) {
    console.error("Recipes GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar receitas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const {
      name,
      description,
      servings,
      prepTime,
      cookTime,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      tags,
      difficulty,
      ingredients,
    } = body

    if (!name || !calories || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, calories, protein, carbs, fat" },
        { status: 400 }
      )
    }

    const [newRecipe] = await db
      .insert(recipes)
      .values({
        name,
        description: description || null,
        servings: parseInt(servings || 1),
        prepTime: prepTime ? parseInt(prepTime) : null,
        cookTime: cookTime ? parseInt(cookTime) : null,
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        fiber: parseFloat(fiber || 0),
        tags: tags ? JSON.stringify(tags) : null,
        difficulty: difficulty || "médio",
      })
      .returning()

    // Adicionar ingredientes se fornecidos
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        ingredients.map((ing: any) => ({
          recipeId: newRecipe.id,
          foodItemId: ing.foodItemId || null,
          name: ing.name,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit || "g",
        }))
      )
    }

    return NextResponse.json(newRecipe, { status: 201 })
  } catch (error) {
    console.error("Recipes POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar receita" },
      { status: 500 }
    )
  }
}

