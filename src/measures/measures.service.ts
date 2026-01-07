import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeasureDto, UpdateMeasureDto } from './dto/measure.dto';

@Injectable()
export class MeasuresService {
  constructor(private prisma: PrismaService) {}

  async findAll(foodId?: number) {
    const where = foodId ? { foodId } : {};
    const measures = await this.prisma.measure.findMany({
      where,
      include: { food: { select: { description: true } } },
      orderBy: { measureDescription: 'asc' },
    });
    return measures.map(m => ({
      id: m.id,
      foodId: m.foodId,
      foodDescription: m.food.description,
      measureDescription: m.measureDescription,
      grams: Number(m.grams),
    }));
  }

  async findOne(id: number) {
    const measure = await this.prisma.measure.findUnique({
      where: { id },
      include: { food: { select: { description: true } } },
    });
    if (!measure) {
      throw new NotFoundException(`Medida com ID ${id} não encontrada`);
    }
    return {
      id: measure.id,
      foodId: measure.foodId,
      foodDescription: measure.food.description,
      measureDescription: measure.measureDescription,
      grams: Number(measure.grams),
    };
  }

  async create(dto: CreateMeasureDto) {
    const food = await this.prisma.food.findFirst({
      where: { id: dto.foodId, deletedAt: null },
    });
    if (!food) {
      throw new NotFoundException(`Alimento com ID ${dto.foodId} não encontrado`);
    }

    const measure = await this.prisma.measure.create({
      data: {
        foodId: dto.foodId,
        measureDescription: dto.measureDescription,
        grams: dto.grams,
      },
    });
    return { ...measure, grams: Number(measure.grams) };
  }

  async update(id: number, dto: UpdateMeasureDto) {
    await this.findOne(id);
    const measure = await this.prisma.measure.update({
      where: { id },
      data: dto,
    });
    return { ...measure, grams: Number(measure.grams) };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.measure.delete({ where: { id } });
    return { message: 'Medida excluída com sucesso' };
  }
}
