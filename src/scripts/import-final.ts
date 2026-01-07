/**
 * Importação final para atingir 10.000+ alimentos
 */

import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FoodNutritionAPI/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchJson(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const TERMOS = [
  'protein', 'whey', 'suplemento', 'vitamina', 'mineral',
  'integral', 'light', 'diet', 'zero', 'fitness',
  'organico', 'natural', 'vegano', 'vegetariano',
  'snack', 'barra', 'cereal', 'muesli', 'mix',
  'tempero', 'molho', 'condimento', 'especiaria',
  'conserva', 'enlatado', 'congelado', 'desidratado',
  'bebida', 'energetico', 'isotônico', 'shake',
];

async function main(): Promise<void> {
  console.log('🚀 Importação final...\n');
  
  const nutrients = await prisma.nutrient.findMany();
  const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));
  
  let total = await prisma.food.count();
  console.log(`📦 Total atual: ${total}`);
  
  if (total >= 10000) {
    console.log('✅ Meta de 10.000 já atingida!');
    await prisma.$disconnect();
    return;
  }

  let importados = 0;

  for (const termo of TERMOS) {
    total = await prisma.food.count();
    if (total >= 10000) break;

    console.log(`🔍 "${termo}"...`);
    
    for (let page = 1; page <= 5; page++) {
      await sleep(400);
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page=${page}&page_size=100&countries_tags_en=brazil`;
      
      try {
        const data = await fetchJson(url);
        for (const p of (data.products || [])) {
          const nome = p.product_name_pt || p.product_name;
          if (!nome || nome.length < 3) continue;
          
          const n = p.nutriments || {};
          const energia = n['energy-kcal_100g'] ?? n['energy-kcal'];
          if (!energia) continue;

          const existing = await prisma.food.findFirst({ where: { description: nome } });
          if (existing) continue;

          try {
            const food = await prisma.food.create({
              data: { description: nome, groupName: 'Outros', sourceTable: 'OFF', portionGrams: 100 },
            });

            const vals: Record<string, number | undefined> = {
              'Energia': energia, 'Proteína': n.proteins_100g, 'Carboidrato total': n.carbohydrates_100g,
              'Lipídeos': n.fat_100g, 'Fibra alimentar': n.fiber_100g, 'Cálcio': n.calcium_100g,
              'Ferro': n.iron_100g, 'Sódio': n.sodium_100g, 'Potássio': n.potassium_100g, 'Vitamina C': n['vitamin-c_100g'],
            };

            for (const [name, value] of Object.entries(vals)) {
              if (value == null) continue;
              const nid = nutrientIdMap.get(name);
              if (nid) await prisma.foodNutrient.create({ data: { foodId: food.id, nutrientId: nid, valuePer100g: value } });
            }
            importados++;
          } catch (e) {}
        }
      } catch (e) {}
    }
    
    total = await prisma.food.count();
    console.log(`   Total: ${total}`);
  }

  console.log(`\n✅ Importados: ${importados}`);
  console.log(`📊 Total final: ${await prisma.food.count()}`);
  await prisma.$disconnect();
}

main().catch(console.error);
