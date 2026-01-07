# 🚀 Guia de Deploy - Hostinger VPS

## Pré-requisitos na Hostinger

1. **VPS com Node.js** (recomendado: Ubuntu 22.04)
2. **MySQL** configurado
3. **Acesso SSH** habilitado

---

## 📋 Passo a Passo

### 1. Conectar via SSH

```bash
ssh usuario@seu-ip-hostinger
```

### 2. Instalar dependências no servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalações
node -v
npm -v
pm2 -v
```

### 3. Criar banco de dados MySQL

Acesse o painel da Hostinger ou via terminal:

```sql
CREATE DATABASE food_nutrition_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'food_api_user'@'localhost' IDENTIFIED BY 'SuaSenhaSegura123!';
GRANT ALL PRIVILEGES ON food_nutrition_db.* TO 'food_api_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Clonar/Enviar o projeto

**Opção A - Git:**
```bash
cd /var/www
git clone https://seu-repositorio.git food-nutrition-api
cd food-nutrition-api
```

**Opção B - SFTP/SCP:**
```bash
# No seu computador local
scp -r ./food-nutrition-api usuario@seu-ip:/var/www/
```

### 5. Configurar variáveis de ambiente

```bash
cd /var/www/food-nutrition-api

# Copiar template de produção
cp .env.production .env

# Editar com seus dados reais
nano .env
```

**Preencha o `.env`:**
```env
DATABASE_URL="mysql://food_api_user:SuaSenhaSegura123!@localhost:3306/food_nutrition_db"
PORT=3000
ADMIN_API_KEY="sua-chave-gerada-com-openssl-rand-hex-32"
NODE_ENV="production"
ALLOWED_ORIGINS="https://seudominio.com.br"
ENABLE_SWAGGER="false"
```

**Gerar API Key segura:**
```bash
openssl rand -hex 32
```

### 6. Instalar dependências e buildar

```bash
# Instalar dependências
npm ci --only=production
npm install -g prisma

# Gerar cliente Prisma
npx prisma generate

# Rodar migrations
npx prisma migrate deploy

# Buildar aplicação
npm run build
```

### 7. Criar pasta de logs

```bash
mkdir -p logs
chmod 755 logs
```

### 8. Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração para reinício automático
pm2 save

# Configurar startup automático
pm2 startup
# Execute o comando que aparecer na tela
```

### 9. Verificar se está rodando

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs food-nutrition-api

# Testar endpoint
curl http://localhost:3000/health
```

---

## 🔒 Configurar HTTPS com Nginx (Recomendado)

### Instalar Nginx e Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/food-api
```

Cole:
```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

### Ativar site e SSL

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/food-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 📊 Comandos Úteis PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs food-nutrition-api

# Reiniciar
pm2 restart food-nutrition-api

# Parar
pm2 stop food-nutrition-api

# Recarregar sem downtime
pm2 reload food-nutrition-api

# Monitoramento
pm2 monit
```

---

## 🔄 Atualizar a Aplicação

```bash
cd /var/www/food-nutrition-api

# Puxar atualizações
git pull origin main

# Instalar novas dependências
npm ci --only=production

# Rodar migrations (se houver)
npx prisma migrate deploy

# Rebuildar
npm run build

# Recarregar sem downtime
pm2 reload food-nutrition-api
```

---

## 🛡️ Checklist de Segurança

- [ ] API Key forte gerada com `openssl rand -hex 32`
- [ ] HTTPS configurado com certificado SSL
- [ ] Firewall configurado (apenas portas 22, 80, 443)
- [ ] Swagger desabilitado em produção (`ENABLE_SWAGGER=false`)
- [ ] CORS configurado apenas para domínios permitidos
- [ ] Banco de dados com senha forte
- [ ] Usuário MySQL com permissões mínimas
- [ ] Logs sendo monitorados

---

## 🔥 Firewall (UFW)

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 📝 Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `GET /health` | Status da API |
| `GET /health/live` | Liveness probe |
| `GET /health/ready` | Readiness probe |
| `GET /docs` | Swagger (se habilitado) |
| `GET /foods` | Listar alimentos |
| `GET /nutrients` | Listar nutrientes |
| `GET /measures` | Listar medidas |

---

## 🆘 Troubleshooting

### Erro de conexão com banco
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u food_api_user -p -h localhost food_nutrition_db
```

### Aplicação não inicia
```bash
# Ver logs de erro
pm2 logs food-nutrition-api --err --lines 50

# Verificar se porta está em uso
sudo lsof -i :3000
```

### Erro de permissão
```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/www/food-nutrition-api
chmod -R 755 /var/www/food-nutrition-api
```
