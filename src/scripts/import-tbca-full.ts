/**
 * Importador TBCA Completo
 * Extrai todos os alimentos do site oficial da TBCA
 * https://www.tbca.net.br
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const DELAY = 800;
const OUTPUT_FILE = './data/tbca_alimentos.json';

interface AlimentoTBCA {
  codigo: string;
  nome: string;
  grupo: string;
  nutrientes: Record<string, number | null>;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getGrupos(page: Page): Promise<{ value: string; text: string }[]> {
  return page.evaluate(() => {
    const select = document.getElementById('cmb_grupo') as HTMLSelectElement;
    if (!select) return [];
    return Array.from(select.options)
      .filter(opt => opt.value && opt.value !== '0')
      .map(opt => ({ value: opt.value, text: opt.textContent?.trim() || '' }));
  });
}

async function buscarPorGrupo(page: Page, grupoValue: string): Promise<{ codigo: string; nome: string; href: string }[]> {
  // Selecionar grupo
  await page.select('#cmb_grupo', grupoValue);
  await sleep(500);
  
  // Clicar em buscar
  await page.click('button[type="submit"], input[type="submit"]');
  await sleep(2000);
  
  // Extrair resultados
  return page.evaluate(() => {
    const items: { codigo: string; nome: string; href: string }[] = [];
    const rows = document.querySelectorAll('table tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const link = cells[1]?.querySelector('a');
        if (link) {
          items.push({
            codigo: cells[0]?.textContent?.trim() || '',
            nome: link.textContent?.trim() || '',
            href: link.getAttribute('href') || '',
          });
        }
      }
    });
    
    return items;
  });
}

async function getDetalhesAlimento(page: Page, href: string): Promise<Record<string, number | null>> {
  const nutrientes: Record<string, number | null> = {};
  
  try {
    await page.goto(`https://www.tbca.net.br/base-dados/${href}`, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
    
    await sleep(500);
    
    const dados = await page.evaluate(() => {
      const result: Record<string, string> = {};
      
      // Buscar tabela de nutrientes
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const nome = cells[0]?.textContent?.trim() || '';
            const valor = cells[1]?.textContent?.trim() || '';
            if (nome && valor) {
              result[nome] = valor;
            }
          }
        });
      });
      
      return result;
    });
    
    // Mapear nutrientes
    const mapa: Record<string, string> = {
      'Energia': 'Energia',
      'Energia (kcal)': 'Energia',
      'Proteína': 'Proteína',
      'Proteína (g)': 'Proteína',
      'Carboidrato total': 'Carboidrato total',
      'Carboidrato (g)': 'Carboidrato total',
      'Lipídios': 'Lipídeos',
      'Lipídeos': 'Lipídeos',
      'Lipídeos (g)': 'Lipídeos',
      'Fibra alimentar': 'Fibra alimentar',
      'Fibra alimentar (g)': 'Fibra alimentar',
    };
    
    for (const [key, value] of Object.entries(dados)) {
      const nutriente = mapa[key];
      if (nutriente) {
        const num = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''));
        nutrientes[nutriente] = isNaN(num) ? null : num;
      }
    }
  } catch (e) {
    // Ignorar erros
  }
  
  return nutrientes;
}

async function salvarNoBanco(alimentos: AlimentoTBCA[]) {
  console.log('\n📊 Salvando no banco de dados...');
  
  // Garantir nutrientes existem
  const nutrientesNomes = [
    { name: 'Energia', unit: 'kcal' },
    { name: 'Proteína', unit: 'g' },
    { name: 'Carboidrato total', unit: 'g' },
    { name: 'Lipídeos', unit: 'g' },
    { name: 'Fibra alimentar', unit: 'g' },
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

  for (const alimento of alimentos) {
    try {
      const existing = await prisma.food.findFirst({
        where: { description: alimento.nome, sourceTable: 'TBCA' },
      });

      let foodId: number;

      if (existing) {
        await prisma.food.update({
          where: { id: existing.id },
          data: { groupName: alimento.grupo },
        });
        foodId = existing.id;
        atualizados++;
      } else {
        const food = await prisma.food.create({
          data: {
            description: alimento.nome,
            groupName: alimento.grupo,
            sourceTable: 'TBCA',
            portionGrams: 100,
          },
        });
        foodId = food.id;
        inseridos++;
      }

      for (const [nome, valor] of Object.entries(alimento.nutrientes)) {
        if (valor === null) continue;
        const nid = nutrientIdMap.get(nome);
        if (!nid) continue;

        await prisma.foodNutrient.upsert({
          where: { foodId_nutrientId: { foodId, nutrientId: nid } },
          update: { valuePer100g: valor },
          create: { foodId, nutrientId: nid, valuePer100g: valor },
        });
      }
    } catch (e) {}
  }

  console.log(`   ✅ Inseridos: ${inseridos}`);
  console.log(`   ✅ Atualizados: ${atualizados}`);
}


async function main() {
  console.log('🚀 IMPORTADOR TBCA COMPLETO\n');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  const todosAlimentos: AlimentoTBCA[] = [];

  try {
    console.log('\n📂 Acessando TBCA...');
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await sleep(2000);

    // Obter grupos
    const grupos = await getGrupos(page);
    console.log(`\n📋 Encontrados ${grupos.length} grupos de alimentos:`);
    grupos.forEach(g => console.log(`   - ${g.text}`));

    // Processar cada grupo
    for (const grupo of grupos) {
      console.log(`\n🔍 Processando: ${grupo.text}...`);
      
      // Voltar para página de busca
      await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
        waitUntil: 'networkidle2',
      });
      await sleep(1000);

      const alimentos = await buscarPorGrupo(page, grupo.value);
      console.log(`   Encontrados: ${alimentos.length} alimentos`);

      // Pegar detalhes de cada alimento (limitado para não sobrecarregar)
      let count = 0;
      for (const alimento of alimentos) {
        if (!alimento.href) continue;
        
        await sleep(DELAY);
        const nutrientes = await getDetalhesAlimento(page, alimento.href);
        
        todosAlimentos.push({
          codigo: alimento.codigo,
          nome: alimento.nome,
          grupo: grupo.text,
          nutrientes,
        });

        count++;
        if (count % 10 === 0) {
          process.stdout.write(`\r   Processados: ${count}/${alimentos.length}`);
        }
      }
      console.log(`\r   ✅ Processados: ${count} alimentos`);
    }

    // Salvar JSON
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(todosAlimentos, null, 2));
    console.log(`\n💾 Dados salvos em ${OUTPUT_FILE}`);

    // Salvar no banco
    if (todosAlimentos.length > 0) {
      await salvarNoBanco(todosAlimentos);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  const totalTBCA = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total TBCA extraído: ${todosAlimentos.length}`);
  console.log(`📊 Total TBCA no banco: ${totalTBCA}`);
  console.log('🏁 Importação finalizada!');
}

main().catch(console.error);
