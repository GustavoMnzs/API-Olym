import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMeasureDto {
  @ApiProperty({ description: 'ID do alimento associado', example: 1 })
  @IsNumber()
  foodId: number;

  @ApiProperty({ description: 'Descrição da medida caseira', example: '1 colher de sopa' })
  @IsString()
  @IsNotEmpty()
  measureDescription: string;

  @ApiProperty({ description: 'Quantidade em gramas', example: 25 })
  @IsNumber()
  @Min(0)
  grams: number;
}

export class UpdateMeasureDto {
  @ApiPropertyOptional({ description: 'Descrição da medida caseira', example: '1 xícara' })
  @IsOptional()
  @IsString()
  measureDescription?: string;

  @ApiPropertyOptional({ description: 'Quantidade em gramas', example: 160 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grams?: number;
}

export class MeasureResponseDto {
  @ApiProperty({ description: 'ID da medida', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID do alimento', example: 1 })
  foodId: number;

  @ApiProperty({ description: 'Descrição da medida caseira', example: '1 colher de sopa' })
  measureDescription: string;

  @ApiProperty({ description: 'Quantidade em gramas', example: 25 })
  grams: number;
}
