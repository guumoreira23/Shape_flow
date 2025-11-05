import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/permissions"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })

    return NextResponse.json(allUsers)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      )
    }
    console.error("Admin users GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

