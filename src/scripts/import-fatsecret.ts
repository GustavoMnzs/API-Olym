/**
 * Buscar alimentos no FatSecret Brasil
 * Inclui marcas como Diabo Verde, Jasmine, Mãe Terra, etc.
 */

import { PrismaClient } from '@prisma/client';
import { Page } from 'puppeteer';

const prisma = new PrismaClient();
const jaExiste = new Set<string>();

async function carregarExistentes() {
  const foods = await prisma.food.findMany({ select: { description: true } });
  foods.forEach(f => jaExiste.add(f.description.toLowerCase()));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

// Marcas e produtos para buscar
const BUSCAS = [
  // Diabo Verde
  'diabo verde', 'diabo verde whey', 'diabo verde creatina', 'diabo verde bcaa',
  'diabo verde pré treino', 'diabo verde glutamina', 'diabo verde albumina',
  
  // Mais marcas de suplementos
  'new millen whey', 'new millen creatina', 'new millen bcaa',
  'soldiers nutrition', 'soldiers whey',
  'under labz', 'under labz whey',
  'dark lab', 'dark lab whey',
  'body action', 'body action whey',
  'adaptogen', 'adaptogen whey',
  'vitafor whey', 'vitafor creatina',
  'nutrify whey', 'nutrify creatina',
  'shark pro', 'shark pro whey',
  'leader nutrition', 'leader whey',
  'health labs', 'health labs whey',
  'nutrata', 'nutrata whey',
  'profit', 'profit whey',
  'neonutri', 'neonutri whey',
  
  // Marcas saudáveis
  'jasmine', 'jasmine granola', 'jasmine integral',
  'mãe terra', 'mae terra', 'mãe terra granola',
  'native', 'native orgânico',
  'taeq', 'taeq integral',
  'vitalin', 'vitalin sem glúten',
  'kobber', 'kobber granola',
  'bio2', 'bio2 orgânico',
  'monama', 'monama orgânico',
  'leve crock', 'levecrock',
  'naturale', 'naturale integral',
  
  // Barras de proteína
  'quest bar', 'quest protein',
  'bold bar', 'bold snacks',
  'built bar',
  'rxbar',
  'kind bar',
  'cliff bar', 'clif bar',
  'power bar', 'powerbar',
  'think thin',
  'one bar', 'one protein bar',
  'grenade carb killa',
  'barebells',
  'fulfil bar',
  
  // Pasta de amendoim
  'pasta de amendoim', 'pasta amendoim integral',
  'dr peanut', 'dr. peanut',
  'power one', 'power1one',
  'naked nuts',
  'my nuts',
  'mandubim',
  'vitapower',
  'creme de amendoim',
  
  // Açaí e bowls
  'açaí', 'acai bowl', 'açaí frooty',
  'oakberry', 'oakberry açaí',
  
  // Produtos fitness
  'fit food', 'fitfood',
  'like fit', 'likefit',
  'belive', 'belive snacks',
  'flormel', 'flormel zero',
  'linea', 'linea sucralose',
  'zero cal', 'zerocal',
  'finn', 'finn adoçante',
  'tal e qual',
  
  // Leites vegetais
  'leite de amêndoas', 'leite amêndoa',
  'leite de coco', 'leite coco',
  'leite de aveia', 'leite aveia',
  'leite de arroz', 'leite arroz',
  'leite de soja', 'leite soja',
  'silk', 'silk leite',
  'alpro', 'alpro leite',
  'a tal da castanha',
  
  // Proteínas vegetais
  'proteína vegana', 'vegan protein',
  'proteína de ervilha', 'pea protein',
  'proteína de arroz', 'rice protein',
  'proteína de soja', 'soy protein',
  'hemp protein', 'proteína de cânhamo',
  
  // Snacks saudáveis
  'chips de batata doce',
  'chips de mandioca',
  'snack integral',
  'biscoito integral',
  'cookie proteico',
  'brownie proteico',
  'muffin proteico',
  'panqueca proteica',
  
  // Comidas congeladas fitness
  'marmita fitness',
  'refeição congelada',
  'liv up', 'livup',
  'chef jamie',
  'kicaldo',
  'vapza',
];

async function buscarFatSecret(page: Page, termo: string): Promise<number> {
  let salvos = 0;
  
  try {
    const url = `https://www.fatsecret.com.br/calorias-nutri%C3%A7%C3%A3o/search?q=${encodeURIComponent(termo)}`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1000);

    // Extrair alimentos da página de busca
    const items = await page.evaluate(() => {
      const results: { nome: string; link: string }[] = [];
      
      // Buscar links de alimentos
      const links = document.querySelectorAll('a.prominent');
      links.forEach(link => {
        const nome = link.textContent?.trim();
        const href = link.getAttribute('href');
        if (nome && href && href.includes('/calorias-nutri')) {
          results.push({ nome, link: href });
        }
      });
      
      return results.slice(0, 20); // Limitar a 20 por busca
    });

    for (const item of items) {
      if (jaExiste.has(item.nome.toLowerCase())) continue;
      
      try {
        // Ir para página de detalhes
        await page.goto('https://www.fatsecret.com.br' + item.link, {
          waitUntil: 'networkidle2', timeout: 12000
        });
        await sleep(500);

        // Extrair nutrientes
        const nutrientes = await page.evaluate(() => {
          const result: Record<string, number> = {};
          
          // Buscar valores nutricionais
          const factPanel = document.querySelector('.nutrition_facts');
          if (!factPanel) return null;
          
          const getText = (selector: string): string => {
            const el = factPanel.querySelector(selector);
            return el?.textContent?.trim() || '';
          };
          
          // Tentar extrair valores
          const rows = factPanel.querySelectorAll('tr, .fact_row, div[class*="fact"]');
          rows.forEach(row => {
            const text = row.textContent?.toLowerCase() || '';
            const numMatch = text.match(/(\d+[,.]?\d*)\s*(kcal|g|mg)/);
            
            if (text.includes('caloria') && numMatch) {
              result['energia'] = parseFloat(numMatch[1].replace(',', '.'));
            } else if (text.includes('proteína') && numMatch) {
              result['proteina'] = parseFloat(numMatch[1].replace(',', '.'));
            } else if (text.includes('carboidrato') && numMatch) {
              result['carboidrato'] = parseFloat(numMatch[1].replace(',', '.'));
            } else if (text.includes('gordura') && !text.includes('saturada') && numMatch) {
              result['gordura'] = parseFloat(numMatch[1].replace(',', '.'));
            } else if (text.includes('fibra') && numMatch) {
              result['fibra'] = parseFloat(numMatch[1].replace(',', '.'));
            }
          });
          
          return Object.keys(result).length >= 3 ? result : null;
        });

        if (!nutrientes || !nutrientes.energia) continue;

        jaExiste.add(item.nome.toLowerCase());

        const food = await prisma.food.create({
          data: {
            description: item.nome,
            groupName: 'FatSecret',
            sourceTable: 'FATSECRET',
            portionGrams: 100,
          }
        });

        const nutrientData = [
          { name: 'Energia', unit: 'kcal', value: nutrientes.energia },
          { name: 'Proteína', unit: 'g', value: nutrientes.proteina },
          { name: 'Carboidrato', unit: 'g', value: nutrientes.carboidrato },
          { name: 'Lipídios', unit: 'g', value: nutrientes.gordura },
        ];
        if (nutrientes.fibra) {
          nutrientData.push({ name: 'Fibra alimentar', unit: 'g', value: nutrientes.fibra });
        }

        for (const n of nutrientData) {
          if (n.value === undefined) continue;
          const nutrientId = await getOrCreateNutrient(n.name, n.unit);
          await prisma.foodNutrient.create({
            data: { foodId: food.id, nutrientId, valuePer100g: n.value }
          });
        }

        salvos++;
      } catch {}
    }
  } catch {}

  return salvos;
}

