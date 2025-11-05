import { db } from "../src/db"
import { users } from "../src/db/schema"
import { hashPassword } from "../src/lib/auth/password"
import { generateId } from "lucia"

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@shapeflow.com"
  const password = process.env.ADMIN_PASSWORD || "admin123"

  console.log(`Criando usuário admin com email: ${email}`)

  try {
    // Verificar se o usuário já existe
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      console.log(`Usuário com email ${email} já existe!`)
      return
    }

    // Criar o usuário
    const hashedPassword = await hashPassword(password)
    const userId = generateId(15)

    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
      role: "admin", // Usuário criado via script é admin
    })

    console.log(`✅ Usuário admin criado com sucesso!`)
    console.log(`Email: ${email}`)
    console.log(`Senha: ${password}`)
    console.log(`\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!`)
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error)
    process.exit(1)
  }
}

createAdmin()

