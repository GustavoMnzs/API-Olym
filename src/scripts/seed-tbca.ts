import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CsvRow {
  [key: string]: string;
}

async function main() {
  console.log('🌱 Iniciando importação TBCA...');

  const filePath = path.join(process.cwd(), 'data', 'tbca.csv');

  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo tbca.csv não encontrado em ./data/');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ';',
    trim: true,
  });

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

  for (const [, info] of Object.entries(nutrientMap)) {
    await prisma.nutrient.upsert({
      where: { name: info.name },
      update: { unit: info.unit },
      create: { name: info.name, unit: info.unit },
    });
  }

  const nutrients = await prisma.nutrient.findMany();
  const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));

  let imported = 0;
  let updated = 0;

  for (const row of records) {
    const description = row.descricao || row.description || row.alimento || '';
    const groupName = row.grupo || row.group || row.categoria || 'Outros';

    if (!description) continue;

    try {
      const existing = await prisma.food.findFirst({
        where: { description, sourceTable: 'TBCA', deletedAt: null },
      });

      let foodId: number;

      if (existing) {
        await prisma.food.update({
          where: { id: existing.id },
          data: { groupName, portionGrams: 100 },
        });
        foodId = existing.id;
        updated++;
      } else {
        const newFood = await prisma.food.create({
          data: { description, groupName, sourceTable: 'TBCA', portionGrams: 100 },
        });
        foodId = newFood.id;
        imported++;
      }

      for (const [csvKey, info] of Object.entries(nutrientMap)) {
        const rawValue = row[csvKey];
        if (!rawValue || rawValue === '-' || rawValue === 'NA' || rawValue === 'Tr') continue;

        const value = parseFloat(rawValue.replace(',', '.'));
        if (isNaN(value)) continue;

        const nutrientId = nutrientIdMap.get(info.name);
        if (!nutrientId) continue;

        await prisma.foodNutrient.upsert({
          where: { foodId_nutrientId: { foodId, nutrientId } },
          update: { valuePer100g: value },
          create: { foodId, nutrientId, valuePer100g: value },
        });
      }

      process.stdout.write(`\r📦 Processados: ${imported + updated}`);
    } catch (error) {
      console.error(`\n❌ Erro: ${description}`, error);
    }
  }

  console.log(`\n✅ Importação TBCA concluída!`);
  console.log(`   Novos: ${imported} | Atualizados: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
