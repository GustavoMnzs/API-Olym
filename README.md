# API de Alimentos e Nutrição

API REST para gestão de alimentos e composição nutricional baseada nas tabelas TACO e TBCA.

## Stack

- **Framework**: NestJS
- **ORM**: Prisma
- **Banco de dados**: MySQL
- **Documentação**: OpenAPI 3.0 + Swagger UI

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Editar .env com suas credenciais MySQL
```

## Configuração do Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate
```

## Executar

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## Documentação

Acesse `http://localhost:3000/docs` para a documentação Swagger.

## Importação de Dados

### Via CLI
```bash
npm run seed:taco
npm run seed:tbca
```

### Via API (requer API Key)
```bash
curl -X POST http://localhost:3000/admin/import/taco \
  -H "x-api-key: sua-chave-api"
```

## Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /foods | Listar alimentos (paginado) |
| GET | /foods/:id | Detalhes do alimento |
| POST | /foods | Cadastrar alimento |
| POST | /foods/:id/calculate | Calcular nutrição por porção |
| GET | /nutrients | Listar nutrientes |
| GET | /measures | Listar medidas caseiras |

## Estrutura do CSV

Os arquivos CSV devem estar em `./data/` com as colunas:
- `descricao`: Nome do alimento
- `grupo`: Grupo alimentar
- `energia_kcal`, `proteina_g`, `carboidrato_g`, `lipideos_g`, `fibra_g`
- `calcio_mg`, `ferro_mg`, `sodio_mg`, `potassio_mg`, `vitamina_c_mg`
