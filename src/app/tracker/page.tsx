import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/middleware"
import { TrackerClient } from "./TrackerClient"

export default async function TrackerPage() {
  await requireAuth()
  return <TrackerClient />
}

