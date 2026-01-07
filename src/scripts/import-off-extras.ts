/**
 * Importar mais alimentos do Open Food Facts
 * Foco: pizzas, doces, cervejas, suplementos, churrasco, etc.
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
  { off: 'saturated-fat_100g', name: 'Gordura saturada', unit: 'g' },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let nutrient = await prisma.nutrient.findFirst({ where: { name } });
  if (!nutrient) {
    nutrient = await prisma.nutrient.create({ data: { name, unit } });
  }
  return nutrient.id;
}

async function buscarOFF(termo: string, categoria: string): Promise<number> {
  let salvos = 0;
  
  try {
    // Buscar no Open Food Facts Brasil
    const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=100&countries_tags_pt=brasil`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.products) return 0;

    for (const product of data.products as OFFProduct[]) {
      if (!product.product_name || !product.nutriments) continue;
      
      const kcal = product.nutriments['energy-kcal_100g'];
      if (!kcal || kcal <= 0) continue;

      // Nome do produto
      let nome = product.product_name;
      if (product.brands) {
        nome = `${product.product_name} - ${product.brands}`;
      }
      nome = nome.substring(0, 250);

      // Verificar se já existe
      const exists = await prisma.food.findFirst({
        where: { description: nome }
      });
      if (exists) continue;

      // Criar alimento
      const food = await prisma.food.create({
        data: {
          description: nome,
          groupName: categoria,
          sourceTable: 'OFF',
          portionGrams: 100,
        }
      });

      // Inserir nutrientes
      for (const map of NUTRIENT_MAP) {
        let value = product.nutriments[map.off as keyof typeof product.nutriments] as number | undefined;
        if (value === undefined || value === null) continue;
        
        if (map.multiply) value *= map.multiply;

        const nutrientId = await getOrCreateNutrient(map.name, map.unit);
        
        await prisma.foodNutrient.create({
          data: {
            foodId: food.id,
            nutrientId,
            valuePer100g: value,
          }
        });
      }

      salvos++;
    }
  } catch (e) {
    console.error(`   Erro em "${termo}":`, e);
  }

  return salvos;
}

async function main() {
  console.log('🚀 IMPORTADOR OFF - EXTRAS\n');

  const buscas = [
    // Pizzas
    { termo: 'pizza', categoria: 'Pizzas' },
    { termo: 'pizza calabresa', categoria: 'Pizzas' },
    { termo: 'pizza mussarela', categoria: 'Pizzas' },
    { termo: 'pizza frango', categoria: 'Pizzas' },
    { termo: 'pizza portuguesa', categoria: 'Pizzas' },
    { termo: 'pizza margherita', categoria: 'Pizzas' },
    { termo: 'pizza pepperoni', categoria: 'Pizzas' },
    
    // Doces
    { termo: 'chocolate', categoria: 'Doces' },
    { termo: 'brigadeiro', categoria: 'Doces' },
    { termo: 'sorvete', categoria: 'Doces' },
    { termo: 'bolo', categoria: 'Doces' },
    { termo: 'biscoito', categoria: 'Doces' },
    { termo: 'cookie', categoria: 'Doces' },
    { termo: 'pudim', categoria: 'Doces' },
    { termo: 'doce de leite', categoria: 'Doces' },
    { termo: 'paçoca', categoria: 'Doces' },
    { termo: 'bombom', categoria: 'Doces' },
    { termo: 'torta', categoria: 'Doces' },
    { termo: 'mousse', categoria: 'Doces' },
    
    // Cervejas e bebidas
    { termo: 'cerveja', categoria: 'Bebidas alcoólicas' },
    { termo: 'cerveja pilsen', categoria: 'Bebidas alcoólicas' },
    { termo: 'cerveja ipa', categoria: 'Bebidas alcoólicas' },
    { termo: 'vinho', categoria: 'Bebidas alcoólicas' },
    { termo: 'whisky', categoria: 'Bebidas alcoólicas' },
    { termo: 'vodka', categoria: 'Bebidas alcoólicas' },
    { termo: 'energético', categoria: 'Bebidas' },
    { termo: 'refrigerante', categoria: 'Bebidas' },
    { termo: 'suco', categoria: 'Bebidas' },
    
    // Suplementos
    { termo: 'whey protein', categoria: 'Suplementos' },
    { termo: 'whey', categoria: 'Suplementos' },
    { termo: 'proteina', categoria: 'Suplementos' },
    { termo: 'creatina', categoria: 'Suplementos' },
    { termo: 'bcaa', categoria: 'Suplementos' },
    { termo: 'albumina', categoria: 'Suplementos' },
    { termo: 'hipercalorico', categoria: 'Suplementos' },
    { termo: 'pre treino', categoria: 'Suplementos' },
    { termo: 'glutamina', categoria: 'Suplementos' },
    { termo: 'caseina', categoria: 'Suplementos' },
    { termo: 'iso whey', categoria: 'Suplementos' },
    { termo: 'mass gainer', categoria: 'Suplementos' },
    
    // Carnes e churrasco
    { termo: 'picanha', categoria: 'Carnes' },
    { termo: 'costela', categoria: 'Carnes' },
    { termo: 'linguiça', categoria: 'Carnes' },
    { termo: 'bacon', categoria: 'Carnes' },
    { termo: 'hamburguer', categoria: 'Carnes' },
    { termo: 'carne moida', categoria: 'Carnes' },
    { termo: 'fraldinha', categoria: 'Carnes' },
    { termo: 'maminha', categoria: 'Carnes' },
    { termo: 'alcatra', categoria: 'Carnes' },
    { termo: 'file mignon', categoria: 'Carnes' },
    { termo: 'cupim', categoria: 'Carnes' },
    { termo: 'contrafile', categoria: 'Carnes' },
    
    // Fast food
    { termo: 'hamburguer', categoria: 'Fast Food' },
    { termo: 'batata frita', categoria: 'Fast Food' },
    { termo: 'nuggets', categoria: 'Fast Food' },
    { termo: 'hot dog', categoria: 'Fast Food' },
    { termo: 'coxinha', categoria: 'Fast Food' },
    { termo: 'pastel', categoria: 'Fast Food' },
    { termo: 'empada', categoria: 'Fast Food' },
    { termo: 'esfiha', categoria: 'Fast Food' },
    
    // Lanches
    { termo: 'pão de queijo', categoria: 'Lanches' },
    { termo: 'sanduiche', categoria: 'Lanches' },
    { termo: 'wrap', categoria: 'Lanches' },
    { termo: 'tapioca', categoria: 'Lanches' },
    
    // Laticínios
    { termo: 'queijo', categoria: 'Laticínios' },
    { termo: 'iogurte', categoria: 'Laticínios' },
    { termo: 'leite', categoria: 'Laticínios' },
    { termo: 'requeijão', categoria: 'Laticínios' },
    { termo: 'cream cheese', categoria: 'Laticínios' },
    
    // Saudáveis
    { termo: 'granola', categoria: 'Saudáveis' },
    { termo: 'aveia', categoria: 'Saudáveis' },
    { termo: 'quinoa', categoria: 'Saudáveis' },
    { termo: 'chia', categoria: 'Saudáveis' },
    { termo: 'linhaça', categoria: 'Saudáveis' },
    { termo: 'pasta de amendoim', categoria: 'Saudáveis' },
    { termo: 'açaí', categoria: 'Saudáveis' },
  ];

  let total = 0;

  for (const busca of buscas) {
    const salvos = await buscarOFF(busca.termo, busca.categoria);
    total += salvos;
    if (salvos > 0) {
      console.log(`   ${busca.termo}: +${salvos}`);
    }
    await new Promise(r => setTimeout(r, 300));
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
  console.log('🏁 Finalizado!');

  await prisma.$disconnect();
}

main().catch(console.error);
