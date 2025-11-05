# Instruções de Deploy no Vercel

## Como criar um token no Vercel

1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Nomeie o token (ex: "ShapeFlow Deploy")
4. Selecione o escopo (Full Account ou apenas o time/projeto)
5. Clique em "Create Token"
6. **Copie o token imediatamente** (ele só aparece uma vez!)

## Como usar o token para fazer deploy

### Opção 1: Usar variável de ambiente (Recomendado)

```bash
# Windows PowerShell
$env:VERCEL_TOKEN="seu-token-aqui"
vercel --prod

# Windows CMD
set VERCEL_TOKEN=seu-token-aqui
vercel --prod

# Linux/Mac
export VERCEL_TOKEN="seu-token-aqui"
vercel --prod
```

### Opção 2: Usar diretamente no comando

```bash
vercel --prod --token seu-token-aqui
```

### Opção 3: Salvar em arquivo .vercel-token (local apenas)

```bash
# Criar arquivo .vercel-token com o token
echo "seu-token-aqui" > .vercel-token
vercel --prod
```

⚠️ **IMPORTANTE**: Não commite o arquivo `.vercel-token` no Git! Ele já está no `.gitignore`.

## Deploy após criar o token

Após criar o token, execute:

```bash
vercel --prod --token SEU_TOKEN_AQUI
```

Ou configure como variável de ambiente e execute:

```bash
vercel --prod
```

