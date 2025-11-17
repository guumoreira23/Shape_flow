import { readFileSync } from "fs"
import { join } from "path"
import postgres from "postgres"

// Carregar variáveis de ambiente do .env.local
const envPath = join(process.cwd(), ".env.local")
let envContent = ""

try {
  envContent = readFileSync(envPath, "utf-8")
} catch (error) {
  console.error("Erro ao ler .env.local. Certifique-se de que o arquivo existe.")
  process.exit(1)
}

// Parse manual do .env.local
const envLines = envContent.split("\n")
for (const line of envLines) {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith("#")) {
    const [key, ...valueParts] = trimmedLine.split("=")
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "")
      process.env[key.trim()] = value
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada no .env.local")
  console.error("Por favor, adicione DATABASE_URL ao arquivo .env.local")
  process.exit(1)
}

async function migrateTheme() {
  const sql = postgres(DATABASE_URL as string)

  try {
    console.log("🔄 Iniciando migração: adicionar coluna 'theme' à tabela users...")

    // Verificar se a coluna já existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'theme'
    `

    if (checkColumn.length > 0) {
      console.log("✅ Coluna 'theme' já existe na tabela users")
      return
    }

    // Adicionar coluna theme
    await sql`
      ALTER TABLE users
      ADD COLUMN theme TEXT DEFAULT 'dark'
    `

    // Atualizar registros existentes
    await sql`
      UPDATE users
      SET theme = 'dark'
      WHERE theme IS NULL
    `

    console.log("✅ Migração concluída com sucesso!")
    console.log("   - Coluna 'theme' adicionada à tabela users")
    console.log("   - Valor padrão 'dark' definido para registros existentes")
  } catch (error: any) {
    console.error("❌ Erro ao executar migração:", error.message)
    throw error
  } finally {
    await sql.end()
  }
}

migrateTheme()
  .then(() => {
    console.log("\n✅ Migração finalizada!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Erro na migração:", error)
    process.exit(1)
  })

