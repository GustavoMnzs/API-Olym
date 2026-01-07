/**
 * Importador TBCA v3 - Otimizado
 * Foca nas buscas mais produtivas e salva progresso
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const DELAY = 600;

interface Alimento {
  codigo: string;
  nome: string;
}

const alimentosMap = new Map<string, Alimento>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscar(page: Page, termo: string): Promise<number> {
  try {
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
    await sleep(300);

    await page.evaluate(() => {
      const input = document.getElementById('produto') as HTMLInputElement;
      if (input) input.value = '';
    });
    
    await page.type('#produto', termo, { delay: 30 });
    await sleep(200);

    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) (btn as HTMLButtonElement).click();
    });
    
    await sleep(1500);

    const items = await page.evaluate(() => {
      const results: { codigo: string; nome: string }[] = [];
      const rows = document.querySelectorAll('table tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const link = cells[1]?.querySelector('a');
          if (link) {
            const codigo = cells[0]?.textContent?.trim() || '';
            const nome = link.textContent?.trim() || '';
            if (codigo && nome) {
              results.push({ codigo, nome });
            }
          }
        }
      });
      
      return results;
    });

    let novos = 0;
    for (const item of items) {
      if (!alimentosMap.has(item.codigo)) {
        alimentosMap.set(item.codigo, item);
        novos++;
      }
    }

    return novos;
  } catch (e) {
    return 0;
  }
}

async function main() {
  console.log('🚀 IMPORTADOR TBCA v3 - Otimizado\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    // Fase 1: Letras (mais produtivo)
    console.log('📝 FASE 1: Busca por letras\n');
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letra of letras) {
      const novos = await buscar(page, letra);
      process.stdout.write(`${letra}:${novos} `);
      await sleep(DELAY);
    }
    console.log(`\n\n   Total: ${alimentosMap.size}\n`);

    // Fase 2: Combinações mais comuns
    console.log('📝 FASE 2: Combinações comuns\n');
    const combos = [
      'AR', 'BA', 'BE', 'BI', 'BO', 'CA', 'CE', 'CO', 'FA', 'FE', 'FI', 'FO',
      'GA', 'GE', 'GO', 'LA', 'LE', 'LI', 'MA', 'ME', 'MI', 'MO', 'PA', 'PE',
      'PI', 'PO', 'QU', 'RA', 'RE', 'RI', 'RO', 'SA', 'SE', 'SO', 'TA', 'TE',
      'TO', 'VA', 'VE', 'VI'
    ];
    
    for (const combo of combos) {
      const novos = await buscar(page, combo);
      if (novos > 0) process.stdout.write(`${combo}:+${novos} `);
      await sleep(DELAY / 2);
    }
    console.log(`\n\n   Total: ${alimentosMap.size}\n`);

    // Fase 3: Termos específicos importantes
    console.log('📝 FASE 3: Termos específicos\n');
    const termos = [
      'carne', 'frango', 'peixe', 'ovo', 'leite', 'queijo', 'arroz', 'feijão',
      'batata', 'tomate', 'cebola', 'alho', 'banana', 'maçã', 'laranja', 'manga',
      'açúcar', 'sal', 'óleo', 'azeite', 'farinha', 'pão', 'macarrão', 'biscoito',
      'chocolate', 'café', 'suco', 'refrigerante', 'cerveja', 'vinho',
      'mandioca', 'milho', 'soja', 'amendoim', 'castanha', 'coco',
      'abóbora', 'cenoura', 'beterraba', 'brócolis', 'couve', 'alface',
      'linguiça', 'presunto', 'bacon', 'salsicha', 'hambúrguer',
      'camarão', 'sardinha', 'atum', 'salmão', 'tilápia',
      'iogurte', 'manteiga', 'margarina', 'requeijão', 'creme',
      'mel', 'geleia', 'doce', 'bolo', 'sorvete', 'pudim'
    ];
    
    for (const termo of termos) {
      const novos = await buscar(page, termo);
      if (novos > 0) process.stdout.write(`${termo}:+${novos} `);
      await sleep(DELAY / 2);
    }
    console.log(`\n\n   Total final: ${alimentosMap.size}\n`);

    // Salvar JSON
    const alimentos = Array.from(alimentosMap.values());
    fs.writeFileSync('./data/tbca_v3.json', JSON.stringify(alimentos, null, 2));
    console.log('💾 Salvos em ./data/tbca_v3.json');

    // Inserir no banco
    console.log('\n📊 Inserindo no banco...');
    
    let inseridos = 0;
    let existentes = 0;
    
    for (const alimento of alimentos) {
      const exists = await prisma.food.findFirst({
        where: { 
          OR: [
            { description: alimento.nome },
            { description: { contains: alimento.codigo } }
          ]
        },
      });

      if (!exists) {
        await prisma.food.create({
          data: {
            description: alimento.nome,
            groupName: 'TBCA',
            sourceTable: 'TBCA',
            portionGrams: 100,
          },
        });
        inseridos++;
      } else {
        existentes++;
      }
    }

    console.log(`   ✅ Novos: ${inseridos}`);
    console.log(`   ⏭️  Existentes: ${existentes}`);

  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  // Stats finais
  const stats = await prisma.food.groupBy({
    by: ['sourceTable'],
    _count: true,
  });
  
  console.log('\n📊 ESTATÍSTICAS DO BANCO:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  
  const total = await prisma.food.count();
  console.log(`   TOTAL: ${total}`);
  console.log('\n🏁 Finalizado!');
}

main().catch(console.error);
