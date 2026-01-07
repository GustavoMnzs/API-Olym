/**
 * TBCA Refinado - Busca por combinações de 2 letras
 * Pega alimentos + nutrientes completos sem repetição
 */

import { PrismaClient } from '@prisma/client';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const processados = new Set<string>();

// Carregar códigos já processados do banco
async function carregarProcessados() {
  const existentes = await prisma.food.findMany({
    where: { sourceTable: 'TBCA' },
    select: { description: true }
  });
  existentes.forEach(f => processados.add(f.description));
  console.log(`   ${processados.size} alimentos TBCA já no banco\n`);
}

const NUTRIENT_MAP: Record<string, { name: string; unit: string }> = {
  'Energia_kcal': { name: 'Energia', unit: 'kcal' },
  'Proteína_g': { name: 'Proteína', unit: 'g' },
  'Lipídios_g': { name: 'Lipídios', unit: 'g' },
  'Carboidrato total_g': { name: 'Carboidrato', unit: 'g' },
  'Fibra alimentar_g': { name: 'Fibra alimentar', unit: 'g' },
  'Colesterol_mg': { name: 'Colesterol', unit: 'mg' },
  'Cálcio_mg': { name: 'Cálcio', unit: 'mg' },
  'Ferro_mg': { name: 'Ferro', unit: 'mg' },
  'Sódio_mg': { name: 'Sódio', unit: 'mg' },
  'Potássio_mg': { name: 'Potássio', unit: 'mg' },
  'Magnésio_mg': { name: 'Magnésio', unit: 'mg' },
  'Fósforo_mg': { name: 'Fósforo', unit: 'mg' },
  'Zinco_mg': { name: 'Zinco', unit: 'mg' },
  'Vitamina C_mg': { name: 'Vitamina C', unit: 'mg' },
  'Vitamina A (RAE)_mcg': { name: 'Vitamina A', unit: 'mcg' },
  'Vitamina D_mcg': { name: 'Vitamina D', unit: 'mcg' },
  'Vitamina B12_mcg': { name: 'Vitamina B12', unit: 'mcg' },
  'Ácidos graxos saturados_g': { name: 'Gordura saturada', unit: 'g' },
  'Açúcar de adição_g': { name: 'Açúcares', unit: 'g' },
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

async function extrairNutrientes(page: Page): Promise<Record<string, number> | null> {
  return page.evaluate(() => {
    const result: Record<string, number> = {};
    const rows = document.querySelectorAll('table#tabela1 tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const comp = cells[0]?.textContent?.trim() || '';
        const unit = cells[1]?.textContent?.trim() || '';
        const val = cells[2]?.textContent?.trim() || '';
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) result[comp + '_' + unit] = num;
      }
    });
    return Object.keys(result).length > 0 ? result : null;
  });
}

async function processarBusca(page: Page, termo: string): Promise<number> {
  let salvos = 0;
  
  try {
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2', timeout: 15000
    });
    await sleep(300);

    await page.evaluate(() => {
      (document.getElementById('produto') as HTMLInputElement).value = '';
    });
    await page.type('#produto', termo, { delay: 20 });
    await page.click('button[type="submit"]');
    await sleep(1500);

    const links = await page.evaluate(() => {
      const results: { nome: string; href: string }[] = [];
      document.querySelectorAll('table tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const linkEl = cells[1]?.querySelector('a');
          if (linkEl) {
            results.push({
              nome: linkEl.textContent?.trim() || '',
              href: linkEl.getAttribute('href') || ''
            });
          }
        }
      });
      return results;
    });

    for (const item of links) {
      if (!item.nome || !item.href) continue;
      if (processados.has(item.nome)) continue;
      processados.add(item.nome);

      try {
        await page.goto('https://www.tbca.net.br/base-dados/' + item.href, {
          waitUntil: 'networkidle2', timeout: 12000
        });
        await sleep(500);

        const nutrientes = await extrairNutrientes(page);
        if (!nutrientes || !nutrientes['Energia_kcal']) continue;

        const food = await prisma.food.create({
          data: {
            description: item.nome,
            groupName: 'TBCA',
            sourceTable: 'TBCA',
            portionGrams: 100,
          }
        });

        for (const [key, value] of Object.entries(nutrientes)) {
          const map = NUTRIENT_MAP[key];
          if (!map) continue;
          const nutrientId = await getOrCreateNutrient(map.name, map.unit);
          await prisma.foodNutrient.create({
            data: { foodId: food.id, nutrientId, valuePer100g: value }
          });
        }

        salvos++;
      } catch {}
    }
  } catch {}

  return salvos;
}

