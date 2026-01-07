/**
 * Adicionar suplementos Diabo Verde e outras marcas
 * Dados baseados nos rótulos oficiais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Suplemento {
  nome: string;
  energia: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
}

// Diabo Verde - dados dos rótulos
const DIABO_VERDE: Suplemento[] = [
  { nome: 'Diabo Verde Whey Protein Concentrado (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'Diabo Verde Whey Protein Isolado (scoop 30g)', energia: 110, proteina: 25, carboidrato: 1, gordura: 0.5 },
  { nome: 'Diabo Verde Whey 3W (scoop 30g)', energia: 115, proteina: 23, carboidrato: 3, gordura: 1 },
  { nome: 'Diabo Verde Creatina Monohidratada (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Diabo Verde BCAA 2:1:1 (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Diabo Verde Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Diabo Verde Pré-Treino (dose 6g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Diabo Verde Albumina (porção 30g)', energia: 108, proteina: 25, carboidrato: 1, gordura: 0 },
  { nome: 'Diabo Verde Hipercalórico (porção 100g)', energia: 375, proteina: 15, carboidrato: 70, gordura: 3 },
  { nome: 'Diabo Verde Termogênico (dose)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
];

// New Millen
const NEW_MILLEN: Suplemento[] = [
  { nome: 'New Millen Whey Concentrado (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'New Millen Whey Isolado (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'New Millen Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'New Millen BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'New Millen Glutamina (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'New Millen Pré-Treino (dose 6g)', energia: 8, proteina: 0, carboidrato: 2, gordura: 0 },
];

// Shark Pro
const SHARK_PRO: Suplemento[] = [
  { nome: 'Shark Pro Whey Concentrado (scoop 30g)', energia: 118, proteina: 22, carboidrato: 4, gordura: 1.3 },
  { nome: 'Shark Pro Whey Isolado (scoop 30g)', energia: 110, proteina: 25, carboidrato: 1, gordura: 0.5 },
  { nome: 'Shark Pro Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Shark Pro BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
];

// Leader Nutrition
const LEADER: Suplemento[] = [
  { nome: 'Leader Whey Protein (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Leader ISO Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Leader Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Leader BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
];

// Nutrata
const NUTRATA: Suplemento[] = [
  { nome: 'Nutrata Whey Protein (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Nutrata ISO Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Nutrata Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Nutrata BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
];

// Profit
const PROFIT: Suplemento[] = [
  { nome: 'Profit Whey Protein (scoop 30g)', energia: 117, proteina: 22, carboidrato: 4, gordura: 1.2 },
  { nome: 'Profit ISO Whey (scoop 30g)', energia: 108, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Profit Creatina (dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Profit BCAA (dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
];

// Barras de proteína populares
const BARRAS: Suplemento[] = [
  { nome: 'Quest Bar Chocolate Chip Cookie Dough (60g)', energia: 200, proteina: 21, carboidrato: 21, gordura: 8 },
  { nome: 'Quest Bar Cookies and Cream (60g)', energia: 200, proteina: 21, carboidrato: 22, gordura: 8 },
  { nome: 'Quest Bar Brownie (60g)', energia: 200, proteina: 20, carboidrato: 22, gordura: 9 },
  { nome: 'Bold Bar Brownie (60g)', energia: 200, proteina: 20, carboidrato: 18, gordura: 7 },
  { nome: 'Bold Bar Cookies (60g)', energia: 195, proteina: 20, carboidrato: 17, gordura: 7 },
  { nome: 'Bold Bar Paçoca (60g)', energia: 210, proteina: 20, carboidrato: 19, gordura: 8 },
  { nome: 'Grenade Carb Killa Chocolate (60g)', energia: 220, proteina: 23, carboidrato: 15, gordura: 9 },
  { nome: 'Barebells Protein Bar (55g)', energia: 200, proteina: 20, carboidrato: 18, gordura: 8 },
  { nome: 'RXBar Chocolate Sea Salt (52g)', energia: 210, proteina: 12, carboidrato: 24, gordura: 9 },
  { nome: 'Kind Protein Bar (50g)', energia: 250, proteina: 12, carboidrato: 17, gordura: 17 },
  { nome: 'Clif Bar Chocolate Chip (68g)', energia: 250, proteina: 10, carboidrato: 44, gordura: 5 },
  { nome: 'PowerBar Protein Plus (55g)', energia: 200, proteina: 20, carboidrato: 20, gordura: 6 },
];

// Pastas de amendoim
const PASTAS: Suplemento[] = [
  { nome: 'Dr. Peanut Pasta de Amendoim Original (30g)', energia: 188, proteina: 8, carboidrato: 5, gordura: 15 },
  { nome: 'Dr. Peanut Pasta de Amendoim com Whey (30g)', energia: 175, proteina: 10, carboidrato: 5, gordura: 13 },
  { nome: 'Dr. Peanut Pasta de Amendoim Chocolate (30g)', energia: 180, proteina: 8, carboidrato: 8, gordura: 14 },
  { nome: 'Power One Pasta de Amendoim (30g)', energia: 185, proteina: 8, carboidrato: 5, gordura: 15 },
  { nome: 'Power One Pasta de Amendoim com Cacau (30g)', energia: 178, proteina: 8, carboidrato: 7, gordura: 14 },
  { nome: 'Naked Nuts Pasta de Amendoim (30g)', energia: 180, proteina: 8, carboidrato: 5, gordura: 15 },
  { nome: 'Mandubim Pasta de Amendoim (30g)', energia: 182, proteina: 8, carboidrato: 5, gordura: 15 },
  { nome: 'Vitapower Pasta de Amendoim (30g)', energia: 180, proteina: 8, carboidrato: 5, gordura: 15 },
  { nome: 'Pasta de Amendoim Integral (30g)', energia: 180, proteina: 8, carboidrato: 5, gordura: 15 },
];

// Leites vegetais
const LEITES_VEGETAIS: Suplemento[] = [
  { nome: 'Leite de Amêndoas (200ml)', energia: 26, proteina: 0.5, carboidrato: 3, gordura: 1.2 },
  { nome: 'Leite de Coco (200ml)', energia: 40, proteina: 0.2, carboidrato: 2, gordura: 4 },
  { nome: 'Leite de Aveia (200ml)', energia: 92, proteina: 2, carboidrato: 16, gordura: 2 },
  { nome: 'Leite de Arroz (200ml)', energia: 94, proteina: 0.5, carboidrato: 20, gordura: 1 },
  { nome: 'Leite de Soja (200ml)', energia: 72, proteina: 6, carboidrato: 4, gordura: 4 },
  { nome: 'Silk Leite de Amêndoas (200ml)', energia: 30, proteina: 1, carboidrato: 3, gordura: 1.5 },
  { nome: 'Alpro Leite de Soja (200ml)', energia: 78, proteina: 6, carboidrato: 5, gordura: 4 },
  { nome: 'A Tal da Castanha Leite de Castanha (200ml)', energia: 50, proteina: 1, carboidrato: 4, gordura: 3 },
];

// Açaí
const ACAI: Suplemento[] = [
  { nome: 'Açaí Puro (100g)', energia: 58, proteina: 1, carboidrato: 6, gordura: 3.5 },
  { nome: 'Açaí com Guaraná (100g)', energia: 110, proteina: 1, carboidrato: 22, gordura: 3 },
  { nome: 'Açaí na Tigela com Granola (200g)', energia: 280, proteina: 4, carboidrato: 50, gordura: 8 },
  { nome: 'Açaí na Tigela com Banana (200g)', energia: 260, proteina: 3, carboidrato: 48, gordura: 7 },
  { nome: 'Oakberry Açaí Original (300ml)', energia: 180, proteina: 2, carboidrato: 35, gordura: 5 },
  { nome: 'Oakberry Açaí com Granola (300ml)', energia: 280, proteina: 5, carboidrato: 50, gordura: 8 },
  { nome: 'Frooty Açaí (100g)', energia: 60, proteina: 1, carboidrato: 7, gordura: 3.5 },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

async function inserir(items: Suplemento[], fonte: string): Promise<number> {
  let count = 0;
  for (const item of items) {
    const exists = await prisma.food.findFirst({ where: { description: item.nome } });
    if (exists) continue;

    const food = await prisma.food.create({
      data: {
        description: item.nome,
        groupName: fonte === 'SUPLEMENTOS' ? 'Suplementos' : 'Produtos',
        sourceTable: fonte,
        portionGrams: 100,
      }
    });

    const nutrientes = [
      { name: 'Energia', unit: 'kcal', value: item.energia },
      { name: 'Proteína', unit: 'g', value: item.proteina },
      { name: 'Carboidrato', unit: 'g', value: item.carboidrato },
      { name: 'Lipídios', unit: 'g', value: item.gordura },
    ];

    for (const n of nutrientes) {
      const nutrientId = await getOrCreateNutrient(n.name, n.unit);
      await prisma.foodNutrient.create({
        data: { foodId: food.id, nutrientId, valuePer100g: n.value }
      });
    }
    count++;
  }
  return count;
}

async function main() {
  console.log('😈 ADICIONANDO DIABO VERDE E OUTRAS MARCAS\n');

  let total = 0;

  console.log('😈 Diabo Verde...');
  total += await inserir(DIABO_VERDE, 'SUPLEMENTOS');

  console.log('🏋️ New Millen...');
  total += await inserir(NEW_MILLEN, 'SUPLEMENTOS');

  console.log('🦈 Shark Pro...');
  total += await inserir(SHARK_PRO, 'SUPLEMENTOS');

  console.log('👑 Leader...');
  total += await inserir(LEADER, 'SUPLEMENTOS');

  console.log('💪 Nutrata...');
  total += await inserir(NUTRATA, 'SUPLEMENTOS');

  console.log('💰 Profit...');
  total += await inserir(PROFIT, 'SUPLEMENTOS');

  console.log('🍫 Barras de Proteína...');
  total += await inserir(BARRAS, 'SUPLEMENTOS');

  console.log('🥜 Pastas de Amendoim...');
  total += await inserir(PASTAS, 'PRODUTOS');

  console.log('🥛 Leites Vegetais...');
  total += await inserir(LEITES_VEGETAIS, 'PRODUTOS');

  console.log('🍇 Açaí...');
  total += await inserir(ACAI, 'PRODUTOS');

  const stats = await prisma.food.groupBy({ by: ['sourceTable'], _count: true });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  console.log(`   TOTAL: ${totalGeral}`);
  console.log(`\n✅ Novos: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
