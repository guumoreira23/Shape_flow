import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

// Use postgres client for Lucia adapter (works better with Neon)
const sql = postgres(connectionString)

export const adapter = new PostgresJsAdapter(sql, {
  user: "users",
  session: "sessions",
})

