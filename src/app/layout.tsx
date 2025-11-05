import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ChatWidget } from "@/components/coach/ChatWidget"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

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
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <ChatWidget />
      </body>
    </html>
  )
}

