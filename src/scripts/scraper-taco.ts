/**
 * Scraper TACO - Tabela Brasileira de Composição de Alimentos (UNICAMP)
 * 
 * A TACO está disponível em PDF, mas existem versões em JSON/CSV
 * disponibilizadas pela comunidade. Este script busca de fontes confiáveis.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

const prisma = new PrismaClient();

// URLs de dados TACO disponíveis publicamente
const TACO_SOURCES = [
  // Repositório com dados TACO em JSON
  'https://raw.githubusercontent.com/raulfdm/taco-api/main/src/data/taco.json',
  // Backup alternativo
  'https://raw.githubusercontent.com/base-de-dados/taco/main/taco.json',
];

interface TacoAlimento {
  id?: number;
  description?: string;
  descricao?: string;
  category?: { name?: string };
  categoria?: string;
  group?: string;
  grupo?: string;
  base_qty?: number;
  energy?: { kcal?: number; kj?: number };
  energia?: number;
  protein?: number;
  proteina?: number;
  carbohydrate?: number;
  carboidrato?: number;
  lipid?: number;
  lipideos?: number;
  fiber?: number;
  fibra?: number;
  calcium?: number;
  calcio?: number;
  iron?: number;
  ferro?: number;
  sodium?: number;
  sodio?: number;
  potassium?: number;
  potassio?: number;
  vitamin_c?: number;
  vitamina_c?: number;
  [key: string]: any;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Seguir redirect
        fetchJson(res.headers.location!).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Erro ao parsear JSON'));
        }
      });
    }).on('error', reject);
  });
}

function extrairValor(obj: any, ...keys: string[]): number | null {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '' && obj[key] !== '-') {
      const val = typeof obj[key] === 'object' ? obj[key].kcal || obj[key].value : obj[key];
      const num = parseFloat(String(val).replace(',', '.'));
      return isNaN(num) ? null : num;
    }
  }
  return null;
}

function extrairGrupo(obj: any): string {
  if (obj.category?.name) return obj.category.name;
  if (obj.categoria) return obj.categoria;
  if (obj.group) return obj.group;
  if (obj.grupo) return obj.grupo;
  return 'Outros';
}

function extrairNome(obj: any): string {
  return obj.description || obj.descricao || obj.nome || obj.name || 'Sem nome';
}

async function buscarDadosTaco(): Promise<TacoAlimento[]> {
  console.log('🔍 Buscando dados TACO de fontes públicas...\n');

  for (const url of TACO_SOURCES) {
    try {
      console.log(`   Tentando: ${url}`);
      const data = await fetchJson(url);
      
      // Verificar se é array ou objeto com array
      const alimentos = Array.isArray(data) ? data : data.foods || data.alimentos || data.data || [];
      
      if (alimentos.length > 0) {
        console.log(`   ✅ Encontrados ${alimentos.length} alimentos`);
        return alimentos;
      }
    } catch (error) {
      console.log(`   ❌ Falhou: ${url}`);
    }
  }

  return [];
}

async function salvarNoBanco(alimentos: TacoAlimento[]): Promise<void> {
  console.log('\n📊 Salvando no banco de dados...');

  // Criar nutrientes
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
  const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));

  let inseridos = 0;
  let atualizados = 0;
  let erros = 0;

  for (const alimento of alimentos) {
    const nome = extrairNome(alimento);
    const grupo = extrairGrupo(alimento);

    // Extrair valores nutricionais
    const nutrientes: Record<string, number | null> = {
      'Energia': extrairValor(alimento, 'energy', 'energia', 'kcal', 'energy_kcal'),
      'Proteína': extrairValor(alimento, 'protein', 'proteina', 'protein_g'),
      'Carboidrato total': extrairValor(alimento, 'carbohydrate', 'carboidrato', 'carbohydrate_g', 'carb'),
      'Lipídeos': extrairValor(alimento, 'lipid', 'lipideos', 'lipid_g', 'fat', 'gordura'),
      'Fibra alimentar': extrairValor(alimento, 'fiber', 'fibra', 'fiber_g', 'fibra_alimentar'),
      'Cálcio': extrairValor(alimento, 'calcium', 'calcio', 'calcium_mg', 'ca'),
      'Ferro': extrairValor(alimento, 'iron', 'ferro', 'iron_mg', 'fe'),
      'Sódio': extrairValor(alimento, 'sodium', 'sodio', 'sodium_mg', 'na'),
      'Potássio': extrairValor(alimento, 'potassium', 'potassio', 'potassium_mg', 'k'),
      'Vitamina C': extrairValor(alimento, 'vitamin_c', 'vitamina_c', 'vitc', 'vit_c'),
    };

    try {
      // Verificar se já existe
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
        const newFood = await prisma.food.create({
          data: {
            description: nome,
            groupName: grupo,
            sourceTable: 'TACO',
            portionGrams: 100,
          },
        });
        foodId = newFood.id;
        inseridos++;
      }

      // Inserir nutrientes
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

      if ((inseridos + atualizados) % 50 === 0) {
        process.stdout.write(`\r   📦 Processados: ${inseridos + atualizados}`);
      }
    } catch (error) {
      erros++;
    }
  }

  console.log(`\n\n   ✅ Inseridos: ${inseridos}`);
  console.log(`   ✅ Atualizados: ${atualizados}`);
  if (erros > 0) console.log(`   ⚠️ Erros: ${erros}`);
}


async function main(): Promise<void> {
  console.log('🚀 SCRAPER TACO - Tabela Brasileira de Composição de Alimentos\n');
  console.log('='.repeat(60));

  try {
    const alimentos = await buscarDadosTaco();

    if (alimentos.length === 0) {
      console.log('\n⚠️ Não foi possível obter dados TACO das fontes online.');
      console.log('   Verifique sua conexão ou tente novamente mais tarde.');
      return;
    }

    // Salvar JSON local como backup
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync('./data/taco_extraido.json', JSON.stringify(alimentos, null, 2), 'utf-8');
    console.log('\n💾 Dados salvos em ./data/taco_extraido.json');

    // Salvar no banco
    await salvarNoBanco(alimentos);

    const total = await prisma.food.count({ where: { sourceTable: 'TACO' } });
    console.log(`\n📊 Total TACO no banco: ${total}`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Extração TACO finalizada!');
}

main().catch(console.error);
