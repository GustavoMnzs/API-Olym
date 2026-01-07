import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNutrientDto {
  @ApiProperty({ description: 'Nome do nutriente', example: 'Energia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unidade de medida', example: 'kcal' })
  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class UpdateNutrientDto {
  @ApiPropertyOptional({ description: 'Nome do nutriente', example: 'Proteína' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'g' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class NutrientResponseDto {
  @ApiProperty({ description: 'ID do nutriente', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do nutriente', example: 'Energia' })
  name: string;

  @ApiProperty({ description: 'Unidade de medida', example: 'kcal' })
  unit: string;
}
