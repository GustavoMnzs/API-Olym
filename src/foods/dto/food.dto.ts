import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFoodDto {
  @ApiProperty({ description: 'Descrição do alimento em português', example: 'Arroz, branco, cozido' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Grupo de alimentos', example: 'Cereais e derivados' })
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty({ description: 'Tabela de origem', example: 'TACO', enum: ['TACO', 'TBCA'] })
  @IsString()
  @IsIn(['TACO', 'TBCA'])
  sourceTable: string;

  @ApiProperty({ description: 'Porção padrão em gramas', example: 100 })
  @IsNumber()
  @Min(0)
  portionGrams: number;
}

export class UpdateFoodDto {
  @ApiPropertyOptional({ description: 'Descrição do alimento em português', example: 'Arroz, integral, cozido' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Grupo de alimentos', example: 'Cereais e derivados' })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ description: 'Tabela de origem', example: 'TACO', enum: ['TACO', 'TBCA'] })
  @IsOptional()
  @IsString()
  @IsIn(['TACO', 'TBCA'])
  sourceTable?: string;

  @ApiPropertyOptional({ description: 'Porção padrão em gramas', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  portionGrams?: number;
}

export class FoodFilterDto {
  @ApiPropertyOptional({ description: 'Busca por nome/parte do nome', example: 'arroz' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrar por grupo de alimentos', example: 'Cereais e derivados' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tabela de origem', example: 'TACO', enum: ['TACO', 'TBCA'] })
  @IsOptional()
  @IsString()
  @IsIn(['TACO', 'TBCA'])
  source?: string;
}

export class CalculateNutritionDto {
  @ApiProperty({ description: 'Quantidade em gramas para cálculo', example: 150 })
  @IsNumber()
  @Min(0)
  amount_grams: number;
}

export class NutrientValueDto {
  @ApiProperty({ description: 'ID do nutriente', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do nutriente', example: 'Energia' })
  name: string;

  @ApiProperty({ description: 'Unidade de medida', example: 'kcal' })
  unit: string;

  @ApiProperty({ description: 'Valor por 100g', example: 128.0 })
  valuePer100g: number;
}

export class MeasureResponseDto {
  @ApiProperty({ description: 'ID da medida', example: 1 })
  id: number;

  @ApiProperty({ description: 'Descrição da medida caseira', example: '1 colher de sopa' })
  measureDescription: string;

  @ApiProperty({ description: 'Quantidade em gramas', example: 25 })
  grams: number;
}

export class FoodResponseDto {
  @ApiProperty({ description: 'ID do alimento', example: 1 })
  id: number;

  @ApiProperty({ description: 'Descrição do alimento', example: 'Arroz, branco, cozido' })
  description: string;

  @ApiProperty({ description: 'Grupo de alimentos', example: 'Cereais e derivados' })
  groupName: string;

  @ApiProperty({ description: 'Tabela de origem', example: 'TACO' })
  sourceTable: string;

  @ApiProperty({ description: 'Porção padrão em gramas', example: 100 })
  portionGrams: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class FoodDetailResponseDto extends FoodResponseDto {
  @ApiProperty({ description: 'Lista de nutrientes', type: [NutrientValueDto] })
  nutrients: NutrientValueDto[];

  @ApiProperty({ description: 'Lista de medidas caseiras', type: [MeasureResponseDto] })
  measures: MeasureResponseDto[];
}

export class CalculatedNutrientDto {
  @ApiProperty({ description: 'Nome do nutriente', example: 'Energia' })
  name: string;

  @ApiProperty({ description: 'Unidade de medida', example: 'kcal' })
  unit: string;

  @ApiProperty({ description: 'Valor calculado para a quantidade informada', example: 192.0 })
  calculatedValue: number;
}

export class CalculateNutritionResponseDto {
  @ApiProperty({ description: 'ID do alimento', example: 1 })
  foodId: number;

  @ApiProperty({ description: 'Descrição do alimento', example: 'Arroz, branco, cozido' })
  foodDescription: string;

  @ApiProperty({ description: 'Quantidade em gramas utilizada no cálculo', example: 150 })
  amountGrams: number;

  @ApiProperty({ description: 'Nutrientes calculados', type: [CalculatedNutrientDto] })
  nutrients: CalculatedNutrientDto[];
}
