import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const userData = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
    })

    return NextResponse.json({
      theme: userData?.theme || "dark",
    })
  } catch (error) {
    console.error("User preferences GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar preferências" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { theme } = body

    if (theme && theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        { error: "Tema inválido. Use 'light' ou 'dark'" },
        { status: 400 }
      )
    }

    await db
      .update(users)
      .set({
        theme: theme || "dark",
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true, theme: theme || "dark" })
  } catch (error) {
    console.error("User preferences PATCH error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar preferências" },
      { status: 500 }
    )
  }
}

