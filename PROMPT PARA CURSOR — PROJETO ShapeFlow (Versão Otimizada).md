# PROMPT PARA CURSOR — PROJETO ShapeFlow (Versão Otimizada)

Este prompt detalha a criação de um projeto full-stack Next.js, com foco em **melhores práticas de código**, **arquitetura limpa** e **segurança**.

## 🎯 Objetivo Principal

Gerar um projeto Next.js 15 (App Router, TypeScript) chamado **ShapeFlow**, um mini-SaaS para acompanhamento de medidas corporais e peso.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 | App Router, TypeScript, Server Components (onde aplicável). |
| **Autenticação** | Lucia Auth | Email/senha, com proteção de rotas server-side. |
| **Banco de Dados** | PostgreSQL | Neon/Supabase. |
| **ORM** | Drizzle ORM | Uso de `drizzle-orm/neon-http` com `@neondatabase/serverless` para compatibilidade com ambientes serverless. |
| **UI/Estilo** | Tailwind CSS | Uso de classes utilitárias. |
| **Componentes** | shadcn/ui | Tema escuro elegante (`bg-slate-950`, `bg-slate-900`). |
| **Gráficos** | Recharts | Para visualização de dados (linha + meta/goal). |
| **Inteligência Artificial** | OpenAI API | Chat Coach utilizando Assistants API (preferencial) ou Chat Completions (fallback). |

## ✅ Requisitos Funcionais

1.  **Cadastro de Medidas**: Permite cadastrar tipos de medidas (ex.: Peso (kg), Cintura (cm), Quadril (cm)), cada uma com unidade.
2.  **Lançamento de Dados (Grade Editável)**:
    *   Implementar uma grade (tabela) onde linhas = medidas e colunas = datas.
    *   Células com input numérico, edição **inline**, **debounce** (300–500ms) e **otimismo (Optimistic UI)**.
    *   A persistência deve ser feita via `POST /api/value`.
3.  **Visualização Gráfica**: Página dedicada por medida (`/tracker/[measureId]`) com `LineChart` (Recharts) e `ReferenceLine` para a meta (`targetValue`).
4.  **Dashboard**: Visão resumida com último peso/cintura, contagem de lançamentos e mini-gráfico (`sparkline`) do peso.
5.  **Chat Coach "Thais Carla"**:
    *   Widget flutuante que abre um chat lateral.
    *   Comunicação via `POST /api/ai/chat` com **Server-Sent Events (SSE)** para streaming.
    *   O backend deve injetar um resumo das últimas 30 dias das principais medidas do usuário como **contexto** para personalizar as respostas da IA.

## ⚙️ Melhores Práticas de Código e Arquitetura

O código gerado deve aderir estritamente às seguintes diretrizes:

1.  **Segurança (Multi-usuário)**:
    *   Todas as queries de banco de dados devem ser **scoped** pelo `userId` (multi-usuário desde o início).
    *   Validação de dados de entrada (API Routes) utilizando **Zod**.
    *   Proteção de rotas sensíveis (`/dashboard`, `/tracker`) com verificação de autenticação **server-side**.
2.  **Performance e UX**:
    *   Implementar o salvamento da grade com **AbortController** para cancelar requisições antigas e evitar condições de corrida.
    *   Utilizar **Server Components** para busca inicial de dados e **Client Components** para interatividade (formulários, grade, chat).
    *   Centralizar utilitários de `debounce`, `sse`, formatação de datas e validação em `src/lib`.
3.  **Manutenibilidade**:
    *   Configuração completa de **ESLint** e **Prettier**.
    *   Tipagem forte em todo o projeto (TypeScript, Zod, Drizzle).
    *   Evitar bibliotecas pesadas para a grade; implementar a tabela manualmente com HTML + Tailwind para controle total (primeira coluna sticky + scroll horizontal).

## 🗂️ Estrutura de Pastas e Arquivos

Manter a estrutura original, com foco na separação de responsabilidades:

