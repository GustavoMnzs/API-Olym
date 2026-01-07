/**
 * Importar suplementos de marcas específicas
 * FTW, Growth, Max Titanium, Integralmédica, Probiótica, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jaExiste = new Set<string>();

async function carregarExistentes() {
  const foods = await prisma.food.findMany({ select: { description: true } });
  foods.forEach(f => jaExiste.add(f.description.toLowerCase()));
}

const NUTRIENT_MAP = [
  { off: 'energy-kcal_100g', name: 'Energia', unit: 'kcal' },
  { off: 'proteins_100g', name: 'Proteína', unit: 'g' },
  { off: 'fat_100g', name: 'Lipídios', unit: 'g' },
  { off: 'carbohydrates_100g', name: 'Carboidrato', unit: 'g' },
  { off: 'fiber_100g', name: 'Fibra alimentar', unit: 'g' },
  { off: 'sodium_100g', name: 'Sódio', unit: 'mg', multiply: 1000 },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

async function buscarOFF(termo: string, categoria: string): Promise<number> {
  let salvos = 0;
  
  try {
    // Buscar no Open Food Facts mundial
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=100`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.products) return 0;

    for (const product of data.products) {
      if (!product.product_name || !product.nutriments) continue;
      
      const kcal = product.nutriments['energy-kcal_100g'];
      if (kcal === undefined) continue;

      let nome = product.product_name;
      if (product.brands) {
        nome = `${product.product_name} - ${product.brands}`;
      }
      nome = nome.substring(0, 250);

      if (jaExiste.has(nome.toLowerCase())) continue;
      jaExiste.add(nome.toLowerCase());

      const food = await prisma.food.create({
        data: {
          description: nome,
          groupName: categoria,
          sourceTable: 'OFF',
          portionGrams: 100,
        }
      });

      for (const map of NUTRIENT_MAP) {
        let value = product.nutriments[map.off];
        if (value === undefined || value === null) continue;
        if (map.multiply) value *= map.multiply;

        const nutrientId = await getOrCreateNutrient(map.name, map.unit);
        await prisma.foodNutrient.create({
          data: { foodId: food.id, nutrientId, valuePer100g: value }
        });
      }

      salvos++;
    }
  } catch (e) {
    // Ignorar erros
  }

  return salvos;
}

// Marcas de suplementos para buscar
const MARCAS_SUPLEMENTOS = [
  // Marcas brasileiras
  'ftw', 'ftw sports', 'ftw whey',
  'growth supplements', 'growth whey', 'growth creatina',
  'max titanium', 'max titanium whey', 'max titanium creatina',
  'integralmedica', 'integral medica', 'darkness',
  'probiotica', 'probiótica',
  'black skull', 'blackskull',
  'atlhetica nutrition', 'atlhetica',
  'new millen', 'newmillen',
  'dux nutrition', 'dux',
  'essential nutrition', 'essential',
  'vitafor',
  'nutrify',
  'soldiers nutrition',
  'under labz',
  'dark lab',
  'adaptogen',
  'body action',
  
  // Marcas internacionais
  'optimum nutrition', 'gold standard',
  'dymatize', 'iso 100',
  'muscletech', 'nitro tech',
  'bsn', 'syntha 6',
  'cellucor', 'c4',
  'myprotein', 'impact whey',
  'universal nutrition',
  'gaspari nutrition',
  'musclepharm',
  'evl nutrition', 'evlution',
  'rule one', 'rule 1',
  'allmax',
  'nutrex',
  'mutant',
  'ronnie coleman',
  'animal pak',
  'now foods',
  'naturals',
  
  // Produtos específicos
  'whey protein isolate',
  'whey protein concentrate',
  'whey protein hydrolyzed',
  'casein protein',
  'mass gainer',
  'weight gainer',
  'pre workout',
  'bcaa powder',
  'creatine monohydrate',
  'glutamine powder',
  'protein bar',
  'protein shake',
  'meal replacement',
  'amino acids',
  'beta alanine',
  'citrulline',
  'arginine',
  'carnitine',
  'fat burner',
  'thermogenic',
  'testosterone booster',
  'zma supplement',
  'omega 3 fish oil',
  'multivitamin',
  'vitamin d3',
  'vitamin c',
  'collagen peptides',
  'hydrolyzed collagen',
];

async function main() {
  console.log('💪 IMPORTADOR DE SUPLEMENTOS - MARCAS\n');
  
  await carregarExistentes();
  console.log(`   ${jaExiste.size} alimentos já no banco\n`);

  let total = 0;

  console.log(`📝 Buscando ${MARCAS_SUPLEMENTOS.length} marcas/produtos\n`);

  for (const termo of MARCAS_SUPLEMENTOS) {
    const salvos = await buscarOFF(termo, 'Suplementos');
    total += salvos;
    
    if (salvos > 0) {
      console.log(`   ${termo}: +${salvos}`);
    }
    
    await new Promise(r => setTimeout(r, 400));
  }

  // Stats
  const stats = await prisma.food.groupBy({ by: ['sourceTable'], _count: true });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  console.log(`   TOTAL: ${totalGeral}`);
  console.log(`\n✅ Novos suplementos: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
