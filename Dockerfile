FROM node:20-alpine

# Instalar OpenSSL 1.1 para compatibilidade com Prisma
RUN apk add --no-cache openssl1.1-compat

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
