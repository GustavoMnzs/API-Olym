/**
 * Scraper TBCA Real - Extrai dados do site oficial
 * https://www.tbca.net.br/base-dados/composicao_alimentos.php
 * 
 * A TBCA tem ~5.700 alimentos com dados nutricionais completos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();
const DELAY = 1000;

interface AlimentoTBCA {
  codigo: string;
  nome: string;
  grupo: string;
  energia?: number;
  proteina?: number;
  carboidrato?: number;
  lipideos?: number;
  fibra?: number;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 SCRAPER TBCA - Tabela Brasileira de Composição de Alimentos\n');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  const alimentos: AlimentoTBCA[] = [];

  try {
    console.log('\n📂 Acessando página de busca...');
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await sleep(2000);

    // Salvar screenshot para debug
    await page.screenshot({ path: './data/tbca_page.png', fullPage: true });
    console.log('   Screenshot salvo em ./data/tbca_page.png');

    // Salvar HTML
    const html = await page.content();
    fs.writeFileSync('./data/tbca_page.html', html);
    console.log('   HTML salvo em ./data/tbca_page.html');

    // Tentar encontrar o formulário de busca
    console.log('\n🔍 Analisando estrutura da página...');
    
    const pageInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const selects = document.querySelectorAll('select');
      const inputs = document.querySelectorAll('input');
      const tables = document.querySelectorAll('table');
      const buttons = document.querySelectorAll('button, input[type="submit"]');
      
      return {
        forms: forms.length,
        selects: Array.from(selects).map(s => ({ id: s.id, name: s.name, options: s.options.length })),
        inputs: Array.from(inputs).map(i => ({ id: i.id, name: i.name, type: i.type })),
        tables: tables.length,
        buttons: Array.from(buttons).map(b => b.textContent?.trim()),
        bodyText: document.body.innerText.substring(0, 500),
      };
    });

    console.log('   Forms:', pageInfo.forms);
    console.log('   Selects:', JSON.stringify(pageInfo.selects, null, 2));
    console.log('   Inputs:', JSON.stringify(pageInfo.inputs, null, 2));
    console.log('   Tables:', pageInfo.tables);
    console.log('   Buttons:', pageInfo.buttons);

    // Tentar buscar por letra
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letra of letras.slice(0, 3)) { // Testar com 3 letras primeiro
      console.log(`\n🔤 Buscando alimentos com "${letra}"...`);
      
      // Limpar e digitar no campo de busca
      const searchInput = await page.$('input[type="text"], input[name="alimento"], #alimento');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(letra);
        await sleep(500);
        
        // Clicar no botão de busca
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], .btn-buscar, button');
        if (submitBtn) {
          await submitBtn.click();
          await sleep(2000);
        }
        
        // Extrair resultados
        const resultados = await page.evaluate(() => {
          const items: any[] = [];
          
          // Tentar diferentes seletores
          const rows = document.querySelectorAll('table tr, .resultado-item, .alimento-item');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const link = row.querySelector('a');
              items.push({
                codigo: cells[0]?.textContent?.trim(),
                nome: cells[1]?.textContent?.trim() || link?.textContent?.trim(),
                href: link?.getAttribute('href'),
              });
            }
          });
          
          return items;
        });
        
        console.log(`   Encontrados: ${resultados.length} resultados`);
        
        if (resultados.length > 0) {
          console.log('   Exemplo:', resultados[0]);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total extraído: ${alimentos.length}`);
  console.log('🏁 Scraper finalizado!');
}

main().catch(console.error);
