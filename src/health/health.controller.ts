import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Verificar saúde da API',
    description: 'Retorna o status de saúde da API e conexão com banco de dados',
  })
  @ApiResponse({ status: 200, description: 'API saudável' })
  @ApiResponse({ status: 503, description: 'API com problemas' })
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Verifica se a aplicação está rodando',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Verifica se a aplicação está pronta para receber tráfego',
  })
  @ApiResponse({ status: 200, description: 'Aplicação pronta' })
  @ApiResponse({ status: 503, description: 'Aplicação não está pronta' })
  async ready() {
    return this.healthService.checkReadiness();
  }
}
