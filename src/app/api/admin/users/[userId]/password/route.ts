import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { requireAdmin } from "@/lib/auth/permissions"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updatePasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verificar se o usuário é admin
    await requireAdmin()

    const { userId } = await params
    const body = await request.json()
    const validatedData = updatePasswordSchema.parse(body)

    // Verificar se o usuário existe
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Atualizar senha no banco
    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    })
  } catch (error: any) {
    if (error?.name === "ZodError" || error?.issues) {
      const zodError = error.issues || error.errors || []
      const firstError = zodError[0]
      return NextResponse.json(
        { error: firstError?.message || "Dados inválidos" },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar senha:", error)
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar senha" },
      { status: 500 }
    )
  }
}

