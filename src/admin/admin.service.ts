import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

interface CsvRow {
  [key: string]: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async importTaco(): Promise<{ message: string; imported: number; updated: number }> {
    return this.importFromCsv('taco.csv', 'TACO');
  }

  async importTbca(): Promise<{ message: string; imported: number; updated: number }> {
    return this.importFromCsv('tbca.csv', 'TBCA');
  }

  private async importFromCsv(filename: string, source: string) {
    const filePath = path.join(process.cwd(), 'data', filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo ${filename} não encontrado em ./data/`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records: CsvRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';',
      trim: true,
    });

    let imported = 0;
    let updated = 0;

    // Nutrientes padrão
    const nutrientMap: Record<string, { name: string; unit: string }> = {
      energia_kcal: { name: 'Energia', unit: 'kcal' },
      proteina_g: { name: 'Proteína', unit: 'g' },
      carboidrato_g: { name: 'Carboidrato total', unit: 'g' },
      lipideos_g: { name: 'Lipídeos', unit: 'g' },
      fibra_g: { name: 'Fibra alimentar', unit: 'g' },
      calcio_mg: { name: 'Cálcio', unit: 'mg' },
      ferro_mg: { name: 'Ferro', unit: 'mg' },
      sodio_mg: { name: 'Sódio', unit: 'mg' },
      potassio_mg: { name: 'Potássio', unit: 'mg' },
      vitamina_c_mg: { name: 'Vitamina C', unit: 'mg' },
    };

    // Garantir que os nutrientes existam
    for (const [, info] of Object.entries(nutrientMap)) {
      await this.prisma.nutrient.upsert({
        where: { name: info.name },
        update: { unit: info.unit },
        create: { name: info.name, unit: info.unit },
      });
    }

    const nutrients = await this.prisma.nutrient.findMany();
    const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));

    for (const row of records) {
      const description = row.descricao || row.description || row.alimento || '';
      const groupName = row.grupo || row.group || row.categoria || 'Outros';

      if (!description) continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          // Verificar se alimento já existe
          const existing = await tx.food.findFirst({
            where: { description, sourceTable: source, deletedAt: null },
          });

          let foodId: number;

          if (existing) {
            await tx.food.update({
              where: { id: existing.id },
              data: { groupName, portionGrams: 100, updatedAt: new Date() },
            });
            foodId = existing.id;
            updated++;
          } else {
            const newFood = await tx.food.create({
              data: { description, groupName, sourceTable: source, portionGrams: 100 },
            });
            foodId = newFood.id;
            imported++;
          }

          // Processar nutrientes
          for (const [csvKey, info] of Object.entries(nutrientMap)) {
            const rawValue = row[csvKey];
            if (!rawValue || rawValue === '-' || rawValue === 'NA' || rawValue === 'Tr') continue;

            const value = parseFloat(rawValue.replace(',', '.'));
            if (isNaN(value)) continue;

            const nutrientId = nutrientIdMap.get(info.name);
            if (!nutrientId) continue;

            await tx.foodNutrient.upsert({
              where: { foodId_nutrientId: { foodId, nutrientId } },
              update: { valuePer100g: value },
              create: { foodId, nutrientId, valuePer100g: value },
            });
          }
        });
      } catch (error) {
        this.logger.error(`Erro ao processar: ${description}`, error);
      }
    }

    return {
      message: `Importação ${source} concluída`,
      imported,
      updated,
    };
  }
}
