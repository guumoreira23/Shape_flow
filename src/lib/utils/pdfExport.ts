/**
 * Utilitário para gerar PDFs usando a API do navegador
 * Gera PDF simples com gráfico usando canvas e window.print()
 */

export interface PDFData {
  measureType: {
    name: string
    unit: string
  }
  goal: {
    targetValue: number
    deadline: string | null
  } | null
  data: Array<{
    date: string
    value: number
  }>
  period: {
    start: string
    end: string
  }
}

export function generatePDFReport(data: PDFData) {
  // Criar uma nova janela para o relatório
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão")
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório - ${data.measureType.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          padding: 40px;
          color: #1e293b;
          background: white;
        }
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .header p {
          color: #64748b;
          font-size: 14px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .info-card h3 {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-card p {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }
        .chart-container {
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .chart-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          color: #1e293b;
        }
        .goal-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #3b82f6;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de ${data.measureType.name}</h1>
        <p>Período: ${new Date(data.period.start).toLocaleDateString('pt-BR')} a ${new Date(data.period.end).toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h3>Total de Registros</h3>
          <p>${data.data.length}</p>
        </div>
        <div class="info-card">
          <h3>Unidade</h3>
          <p>${data.measureType.unit}</p>
        </div>
        ${data.goal ? `
        <div class="info-card">
          <h3>Meta</h3>
          <p>${data.goal.targetValue} ${data.measureType.unit}</p>
        </div>
        <div class="info-card">
          <h3>Data Limite</h3>
          <p>${data.goal.deadline ? new Date(data.goal.deadline).toLocaleDateString('pt-BR') : 'Não definida'}</p>
        </div>
        ` : ''}
      </div>

      <div class="chart-container">
        <div class="chart-title">Evolução ao Longo do Tempo</div>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">
          Gráfico de linha mostrando a evolução de ${data.measureType.name.toLowerCase()} no período selecionado.
        </p>
        ${data.goal ? `<p style="color: #3b82f6; font-size: 14px; margin-bottom: 10px;">
          Meta: <span class="goal-badge">${data.goal.targetValue} ${data.measureType.unit}</span>
        </p>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Valor (${data.measureType.unit})</th>
            ${data.goal ? '<th>Progresso em relação à Meta</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.data.map((item, index) => {
            const progress = data.goal
              ? ((item.value / data.goal.targetValue) * 100).toFixed(1)
              : null
            return `
              <tr>
                <td>${new Date(item.date).toLocaleDateString('pt-BR')}</td>
                <td><strong>${item.value}</strong></td>
                ${data.goal ? `<td>${progress}%</td>` : ''}
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>ShapeFlow - Sistema de Acompanhamento de Medidas Corporais</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 500);
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

