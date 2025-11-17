import postgres from "postgres"
import { readFileSync } from "fs"
import { resolve } from "path"

// Tentar carregar .env.local manualmente
try {
  const envPath = resolve(process.cwd(), ".env.local")
  const envFile = readFileSync(envPath, "utf-8")
  envFile.split("\n").forEach((line) => {
    // Ignorar comentários e linhas vazias
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) return
    
    const equalIndex = trimmedLine.indexOf("=")
    if (equalIndex === -1) return
    
    const key = trimmedLine.substring(0, equalIndex).trim()
    let value = trimmedLine.substring(equalIndex + 1).trim()
    
    // Remover aspas se existirem
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
} catch (error) {
  // Arquivo .env.local não encontrado, usar variáveis de ambiente do sistema
  console.log("ℹ️  Arquivo .env.local não encontrado, usando variáveis de ambiente do sistema")
}

async function addDeadlineColumn() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL não encontrada nas variáveis de ambiente")
    console.error("\nConfigure DATABASE_URL:")
    console.error("  Windows PowerShell: $env:DATABASE_URL=\"sua-url-postgresql\"")
    console.error("  Linux/Mac: export DATABASE_URL=\"sua-url-postgresql\"")
    console.error("  Ou configure no arquivo .env.local")
    process.exit(1)
  }

  console.log("🔧 Conectando ao banco de dados...")

  const sql = postgres(connectionString)

  try {
    console.log("📝 Executando migration: Adicionar campo deadline na tabela goals...")

    await sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
    `

    console.log("✅ Migration executada com sucesso!")
    console.log("✅ Campo 'deadline' adicionado à tabela 'goals'")
  } catch (error: any) {
    if (error?.code === "42701") {
      // Column already exists
      console.log("ℹ️  Campo 'deadline' já existe na tabela 'goals'")
    } else {
      console.error("❌ Erro ao executar migration:", error)
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

addDeadlineColumn()

