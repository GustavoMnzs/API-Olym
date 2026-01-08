import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Segurança - Helmet (headers HTTP seguros)
  // Desabilitar CSP para páginas estáticas com scripts inline
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Compressão de respostas
  app.use(compression());

  // Servir arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // CORS configurado para produção
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || ['*'];
  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    credentials: true,
  });

  // Confiança em proxy (necessário para Hostinger/reverse proxy)
  app.set('trust proxy', 1);

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Configuração Swagger/OpenAPI (desabilitar em produção se preferir)
  if (!isProduction || configService.get('ENABLE_SWAGGER') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('API de Alimentos e Nutrição')
      .setDescription(
        'API REST para gestão de alimentos e composição nutricional baseada nas tabelas TACO e TBCA. ' +
          'Permite consultar informações nutricionais, cadastrar alimentos, medidas caseiras e calcular valores nutricionais por porção.',
      )
      .setVersion('1.0.0')
      .addTag('Foods', 'Operações relacionadas a alimentos')
      .addTag('Nutrients', 'Operações relacionadas a nutrientes')
      .addTag('Measures', 'Operações relacionadas a medidas caseiras')
      .addTag('Admin', 'Operações administrativas (importação de dados)')
      .addTag('Health', 'Verificação de saúde da API')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get('PORT') || 3000;
  const host = '0.0.0.0'; // Necessário para Hostinger

  await app.listen(port, host);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/docs`);
  console.log(`🥗 Frontend: http://localhost:${port}/index.html`);
  console.log(`🔒 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
}
bootstrap();
