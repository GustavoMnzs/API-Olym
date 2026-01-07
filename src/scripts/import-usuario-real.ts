/**
 * Importador Inteligente - Busca como usuário real
 * Simula buscas reais que pessoas fariam no dia a dia
 */

import { PrismaClient } from '@prisma/client';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();
const jaExiste = new Set<string>();

// Carregar alimentos existentes
async function carregarExistentes() {
  const foods = await prisma.food.findMany({ select: { description: true } });
  foods.forEach(f => jaExiste.add(f.description.toLowerCase()));
  console.log(`   ${jaExiste.size} alimentos já no banco\n`);
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
  'Zinco_mg': { name: 'Zinco', unit: 'mg' },
  'Vitamina C_mg': { name: 'Vitamina C', unit: 'mg' },
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let n = await prisma.nutrient.findFirst({ where: { name } });
  if (!n) n = await prisma.nutrient.create({ data: { name, unit } });
  return n.id;
}

// BUSCAS REAIS DE USUÁRIOS - O que as pessoas pesquisam no dia a dia
const BUSCAS_USUARIO = [
  // ===== CAFÉ DA MANHÃ =====
  'pão francês', 'pão de forma', 'pão integral', 'pão de queijo', 'pão de mel',
  'torrada', 'biscoito cream cracker', 'biscoito maisena', 'biscoito recheado',
  'manteiga', 'margarina', 'requeijão', 'cream cheese', 'geleia',
  'café com leite', 'café preto', 'cappuccino', 'achocolatado', 'nescau',
  'leite integral', 'leite desnatado', 'leite sem lactose', 'iogurte natural',
  'iogurte grego', 'danone', 'yakult', 'queijo minas', 'queijo prato',
  'presunto', 'peito de peru', 'mortadela', 'salame',
  'ovo cozido', 'ovo frito', 'ovo mexido', 'omelete', 'tapioca',
  'granola', 'aveia', 'cereal', 'sucrilhos', 'müsli',
  'mamão', 'banana', 'maçã', 'laranja', 'melão', 'melancia',
  'suco de laranja', 'suco de uva', 'vitamina de banana',

  // ===== ALMOÇO / JANTAR =====
  'arroz branco', 'arroz integral', 'arroz parboilizado', 'arroz à grega',
  'feijão carioca', 'feijão preto', 'feijão tropeiro', 'feijoada',
  'macarrão', 'espaguete', 'lasanha', 'nhoque', 'ravióli',
  'frango grelhado', 'frango assado', 'frango frito', 'filé de frango',
  'peito de frango', 'coxa de frango', 'sobrecoxa', 'asa de frango',
  'carne moída', 'bife', 'filé mignon', 'alcatra', 'patinho', 'acém',
  'picanha', 'maminha', 'fraldinha', 'costela', 'cupim', 'contrafilé',
  'carne de porco', 'lombo', 'bisteca', 'pernil', 'bacon', 'linguiça',
  'peixe grelhado', 'tilápia', 'salmão', 'atum', 'sardinha', 'bacalhau',
  'camarão', 'lula', 'polvo', 'marisco',
  'salada', 'alface', 'tomate', 'pepino', 'cenoura', 'beterraba',
  'brócolis', 'couve-flor', 'espinafre', 'rúcula', 'agrião',
  'batata cozida', 'batata frita', 'purê de batata', 'batata doce',
  'mandioca', 'aipim', 'farofa', 'pirão', 'polenta',
  'estrogonofe', 'escondidinho', 'moqueca', 'bobó de camarão',

  // ===== LANCHES =====
  'sanduíche natural', 'sanduíche de presunto', 'misto quente',
  'hambúrguer', 'cheeseburger', 'x-bacon', 'x-tudo', 'x-salada',
  'hot dog', 'cachorro quente', 'pizza', 'esfiha', 'empada',
  'coxinha', 'pastel', 'quibe', 'bolinha de queijo', 'risole',
  'pão de queijo', 'enroladinho de salsicha', 'croissant',
  'açaí', 'açaí com granola', 'smoothie', 'milk shake',
  'pipoca', 'batata chips', 'salgadinho', 'doritos', 'cheetos',
  'amendoim', 'castanha de caju', 'castanha do pará', 'nozes', 'amêndoas',
  'barra de cereal', 'barra de proteína',

  // ===== SOBREMESAS E DOCES =====
  'pudim', 'mousse de chocolate', 'mousse de maracujá', 'brigadeiro',
  'beijinho', 'cajuzinho', 'trufa', 'bombom', 'chocolate ao leite',
  'chocolate amargo', 'chocolate branco', 'nutella', 'creme de avelã',
  'sorvete', 'picolé', 'açaí', 'frozen yogurt',
  'bolo de chocolate', 'bolo de cenoura', 'bolo de laranja', 'bolo de fubá',
  'torta de limão', 'torta de maçã', 'cheesecake', 'petit gateau',
  'paçoca', 'pé de moleque', 'cocada', 'goiabada', 'doce de leite',
  'maria mole', 'suspiro', 'quindim', 'romeu e julieta',

  // ===== BEBIDAS =====
  'água', 'água de coco', 'água com gás', 'água tônica',
  'refrigerante', 'coca-cola', 'guaraná', 'fanta', 'sprite',
  'suco natural', 'suco de caixinha', 'néctar', 'limonada',
  'chá gelado', 'chá mate', 'chá verde', 'chá de camomila',
  'café expresso', 'café coado', 'descafeinado',
  'cerveja', 'chopp', 'vinho tinto', 'vinho branco', 'espumante',
  'caipirinha', 'whisky', 'vodka', 'gin', 'rum', 'cachaça',
  'energético', 'red bull', 'monster', 'gatorade', 'isotônico',

  // ===== COMIDA JAPONESA =====
  'sushi', 'sashimi', 'temaki', 'hot roll', 'uramaki',
  'yakisoba', 'lámen', 'missoshiru', 'gyoza', 'tempurá',

  // ===== COMIDA ITALIANA =====
  'pizza margherita', 'pizza calabresa', 'pizza portuguesa',
  'pizza quatro queijos', 'pizza pepperoni', 'pizza frango catupiry',
  'macarrão à bolonhesa', 'macarrão ao alho e óleo', 'carbonara',
  'risoto', 'gnocchi', 'ravioli', 'canelone',

  // ===== COMIDA MEXICANA =====
  'taco', 'burrito', 'nachos', 'guacamole', 'quesadilla', 'enchilada',

  // ===== FAST FOOD =====
  'big mac', 'whopper', 'mcnuggets', 'batata mcdonald',
  'sundae', 'mcflurry', 'milk shake', 'casquinha',

  // ===== SUPLEMENTOS =====
  'whey protein', 'whey isolado', 'whey concentrado', 'whey hidrolisado',
  'caseína', 'albumina', 'proteína vegana', 'proteína de soja',
  'creatina', 'bcaa', 'glutamina', 'pré-treino', 'termogênico',
  'hipercalórico', 'maltodextrina', 'dextrose',
  'ômega 3', 'vitamina c', 'vitamina d', 'multivitamínico',
  'colágeno', 'melatonina', 'zma',

  // ===== COMIDAS FITNESS =====
  'frango com batata doce', 'atum com salada', 'omelete de claras',
  'wrap integral', 'salada caesar', 'bowl de açaí',
  'overnight oats', 'panqueca de banana', 'crepioca',

  // ===== INGREDIENTES COMUNS =====
  'azeite', 'óleo de soja', 'óleo de coco', 'vinagre', 'molho de soja',
  'ketchup', 'mostarda', 'maionese', 'molho barbecue', 'molho de tomate',
  'sal', 'açúcar', 'açúcar mascavo', 'mel', 'adoçante',
  'farinha de trigo', 'farinha de aveia', 'farinha de amêndoas',
  'leite de coco', 'creme de leite', 'leite condensado',
  'alho', 'cebola', 'tomate', 'pimentão', 'cebolinha', 'salsinha',
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
  console.log('🧠 IMPORTADOR INTELIGENTE - Buscas de usuário real\n');
  
  await carregarExistentes();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  let total = 0;
  let buscasComResultado = 0;

  console.log(`📝 ${BUSCAS_USUARIO.length} buscas de usuário real\n`);

  for (let i = 0; i < BUSCAS_USUARIO.length; i++) {
    const termo = BUSCAS_USUARIO[i];
    const salvos = await buscarTBCA(page, termo);
    total += salvos;
    
    if (salvos > 0) {
      buscasComResultado++;
      process.stdout.write(`${termo}:+${salvos} `);
    }
    
    if ((i + 1) % 25 === 0) {
      console.log(`\n   [${i + 1}/${BUSCAS_USUARIO.length}] Novos: ${total}`);
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
  console.log(`\n✅ Novos TBCA: ${total}`);
  console.log(`🔍 Buscas com resultado: ${buscasComResultado}/${BUSCAS_USUARIO.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
