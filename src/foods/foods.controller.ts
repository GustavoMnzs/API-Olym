import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    CalculateNutritionDto,
    CalculateNutritionResponseDto,
    CreateFoodDto,
    FoodDetailResponseDto,
    FoodFilterDto,
    FoodResponseDto,
    UpdateFoodDto,
} from './dto/food.dto';
import { FoodsService } from './foods.service';

@ApiTags('Foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alimentos', description: 'Retorna lista paginada de alimentos com filtros opcionais' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página', example: 1 })
  @ApiQuery({ name: 'size', required: false, description: 'Itens por página', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: 'Busca por nome/parte do nome', example: 'arroz' })
  @ApiQuery({ name: 'group', required: false, description: 'Filtrar por grupo', example: 'Cereais e derivados' })
  @ApiQuery({ name: 'source', required: false, description: 'Filtrar por fonte (TACO/TBCA)', example: 'TACO' })
  @ApiResponse({ status: 200, description: 'Lista de alimentos retornada com sucesso' })
  findAll(@Query() filters: FoodFilterDto) {
    return this.foodsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter alimento por ID', description: 'Retorna detalhes de um alimento incluindo nutrientes e medidas caseiras' })
  @ApiParam({ name: 'id', description: 'ID do alimento', example: 1 })
  @ApiResponse({ status: 200, description: 'Alimento encontrado', type: FoodDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Alimento não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar alimento', description: 'Cadastra um novo alimento manualmente' })
  @ApiResponse({ status: 201, description: 'Alimento criado com sucesso', type: FoodResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() dto: CreateFoodDto) {
    return this.foodsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar alimento', description: 'Atualiza os dados de um alimento existente' })
  @ApiParam({ name: 'id', description: 'ID do alimento', example: 1 })
  @ApiResponse({ status: 200, description: 'Alimento atualizado com sucesso', type: FoodResponseDto })
  @ApiResponse({ status: 404, description: 'Alimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFoodDto) {
    return this.foodsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir alimento', description: 'Realiza exclusão lógica (soft delete) do alimento' })
  @ApiParam({ name: 'id', description: 'ID do alimento', example: 1 })
  @ApiResponse({ status: 200, description: 'Alimento excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Alimento não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.remove(id);
  }

  @Post(':id/calculate')
  @ApiOperation({ summary: 'Calcular nutrição por porção', description: 'Calcula os valores nutricionais para uma quantidade específica em gramas' })
  @ApiParam({ name: 'id', description: 'ID do alimento', example: 1 })
  @ApiResponse({ status: 200, description: 'Cálculo realizado com sucesso', type: CalculateNutritionResponseDto })
  @ApiResponse({ status: 404, description: 'Alimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  calculateNutrition(@Param('id', ParseIntPipe) id: number, @Body() dto: CalculateNutritionDto) {
    return this.foodsService.calculateNutrition(id, dto);
  }
}