async function main() {
  console.log('🚀 TBCA REFINADO - Busca por combinações\n');
  
  await carregarProcessados();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  let total = 0;

  // Combinações de 2 letras mais comuns em português
  const combos = [
    // Vogal + Consoante
    'AB', 'AC', 'AD', 'AF', 'AG', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS', 'AT', 'AV', 'AZ',
    'EB', 'EC', 'ED', 'EF', 'EG', 'EL', 'EM', 'EN', 'EP', 'ER', 'ES', 'ET', 'EV',
    'IB', 'IC', 'ID', 'IF', 'IG', 'IL', 'IM', 'IN', 'IP', 'IR', 'IS', 'IT', 'IV',
    'OB', 'OC', 'OD', 'OF', 'OG', 'OL', 'OM', 'ON', 'OP', 'OR', 'OS', 'OT', 'OV',
    'UB', 'UC', 'UD', 'UF', 'UG', 'UL', 'UM', 'UN', 'UP', 'UR', 'US', 'UT', 'UV',
    // Consoante + Vogal
    'BA', 'BE', 'BI', 'BO', 'BU',
    'CA', 'CE', 'CI', 'CO', 'CU',
    'DA', 'DE', 'DI', 'DO', 'DU',
    'FA', 'FE', 'FI', 'FO', 'FU',
    'GA', 'GE', 'GI', 'GO', 'GU',
    'JA', 'JE', 'JI', 'JO', 'JU',
    'LA', 'LE', 'LI', 'LO', 'LU',
    'MA', 'ME', 'MI', 'MO', 'MU',
    'NA', 'NE', 'NI', 'NO', 'NU',
    'PA', 'PE', 'PI', 'PO', 'PU',
    'QU',
    'RA', 'RE', 'RI', 'RO', 'RU',
    'SA', 'SE', 'SI', 'SO', 'SU',
    'TA', 'TE', 'TI', 'TO', 'TU',
    'VA', 'VE', 'VI', 'VO', 'VU',
    'XA', 'XE', 'XI',
    'ZA', 'ZE', 'ZI', 'ZO',
    // Combinações especiais
    'CH', 'LH', 'NH', 'PR', 'TR', 'CR', 'FR', 'GR', 'BR', 'DR',
    'PL', 'CL', 'FL', 'GL', 'BL',
  ];

  console.log(`📝 Buscando ${combos.length} combinações...\n`);

  for (let i = 0; i < combos.length; i++) {
    const combo = combos[i];
    const salvos = await processarBusca(page, combo);
    total += salvos;
    
    if (salvos > 0) {
      process.stdout.write(`${combo}:+${salvos} `);
    }
    
    // Progresso a cada 20
    if ((i + 1) % 20 === 0) {
      console.log(`\n   [${i + 1}/${combos.length}] Total: ${total}`);
    }
    
    await sleep(400);
  }

  await browser.close();

  // Stats
  const tbcaTotal = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  const totalGeral = await prisma.food.count();

  console.log('\n\n' + '='.repeat(50));
  console.log(`📊 TBCA total: ${tbcaTotal}`);
  console.log(`📊 Total geral: ${totalGeral}`);
  console.log(`✅ Novos nesta execução: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
