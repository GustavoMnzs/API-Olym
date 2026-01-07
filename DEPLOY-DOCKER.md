# 🐳 Deploy com Docker + Caddy

## Arquitetura

```
Internet → Caddy (HTTPS) → API NestJS → MySQL
                ↓
         SSL automático
```

## Segurança

- **API Key obrigatória** em todas as rotas (exceto `/health/*`)
- Header: `x-api-key: SUA_CHAVE_AQUI`
- Rate limiting: 20 req/s, 200 req/min
- HTTPS automático via Caddy
- Container roda como usuário não-root

---

## 🚀 Deploy Rápido

### 1. No servidor, clone o projeto

```bash
git clone SEU_REPO /opt/food-api
cd /opt/food-api
```

### 2. Configure as variáveis

```bash
cp .env.docker .env
nano .env
```

**Gere uma API Key forte:**
```bash
openssl rand -hex 32
```

Preencha o `.env`:
```env
API_KEY=sua_chave_gerada_aqui
MYSQL_ROOT_PASSWORD=SenhaRootForte123!
MYSQL_PASSWORD=SenhaUserForte456!
```

### 3. Configure o domínio no Caddyfile

```bash
nano Caddyfile
```

Substitua `SEU_DOMINIO.com.br` pelo seu domínio real.

### 4. Suba os containers

```bash
docker compose up -d
```

### 5. Rode as migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### 6. Verifique

```bash
# Status dos containers
docker compose ps

# Logs
docker compose logs -f api

# Testar health (público)
curl https://seudominio.com.br/health

# Testar API (requer API Key)
curl -H "x-api-key: SUA_CHAVE" https://seudominio.com.br/foods
```

---

## 📡 Como usar a API

**TODAS as rotas (exceto /health) exigem o header:**

```
x-api-key: SUA_API_KEY_AQUI
```

### Exemplos

```bash
# ❌ Sem API Key - retorna 401
curl https://seudominio.com.br/foods

# ✅ Com API Key - funciona
curl -H "x-api-key: abc123..." https://seudominio.com.br/foods

# ✅ Buscar alimento
curl -H "x-api-key: abc123..." "https://seudominio.com.br/foods?search=arroz"
```

### Na sua aplicação (JavaScript/TypeScript)

```typescript
const API_KEY = 'sua-chave-aqui';
const API_URL = 'https://seudominio.com.br';

const response = await fetch(`${API_URL}/foods?search=arroz`, {
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

const foods = await response.json();
```

---

## 🔧 Comandos Úteis

```bash
# Ver logs
docker compose logs -f

# Reiniciar API
docker compose restart api

# Rebuild após mudanças
docker compose up -d --build

# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Entrar no container
docker compose exec api sh

# Ver uso de recursos
docker stats
```

---

## 🔄 Atualizar a API

```bash
cd /opt/food-api
git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

---

## 🛡️ Checklist de Segurança

- [ ] API Key forte (64 caracteres hex)
- [ ] Senhas MySQL fortes
- [ ] Domínio configurado no Caddyfile
- [ ] Firewall: apenas portas 22, 80, 443
- [ ] API Key guardada em local seguro
- [ ] Não commitar `.env` no git

---

## 🆘 Troubleshooting

### Container não inicia
```bash
docker compose logs api
```

### Erro de conexão com banco
```bash
# Verificar se MySQL está pronto
docker compose logs db

# Testar conexão
docker compose exec db mysql -u food_user -p
```

### Certificado SSL não gerado
```bash
# Verificar logs do Caddy
docker compose logs caddy

# DNS do domínio aponta para o servidor?
dig seudominio.com.br
```

### API retorna 401
- Verifique se está enviando o header `x-api-key`
- Verifique se a chave está correta
- Rotas `/health/*` são públicas (para teste)
