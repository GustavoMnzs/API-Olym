import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMeasureDto, MeasureResponseDto, UpdateMeasureDto } from './dto/measure.dto';
import { MeasuresService } from './measures.service';

@ApiTags('Measures')
@Controller('measures')
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar medidas caseiras', description: 'Retorna todas as medidas caseiras, opcionalmente filtradas por alimento' })
  @ApiQuery({ name: 'foodId', required: false, description: 'Filtrar por ID do alimento', example: 1 })
  @ApiResponse({ status: 200, description: 'Lista de medidas', type: [MeasureResponseDto] })
  findAll(@Query('foodId') foodId?: number) {
    return this.measuresService.findAll(foodId ? Number(foodId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter medida por ID', description: 'Retorna uma medida caseira específica' })
  @ApiParam({ name: 'id', description: 'ID da medida', example: 1 })
  @ApiResponse({ status: 200, description: 'Medida encontrada', type: MeasureResponseDto })
  @ApiResponse({ status: 404, description: 'Medida não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.measuresService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar medida caseira', description: 'Cadastra uma nova medida caseira para um alimento' })
  @ApiResponse({ status: 201, description: 'Medida criada', type: MeasureResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Alimento não encontrado' })
  create(@Body() dto: CreateMeasureDto) {
    return this.measuresService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar medida caseira', description: 'Atualiza uma medida caseira existente' })
  @ApiParam({ name: 'id', description: 'ID da medida', example: 1 })
  @ApiResponse({ status: 200, description: 'Medida atualizada', type: MeasureResponseDto })
  @ApiResponse({ status: 404, description: 'Medida não encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMeasureDto) {
    return this.measuresService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir medida caseira', description: 'Remove uma medida caseira' })
  @ApiParam({ name: 'id', description: 'ID da medida', example: 1 })
  @ApiResponse({ status: 200, description: 'Medida excluída' })
  @ApiResponse({ status: 404, description: 'Medida não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.measuresService.remove(id);
  }
}
