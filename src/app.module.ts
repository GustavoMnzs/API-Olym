import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CombinedAuthGuard } from './common/guards/combined-auth.guard';
import { FoodsModule } from './foods/foods.module';
import { HealthModule } from './health/health.module';
import { MeasuresModule } from './measures/measures.module';
import { NutrientsModule } from './nutrients/nutrients.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 200 },
    ]),
    AuthModule,
    PrismaModule,
    HealthModule,
    FoodsModule,
    NutrientsModule,
    MeasuresModule,
    AdminModule,
  ],
  providers: [
    // Autenticação: API Key + JWT obrigatórios
    {
      provide: APP_GUARD,
      useClass: CombinedAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
