"use client"

import { Sidebar } from "./Sidebar"
import { useState, useEffect } from "react"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-950">{children}</div>
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

