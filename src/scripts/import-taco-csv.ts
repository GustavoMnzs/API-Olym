/**
 * Importador de dados TACO a partir de CSV completo
 * 
 * Este script lê o arquivo data/taco_completo.csv com dados reais da TACO
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function inicializarNutrientes(): Promise<Map<string, number>> {
  const nutrientesNomes = [
    { name: 'Energia', unit: 'kcal' },
    { name: 'Proteína', unit: 'g' },
    { name: 'Carboidrato total', unit: 'g' },
    { name: 'Lipídeos', unit: 'g' },
    { name: 'Fibra alimentar', unit: 'g' },
    { name: 'Cálcio', unit: 'mg' },
    { name: 'Ferro', unit: 'mg' },
    { name: 'Sódio', unit: 'mg' },
    { name: 'Potássio', unit: 'mg' },
    { name: 'Vitamina C', unit: 'mg' },
  ];

  for (const n of nutrientesNomes) {
    await prisma.nutrient.upsert({
      where: { name: n.name },
      update: {},
      create: n,
    });
  }

  const nutrients = await prisma.nutrient.findMany();
  return new Map(nutrients.map(n => [n.name, n.id]));
}


function parseNum(val: string | undefined): number | null {
  if (!val || val === 'Tr' || val === '-' || val === 'NA' || val === '*' || val.trim() === '') {
    return null;
  }
  const num = parseFloat(val.replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

async function importarTACO(nutrientIdMap: Map<string, number>): Promise<number> {
  const csvPath = './data/taco_completo.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.log(`❌ Arquivo não encontrado: ${csvPath}`);
    console.log('   Execute primeiro: npm run download:taco');
    return 0;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  let importados = 0;
  let atualizados = 0;

  for (const row of records) {
    const nome = row.descricao || row.description || row.nome;
    const grupo = row.grupo || row.category || row.group || 'Outros';
    
    if (!nome) continue;

    const nutrientes: Record<string, number | null> = {
      'Energia': parseNum(row.energia_kcal || row.energy_kcal || row.kcal),
      'Proteína': parseNum(row.proteina_g || row.protein_g || row.proteina),
      'Carboidrato total': parseNum(row.carboidrato_g || row.carbohydrate_g || row.carboidrato),
      'Lipídeos': parseNum(row.lipideos_g || row.lipid_g || row.lipideos || row.gordura),
      'Fibra alimentar': parseNum(row.fibra_g || row.fiber_g || row.fibra),
      'Cálcio': parseNum(row.calcio_mg || row.calcium_mg || row.calcio),
      'Ferro': parseNum(row.ferro_mg || row.iron_mg || row.ferro),
      'Sódio': parseNum(row.sodio_mg || row.sodium_mg || row.sodio),
      'Potássio': parseNum(row.potassio_mg || row.potassium_mg || row.potassio),
      'Vitamina C': parseNum(row.vitamina_c_mg || row.vitamin_c_mg || row.vitc),
    };

    try {
      const existing = await prisma.food.findFirst({
        where: { description: nome, sourceTable: 'TACO' },
      });

      let foodId: number;

      if (existing) {
        await prisma.food.update({
          where: { id: existing.id },
          data: { groupName: grupo },
        });
        foodId = existing.id;
        atualizados++;
      } else {
        const food = await prisma.food.create({
          data: {
            description: nome,
            groupName: grupo,
            sourceTable: 'TACO',
            portionGrams: 100,
          },
        });
        foodId = food.id;
        importados++;
      }

      for (const [nutrienteName, value] of Object.entries(nutrientes)) {
        if (value === null) continue;
        const nutrientId = nutrientIdMap.get(nutrienteName);
        if (!nutrientId) continue;

        await prisma.foodNutrient.upsert({
          where: { foodId_nutrientId: { foodId, nutrientId } },
          update: { valuePer100g: value },
          create: { foodId, nutrientId, valuePer100g: value },
        });
      }
    } catch (error) {
      // Ignorar erros de duplicação
    }
  }

  console.log(`✅ TACO: ${importados} novos, ${atualizados} atualizados`);
  return importados + atualizados;
}

async function main(): Promise<void> {
  console.log('🚀 IMPORTAÇÃO TACO (CSV Completo)\n');
  
  try {
    const nutrientIdMap = await inicializarNutrientes();
    await importarTACO(nutrientIdMap);
    
    const total = await prisma.food.count({ where: { sourceTable: 'TACO' } });
    console.log(`\n📊 Total TACO no banco: ${total}`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