```
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    dashboard/page.tsx
    tracker/page.tsx
    tracker/[measureId]/page.tsx
    api/
      tracker/route.ts         # GET: datas, medidas, valores, metas
      date/route.ts            # POST: cria data nova (hoje ou data especificada)
      value/route.ts           # POST: cria/atualiza valor de uma célula
      goal/route.ts            # POST: cria/atualiza meta de uma medida
      ai/
        chat/route.ts          # POST (SSE): proxy p/ OpenAI (Assistants/Chat)
  components/
    ui/...(shadcn)
    tracker/MeasuresGrid.tsx   # grade editável (linhas=medidas, colunas=datas)
    charts/MeasureChart.tsx    # gráfico com ReferenceLine de meta
    coach/ChatWidget.tsx       # botão flutuante + painel de chat (Thais Carla)
  db/
    schema.ts                  # Schemas Drizzle
    index.ts                   # Cliente Drizzle
  lib/
    auth/                      # Lógica de autenticação Lucia
      lucia.ts
      middleware.ts
      password.ts
    drizzle/
      client.ts                # Cliente Drizzle (alias para db/index.ts)
    utils/                     # Utilitários (date, number, sse, zod)
      date.ts
      number.ts
      sse.ts
      zod.ts
  styles/
    globals.css
drizzle.config.ts
.env.example
```

## 🗃️ Banco de Dados (Drizzle Schemas)

Os schemas Drizzle devem ser criados em `src/db/schema.ts` exatamente como especificado no prompt original, garantindo os índices de unicidade:

*   `users`
*   `measurementTypes`
*   `measurementEntries` (com `userDateUnique` index)
*   `measurementValues` (com `entryMeasureUnique` index)
*   `goals` (com `userMeasureGoalUnique` index)

O cliente Drizzle (`src/db/index.ts` ou `src/lib/drizzle/client.ts`) deve usar a configuração para Neon:

```typescript
// src/lib/drizzle/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
export const db = drizzle({ client: sql, schema });
```

## 🤖 Chat Coach Thais Carla (OpenAI)

### Funções (Tool Calls)

O backend deve expor e mapear as seguintes funções para a IA:

1.  `getUserMetricsSummary()`: Retorna média, mínimo, máximo e última medição por medida nos últimos 30 dias.
2.  `setGoal(measureId: number, targetValue: number)`: Atualiza a meta da medida no banco de dados.

### Lógica de Backend (`/api/ai/chat/route.ts`)

*   **Prioridade**: Se `ASSISTANT_ID_THAS_CARLA` estiver definido, usar **Assistants API** (Threads efêmeras por sessão, mapeamento de `tool calls` para funções locais que interagem com o DB).
*   **Fallback**: Caso contrário, usar **Chat Completions** com `THAIS_CARLA_SYSTEM_PROMPT` e a capacidade de usar `tool calls` (se o modelo suportar).
*   **Contexto**: O `system prompt` ou a instrução do Assistant deve ser enriquecida com o resumo das métricas do usuário antes de cada chamada à API da OpenAI.

## 📦 Scripts e Documentação

O `README.md` deve ser completo, incluindo instruções para:

*   Instalação de dependências (`pnpm i`).
*   Configuração das variáveis de ambiente (`.env.example`).
*   Migração do banco de dados (`pnpm db:push`).
*   Execução do projeto (`pnpm dev`).
*   Instruções claras sobre como usar as variáveis `ASSISTANT_ID_THAS_CARLA` e `THAIS_CARLA_SYSTEM_PROMPT`.

## 💯 Critérios de Aceite (Reforçados)

1.  **Autenticação**: Registro e login funcionais, com rotas protegidas por verificação server-side.
2.  **Grade de Lançamento**: Edição inline com **debounce**, **optimistic UI** e uso de **AbortController** para cancelamento de requisições.
3.  **Gráfico**: Exibição correta do `LineChart` com a `ReferenceLine` da meta, e funcionalidade de edição da meta.
4.  **Chat Coach**: O widget abre, envia mensagens via **SSE streaming**, e a IA consegue usar a função `setGoal` para interagir com o DB.
5.  **Qualidade**: O código deve ser limpo, tipado, e seguir a estrutura de pastas especificada, com separação clara entre Server e Client Components.

---
**Observação Final para o Gerador de Código**: Mantenha o foco na **qualidade do código**, **segurança** (Zod, scoping por userId) e **experiência do usuário** (Optimistic UI, Debounce com AbortController, SSE). O prompt é um guia de arquitetura.
