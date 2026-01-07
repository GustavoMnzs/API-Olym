import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('import/taco')
  @ApiOperation({
    summary: 'Importar dados TACO',
    description: 'Importa dados da tabela TACO a partir do arquivo taco.csv em ./data/. Requer API Key.',
  })
  @ApiResponse({ status: 200, description: 'Importação realizada com sucesso' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  @ApiResponse({ status: 500, description: 'Erro na importação' })
  importTaco() {
    return this.adminService.importTaco();
  }

  @Post('import/tbca')
  @ApiOperation({
    summary: 'Importar dados TBCA',
    description: 'Importa dados da tabela TBCA a partir do arquivo tbca.csv em ./data/. Requer API Key.',
  })
  @ApiResponse({ status: 200, description: 'Importação realizada com sucesso' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  @ApiResponse({ status: 500, description: 'Erro na importação' })
  importTbca() {
    return this.adminService.importTbca();
  }
}
