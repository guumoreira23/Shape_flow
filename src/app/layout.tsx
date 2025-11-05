import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ChatWidget } from "@/components/coach/ChatWidget"
import { ErrorBoundary } from "@/components/ErrorBoundary"

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
        <ErrorBoundary>
          {children}
          <Toaster />
          <ChatWidget />
        </ErrorBoundary>
      </body>
    </html>
  )
}

