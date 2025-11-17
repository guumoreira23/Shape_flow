import { db } from "../src/db"
import { users } from "../src/db/schema"
import { hashPassword } from "../src/lib/auth/password"
import { eq } from "drizzle-orm"

async function resetAdminPassword() {
  const email = process.env.ADMIN_EMAIL || "admin@shapeflow.com"
  const newPassword = process.env.ADMIN_PASSWORD

  if (!newPassword) {
    console.error(
      "⚠️  Defina a variável de ambiente ADMIN_PASSWORD com a nova senha."
    )
    process.exit(1)
  }

  console.log(`🔐 Resetando senha para o admin: ${email}`)

  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (!existingUser) {
      console.error(`❌ Usuário com email ${email} não encontrado.`)
      process.exit(1)
    }

    if (existingUser.role !== "admin") {
      console.warn(
        `⚠️  Usuário encontrado não possui role 'admin' (role atual: ${existingUser.role}). Continuando assim mesmo.`
      )
    }

    const hashedPassword = await hashPassword(newPassword)

    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.id, existingUser.id))

    console.log("✅ Senha atualizada com sucesso!")
    console.log("📌 Lembre-se de avisar o usuário para alterar a senha após o login.")
  } catch (error) {
    console.error("Erro ao resetar senha do admin:", error)
    process.exit(1)
  }
}

resetAdminPassword()




