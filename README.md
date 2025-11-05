# ShapeFlow

ShapeFlow é um mini-SaaS para acompanhamento de medidas corporais e peso, desenvolvido com Next.js 15, TypeScript e PostgreSQL.

## 🚀 Características

- ✅ Sistema de autenticação completo (Lucia Auth)
- ✅ Cadastro e gerenciamento de tipos de medidas
- ✅ Grade editável para lançamento de dados com debounce e optimistic UI
- ✅ Visualização gráfica com Recharts
- ✅ Dashboard com resumo e mini-gráficos
- ✅ Chat Coach "Thais Carla" com IA (OpenAI) usando Server-Sent Events
- ✅ Definição e acompanhamento de metas
- ✅ Interface moderna com tema escuro (Tailwind CSS + shadcn/ui)

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Autenticação**: Lucia Auth v3
- **Banco de Dados**: PostgreSQL (Neon/Supabase)
- **ORM**: Drizzle ORM com `@neondatabase/serverless`
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **IA**: OpenAI API (Assistants API ou Chat Completions)

## 📦 Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd shapeflow
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Copie o arquivo `env.example.txt` e crie um arquivo `.env.local`:

```bash
cp env.example.txt .env.local
```

Edite o `.env.local` com suas configurações:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Lucia Auth
LUCIA_SECRET=your-secret-key-here-min-32-chars

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
ASSISTANT_ID_THAS_CARLA=asst_xxxxxxxxxxxxx  # Opcional
THAIS_CARLA_SYSTEM_PROMPT=Você é Thais Carla...  # Opcional

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuração do Banco de Dados

1. Crie um banco PostgreSQL (recomendado: Neon ou Supabase)
2. Configure a `DATABASE_URL` no `.env.local`
3. Execute as migrações:

```bash
npm run db:push
```

## 🚀 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Produção

```bash
npm run build
npm start
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run db:push` - Aplica as migrações do banco de dados
- `npm run db:studio` - Abre o Drizzle Studio para visualizar o banco

## 🤖 Configuração do Chat Coach (OpenAI)

O sistema suporta duas formas de usar a OpenAI:

### Opção 1: Assistants API (Recomendado)

1. Crie um Assistant na OpenAI Platform
2. Configure as funções (tools) no Assistant:
   - `getUserMetricsSummary`: Retorna resumo das métricas
   - `setGoal`: Define/atualiza meta de uma medida
3. Defina `ASSISTANT_ID_THAS_CARLA` no `.env.local`

### Opção 2: Chat Completions (Fallback)

Se `ASSISTANT_ID_THAS_CARLA` não estiver definido, o sistema usa Chat Completions com suporte a tool calls.

Configure o `THAIS_CARLA_SYSTEM_PROMPT` para personalizar o comportamento da IA.

## 📁 Estrutura do Projeto

```
src/
  app/
    (auth)/          # Páginas de autenticação
    api/             # API Routes
    dashboard/       # Dashboard principal
    tracker/         # Página de tracker e detalhes
  components/
    ui/              # Componentes shadcn/ui
    tracker/         # Componentes do tracker
    charts/          # Componentes de gráficos
    coach/           # Componente do chat coach
  db/
    schema.ts        # Schemas Drizzle
    index.ts         # Cliente Drizzle
  lib/
    auth/            # Lógica de autenticação
    drizzle/          # Cliente Drizzle
    utils/            # Utilitários
  styles/
    globals.css      # Estilos globais
```

## 🔒 Segurança

- Todas as queries são scoped por `userId` (multi-usuário)
- Validação de dados com Zod em todas as rotas de API
- Proteção de rotas sensíveis com verificação server-side
- Senhas hasheadas com Argon2
- Cookies de sessão seguros em produção

## 🎨 Melhores Práticas Implementadas

- ✅ Server Components para busca inicial de dados
- ✅ Client Components para interatividade
- ✅ Debounce com AbortController para evitar condições de corrida
- ✅ Optimistic UI para melhor UX
- ✅ Server-Sent Events (SSE) para streaming do chat
- ✅ Tipagem forte com TypeScript e Zod
- ✅ ESLint e Prettier configurados

## 📄 Licença

Este projeto é privado e de uso interno.

## 🤝 Suporte

Para questões ou problemas, abra uma issue no repositório.

