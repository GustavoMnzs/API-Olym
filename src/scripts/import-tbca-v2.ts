/**
 * Importador TBCA v2 - Corrigido
 * O site TBCA limita a 100 resultados por busca
 * Estratégia: Buscar por combinações de 2-3 letras para pegar todos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const DELAY = 800;

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
    // Navegar para página limpa
    await page.goto('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });
    await sleep(500);

    // Limpar e preencher campo de busca
    await page.evaluate(() => {
      const input = document.getElementById('produto') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    });
    
    await page.type('#produto', termo, { delay: 50 });
    await sleep(300);

    // Clicar no botão de busca
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) (btn as HTMLButtonElement).click();
    });
    
    await sleep(2000);

    // Extrair resultados
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

    // Adicionar ao mapa (evita duplicatas)
    let novos = 0;
    for (const item of items) {
      if (!alimentosMap.has(item.codigo)) {
        alimentosMap.set(item.codigo, item);
        novos++;
      }
    }

    return novos;
  } catch (e) {
    console.error(`   Erro em "${termo}":`, e);
    return 0;
  }
}

async function main() {
  console.log('🚀 IMPORTADOR TBCA v2\n');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  
  // Aumentar timeout
  page.setDefaultTimeout(30000);

  try {
    // Teste inicial
    console.log('🧪 Testando conexão...');
    const teste = await buscar(page, 'arroz');
    console.log(`   Teste "arroz": ${teste} resultados\n`);

    if (teste === 0) {
      console.log('❌ Não foi possível conectar ao site TBCA');
      return;
    }

    // Fase 1: Buscar por cada letra
    console.log('📝 FASE 1: Busca por letra inicial\n');
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letra of letras) {
      const novos = await buscar(page, letra);
      const total = alimentosMap.size;
      console.log(`   ${letra}: +${novos.toString().padStart(3)} novos | Total: ${total}`);
      await sleep(DELAY);
    }

    console.log(`\n   Subtotal após letras: ${alimentosMap.size}\n`);

    // Fase 2: Buscar por combinações de 2 letras (AA, AB, AC... ZZ)
    console.log('📝 FASE 2: Busca por 2 letras (mais específico)\n');
    
    const vogais = ['A', 'E', 'I', 'O', 'U'];
    const consoantes = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'X', 'Z'];
    
    // Combinações comuns em português
    for (const c of consoantes) {
      for (const v of vogais) {
        const combo = c + v;
        const novos = await buscar(page, combo);
        if (novos > 0) {
          process.stdout.write(`${combo}:+${novos} `);
        }
        await sleep(DELAY / 2);
      }
    }
    
    console.log(`\n\n   Subtotal após 2 letras: ${alimentosMap.size}\n`);

    // Fase 3: Termos específicos de alimentos
    console.log('📝 FASE 3: Termos específicos\n');
    
    const termos = [
      // Frutas
      'abacate', 'abacaxi', 'açaí', 'acerola', 'ameixa', 'banana', 'caju', 'caqui',
      'carambola', 'cereja', 'coco', 'damasco', 'figo', 'framboesa', 'goiaba', 'graviola',
      'jabuticaba', 'jaca', 'kiwi', 'laranja', 'limão', 'maçã', 'mamão', 'manga',
      'maracujá', 'melancia', 'melão', 'morango', 'nectarina', 'pera', 'pêssego',
      'pitanga', 'romã', 'tangerina', 'uva',
      // Verduras e legumes
      'abóbora', 'abobrinha', 'acelga', 'agrião', 'aipo', 'alcachofra', 'alface',
      'alho', 'almeirão', 'aspargo', 'batata', 'berinjela', 'beterraba', 'brócolis',
      'cebola', 'cenoura', 'chicória', 'chuchu', 'coentro', 'cogumelo', 'couve',
      'ervilha', 'espinafre', 'inhame', 'jiló', 'mandioca', 'maxixe', 'milho',
      'mostarda', 'nabo', 'palmito', 'pepino', 'pimentão', 'quiabo', 'rabanete',
      'repolho', 'rúcula', 'salsa', 'tomate', 'vagem',
      // Carnes
      'acém', 'alcatra', 'bacon', 'bisteca', 'carne', 'charque', 'contrafilé',
      'costela', 'cupim', 'filé', 'fraldinha', 'frango', 'hambúrguer', 'lagarto',
      'linguiça', 'lombo', 'maminha', 'mortadela', 'músculo', 'patinho', 'peito',
      'pernil', 'picanha', 'presunto', 'salame', 'salsicha',
      // Peixes e frutos do mar
      'atum', 'bacalhau', 'camarão', 'caranguejo', 'corvina', 'lagosta', 'lula',
      'marisco', 'merluza', 'ostra', 'pescada', 'salmão', 'sardinha', 'tilápia', 'truta',
      // Laticínios
      'creme', 'iogurte', 'leite', 'manteiga', 'nata', 'queijo', 'requeijão', 'ricota',
      // Cereais e grãos
      'arroz', 'aveia', 'centeio', 'cevada', 'farinha', 'feijão', 'grão-de-bico',
      'lentilha', 'macarrão', 'milho', 'pão', 'quinoa', 'soja', 'trigo',
      // Oleaginosas
      'amêndoa', 'amendoim', 'avelã', 'castanha', 'gergelim', 'linhaça', 'noz', 'pistache',
      // Bebidas
      'café', 'cerveja', 'chá', 'refrigerante', 'suco', 'vinho', 'água',
      // Doces
      'açúcar', 'bolo', 'brigadeiro', 'chocolate', 'doce', 'geleia', 'mel', 'pudim', 'sorvete',
      // Outros
      'azeite', 'catchup', 'maionese', 'margarina', 'mostarda', 'óleo', 'sal', 'vinagre',
    ];

    let count = 0;
    for (const termo of termos) {
      const novos = await buscar(page, termo);
      if (novos > 0) {
        count++;
        if (count % 10 === 0) {
          console.log(`   ... ${alimentosMap.size} alimentos`);
        }
      }
      await sleep(DELAY / 2);
    }

    console.log(`\n   Total final: ${alimentosMap.size} alimentos únicos\n`);

    // Salvar JSON
    const alimentos = Array.from(alimentosMap.values());
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync('./data/tbca_extraido.json', JSON.stringify(alimentos, null, 2));
    console.log('💾 Dados salvos em ./data/tbca_extraido.json');

    // Salvar no banco
    console.log('\n📊 Salvando no banco de dados...');
    
    let inseridos = 0;
    for (const alimento of alimentos) {
      try {
        const exists = await prisma.food.findFirst({
          where: { description: alimento.nome },
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
        }
      } catch (e) {}
    }

    console.log(`   ✅ Inseridos: ${inseridos} novos alimentos`);

  } catch (error) {
    console.error('\n❌ Erro geral:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  const totalTBCA = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  const totalGeral = await prisma.food.count();

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total TBCA no banco: ${totalTBCA}`);
  console.log(`📊 Total geral: ${totalGeral}`);
  console.log('🏁 Finalizado!');
}

main().catch(console.error);