// Também buscar no Open Food Facts
async function buscarOFF(termo: string, categoria: string): Promise<number> {
  let salvos = 0;
  
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=50`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.products) return 0;

    for (const product of data.products) {
      if (!product.product_name || !product.nutriments) continue;
      
      const kcal = product.nutriments['energy-kcal_100g'];
      if (kcal === undefined) continue;

      let nome = product.product_name;
      if (product.brands) nome = `${product.product_name} - ${product.brands}`;
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

      const nutrientMap = [
        { off: 'energy-kcal_100g', name: 'Energia', unit: 'kcal' },
        { off: 'proteins_100g', name: 'Proteína', unit: 'g' },
        { off: 'fat_100g', name: 'Lipídios', unit: 'g' },
        { off: 'carbohydrates_100g', name: 'Carboidrato', unit: 'g' },
        { off: 'fiber_100g', name: 'Fibra alimentar', unit: 'g' },
      ];

      for (const map of nutrientMap) {
        const value = product.nutriments[map.off];
        if (value === undefined) continue;
        const nutrientId = await getOrCreateNutrient(map.name, map.unit);
        await prisma.foodNutrient.create({
          data: { foodId: food.id, nutrientId, valuePer100g: value }
        });
      }

      salvos++;
    }
  } catch {}

  return salvos;
}

async function main() {
  console.log('🔍 IMPORTADOR FATSECRET + OFF - MARCAS EXTRAS\n');
  
  await carregarExistentes();
  console.log(`   ${jaExiste.size} alimentos já no banco\n`);

  let total = 0;

  // Primeiro buscar no Open Food Facts (mais rápido)
  console.log('🌍 Buscando no Open Food Facts...\n');
  
  for (const termo of BUSCAS) {
    const salvos = await buscarOFF(termo, 'Produtos');
    total += salvos;
    if (salvos > 0) console.log(`   ${termo}: +${salvos}`);
    await sleep(300);
  }

  // Stats
  const stats = await prisma.food.groupBy({ by: ['sourceTable'], _count: true });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  console.log(`   TOTAL: ${totalGeral}`);
  console.log(`\n✅ Novos produtos: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
