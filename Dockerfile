FROM node:20-slim

# Instalar OpenSSL para Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
