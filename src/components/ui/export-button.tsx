"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportButton() {
  const handleExport = () => {
    window.location.href = "/api/export/csv"
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleExport}
    >
      <Download className="h-4 w-4" />
      Exportar Dados (CSV)
    </Button>
  )
}

