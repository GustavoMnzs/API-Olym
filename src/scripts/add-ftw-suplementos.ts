/**
 * Adicionar suplementos FTW e outras marcas brasileiras
 * Dados baseados nos rótulos oficiais dos produtos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Suplemento {
  nome: string;
  energia: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  fibra?: number;
}

// Dados baseados em rótulos oficiais
const SUPLEMENTOS_FTW: Suplemento[] = [
  // FTW Wheys
  { nome: 'FTW Whey 3W (scoop 30g)', energia: 117, proteina: 23, carboidrato: 3, gordura: 1.2 },
  { nome: 'FTW Whey Isolado (scoop 30g)', energia: 112, proteina: 26, carboidrato: 1, gordura: 0.3 },
  { nome: 'FTW Whey Concentrado (scoop 30g)', energia: 120, proteina: 22, carboidrato: 4, gordura: 1.5 },
  { nome: 'FTW Delicious 3 Whey Chocolate (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'FTW Delicious 3 Whey Morango (scoop 30g)', energia: 116, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'FTW Delicious 3 Whey Baunilha (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'FTW Whey Protein Gourmet (scoop 30g)', energia: 119, proteina: 21, carboidrato: 5, gordura: 1.5 },
  { nome: 'FTW Vegan Protein (scoop 30g)', energia: 110, proteina: 20, carboidrato: 5, gordura: 1.5 },
  
  // FTW Outros
  { nome: 'FTW Creatina Monohidratada (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'FTW BCAA 2:1:1 (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'FTW Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'FTW Pré-Treino (dose 6g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'FTW Hipercalórico (porção 100g)', energia: 380, proteina: 15, carboidrato: 70, gordura: 3 },
  { nome: 'FTW Albumina (porção 30g)', energia: 108, proteina: 25, carboidrato: 1, gordura: 0 },
  { nome: 'FTW Colágeno Hidrolisado (dose 10g)', energia: 36, proteina: 9, carboidrato: 0, gordura: 0 },
];

const SUPLEMENTOS_GROWTH: Suplemento[] = [
  { nome: 'Growth Whey Concentrado (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'Growth Whey Isolado (scoop 30g)', energia: 110, proteina: 25, carboidrato: 1, gordura: 0.5 },
  { nome: 'Growth Whey 3W (scoop 30g)', energia: 115, proteina: 23, carboidrato: 3, gordura: 1 },
  { nome: 'Growth Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Growth BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Growth Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Growth Pré-Treino (dose 6g)', energia: 8, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Growth Hipercalórico (porção 100g)', energia: 370, proteina: 14, carboidrato: 68, gordura: 3 },
  { nome: 'Growth Pasta de Amendoim (porção 30g)', energia: 180, proteina: 8, carboidrato: 6, gordura: 14 },
  { nome: 'Growth Proteína de Ervilha (scoop 30g)', energia: 108, proteina: 21, carboidrato: 3, gordura: 1.5 },
  { nome: 'Growth Proteína de Arroz (scoop 30g)', energia: 112, proteina: 22, carboidrato: 2, gordura: 1 },
];

const SUPLEMENTOS_MAX_TITANIUM: Suplemento[] = [
  { nome: 'Max Titanium Whey Pro (scoop 30g)', energia: 117, proteina: 23, carboidrato: 3, gordura: 1.2 },
  { nome: 'Max Titanium 100% Whey (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'Max Titanium Whey Blend (scoop 30g)', energia: 115, proteina: 21, carboidrato: 5, gordura: 1.5 },
  { nome: 'Max Titanium Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Max Titanium BCAA 2400 (4 cápsulas)', energia: 16, proteina: 4, carboidrato: 0, gordura: 0 },
  { nome: 'Max Titanium Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Max Titanium Horus Pré-Treino (dose 6g)', energia: 8, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Max Titanium Mass Titanium (porção 150g)', energia: 580, proteina: 28, carboidrato: 105, gordura: 4 },
  { nome: 'Max Titanium Top Whey 3W (scoop 30g)', energia: 116, proteina: 24, carboidrato: 2, gordura: 1 },
];

const SUPLEMENTOS_INTEGRALMEDICA: Suplemento[] = [
  { nome: 'Integralmédica Whey Protein (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Integralmédica ISO Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Integralmédica ISO Triple Zero (scoop 30g)', energia: 106, proteina: 26, carboidrato: 0, gordura: 0 },
  { nome: 'Integralmédica Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Integralmédica BCAA Fix (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Integralmédica Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Darkness Évora PW Pré-Treino (dose 5.5g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Darkness Insane Pré-Treino (dose 6g)', energia: 12, proteina: 0, carboidrato: 3, gordura: 0 },
  { nome: 'Darkness Flame Pré-Treino (dose 6g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Integralmédica Protein Crisp Bar (45g)', energia: 190, proteina: 12, carboidrato: 18, gordura: 8, fibra: 2 },
  { nome: 'Integralmédica Massa 3200 (porção 100g)', energia: 380, proteina: 15, carboidrato: 72, gordura: 3 },
];

const SUPLEMENTOS_PROBIOTICA: Suplemento[] = [
  { nome: 'Probiótica Whey 100% Pure (scoop 30g)', energia: 117, proteina: 23, carboidrato: 4, gordura: 1 },
  { nome: 'Probiótica ISO Protein (scoop 30g)', energia: 110, proteina: 25, carboidrato: 1, gordura: 0.5 },
  { nome: 'Probiótica Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Probiótica BCAA Plus (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Probiótica Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Probiótica Massa 3200 (porção 100g)', energia: 380, proteina: 15, carboidrato: 72, gordura: 3 },
  { nome: 'Probiótica Albumina (porção 30g)', energia: 108, proteina: 24, carboidrato: 2, gordura: 0 },
];

const SUPLEMENTOS_BLACK_SKULL: Suplemento[] = [
  { nome: 'Black Skull Whey Zero (scoop 30g)', energia: 112, proteina: 24, carboidrato: 2, gordura: 0.5 },
  { nome: 'Black Skull Isolate Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Black Skull Creatine Turbo (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Black Skull BCAA 2500 (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Black Skull Bone Crusher Pré-Treino (dose 5g)', energia: 5, proteina: 0, carboidrato: 1, gordura: 0 },
  { nome: 'Black Skull Caveira Preta Pré-Treino (dose 6g)', energia: 8, proteina: 0, carboidrato: 2, gordura: 0 },
];

const SUPLEMENTOS_DUX: Suplemento[] = [
  { nome: 'DUX Whey Protein Concentrado (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'DUX Whey Protein Isolado (scoop 30g)', energia: 110, proteina: 25, carboidrato: 1, gordura: 0.5 },
  { nome: 'DUX Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'DUX BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'DUX Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'DUX Pré-Treino (dose 6g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'DUX Colágeno Verisol (dose 2.5g)', energia: 9, proteina: 2.25, carboidrato: 0, gordura: 0 },
];

const SUPLEMENTOS_ESSENTIAL: Suplemento[] = [
  { nome: 'Essential Whey Protein (scoop 30g)', energia: 115, proteina: 23, carboidrato: 3, gordura: 1 },
  { nome: 'Essential Cacao Whey (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Essential Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Essential Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Essential Colágeno Articular (dose 10g)', energia: 36, proteina: 9, carboidrato: 0, gordura: 0 },
  { nome: 'Essential Ômega 3 (cápsula)', energia: 9, proteina: 0, carboidrato: 0, gordura: 1 },
];

const SUPLEMENTOS_ATLHETICA: Suplemento[] = [
  { nome: 'Atlhetica Whey Protein (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Atlhetica ISO Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Atlhetica Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Atlhetica BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Atlhetica Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Atlhetica Pré-Treino (dose 6g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

async function inserirSuplementos(suplementos: Suplemento[], marca: string): Promise<number> {
  let inseridos = 0;
  
  for (const sup of suplementos) {
    const exists = await prisma.food.findFirst({
      where: { description: sup.nome }
    });
    if (exists) continue;

    const food = await prisma.food.create({
      data: {
        description: sup.nome,
        groupName: 'Suplementos',
        sourceTable: 'SUPLEMENTOS',
        portionGrams: 100,
      }
    });

    const nutrientes = [
      { name: 'Energia', unit: 'kcal', value: sup.energia },
      { name: 'Proteína', unit: 'g', value: sup.proteina },
      { name: 'Carboidrato', unit: 'g', value: sup.carboidrato },
      { name: 'Lipídios', unit: 'g', value: sup.gordura },
    ];
    if (sup.fibra) nutrientes.push({ name: 'Fibra alimentar', unit: 'g', value: sup.fibra });

    for (const n of nutrientes) {
      const nutrientId = await getOrCreateNutrient(n.name, n.unit);
      await prisma.foodNutrient.create({
        data: { foodId: food.id, nutrientId, valuePer100g: n.value }
      });
    }

    inseridos++;
  }
  
  return inseridos;
}

async function main() {
  console.log('💪 ADICIONANDO SUPLEMENTOS DE MARCAS BRASILEIRAS\n');

  let total = 0;

  console.log('🏋️ FTW...');
  total += await inserirSuplementos(SUPLEMENTOS_FTW, 'FTW');
  
  console.log('🏋️ Growth...');
  total += await inserirSuplementos(SUPLEMENTOS_GROWTH, 'Growth');
  
  console.log('🏋️ Max Titanium...');
  total += await inserirSuplementos(SUPLEMENTOS_MAX_TITANIUM, 'Max Titanium');
  
  console.log('🏋️ Integralmédica/Darkness...');
  total += await inserirSuplementos(SUPLEMENTOS_INTEGRALMEDICA, 'Integralmédica');
  
  console.log('🏋️ Probiótica...');
  total += await inserirSuplementos(SUPLEMENTOS_PROBIOTICA, 'Probiótica');
  
  console.log('🏋️ Black Skull...');
  total += await inserirSuplementos(SUPLEMENTOS_BLACK_SKULL, 'Black Skull');
  
  console.log('🏋️ DUX...');
  total += await inserirSuplementos(SUPLEMENTOS_DUX, 'DUX');
  
  console.log('🏋️ Essential...');
  total += await inserirSuplementos(SUPLEMENTOS_ESSENTIAL, 'Essential');
  
  console.log('🏋️ Atlhetica...');
  total += await inserirSuplementos(SUPLEMENTOS_ATLHETICA, 'Atlhetica');

  const totalSup = await prisma.food.count({ where: { sourceTable: 'SUPLEMENTOS' } });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Novos suplementos: ${total}`);
  console.log(`📊 Total suplementos: ${totalSup}`);
  console.log(`📊 Total geral: ${totalGeral}`);

  await prisma.$disconnect();
}

main().catch(console.error);
