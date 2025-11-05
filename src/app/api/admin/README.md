# Rotas Administrativas Temporárias

## ⚠️ Atenção

As rotas `/api/admin/setup` e `/api/admin/init-db` são **temporárias** e foram criadas para facilitar a configuração inicial do banco de dados no ambiente de produção (Vercel).

## 📋 Quando Usar

Use essas rotas apenas se:
- O banco de dados ainda não foi inicializado
- Você não consegue executar `npm run db:push` localmente
- Você precisa criar o primeiro usuário administrador

## 🗑️ Remoção Recomendada

Após a configuração inicial, **recomenda-se remover ou desabilitar** essas rotas por segurança:

1. Remover os arquivos `src/app/api/admin/setup/route.ts` e `src/app/api/admin/init-db/route.ts`
2. Ou adicionar uma verificação de ambiente para desabilitá-las em produção

## 🔒 Segurança

- Essas rotas não têm autenticação adicional
- Devem ser usadas apenas durante o setup inicial
- Após uso, considere removê-las do código

## 📝 Alternativas

Para produção, recomenda-se:
- Usar migrações do Drizzle (`drizzle-kit migrate`)
- Criar usuário admin via script local (`npm run create-admin`)
- Usar ferramentas de gerenciamento de banco de dados (Neon Console, Supabase Dashboard)

