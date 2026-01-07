/**
 * Continua importação do Open Food Facts
 */

import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;
const DELAY_MS = 500;
const MAX_FOODS = 10000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'FoodNutritionAPI/1.0' } };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchJson(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Mais categorias para buscar
const CATEGORIAS = [
  'cebola', 'alho', 'brocolis', 'couve', 'espinafre', 'abobrinha',
  'berinjela', 'pepino', 'pimentao', 'repolho', 'abobora',
  'lentilha', 'grao-de-bico', 'ervilha', 'soja',
  'castanha', 'amendoim', 'nozes', 'amendoa',
  'suco', 'refrigerante', 'cafe', 'cha', 'agua-de-coco',
  'chocolate', 'sorvete', 'bolo', 'pudim', 'gelatina',
  'azeite', 'oleo', 'margarina',
  'sal', 'acucar', 'mel', 'vinagre', 'mostarda', 'ketchup', 'maionese',
  'acai', 'tapioca', 'cuscuz', 'pamonha', 'coxinha', 'pastel',
  'brigadeiro', 'pao-de-queijo', 'farofa', 'feijoada',
  'pizza', 'hamburguer', 'sanduiche', 'lasanha', 'empanado',
  'nuggets', 'almondega', 'strogonoff', 'risoto',
];

async function main(): Promise<void> {
  console.log('🚀 Continuando importação Open Food Facts...\n');

  const nutrients = await prisma.nutrient.findMany();
  const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));
  
  let existentes = await prisma.food.count();
  console.log(`📦 Alimentos existentes: ${existentes}`);
  
  if (existentes >= MAX_FOODS) {
    console.log('✅ Meta de 10.000 já atingida!');
    return;
  }

  let totalImportados = 0;
  const processados = new Set<string>();

  for (const termo of CATEGORIAS) {
    const atual = await prisma.food.count();
    if (atual >= MAX_FOODS) break;

    console.log(`🔍 Buscando: "${termo}"...`);
    let encontrados = 0;

    for (let page = 1; page <= 3; page++) {
      await sleep(DELAY_MS);
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page=${page}&page_size=${BATCH_SIZE}&countries_tags_en=brazil`;
      
      try {
        const data = await fetchJson(url);
        const products = data.products || [];
        if (products.length === 0) break;

        for (const p of products) {
          const nome = p.product_name_pt || p.product_name;
          if (!nome || nome.length < 3 || processados.has(nome.toLowerCase())) continue;
          
          const n = p.nutriments || {};
          const energia = n['energy-kcal_100g'] ?? n['energy-kcal'];
          if (!energia) continue;

          processados.add(nome.toLowerCase());

          const existing = await prisma.food.findFirst({ where: { description: nome } });
          if (existing) continue;

          try {
            const food = await prisma.food.create({
              data: {
                description: nome,
                groupName: 'Outros alimentos industrializados',
                sourceTable: 'OFF',
                portionGrams: 100,
              },
            });

            const nutrientes = {
              'Energia': energia,
              'Proteína': n.proteins_100g ?? n.proteins,
              'Carboidrato total': n.carbohydrates_100g ?? n.carbohydrates,
              'Lipídeos': n.fat_100g ?? n.fat,
              'Fibra alimentar': n.fiber_100g ?? n.fiber,
              'Cálcio': n.calcium_100g ?? n.calcium,
              'Ferro': n.iron_100g ?? n.iron,
              'Sódio': n.sodium_100g ?? n.sodium,
              'Potássio': n.potassium_100g ?? n.potassium,
              'Vitamina C': n['vitamin-c_100g'],
            };

            for (const [name, value] of Object.entries(nutrientes)) {
              if (value == null) continue;
              const nid = nutrientIdMap.get(name);
              if (!nid) continue;
              await prisma.foodNutrient.create({
                data: { foodId: food.id, nutrientId: nid, valuePer100g: value as number },
              });
            }

            totalImportados++;
            encontrados++;
            
            if (totalImportados % 100 === 0) {
              const total = await prisma.food.count();
              console.log(`   ✅ ${total} alimentos no banco`);
            }
          } catch (e) {}
        }
      } catch (e) {
        console.log(`   ⚠️ Erro: ${e}`);
      }
    }
    console.log(`   → ${encontrados} novos de "${termo}"`);
  }

  const total = await prisma.food.count();
  console.log(`\n📊 Total final: ${total} alimentos`);
  await prisma.$disconnect();
}

main().catch(console.error);
