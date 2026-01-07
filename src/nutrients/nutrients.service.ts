import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutrientDto, UpdateNutrientDto } from './dto/nutrient.dto';

@Injectable()
export class NutrientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.nutrient.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const nutrient = await this.prisma.nutrient.findUnique({ where: { id } });
    if (!nutrient) {
      throw new NotFoundException(`Nutriente com ID ${id} não encontrado`);
    }
    return nutrient;
  }

  async create(dto: CreateNutrientDto) {
    const existing = await this.prisma.nutrient.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Nutriente "${dto.name}" já existe`);
    }
    return this.prisma.nutrient.create({ data: dto });
  }

  async update(id: number, dto: UpdateNutrientDto) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.nutrient.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Nutriente "${dto.name}" já existe`);
      }
    }
    return this.prisma.nutrient.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.nutrient.delete({ where: { id } });
    return { message: 'Nutriente excluído com sucesso' };
  }
}
