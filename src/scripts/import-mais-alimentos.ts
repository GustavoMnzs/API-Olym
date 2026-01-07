/**
 * Importar MAIS alimentos específicos
 * Foco em itens que faltam: pizzas doces, bebidas, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OFFProduct {
  product_name: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    fiber_100g?: number;
    sodium_100g?: number;
    sugars_100g?: number;
    'saturated-fat_100g'?: number;
    alcohol_100g?: number;
  };
}

const NUTRIENT_MAP = [
  { off: 'energy-kcal_100g', name: 'Energia', unit: 'kcal' },
  { off: 'proteins_100g', name: 'Proteína', unit: 'g' },
  { off: 'fat_100g', name: 'Lipídios', unit: 'g' },
  { off: 'carbohydrates_100g', name: 'Carboidrato', unit: 'g' },
  { off: 'fiber_100g', name: 'Fibra alimentar', unit: 'g' },
  { off: 'sodium_100g', name: 'Sódio', unit: 'mg', multiply: 1000 },
  { off: 'sugars_100g', name: 'Açúcares', unit: 'g' },
  { off: 'alcohol_100g', name: 'Álcool', unit: 'g' },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let nutrient = await prisma.nutrient.findFirst({ where: { name } });
  if (!nutrient) {
    nutrient = await prisma.nutrient.create({ data: { name, unit } });
  }
  return nutrient.id;
}

async function buscarOFF(termo: string, categoria: string, pais?: string): Promise<number> {
  let salvos = 0;
  
  try {
    const baseUrl = pais === 'world' 
      ? 'https://world.openfoodfacts.org'
      : 'https://br.openfoodfacts.org';
    
    const url = `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=100`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.products) return 0;

    for (const product of data.products as OFFProduct[]) {
      if (!product.product_name || !product.nutriments) continue;
      
      const kcal = product.nutriments['energy-kcal_100g'];
      if (kcal === undefined) continue;

      let nome = product.product_name;
      if (product.brands) {
        nome = `${product.product_name} - ${product.brands}`;
      }
      nome = nome.substring(0, 250);

      const exists = await prisma.food.findFirst({
        where: { description: nome }
      });
      if (exists) continue;

      const food = await prisma.food.create({
        data: {
          description: nome,
          groupName: categoria,
          sourceTable: 'OFF',
          portionGrams: 100,
        }
      });

      for (const map of NUTRIENT_MAP) {
        let value = product.nutriments[map.off as keyof typeof product.nutriments] as number | undefined;
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

// Dados de bebidas alcoólicas (USDA/TACO)
const BEBIDAS_ALCOOLICAS = [
  { nome: 'Whisky (dose 50ml)', energia: 110, proteina: 0, carbo: 0, gordura: 0, alcool: 16 },
  { nome: 'Vodka (dose 50ml)', energia: 97, proteina: 0, carbo: 0, gordura: 0, alcool: 14 },
  { nome: 'Gin (dose 50ml)', energia: 110, proteina: 0, carbo: 0, gordura: 0, alcool: 16 },
  { nome: 'Rum (dose 50ml)', energia: 97, proteina: 0, carbo: 0, gordura: 0, alcool: 14 },
  { nome: 'Tequila (dose 50ml)', energia: 97, proteina: 0, carbo: 0, gordura: 0, alcool: 14 },
  { nome: 'Cachaça (dose 50ml)', energia: 118, proteina: 0, carbo: 0, gordura: 0, alcool: 17 },
  { nome: 'Conhaque (dose 50ml)', energia: 116, proteina: 0, carbo: 0, gordura: 0, alcool: 16 },
  { nome: 'Licor (dose 50ml)', energia: 160, proteina: 0, carbo: 24, gordura: 0, alcool: 10 },
  { nome: 'Cerveja Pilsen (lata 350ml)', energia: 150, proteina: 1.4, carbo: 12, gordura: 0, alcool: 14 },
  { nome: 'Cerveja IPA (lata 350ml)', energia: 200, proteina: 2, carbo: 15, gordura: 0, alcool: 21 },
  { nome: 'Cerveja Puro Malte (lata 350ml)', energia: 160, proteina: 1.5, carbo: 13, gordura: 0, alcool: 15 },
  { nome: 'Cerveja sem álcool (lata 350ml)', energia: 70, proteina: 0.7, carbo: 14, gordura: 0, alcool: 0 },
  { nome: 'Cerveja Weiss (copo 300ml)', energia: 135, proteina: 1.5, carbo: 12, gordura: 0, alcool: 12 },
  { nome: 'Chopp (copo 300ml)', energia: 120, proteina: 1, carbo: 10, gordura: 0, alcool: 12 },
  { nome: 'Vinho Tinto Seco (taça 150ml)', energia: 125, proteina: 0.1, carbo: 4, gordura: 0, alcool: 15 },
  { nome: 'Vinho Branco Seco (taça 150ml)', energia: 120, proteina: 0.1, carbo: 3, gordura: 0, alcool: 15 },
  { nome: 'Vinho Rosé (taça 150ml)', energia: 118, proteina: 0.1, carbo: 4, gordura: 0, alcool: 14 },
  { nome: 'Espumante Brut (taça 150ml)', energia: 120, proteina: 0.1, carbo: 2, gordura: 0, alcool: 15 },
  { nome: 'Champagne (taça 150ml)', energia: 125, proteina: 0.1, carbo: 2, gordura: 0, alcool: 16 },
  { nome: 'Sangria (copo 200ml)', energia: 140, proteina: 0.2, carbo: 18, gordura: 0, alcool: 10 },
  { nome: 'Caipirinha (copo 200ml)', energia: 230, proteina: 0, carbo: 25, gordura: 0, alcool: 20 },
  { nome: 'Mojito (copo 200ml)', energia: 180, proteina: 0, carbo: 20, gordura: 0, alcool: 14 },
  { nome: 'Margarita (copo 200ml)', energia: 200, proteina: 0, carbo: 15, gordura: 0, alcool: 18 },
  { nome: 'Piña Colada (copo 200ml)', energia: 280, proteina: 1, carbo: 35, gordura: 5, alcool: 12 },
];

// Energéticos e bebidas
const ENERGETICOS = [
  { nome: 'Red Bull (lata 250ml)', energia: 112, proteina: 0, carbo: 28, gordura: 0 },
  { nome: 'Red Bull Sugar Free (lata 250ml)', energia: 8, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Monster Energy (lata 473ml)', energia: 200, proteina: 0, carbo: 54, gordura: 0 },
  { nome: 'Monster Zero (lata 473ml)', energia: 10, proteina: 0, carbo: 2, gordura: 0 },
  { nome: 'Burn (lata 260ml)', energia: 117, proteina: 0, carbo: 29, gordura: 0 },
  { nome: 'TNT Energy (lata 269ml)', energia: 112, proteina: 0, carbo: 28, gordura: 0 },
  { nome: 'Fusion Energy (lata 250ml)', energia: 110, proteina: 0, carbo: 27, gordura: 0 },
  { nome: 'Reign Energy (lata 473ml)', energia: 10, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Celsius (lata 355ml)', energia: 10, proteina: 0, carbo: 2, gordura: 0 },
  { nome: 'C4 Energy Drink (lata 473ml)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
];

// Pizzas doces e salgadas
const PIZZAS = [
  { nome: 'Pizza de Chocolate (fatia 100g)', energia: 320, proteina: 6, carbo: 45, gordura: 14 },
  { nome: 'Pizza de Brigadeiro (fatia 100g)', energia: 350, proteina: 5, carbo: 50, gordura: 15 },
  { nome: 'Pizza de Banana com Canela (fatia 100g)', energia: 280, proteina: 5, carbo: 42, gordura: 10 },
  { nome: 'Pizza de Romeu e Julieta (fatia 100g)', energia: 310, proteina: 8, carbo: 40, gordura: 13 },
  { nome: 'Pizza de Nutella (fatia 100g)', energia: 380, proteina: 6, carbo: 48, gordura: 18 },
  { nome: 'Pizza de Morango com Chocolate (fatia 100g)', energia: 290, proteina: 5, carbo: 40, gordura: 12 },
  { nome: 'Pizza de Prestígio (fatia 100g)', energia: 340, proteina: 5, carbo: 45, gordura: 16 },
  { nome: 'Pizza de Doce de Leite (fatia 100g)', energia: 330, proteina: 6, carbo: 48, gordura: 13 },
  { nome: 'Pizza Calabresa (fatia 100g)', energia: 260, proteina: 12, carbo: 28, gordura: 11 },
  { nome: 'Pizza Mussarela (fatia 100g)', energia: 250, proteina: 11, carbo: 27, gordura: 10 },
  { nome: 'Pizza Portuguesa (fatia 100g)', energia: 240, proteina: 10, carbo: 26, gordura: 10 },
  { nome: 'Pizza Frango com Catupiry (fatia 100g)', energia: 255, proteina: 13, carbo: 27, gordura: 10 },
  { nome: 'Pizza Pepperoni (fatia 100g)', energia: 280, proteina: 13, carbo: 26, gordura: 13 },
  { nome: 'Pizza Quatro Queijos (fatia 100g)', energia: 290, proteina: 14, carbo: 25, gordura: 14 },
  { nome: 'Pizza Margherita (fatia 100g)', energia: 230, proteina: 10, carbo: 28, gordura: 8 },
  { nome: 'Pizza Napolitana (fatia 100g)', energia: 220, proteina: 9, carbo: 30, gordura: 7 },
  { nome: 'Pizza Bacon (fatia 100g)', energia: 300, proteina: 14, carbo: 26, gordura: 15 },
  { nome: 'Pizza Atum (fatia 100g)', energia: 235, proteina: 14, carbo: 27, gordura: 8 },
  { nome: 'Pizza Vegetariana (fatia 100g)', energia: 200, proteina: 8, carbo: 28, gordura: 6 },
];

// Pré-treinos populares
const PRE_TREINOS = [
  { nome: 'C4 Original - Cellucor (dose 6.5g)', energia: 5, proteina: 0, carbo: 1, gordura: 0 },
  { nome: 'Évora PW - Darkness (dose 5.5g)', energia: 10, proteina: 0, carbo: 2, gordura: 0 },
  { nome: 'Horus - Max Titanium (dose 6g)', energia: 8, proteina: 0, carbo: 2, gordura: 0 },
  { nome: 'Insane - Darkness (dose 6g)', energia: 12, proteina: 0, carbo: 3, gordura: 0 },
  { nome: 'Psychotic - Insane Labz (dose 5.3g)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Jack3d - USP Labs (dose 5g)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Mesomorph - APS (dose 15.5g)', energia: 25, proteina: 0, carbo: 6, gordura: 0 },
  { nome: 'Total War - Redcon1 (dose 14.7g)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Woke AF - Bucked Up (dose 12.2g)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Gorilla Mode - Gorilla Mind (dose 15g)', energia: 5, proteina: 0, carbo: 1, gordura: 0 },
  { nome: 'Superhuman - Alpha Lion (dose 11g)', energia: 0, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'Flame - Darkness (dose 6g)', energia: 10, proteina: 0, carbo: 2, gordura: 0 },
];

// Whey Isolados específicos
const WHEY_ISOLADOS = [
  { nome: 'Whey Isolado Gold Standard - Optimum (scoop 31g)', energia: 110, proteina: 25, carbo: 1, gordura: 0.5 },
  { nome: 'ISO 100 - Dymatize (scoop 32g)', energia: 120, proteina: 25, carbo: 2, gordura: 0.5 },
  { nome: 'Iso Whey - Integralmédica (scoop 30g)', energia: 108, proteina: 26, carbo: 0.5, gordura: 0.3 },
  { nome: 'Iso Triple Zero - Integralmédica (scoop 30g)', energia: 106, proteina: 26, carbo: 0, gordura: 0 },
  { nome: 'Whey Zero - Black Skull (scoop 30g)', energia: 112, proteina: 24, carbo: 2, gordura: 0.5 },
  { nome: 'Iso Protein - Probiótica (scoop 30g)', energia: 110, proteina: 25, carbo: 1, gordura: 0.5 },
  { nome: 'Whey Isolate - MyProtein (scoop 25g)', energia: 93, proteina: 21, carbo: 1, gordura: 0.3 },
  { nome: 'Isopure Zero Carb - Nature\'s Best (scoop 31g)', energia: 100, proteina: 25, carbo: 0, gordura: 0 },
  { nome: 'Carnivor Beef Isolate - MuscleMeds (scoop 36g)', energia: 120, proteina: 23, carbo: 4, gordura: 0 },
  { nome: 'Hydro Whey - Optimum (scoop 39g)', energia: 140, proteina: 30, carbo: 3, gordura: 1 },
];

async function inserirDadosManuais(items: any[], categoria: string, fonte: string) {
  let inseridos = 0;
  
  for (const item of items) {
    const exists = await prisma.food.findFirst({
      where: { description: item.nome }
    });
    if (exists) continue;

    const food = await prisma.food.create({
      data: {
        description: item.nome,
        groupName: categoria,
        sourceTable: fonte,
        portionGrams: 100,
      }
    });

    const nutrientes = [
      { name: 'Energia', unit: 'kcal', value: item.energia },
      { name: 'Proteína', unit: 'g', value: item.proteina },
      { name: 'Carboidrato', unit: 'g', value: item.carbo },
      { name: 'Lipídios', unit: 'g', value: item.gordura },
    ];
    
    if (item.alcool) nutrientes.push({ name: 'Álcool', unit: 'g', value: item.alcool });

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
  console.log('🚀 IMPORTANDO MAIS ALIMENTOS\n');

  let total = 0;

  // 1. Bebidas alcoólicas
  console.log('🍺 Bebidas alcoólicas...');
  const bebidas = await inserirDadosManuais(BEBIDAS_ALCOOLICAS, 'Bebidas alcoólicas', 'USDA');
  console.log(`   +${bebidas}`);
  total += bebidas;

  // 2. Energéticos
  console.log('⚡ Energéticos...');
  const energeticos = await inserirDadosManuais(ENERGETICOS, 'Bebidas', 'USDA');
  console.log(`   +${energeticos}`);
  total += energeticos;

  // 3. Pizzas
  console.log('🍕 Pizzas...');
  const pizzas = await inserirDadosManuais(PIZZAS, 'Pizzas', 'TACO');
  console.log(`   +${pizzas}`);
  total += pizzas;

  // 4. Pré-treinos
  console.log('💪 Pré-treinos...');
  const pretreinos = await inserirDadosManuais(PRE_TREINOS, 'Suplementos', 'SUPLEMENTOS');
  console.log(`   +${pretreinos}`);
  total += pretreinos;

  // 5. Whey Isolados
  console.log('🥛 Whey Isolados...');
  const wheys = await inserirDadosManuais(WHEY_ISOLADOS, 'Suplementos', 'SUPLEMENTOS');
  console.log(`   +${wheys}`);
  total += wheys;

  // 6. Buscar mais do Open Food Facts (mundial)
  console.log('\n🌍 Buscando no Open Food Facts mundial...\n');
  
  const buscasOFF = [
    { termo: 'pizza chocolate', cat: 'Pizzas' },
    { termo: 'pizza doce', cat: 'Pizzas' },
    { termo: 'red bull', cat: 'Bebidas' },
    { termo: 'monster energy', cat: 'Bebidas' },
    { termo: 'jack daniels', cat: 'Bebidas alcoólicas' },
    { termo: 'johnnie walker', cat: 'Bebidas alcoólicas' },
    { termo: 'absolut vodka', cat: 'Bebidas alcoólicas' },
    { termo: 'smirnoff', cat: 'Bebidas alcoólicas' },
    { termo: 'heineken', cat: 'Bebidas alcoólicas' },
    { termo: 'budweiser', cat: 'Bebidas alcoólicas' },
    { termo: 'corona', cat: 'Bebidas alcoólicas' },
    { termo: 'stella artois', cat: 'Bebidas alcoólicas' },
    { termo: 'brahma', cat: 'Bebidas alcoólicas' },
    { termo: 'skol', cat: 'Bebidas alcoólicas' },
    { termo: 'antarctica', cat: 'Bebidas alcoólicas' },
    { termo: 'optimum nutrition', cat: 'Suplementos' },
    { termo: 'dymatize', cat: 'Suplementos' },
    { termo: 'muscletech', cat: 'Suplementos' },
    { termo: 'bsn', cat: 'Suplementos' },
    { termo: 'cellucor', cat: 'Suplementos' },
    { termo: 'myprotein', cat: 'Suplementos' },
    { termo: 'growth supplements', cat: 'Suplementos' },
    { termo: 'max titanium', cat: 'Suplementos' },
    { termo: 'darkness', cat: 'Suplementos' },
    { termo: 'integralmedica', cat: 'Suplementos' },
    { termo: 'probiotica', cat: 'Suplementos' },
    { termo: 'acai bowl', cat: 'Saudáveis' },
    { termo: 'protein bar', cat: 'Suplementos' },
    { termo: 'energy bar', cat: 'Lanches' },
    { termo: 'granola bar', cat: 'Lanches' },
  ];

  for (const busca of buscasOFF) {
    const salvos = await buscarOFF(busca.termo, busca.cat, 'world');
    if (salvos > 0) console.log(`   ${busca.termo}: +${salvos}`);
    total += salvos;
    await new Promise(r => setTimeout(r, 400));
  }

  // Stats finais
  const stats = await prisma.food.groupBy({
    by: ['sourceTable'],
    _count: true,
  });

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  
  const totalGeral = await prisma.food.count();
  console.log(`   TOTAL: ${totalGeral}`);
  console.log(`\n✅ Novos nesta execução: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
