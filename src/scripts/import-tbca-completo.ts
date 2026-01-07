/**
 * Importador TBCA COMPLETO
 * Busca alimentos E nutrientes de uma vez
 * Não salva alimento sem dados nutricionais
 */

import { PrismaClient } from '@prisma/client';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const processados = new Set<string>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseNum(val: string): number | null {
  if (!val || val === 'NA' || val === 'Tr' || val === '-' || val === 'Vest') return null;
  const num = parseFloat(val.replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

// Mapeamento de nutrientes TBCA -> nosso banco
const NUTRIENT_MAP: Record<string, { name: string; unit: string }> = {
  'Energia_kcal': { name: 'Energia', unit: 'kcal' },
  'Proteína_g': { name: 'Proteína', unit: 'g' },
  'Lipídios_g': { name: 'Lipídios', unit: 'g' },
  'Carboidrato total_g': { name: 'Carboidrato', unit: 'g' },
  'Carboidrato disponível_g': { name: 'Carboidrato disponível', unit: 'g' },
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
};

async function extrairNutrientesDaPagina(page: Page): Promise<Record<string, number> | null> {
  try {
    const data = await page.evaluate(() => {
      const result: Record<string, number> = {};
      const rows = document.querySelectorAll('table#tabela1 tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const componente = cells[0]?.textContent?.trim() || '';
          const unidade = cells[1]?.textContent?.trim() || '';
          const valor100g = cells[2]?.textContent?.trim() || '';
          
          const key = componente + '_' + unidade;
          const numVal = parseFloat(valor100g.replace(',', '.'));
          if (!isNaN(numVal)) {
            result[key] = numVal;
          }
        }
      });
      
      return Object.keys(result).length > 0 ? result : null;
    });
    
    return data;
  } catch {
    return null;
  }
}

async function processarPaginaDeBusca(page: Page, termo: string): Promise<number> {
  let salvos = 0;
  
  try {
    // Ir para busca
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    await sleep(400);

    // Buscar
    await page.evaluate(() => {
      const input = document.getElementById('produto') as HTMLInputElement;
      if (input) input.value = '';
    });
    await page.type('#produto', termo, { delay: 30 });
    await page.click('button[type="submit"]');
    await sleep(1500);

    // Pegar todos os links da tabela
    const links = await page.evaluate(() => {
      const results: { codigo: string; nome: string; href: string }[] = [];
      const rows = document.querySelectorAll('table tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const codigo = cells[0]?.textContent?.trim() || '';
          const linkEl = cells[1]?.querySelector('a');
          if (linkEl) {
            const nome = linkEl.textContent?.trim() || '';
            const href = linkEl.getAttribute('href') || '';
            if (codigo && nome && href) {
              results.push({ codigo, nome, href });
            }
          }
        }
      });
      
      return results;
    });

    // Processar cada alimento
    for (const item of links) {
      // Já processado?
      if (processados.has(item.codigo)) continue;
      processados.add(item.codigo);

      // Já existe no banco?
      const exists = await prisma.food.findFirst({
        where: { 
          OR: [
            { description: item.nome },
            { description: { contains: item.codigo } }
          ],
          sourceTable: 'TBCA'
        }
      });
      
      if (exists) continue;

      try {
        // Ir para página de detalhes
        await page.goto('https://www.tbca.net.br/base-dados/' + item.href, {
          waitUntil: 'networkidle2',
          timeout: 12000
        });
        await sleep(600);

        // Extrair nutrientes
        const nutrientes = await extrairNutrientesDaPagina(page);
        
        if (!nutrientes || !nutrientes['Energia_kcal']) {
          continue; // Pular se não tem dados
        }

        // Criar alimento
        const food = await prisma.food.create({
          data: {
            description: item.nome,
            groupName: 'TBCA',
            sourceTable: 'TBCA',
            portionGrams: 100,
          }
        });

        // Inserir nutrientes
        for (const [tbcaKey, value] of Object.entries(nutrientes)) {
          const mapping = NUTRIENT_MAP[tbcaKey];
          if (!mapping) continue;

          // Buscar/criar nutriente
          let nutrient = await prisma.nutrient.findFirst({
            where: { name: mapping.name }
          });
          
          if (!nutrient) {
            nutrient = await prisma.nutrient.create({
              data: { name: mapping.name, unit: mapping.unit }
            });
          }

          // Inserir valor
          await prisma.foodNutrient.create({
            data: {
              foodId: food.id,
              nutrientId: nutrient.id,
              valuePer100g: value
            }
          });
        }

        salvos++;
      } catch (e) {
        // Ignorar erros individuais
      }
    }
  } catch (e) {
    // Ignorar erros de busca
  }

  return salvos;
}

