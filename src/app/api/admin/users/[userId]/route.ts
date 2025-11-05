import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/permissions"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()
    const { userId } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    await db
      .update(users)
      .set({
        role: validatedData.role,
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      )
    }
    console.error("Admin user update error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()
    const { userId } = await params

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir deletar a si mesmo
    const { user: currentUser } = await requireAdmin()
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Não é possível deletar seu próprio usuário" },
        { status: 400 }
      )
    }

    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      )
    }
    console.error("Admin user delete error:", error)
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    )
  }
}

