import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ChatWidget } from "@/components/coach/ChatWidget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ShapeFlow - Acompanhamento de Medidas Corporais",
  description: "Sistema de acompanhamento de medidas corporais e peso",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
        <ChatWidget />
      </body>
    </html>
  )
}