async function main() {
  console.log('🚀 IMPORTADOR TBCA COMPLETO\n');
  console.log('   Busca alimentos + nutrientes de uma vez\n');

  // Limpar alimentos TBCA sem nutrientes
  console.log('🧹 Limpando alimentos TBCA sem nutrientes...');
  const semNutrientes = await prisma.food.findMany({
    where: { 
      sourceTable: 'TBCA',
      nutrients: { none: {} }
    },
    select: { id: true }
  });
  
  if (semNutrientes.length > 0) {
    await prisma.food.deleteMany({
      where: { id: { in: semNutrientes.map(f => f.id) } }
    });
    console.log(`   Removidos: ${semNutrientes.length} alimentos sem dados\n`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  let totalSalvos = 0;

  // Fase 1: Buscar por letras
  console.log('📝 FASE 1: Busca por letras\n');
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (const letra of letras) {
    const salvos = await processarPaginaDeBusca(page, letra);
    totalSalvos += salvos;
    process.stdout.write(`${letra}:${salvos} `);
    await sleep(500);
  }
  console.log(`\n   Total: ${totalSalvos}\n`);

  // Fase 2: Combinações comuns
  console.log('📝 FASE 2: Combinações\n');
  const combos = [
    'AR', 'BA', 'BE', 'BI', 'BO', 'CA', 'CE', 'CO', 'FA', 'FE', 'FI',
    'GA', 'GE', 'LA', 'LE', 'MA', 'ME', 'MI', 'MO', 'PA', 'PE', 'PI',
    'QU', 'RA', 'RE', 'SA', 'SE', 'SO', 'TA', 'TO', 'VA', 'VI'
  ];
  
  for (const combo of combos) {
    const salvos = await processarPaginaDeBusca(page, combo);
    totalSalvos += salvos;
    if (salvos > 0) process.stdout.write(`${combo}:${salvos} `);
    await sleep(400);
  }
  console.log(`\n   Total: ${totalSalvos}\n`);

  // Fase 3: Termos específicos
  console.log('📝 FASE 3: Termos específicos\n');
  const termos = [
    'carne', 'frango', 'peixe', 'ovo', 'leite', 'queijo', 'arroz', 'feijão',
    'batata', 'tomate', 'banana', 'maçã', 'laranja', 'açúcar', 'óleo',
    'farinha', 'pão', 'macarrão', 'chocolate', 'café', 'suco',
    'mandioca', 'milho', 'soja', 'castanha', 'abóbora', 'cenoura',
    'brócolis', 'couve', 'alface', 'linguiça', 'presunto', 'camarão',
    'sardinha', 'atum', 'salmão', 'iogurte', 'manteiga', 'mel', 'bolo'
  ];
  
  for (const termo of termos) {
    const salvos = await processarPaginaDeBusca(page, termo);
    totalSalvos += salvos;
    if (salvos > 0) process.stdout.write(`${termo}:${salvos} `);
    await sleep(400);
  }

  await browser.close();

  // Stats finais
  const stats = await prisma.food.groupBy({
    by: ['sourceTable'],
    _count: true,
  });
  
  const tbcaComNutrientes = await prisma.food.count({
    where: {
      sourceTable: 'TBCA',
      nutrients: { some: {} }
    }
  });

  console.log('\n\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  console.log(`   TBCA com nutrientes: ${tbcaComNutrientes}`);
  console.log(`\n✅ Novos salvos nesta execução: ${totalSalvos}`);
  console.log('🏁 Finalizado!');

  await prisma.$disconnect();
}

main().catch(console.error);
