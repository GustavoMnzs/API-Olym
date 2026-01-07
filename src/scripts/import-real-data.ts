/**
 * Script para importar dados nutricionais REAIS
 * 
 * Fontes:
 * 1. Open Food Facts API - Base de dados aberta com milhares de alimentos
 * 2. USDA FoodData Central - Base americana com dados detalhados
 * 3. CSVs locais TACO/TBCA (se disponíveis com dados completos)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as https from 'https';

const prisma = new PrismaClient();

// Configurações
const BATCH_SIZE = 100;
const DELAY_MS = 500;
const MAX_FOODS = 10000;

interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_pt?: string;
  categories_tags?: string[];
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    proteins_100g?: number;
    proteins?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    fat_100g?: number;
    fat?: number;
    fiber_100g?: number;
    fiber?: number;
    calcium_100g?: number;
    calcium?: number;
    iron_100g?: number;
    iron?: number;
    sodium_100g?: number;
    sodium?: number;
    potassium_100g?: number;
    potassium?: number;
    'vitamin-c_100g'?: number;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'FoodNutritionAPI/1.0 (educational project)',
      },
    };

    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchJson(res.headers.location!).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Erro ao parsear JSON: ${e}`));
        }
      });
    }).on('error', reject);
  });
}

// Categorias de alimentos para buscar (em português e inglês)
const CATEGORIAS_BUSCA = [
  // Cereais e derivados
  'arroz', 'feijao', 'macarrao', 'pao', 'farinha', 'aveia', 'milho', 'trigo',
  'cereais', 'biscoito', 'bolacha', 'torrada', 'granola',
  // Carnes
  'carne', 'frango', 'peixe', 'atum', 'sardinha', 'salmao', 'tilapia',
  'linguica', 'salsicha', 'presunto', 'bacon', 'peru',
  // Laticínios
  'leite', 'queijo', 'iogurte', 'manteiga', 'requeijao', 'creme',
  // Frutas
  'banana', 'maca', 'laranja', 'limao', 'uva', 'morango', 'manga',
  'abacaxi', 'melancia', 'mamao', 'goiaba', 'acerola', 'caju',
  // Verduras e legumes
  'alface', 'tomate', 'cenoura', 'batata', 'cebola', 'alho',
  'brocolis', 'couve', 'espinafre', 'abobrinha', 'berinjela',
  'pepino', 'pimentao', 'repolho', 'abobora',
  // Leguminosas
  'lentilha', 'grao-de-bico', 'ervilha', 'soja',
  // Oleaginosas
  'castanha', 'amendoim', 'nozes', 'amêndoa',
  // Bebidas
  'suco', 'refrigerante', 'cafe', 'cha', 'agua-de-coco',
  // Doces e sobremesas
  'chocolate', 'sorvete', 'bolo', 'pudim', 'gelatina',
  // Óleos e gorduras
  'azeite', 'oleo', 'margarina',
  // Condimentos
  'sal', 'acucar', 'mel', 'vinagre', 'mostarda', 'ketchup', 'maionese',
  // Produtos brasileiros específicos
  'acai', 'tapioca', 'cuscuz', 'pamonha', 'coxinha', 'pastel',
  'brigadeiro', 'pao-de-queijo', 'farofa', 'feijoada',
];

async function buscarOpenFoodFacts(termo: string, page: number = 1): Promise<OpenFoodFactsProduct[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page=${page}&page_size=${BATCH_SIZE}&countries_tags_en=brazil`;
  
  try {
    const data = await fetchJson(url);
    return data.products || [];
  } catch (error) {
    console.log(`   ⚠️ Erro ao buscar "${termo}": ${error}`);
    return [];
  }
}

function extrairGrupo(product: OpenFoodFactsProduct): string {
  const categories = product.categories_tags || [];
  
  // Mapeamento de categorias
  const grupoMap: Record<string, string> = {
    'meats': 'Carnes e derivados',
    'poultry': 'Carnes e derivados',
    'fish': 'Pescados e frutos do mar',
    'seafood': 'Pescados e frutos do mar',
    'dairy': 'Leites e derivados',
    'milk': 'Leites e derivados',
    'cheese': 'Leites e derivados',
    'yogurt': 'Leites e derivados',
    'fruits': 'Frutas e derivados',
    'vegetables': 'Verduras, hortaliças e derivados',
    'cereals': 'Cereais e derivados',
    'breads': 'Cereais e derivados',
    'pasta': 'Cereais e derivados',
    'rice': 'Cereais e derivados',
    'legumes': 'Leguminosas e derivados',
    'beans': 'Leguminosas e derivados',
    'nuts': 'Nozes e sementes',
    'oils': 'Óleos e gorduras',
    'fats': 'Óleos e gorduras',
    'beverages': 'Bebidas',
    'drinks': 'Bebidas',
    'sweets': 'Açúcares e doces',
    'chocolates': 'Açúcares e doces',
    'snacks': 'Outros alimentos industrializados',
    'eggs': 'Ovos e derivados',
  };

  for (const cat of categories) {
    for (const [key, grupo] of Object.entries(grupoMap)) {
      if (cat.toLowerCase().includes(key)) {
        return grupo;
      }
    }
  }

  return 'Outros alimentos industrializados';
}

function extrairNome(product: OpenFoodFactsProduct): string {
  return product.product_name_pt || product.product_name || 'Sem nome';
}

function extrairNutrientes(product: OpenFoodFactsProduct): Record<string, number | null> {
  const n = product.nutriments || {};
  
  return {
    'Energia': n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
    'Proteína': n.proteins_100g ?? n.proteins ?? null,
    'Carboidrato total': n.carbohydrates_100g ?? n.carbohydrates ?? null,
    'Lipídeos': n.fat_100g ?? n.fat ?? null,
    'Fibra alimentar': n.fiber_100g ?? n.fiber ?? null,
    'Cálcio': n.calcium_100g ?? n.calcium ?? null,
    'Ferro': n.iron_100g ?? n.iron ?? null,
    'Sódio': n.sodium_100g ?? n.sodium ?? null,
    'Potássio': n.potassium_100g ?? n.potassium ?? null,
    'Vitamina C': n['vitamin-c_100g'] ?? null,
  };
}

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

async function salvarAlimento(
  nome: string,
  grupo: string,
  nutrientes: Record<string, number | null>,
  nutrientIdMap: Map<string, number>,
  source: string
): Promise<boolean> {
  // Verificar se já existe
  const existing = await prisma.food.findFirst({
    where: { description: nome },
  });

  if (existing) return false;

  try {
    const food = await prisma.food.create({
      data: {
        description: nome,
        groupName: grupo,
        sourceTable: source,
        portionGrams: 100,
      },
    });

    // Inserir nutrientes
    for (const [nutrienteName, value] of Object.entries(nutrientes)) {
      if (value === null || value === undefined) continue;
      
      const nutrientId = nutrientIdMap.get(nutrienteName);
      if (!nutrientId) continue;

      await prisma.foodNutrient.create({
        data: { foodId: food.id, nutrientId, valuePer100g: value },
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function importarOpenFoodFacts(nutrientIdMap: Map<string, number>): Promise<number> {
  console.log('\n📦 Importando do Open Food Facts (alimentos brasileiros)...\n');
  
  let totalImportados = 0;
  const alimentosProcessados = new Set<string>();

  for (const termo of CATEGORIAS_BUSCA) {
    if (totalImportados >= MAX_FOODS) break;

    console.log(`🔍 Buscando: "${termo}"...`);
    
    let page = 1;
    let encontrados = 0;

    while (encontrados < 200 && totalImportados < MAX_FOODS) {
      await sleep(DELAY_MS);
      
      const products = await buscarOpenFoodFacts(termo, page);
      if (products.length === 0) break;

      for (const product of products) {
        if (totalImportados >= MAX_FOODS) break;

        const nome = extrairNome(product);
        
        // Pular se já processado ou nome inválido
        if (!nome || nome === 'Sem nome' || nome.length < 3 || alimentosProcessados.has(nome.toLowerCase())) {
          continue;
        }

        const grupo = extrairGrupo(product);
        const nutrientes = extrairNutrientes(product);

        // Verificar se tem pelo menos energia
        if (nutrientes['Energia'] === null) continue;

        alimentosProcessados.add(nome.toLowerCase());

        const salvo = await salvarAlimento(nome, grupo, nutrientes, nutrientIdMap, 'OFF');
        if (salvo) {
          totalImportados++;
          encontrados++;
          
          if (totalImportados % 100 === 0) {
            console.log(`   ✅ ${totalImportados} alimentos importados`);
          }
        }
      }

      page++;
      if (page > 5) break; // Máximo 5 páginas por termo
    }

    console.log(`   → ${encontrados} novos de "${termo}"`);
  }

  return totalImportados;
}

async function importarCSVsLocais(nutrientIdMap: Map<string, number>): Promise<number> {
  console.log('\n📄 Importando CSVs locais (TACO/TBCA)...\n');
  
  let totalImportados = 0;

  const csvFiles = [
    { path: './data/taco.csv', source: 'TACO' },
    { path: './data/tbca.csv', source: 'TBCA' },
  ];

  for (const { path, source } of csvFiles) {
    if (!fs.existsSync(path)) {
      console.log(`   ⚠️ Arquivo não encontrado: ${path}`);
      continue;
    }

    console.log(`   Processando ${path}...`);
    
    const content = fs.readFileSync(path, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    if (lines.length < 2) continue;

    // Pular header
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 12) continue;

      const nome = cols[0]?.trim();
      const grupo = cols[1]?.trim() || 'Outros';
      
      if (!nome) continue;

      const parseNum = (val: string): number | null => {
        if (!val || val === 'Tr' || val === '-' || val === 'NA') return null;
        const num = parseFloat(val.replace(',', '.'));
        return isNaN(num) ? null : num;
      };

      const nutrientes: Record<string, number | null> = {
        'Energia': parseNum(cols[2]),
        'Proteína': parseNum(cols[3]),
        'Carboidrato total': parseNum(cols[4]),
        'Lipídeos': parseNum(cols[5]),
        'Fibra alimentar': parseNum(cols[6]),
        'Cálcio': parseNum(cols[7]),
        'Ferro': parseNum(cols[8]),
        'Sódio': parseNum(cols[9]),
        'Potássio': parseNum(cols[10]),
        'Vitamina C': parseNum(cols[11]),
      };

      const salvo = await salvarAlimento(nome, grupo, nutrientes, nutrientIdMap, source);
      if (salvo) totalImportados++;
    }

    console.log(`   ✅ ${source}: importados do CSV`);
  }

  return totalImportados;
}

async function main(): Promise<void> {
  console.log('🚀 IMPORTAÇÃO DE DADOS NUTRICIONAIS REAIS\n');
  console.log('='.repeat(60));
  console.log('Fontes: Open Food Facts + CSVs locais TACO/TBCA');
  console.log('='.repeat(60));

  try {
    // Inicializar nutrientes
    console.log('\n📊 Inicializando nutrientes...');
    const nutrientIdMap = await inicializarNutrientes();
    console.log(`   ✅ ${nutrientIdMap.size} nutrientes configurados`);

    // Contar alimentos existentes
    const existentes = await prisma.food.count();
    console.log(`   📦 Alimentos existentes no banco: ${existentes}`);

    // Importar CSVs locais primeiro
    const csvImportados = await importarCSVsLocais(nutrientIdMap);

    // Importar do Open Food Facts
    const offImportados = await importarOpenFoodFacts(nutrientIdMap);

    // Resumo final
    const totalFinal = await prisma.food.count();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`   CSVs locais: +${csvImportados}`);
    console.log(`   Open Food Facts: +${offImportados}`);
    console.log(`   Total no banco: ${totalFinal}`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🏁 Importação finalizada!');
}

main().catch(console.error);
