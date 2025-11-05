import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL!

// DATABASE_URL será validado em runtime, não durante build

// Use postgres client for Lucia adapter (works better with Neon)
const sql = postgres(connectionString)

export const adapter = new PostgresJsAdapter(sql, {
  user: "users",
  session: "sessions",
})

