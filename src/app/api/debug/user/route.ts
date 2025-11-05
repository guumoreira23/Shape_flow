import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/lucia"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { user, session } = await getSession()
    
    if (!user || !session) {
      return NextResponse.json({ 
        authenticated: false,
        message: "Usuário não autenticado"
      })
    }

    // Buscar usuário diretamente do banco para verificar o role
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({
      authenticated: true,
      sessionUser: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      dbUser: dbUser,
      match: user.role === dbUser?.role,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 })
  }
}

