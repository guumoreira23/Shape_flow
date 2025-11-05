# Sistema de Roles - ShapeFlow

## 📋 Visão Geral

O sistema agora possui um controle de roles com dois tipos de usuários:
- **User**: Usuário padrão (acesso apenas aos próprios dados)
- **Admin**: Administrador (acesso completo + painel administrativo)

## 🔐 Como Funciona

### Roles Disponíveis

1. **`user`** (padrão)
   - Todos os novos registros são criados como `user`
   - Acesso apenas aos próprios dados (medidas, valores, metas)
   - Não pode acessar o painel administrativo

2. **`admin`**
   - Acesso completo a todos os dados
   - Pode acessar `/admin` para gerenciar usuários
   - Pode ver, editar e deletar qualquer usuário
   - Pode alterar roles de outros usuários

## 🛠️ Funcionalidades Implementadas

### 1. Schema do Banco de Dados
- Campo `role` adicionado na tabela `users`
- Valor padrão: `"user"`
- Valores permitidos: `"user"` ou `"admin"`

### 2. Autenticação
- Role incluído nos atributos do usuário no Lucia Auth
- Funções de verificação de permissões:
  - `requireAdmin()`: Garante que o usuário é admin
  - `isAdmin()`: Verifica se o usuário atual é admin
  - `getUserRole()`: Retorna o role do usuário atual

### 3. API Routes Administrativas
- `GET /api/admin/users` - Lista todos os usuários
- `PATCH /api/admin/users/[userId]` - Atualiza role de um usuário
- `DELETE /api/admin/users/[userId]` - Deleta um usuário

### 4. Painel Administrativo
- Rota: `/admin`
- Acesso restrito apenas para admins
- Funcionalidades:
  - Visualizar todos os usuários
  - Ver estatísticas (total, admins, users)
  - Editar role de usuários
  - Deletar usuários (não pode deletar a si mesmo)

### 5. Dashboard
- Botão "Painel Admin" aparece apenas para admins
- Link direto para `/admin`

## 📝 Como Criar um Admin

### Opção 1: Script de Criação

```bash
# Com email e senha padrão
npm run create-admin

# Com email e senha customizados
ADMIN_EMAIL=admin@exemplo.com ADMIN_PASSWORD=senha-segura npm run create-admin
```

### Opção 2: Através do Painel Admin

1. Faça login como admin
2. Acesse `/admin`
3. Encontre o usuário que deseja tornar admin
4. Clique em "Editar Role"
5. Selecione "Admin" e salve

### Opção 3: Através do Banco de Dados

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

## 🚀 Próximos Passos

Após implementar o sistema de roles, você precisa:

1. **Atualizar o banco de dados**:
   ```bash
   npm run db:push
   ```

2. **Criar seu primeiro admin**:
   ```bash
   npm run create-admin
   ```

3. **Fazer deploy**:
   ```bash
   vercel --prod --token SEU_TOKEN
   ```

## 🔒 Segurança

- Todas as rotas administrativas verificam permissões
- Usuários não podem deletar a si mesmos
- Proteção server-side em todas as verificações
- Roles são verificados em cada requisição

## 📊 Estrutura de Arquivos

```
src/
  lib/
    auth/
      permissions.ts      # Funções de verificação de roles
  app/
    admin/
      page.tsx           # Página do painel admin (server component)
      AdminPanel.tsx     # Componente do painel admin (client component)
    api/
      admin/
        users/
          route.ts       # Lista usuários
          [userId]/
            route.ts     # Atualiza/deleta usuário
```

