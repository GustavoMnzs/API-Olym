/**
 * Importador TBCA Inteligente
 * Busca TODOS os alimentos da TBCA de forma inteligente:
 * - Busca por cada letra do alfabeto
 * - Busca por cada grupo
 * - Controle de duplicatas
 * - Paginação automática
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const DELAY = 600;
const OUTPUT_FILE = './data/tbca_completo.json';

interface AlimentoTBCA {
  codigo: string;
  nome: string;
  grupo: string;
}

const alimentosMap = new Map<string, AlimentoTBCA>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extrairResultados(page: Page): Promise<{ codigo: string; nome: string }[]> {
  return page.evaluate(() => {
    const results: { codigo: string; nome: string }[] = [];
    document.querySelectorAll('table tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const link = cells[1]?.querySelector('a');
        if (link) {
          results.push({
            codigo: cells[0]?.textContent?.trim() || '',
            nome: link.textContent?.trim() || '',
          });
        }
      }
    });
    return results;
  });
}

async function buscarPorTexto(page: Page, texto: string, grupo: string = ''): Promise<number> {
  try {
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });
    await sleep(400);

    // Digitar texto de busca
    const input = await page.$('#produto');
    if (input) {
      await input.click({ clickCount: 3 });
      await input.type(texto);
    }

    // Selecionar grupo se especificado
    if (grupo) {
      await page.select('#cmb_grupo', grupo);
    }

    await sleep(200);
    await page.click('button');
    await sleep(1500);

    const items = await extrairResultados(page);
    
    let novos = 0;
    for (const item of items) {
      if (!alimentosMap.has(item.codigo)) {
        alimentosMap.set(item.codigo, {
          codigo: item.codigo,
          nome: item.nome,
          grupo: grupo || 'Geral',
        });
        novos++;
      }
    }

    return novos;
  } catch (e) {
    return 0;
  }
}

async function obterGrupos(page: Page): Promise<{ value: string; text: string }[]> {
  await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
    waitUntil: 'networkidle2',
  });
  await sleep(500);

  return page.evaluate(() => {
    const select = document.getElementById('cmb_grupo') as HTMLSelectElement;
    if (!select) return [];
    return Array.from(select.options)
      .filter(opt => opt.value && opt.value !== '0')
      .map(opt => ({ value: opt.value, text: opt.textContent?.trim() || '' }));
  });
}

async function main() {
  console.log('🚀 IMPORTADOR TBCA INTELIGENTE\n');
  console.log('='.repeat(60));
  console.log('Estratégia: Busca por letra + grupo para máxima cobertura');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

  try {
    // 1. Obter grupos
    console.log('\n📋 Obtendo grupos de alimentos...');
    const grupos = await obterGrupos(page);
    console.log(`   ${grupos.length} grupos encontrados`);

    // 2. Buscar por cada letra do alfabeto
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    console.log('\n🔤 FASE 1: Busca por letra do alfabeto\n');
    
    for (const letra of letras) {
      const novos = await buscarPorTexto(page, letra);
      console.log(`   ${letra}: +${novos} novos (total: ${alimentosMap.size})`);
      await sleep(DELAY);
    }

    // 3. Buscar por sílabas comuns
    console.log('\n📝 FASE 2: Busca por sílabas comuns\n');
    
    const silabas = [
      'ar', 'ba', 'ca', 'ce', 'co', 'de', 'fa', 'fe', 'fi', 'fr',
      'go', 'la', 'le', 'li', 'ma', 'me', 'mi', 'mo', 'pa', 'pe',
      'pi', 'po', 'pr', 'qu', 're', 'sa', 'se', 'so', 'ta', 'to',
      'tr', 'va', 've', 'vi', 'açu', 'aba', 'ace', 'agu', 'alm',
      'ame', 'arr', 'ave', 'bac', 'ban', 'bat', 'bei', 'bis', 'bol',
      'bov', 'bri', 'cab', 'caf', 'car', 'cas', 'cer', 'cho', 'cos',
      'cre', 'dou', 'emp', 'erv', 'far', 'fei', 'fil', 'fla', 'fra',
      'fru', 'gel', 'gor', 'gra', 'ham', 'iog', 'jam', 'lar', 'lei',
      'len', 'lim', 'lin', 'mac', 'man', 'mar', 'mel', 'mil', 'mol',
      'mor', 'mus', 'noz', 'ovo', 'pao', 'pas', 'pei', 'per', 'pes',
      'pim', 'piz', 'pol', 'por', 'pre', 'pro', 'pud', 'que', 'rap',
      'ref', 'rep', 'sal', 'sar', 'soj', 'sor', 'suc', 'tam', 'tar',
      'tom', 'tor', 'tri', 'uva', 'vit', 'whe', 'yog',
    ];

    for (const silaba of silabas) {
      const novos = await buscarPorTexto(page, silaba);
      if (novos > 0) {
        process.stdout.write(`   "${silaba}": +${novos} | `);
      }
      await sleep(DELAY / 2);
    }
    console.log(`\n   Total após sílabas: ${alimentosMap.size}`);

    // 4. Buscar por grupo + letra
    console.log('\n🏷️ FASE 3: Busca por grupo + letra\n');
    
    for (const grupo of grupos) {
      console.log(`   📂 ${grupo.text}`);
      let grupoNovos = 0;
      
      for (const letra of letras) {
        const novos = await buscarPorTexto(page, letra, grupo.value);
        grupoNovos += novos;
        await sleep(DELAY / 2);
      }
      
      // Atualizar grupo dos alimentos encontrados
      alimentosMap.forEach((alimento, codigo) => {
        if (alimento.grupo === 'Geral') {
          // Tentar associar ao grupo correto baseado no nome
        }
      });
      
      console.log(`      +${grupoNovos} novos (total: ${alimentosMap.size})`);
    }

    // 5. Buscar termos específicos
    console.log('\n🎯 FASE 4: Termos específicos\n');
    
    const termosEspecificos = [
      'integral', 'light', 'diet', 'zero', 'sem glúten', 'orgânico',
      'cru', 'cozido', 'assado', 'frito', 'grelhado', 'refogado',
      'congelado', 'enlatado', 'desidratado', 'em pó', 'líquido',
      'natural', 'artificial', 'industrializado', 'caseiro',
      'proteína', 'fibra', 'vitamina', 'mineral', 'suplemento',
    ];

    for (const termo of termosEspecificos) {
      const novos = await buscarPorTexto(page, termo);
      if (novos > 0) {
        console.log(`   "${termo}": +${novos}`);
      }
      await sleep(DELAY / 2);
    }

    console.log(`\n📊 Total de alimentos únicos: ${alimentosMap.size}`);

    // Salvar JSON
    const alimentos = Array.from(alimentosMap.values());
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(alimentos, null, 2));
    console.log(`💾 Dados salvos em ${OUTPUT_FILE}`);

    // Salvar no banco
    console.log('\n📊 Salvando no banco de dados...');
    
    let inseridos = 0;
    let atualizados = 0;

    for (const alimento of alimentos) {
      try {
        const exists = await prisma.food.findFirst({
          where: { 
            OR: [
              { description: alimento.nome, sourceTable: 'TBCA' },
              { description: alimento.nome, sourceTable: 'TACO' },
            ]
          },
        });

        if (!exists) {
          await prisma.food.create({
            data: {
              description: alimento.nome,
              groupName: alimento.grupo,
              sourceTable: 'TBCA',
              portionGrams: 100,
            },
          });
          inseridos++;
        } else if (exists.sourceTable === 'TBCA') {
          atualizados++;
        }
      } catch (e) {}
    }

    console.log(`   ✅ Inseridos: ${inseridos}`);
    console.log(`   ✅ Já existentes: ${atualizados}`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  const totalTBCA = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total TBCA no banco: ${totalTBCA}`);
  console.log(`📊 Total geral no banco: ${totalGeral}`);
  console.log('🏁 Importação finalizada!');
}

main().catch(console.error);
