/**
 * Importador TBCA Rápido
 * Extrai lista de alimentos da TBCA (sem detalhes nutricionais individuais)
 */

import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

interface Alimento {
  codigo: string;
  nome: string;
  grupo: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 IMPORTADOR TBCA RÁPIDO\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

  const alimentos: Alimento[] = [];

  try {
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(2000);

    // Obter grupos
    const grupos = await page.evaluate(() => {
      const select = document.getElementById('cmb_grupo') as HTMLSelectElement;
      if (!select) return [];
      return Array.from(select.options)
        .filter(opt => opt.value && opt.value !== '0')
        .map(opt => ({ value: opt.value, text: opt.textContent?.trim() || '' }));
    });

    console.log(`📋 ${grupos.length} grupos encontrados\n`);

    for (const grupo of grupos) {
      console.log(`🔍 ${grupo.text}...`);
      
      await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
        waitUntil: 'networkidle2',
      });
      await sleep(500);

      await page.select('#cmb_grupo', grupo.value);
      await sleep(300);
      await page.click('button');
      await sleep(1500);

      const items = await page.evaluate(() => {
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

      items.forEach(item => {
        alimentos.push({ ...item, grupo: grupo.text });
      });

      console.log(`   ✅ ${items.length} alimentos`);
    }

    // Salvar no banco
    console.log(`\n📊 Salvando ${alimentos.length} alimentos no banco...`);

    let inseridos = 0;
    for (const a of alimentos) {
      const exists = await prisma.food.findFirst({
        where: { description: a.nome, sourceTable: 'TBCA' },
      });

      if (!exists) {
        await prisma.food.create({
          data: {
            description: a.nome,
            groupName: a.grupo,
            sourceTable: 'TBCA',
            portionGrams: 100,
          },
        });
        inseridos++;
      }
    }

    console.log(`✅ Inseridos: ${inseridos} novos alimentos TBCA`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  const total = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  console.log(`\n📊 Total TBCA no banco: ${total}`);
}

main().catch(console.error);
