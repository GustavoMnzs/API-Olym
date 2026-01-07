/**
 * Buscar pratos compostos específicos no TBCA e OFF
 * Pratos do dia a dia que usuários pesquisam
 */

import { PrismaClient } from '@prisma/client';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const jaExiste = new Set<string>();

async function carregarExistentes() {
  const foods = await prisma.food.findMany({ select: { description: true } });
  foods.forEach(f => jaExiste.add(f.description.toLowerCase()));
}

const NUTRIENT_MAP: Record<string, { name: string; unit: string }> = {
  'Energia_kcal': { name: 'Energia', unit: 'kcal' },
  'Proteína_g': { name: 'Proteína', unit: 'g' },
  'Lipídios_g': { name: 'Lipídios', unit: 'g' },
  'Carboidrato total_g': { name: 'Carboidrato', unit: 'g' },
  'Fibra alimentar_g': { name: 'Fibra alimentar', unit: 'g' },
  'Sódio_mg': { name: 'Sódio', unit: 'mg' },
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

// Pratos compostos que usuários pesquisam
const PRATOS_COMPOSTOS = [
  // Massas
  'macarrão com carne', 'macarrão com frango', 'macarrão com atum',
  'macarrão ao molho branco', 'macarrão ao sugo', 'macarrão alho e óleo',
  'espaguete à carbonara', 'espaguete ao pesto', 'penne ao molho',
  'lasanha de carne', 'lasanha de frango', 'lasanha quatro queijos',
  'canelone de carne', 'canelone de ricota', 'ravioli de carne',
  'nhoque ao sugo', 'nhoque ao molho branco', 'talharim',
  
  // Sanduíches
  'sanduíche de frango', 'sanduíche de atum', 'sanduíche de presunto',
  'sanduíche natural', 'sanduíche de peito de peru', 'sanduíche de queijo',
  'misto quente', 'bauru', 'americano', 'beirute',
  'hambúrguer artesanal', 'hambúrguer de frango', 'hambúrguer vegano',
  'x-bacon', 'x-tudo', 'x-salada', 'x-egg',
  'cachorro quente completo', 'hot dog prensado',
  
  // Arroz e feijão
  'arroz com feijão', 'arroz carreteiro', 'arroz de forno',
  'arroz à grega', 'arroz com brócolis', 'arroz temperado',
  'galinhada', 'risoto de camarão', 'risoto de cogumelos',
  'baião de dois', 'feijão tropeiro', 'tutu de feijão',
  
  // Carnes
  'bife acebolado', 'bife à milanesa', 'bife à parmegiana',
  'frango à milanesa', 'frango à parmegiana', 'frango xadrez',
  'frango ao molho', 'frango grelhado com legumes', 'frango desfiado',
  'estrogonofe de carne', 'estrogonofe de frango', 'estrogonofe de camarão',
  'picadinho de carne', 'carne de panela', 'carne assada',
  'escondidinho de carne', 'escondidinho de frango', 'escondidinho de charque',
  'carne louca', 'carne de sol', 'charque',
  
  // Peixes e frutos do mar
  'peixe frito', 'peixe assado', 'peixe grelhado',
  'moqueca de peixe', 'moqueca de camarão', 'bobó de camarão',
  'camarão ao alho', 'camarão empanado', 'camarão na moranga',
  'bacalhoada', 'bolinho de bacalhau',
  
  // Tortas e quiches
  'torta de frango', 'torta de palmito', 'torta de legumes',
  'quiche de queijo', 'quiche lorraine', 'quiche de alho poró',
  'empadão de frango', 'empadão de camarão',
  
  // Sopas e caldos
  'sopa de legumes', 'sopa de feijão', 'sopa de carne',
  'canja de galinha', 'caldo verde', 'caldo de feijão',
  'sopa de abóbora', 'sopa de ervilha', 'minestrone',
  
  // Saladas
  'salada caesar', 'salada de maionese', 'salada de batata',
  'salada tropical', 'salada grega', 'salada caprese',
  'tabule', 'coleslaw', 'vinagrete',
  
  // Pratos regionais
  'acarajé', 'vatapá', 'caruru', 'xinxim de galinha',
  'barreado', 'virado à paulista', 'tutu à mineira',
  'pato no tucupi', 'tacacá', 'maniçoba',
  'churrasco', 'costela no bafo', 'cupim assado',
  
  // Lanches
  'coxinha de frango', 'coxinha de carne', 'coxinha de queijo',
  'pastel de carne', 'pastel de queijo', 'pastel de frango',
  'quibe frito', 'quibe assado', 'esfiha de carne',
  'empada de frango', 'empada de camarão', 'empada de palmito',
  'pão de queijo', 'enroladinho de salsicha', 'croissant de presunto',
  'bolinha de queijo', 'risole de camarão', 'kibe',
  
  // Pizzas
  'pizza de calabresa', 'pizza de mussarela', 'pizza portuguesa',
  'pizza de frango', 'pizza margherita', 'pizza pepperoni',
  'pizza quatro queijos', 'pizza de atum', 'pizza vegetariana',
  'pizza de chocolate', 'pizza de brigadeiro', 'pizza doce',
  
  // Comida japonesa
  'temaki de salmão', 'temaki de atum', 'temaki de camarão',
  'sushi de salmão', 'sashimi de salmão', 'hot roll',
  'yakisoba de carne', 'yakisoba de frango', 'yakisoba de camarão',
  
  // Sobremesas
  'pudim de leite', 'mousse de chocolate', 'mousse de maracujá',
  'pavê de chocolate', 'pavê de amendoim', 'manjar',
  'bolo de chocolate', 'bolo de cenoura', 'bolo de milho',
  'torta de limão', 'torta de morango', 'cheesecake',
  'sorvete de chocolate', 'sorvete de morango', 'açaí na tigela',
];

async function buscarTBCA(page: Page, termo: string): Promise<number> {
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
      if (jaExiste.has(item.nome.toLowerCase())) continue;
      jaExiste.add(item.nome.toLowerCase());

      try {
        await page.goto('https://www.tbca.net.br/base-dados/' + item.href, {
          waitUntil: 'networkidle2', timeout: 12000
        });
        await sleep(400);

        const nutrientes = await page.evaluate(() => {
          const result: Record<string, number> = {};
          document.querySelectorAll('table#tabela1 tbody tr').forEach(row => {
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
  console.log('🍽️  IMPORTADOR DE PRATOS COMPOSTOS\n');
  
  await carregarExistentes();
  console.log(`   ${jaExiste.size} alimentos já no banco\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  let total = 0;

  console.log(`📝 ${PRATOS_COMPOSTOS.length} pratos para buscar\n`);

  for (let i = 0; i < PRATOS_COMPOSTOS.length; i++) {
    const termo = PRATOS_COMPOSTOS[i];
    const salvos = await buscarTBCA(page, termo);
    total += salvos;
    
    if (salvos > 0) {
      process.stdout.write(`${termo}:+${salvos} `);
    }
    
    if ((i + 1) % 20 === 0) {
      console.log(`\n   [${i + 1}/${PRATOS_COMPOSTOS.length}] Novos: ${total}`);
    }
    
    await sleep(350);
  }

  await browser.close();

  const stats = await prisma.food.groupBy({ by: ['sourceTable'], _count: true });
  const totalGeral = await prisma.food.count();

  console.log('\n\n' + '='.repeat(50));
  console.log('📊 ESTATÍSTICAS:');
  stats.forEach(s => console.log(`   ${s.sourceTable}: ${s._count}`));
  console.log(`   TOTAL: ${totalGeral}`);
  console.log(`\n✅ Novos pratos: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
