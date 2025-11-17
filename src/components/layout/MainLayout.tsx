"use client"

import { Sidebar } from "./Sidebar"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
  userIsAdmin?: boolean
}

export function MainLayout({ children, userIsAdmin = false }: MainLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fechar sidebar ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-950">{children}</div>
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar userIsAdmin={userIsAdmin} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Botão hambúrguer para mobile */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-30 lg:hidden bg-slate-900/95 border border-slate-800/50 backdrop-blur-sm"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5 text-white" />
      </Button>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

