# Deploy na Stack Existente

## 1. Clonar o repositório no servidor

```bash
cd ~/stack
git clone https://github.com/GustavoMnzs/API-Olym.git api-food
```

## 2. Criar o .env

```bash
cp api-food/.env.example api-food/.env
```

O .env já está configurado com os valores corretos.

## 3. Adicionar no docker-compose.yml

Adicione estes serviços no `docker-compose.yml`:

```yaml
  api-food:
    build: ./api-food
    restart: unless-stopped
    env_file: ./api-food/.env
    depends_on: [mysql-food]
    networks: [appnet]

  mysql-food:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: RootSenhaForte456!
      MYSQL_DATABASE: olym
      MYSQL_USER: olym_user
      MYSQL_PASSWORD: SenhaForte123!
    volumes:
      - mysql_food_data:/var/lib/mysql
    networks: [appnet]
```

E adicione o volume no final:

```yaml
volumes:
  mongo_data:
  caddy_data:
  caddy_config:
  mysql_food_data:  # ADICIONAR ESTA LINHA
```

## 4. Adicionar no Caddyfile

Adicione no `Caddyfile`:

```
food.olym.com.br {
    encode zstd gzip
    respond /health 200
    reverse_proxy api-food:3000
}
```

Ou se preferir outro subdomínio:
```
nutricao.sabido.pro {
    encode zstd gzip
    respond /health 200
    reverse_proxy api-food:3000
}
```

## 5. Subir os serviços

```bash
cd ~/stack
docker compose up -d --build api-food mysql-food
docker compose restart caddy
```

## 6. Aguardar MySQL iniciar e rodar migrations

```bash
# Aguardar ~30 segundos para MySQL iniciar
sleep 30

# Rodar migrations
docker compose exec api-food npx prisma migrate deploy
```

## 7. Importar dados do backup

Envie o backup.sql para o servidor:
```bash
# No seu Mac:
scp backup.sql root@IP_SERVIDOR:~/stack/
```

No servidor:
```bash
cd ~/stack
docker compose exec -T mysql-food mysql -u olym_user -pSenhaForte123! olym < backup.sql
```

## 8. Testar

```bash
# Health check (público)
curl https://food.olym.com.br/health

# API (com autenticação)
curl -H "x-api-key: fc943a9722fb36c29a57ebf5ffb2b0592d47c7d7f434a07593b17310e018a97f" \
     -H "Authorization: Bearer TOKEN_SUPABASE" \
     https://food.olym.com.br/foods?limit=5
```

## Uso da API

Todas as rotas (exceto /health) exigem:

```
x-api-key: fc943a9722fb36c29a57ebf5ffb2b0592d47c7d7f434a07593b17310e018a97f
Authorization: Bearer <token_supabase_do_usuario>
```
