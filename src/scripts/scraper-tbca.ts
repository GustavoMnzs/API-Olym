/**
 * Scraper TBCA - Tabela Brasileira de Composição de Alimentos
 * https://www.tbca.net.br
 * 
 * Este script extrai dados reais de composição nutricional do site oficial da TBCA
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';

const prisma = new PrismaClient();

// Configurações
const BASE_URL = 'https://www.tbca.net.br';
const DELAY_BETWEEN_REQUESTS = 1500; // 1.5s entre requisições para não sobrecarregar
const OUTPUT_FILE = './data/tbca_extraido.json';

interface AlimentoTBCA {
  codigo: string;
  nome: string;
  grupo: string;
  nutrientes: Record<string, number | null>;
}

// Mapeamento de nutrientes TBCA para nosso banco
const NUTRIENTES_MAP: Record<string, string> = {
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
  'Cálcio': 'Cálcio',
  'Cálcio (mg)': 'Cálcio',
  'Ferro': 'Ferro',
  'Ferro (mg)': 'Ferro',
  'Sódio': 'Sódio',
  'Sódio (mg)': 'Sódio',
  'Potássio': 'Potássio',
  'Potássio (mg)': 'Potássio',
  'Vitamina C': 'Vitamina C',
  'Vitamina C (mg)': 'Vitamina C',
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser(): Promise<Browser> {
  console.log('🌐 Iniciando navegador...');
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function getGruposAlimentos(page: Page): Promise<{ id: string; nome: string }[]> {
  console.log('📂 Buscando grupos de alimentos...');
  
  await page.goto(`${BASE_URL}/base-dados/composicao_estatistica.php`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Aguardar carregamento do select de grupos
  await page.waitForSelector('select[name="grupo"], #grupo, select#selectGrupo', { timeout: 10000 }).catch(() => null);

  const grupos = await page.evaluate(() => {
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const options = select.querySelectorAll('option');
      if (options.length > 5) {
        return Array.from(options)
          .filter(opt => opt.value && opt.value !== '' && opt.value !== '0')
          .map(opt => ({
            id: opt.value,
            nome: opt.textContent?.trim() || '',
          }));
      }
    }
    return [];
  });

  console.log(`   Encontrados ${grupos.length} grupos`);
  return grupos;
}

async function getAlimentosPorGrupo(page: Page, grupoId: string, grupoNome: string): Promise<{ codigo: string; nome: string }[]> {
  console.log(`\n🔍 Buscando alimentos do grupo: ${grupoNome}`);

  // Navegar para página de busca com o grupo selecionado
  await page.goto(`${BASE_URL}/base-dados/composicao_estatistica.php?grupo=${grupoId}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  await sleep(1000);

  // Tentar clicar no botão de busca se existir
  const btnBuscar = await page.$('button[type="submit"], input[type="submit"], .btn-buscar');
  if (btnBuscar) {
    await btnBuscar.click();
    await sleep(2000);
  }

  // Extrair lista de alimentos
  const alimentos = await page.evaluate(() => {
    const items: { codigo: string; nome: string }[] = [];
    
    // Tentar diferentes seletores
    const links = document.querySelectorAll('a[href*="alimento"], table tr td a, .lista-alimentos a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const codigoMatch = href.match(/codigo=([A-Z0-9_]+)/i) || href.match(/id=(\d+)/);
      if (codigoMatch) {
        items.push({
          codigo: codigoMatch[1],
          nome: link.textContent?.trim() || '',
        });
      }
    });

    // Se não encontrou por links, tentar por tabela
    if (items.length === 0) {
      const rows = document.querySelectorAll('table tbody tr, .tabela-alimentos tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const codigo = cells[0]?.textContent?.trim() || '';
          const nome = cells[1]?.textContent?.trim() || '';
          if (codigo && nome) {
            items.push({ codigo, nome });
          }
        }
      });
    }

    return items;
  });

  console.log(`   Encontrados ${alimentos.length} alimentos`);
  return alimentos;
}


async function getDetalhesAlimento(page: Page, codigo: string): Promise<Record<string, number | null>> {
  const nutrientes: Record<string, number | null> = {};

  try {
    await page.goto(`${BASE_URL}/base-dados/int_composicao_alimentos.php?cod_produto=${codigo}`, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    await sleep(500);

    const dados = await page.evaluate(() => {
      const result: Record<string, string> = {};
      
      // Buscar tabela de nutrientes
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const nutriente = cells[0]?.textContent?.trim() || '';
            const valor = cells[1]?.textContent?.trim() || '';
            if (nutriente && valor) {
              result[nutriente] = valor;
            }
          }
        });
      });

      // Tentar também por divs/spans
      const items = document.querySelectorAll('.nutriente-item, .composicao-item');
      items.forEach(item => {
        const label = item.querySelector('.label, .nome')?.textContent?.trim() || '';
        const value = item.querySelector('.value, .valor')?.textContent?.trim() || '';
        if (label && value) {
          result[label] = value;
        }
      });

      return result;
    });

    // Converter valores para números
    for (const [key, value] of Object.entries(dados)) {
      const nutrienteNome = NUTRIENTES_MAP[key];
      if (nutrienteNome) {
        const numValue = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''));
        nutrientes[nutrienteNome] = isNaN(numValue) ? null : numValue;
      }
    }
  } catch (error) {
    console.log(`   ⚠️ Erro ao buscar detalhes: ${codigo}`);
  }

  return nutrientes;
}

async function salvarNoArquivo(alimentos: AlimentoTBCA[]): Promise<void> {
  // Garantir que o diretório existe
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(alimentos, null, 2), 'utf-8');
  console.log(`\n💾 Dados salvos em ${OUTPUT_FILE}`);
}

async function salvarNoBanco(alimentos: AlimentoTBCA[]): Promise<void> {
  console.log('\n📊 Salvando no banco de dados...');

  // Criar nutrientes se não existirem
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

  for (const alimento of alimentos) {
    try {
      // Verificar se já existe
      const existing = await prisma.food.findFirst({
        where: {
          description: alimento.nome,
          sourceTable: 'TBCA',
        },
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
        const newFood = await prisma.food.create({
          data: {
            description: alimento.nome,
            groupName: alimento.grupo,
            sourceTable: 'TBCA',
            portionGrams: 100,
          },
        });
        foodId = newFood.id;
        inseridos++;
      }

      // Inserir/atualizar nutrientes
      for (const [nutrienteName, value] of Object.entries(alimento.nutrientes)) {
        if (value === null) continue;
        
        const nutrientId = nutrientIdMap.get(nutrienteName);
        if (!nutrientId) continue;

        await prisma.foodNutrient.upsert({
          where: { foodId_nutrientId: { foodId, nutrientId } },
          update: { valuePer100g: value },
          create: { foodId, nutrientId, valuePer100g: value },
        });
      }
    } catch (error) {
      console.log(`   ⚠️ Erro ao salvar: ${alimento.nome}`);
    }
  }

  console.log(`   ✅ Inseridos: ${inseridos}`);
  console.log(`   ✅ Atualizados: ${atualizados}`);
}


async function main(): Promise<void> {
  console.log('🚀 SCRAPER TBCA - Tabela Brasileira de Composição de Alimentos\n');
  console.log('='.repeat(60));

  const browser = await initBrowser();
  const page = await browser.newPage();
  
  // Configurar user agent para parecer um navegador real
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const todosAlimentos: AlimentoTBCA[] = [];

  try {
    // Buscar grupos
    const grupos = await getGruposAlimentos(page);

    if (grupos.length === 0) {
      console.log('\n⚠️ Não foi possível encontrar grupos. Tentando busca direta...');
      
      // Tentar busca direta na página principal
      await page.goto(`${BASE_URL}/base-dados/composicao_estatistica.php`, {
        waitUntil: 'networkidle2',
      });

      // Capturar screenshot para debug
      await page.screenshot({ path: './data/tbca_debug.png', fullPage: true });
      console.log('   Screenshot salvo em ./data/tbca_debug.png');

      // Salvar HTML para análise
      const html = await page.content();
      fs.writeFileSync('./data/tbca_debug.html', html, 'utf-8');
      console.log('   HTML salvo em ./data/tbca_debug.html');
    }

    // Processar cada grupo
    for (const grupo of grupos) {
      await sleep(DELAY_BETWEEN_REQUESTS);
      
      const alimentos = await getAlimentosPorGrupo(page, grupo.id, grupo.nome);

      for (const alimento of alimentos) {
        await sleep(DELAY_BETWEEN_REQUESTS);
        
        const nutrientes = await getDetalhesAlimento(page, alimento.codigo);

        todosAlimentos.push({
          codigo: alimento.codigo,
          nome: alimento.nome,
          grupo: grupo.nome,
          nutrientes,
        });

        process.stdout.write(`\r   📦 Total extraído: ${todosAlimentos.length}`);
      }
    }

    console.log('\n');

    if (todosAlimentos.length > 0) {
      // Salvar em arquivo JSON
      await salvarNoArquivo(todosAlimentos);

      // Salvar no banco
      await salvarNoBanco(todosAlimentos);
    } else {
      console.log('\n⚠️ Nenhum alimento foi extraído.');
      console.log('   Verifique os arquivos de debug em ./data/');
    }

  } catch (error) {
    console.error('\n❌ Erro durante extração:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Extração finalizada!');
  console.log(`   Total de alimentos: ${todosAlimentos.length}`);
}

// Executar
main().catch(console.error);
