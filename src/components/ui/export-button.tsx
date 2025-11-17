"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportButton() {
  const handleExport = (format: "csv" | "xls") => {
    const path = format === "csv" ? "/api/export/csv" : "/api/export/xls"
    window.location.href = path
  }

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Button
        variant="outline"
        className="gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
        onClick={() => handleExport("csv")}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Exportar CSV</span>
        <span className="sm:hidden">CSV</span>
      </Button>
      <Button
        className="gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
        onClick={() => handleExport("xls")}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Exportar XLS</span>
        <span className="sm:hidden">XLS</span>
      </Button>
    </div>
  )
}

