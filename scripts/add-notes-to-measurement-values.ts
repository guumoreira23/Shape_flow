import postgres from "postgres"
import { readFileSync } from "fs"
import { resolve } from "path"

// Tentar carregar .env.local manualmente
try {
  const envPath = resolve(process.cwd(), ".env.local")
  const envFile = readFileSync(envPath, "utf-8")
  envFile.split("\n").forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) return
    
    const equalIndex = trimmedLine.indexOf("=")
    if (equalIndex === -1) return
    
    const key = trimmedLine.substring(0, equalIndex).trim()
    let value = trimmedLine.substring(equalIndex + 1).trim()
    
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
} catch (error) {
  console.log("ℹ️  Arquivo .env.local não encontrado, usando variáveis de ambiente do sistema")
}

async function addNotesColumn() {
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
    console.log("📝 Executando migration: Adicionar campo notes na tabela measurement_values...")

    await sql`
      ALTER TABLE measurement_values 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `

    console.log("✅ Migration executada com sucesso!")
    console.log("✅ Campo 'notes' adicionado à tabela 'measurement_values'")
  } catch (error: any) {
    if (error?.code === "42701") {
      console.log("ℹ️  Campo 'notes' já existe na tabela 'measurement_values'")
    } else {
      console.error("❌ Erro ao executar migration:", error)
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

addNotesColumn()

