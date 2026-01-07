import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNutrientDto, NutrientResponseDto, UpdateNutrientDto } from './dto/nutrient.dto';
import { NutrientsService } from './nutrients.service';

@ApiTags('Nutrients')
@Controller('nutrients')
export class NutrientsController {
  constructor(private readonly nutrientsService: NutrientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar nutrientes', description: 'Retorna todos os nutrientes cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista de nutrientes', type: [NutrientResponseDto] })
  findAll() {
    return this.nutrientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter nutriente por ID', description: 'Retorna um nutriente específico' })
  @ApiParam({ name: 'id', description: 'ID do nutriente', example: 1 })
  @ApiResponse({ status: 200, description: 'Nutriente encontrado', type: NutrientResponseDto })
  @ApiResponse({ status: 404, description: 'Nutriente não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nutrientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar nutriente', description: 'Cadastra um novo nutriente' })
  @ApiResponse({ status: 201, description: 'Nutriente criado', type: NutrientResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Nutriente já existe' })
  create(@Body() dto: CreateNutrientDto) {
    return this.nutrientsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar nutriente', description: 'Atualiza um nutriente existente' })
  @ApiParam({ name: 'id', description: 'ID do nutriente', example: 1 })
  @ApiResponse({ status: 200, description: 'Nutriente atualizado', type: NutrientResponseDto })
  @ApiResponse({ status: 404, description: 'Nutriente não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNutrientDto) {
    return this.nutrientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir nutriente', description: 'Remove um nutriente do sistema' })
  @ApiParam({ name: 'id', description: 'ID do nutriente', example: 1 })
  @ApiResponse({ status: 200, description: 'Nutriente excluído' })
  @ApiResponse({ status: 404, description: 'Nutriente não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nutrientsService.remove(id);
  }
}
