"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BarChart3, Users, LogOut, X, UtensilsCrossed, Droplet, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tracker",
    href: "/tracker",
    icon: BarChart3,
  },
  {
    title: "Diário Alimentar",
    href: "/diario",
    icon: UtensilsCrossed,
  },
  {
    title: "Hidratação",
    href: "/hidratacao",
    icon: Droplet,
  },
  {
    title: "Jejum Intermitente",
    href: "/jejum",
    icon: Timer,
  },
  {
    title: "Central Administrativa",
    href: "/admin",
    icon: Users,
    adminOnly: true,
  },
]

interface SidebarProps {
  userIsAdmin?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ userIsAdmin = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      // Ignorar erro
    }
    window.location.href = "/login"
  }

  const visibleItems = navItems.filter((item) => !item.adminOnly || userIsAdmin)

  // Fechar sidebar ao clicar em um link em mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-slate-900/95 border-r border-slate-800/50 backdrop-blur-sm z-50 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-white">ShapeFlow</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

