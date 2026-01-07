/**
 * Buscar PRATOS COMPLETOS no TBCA
 * Lista extensa de alimentos e pratos do dia a dia brasileiro
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

// LISTA COMPLETA DE PRATOS E ALIMENTOS BRASILEIROS
const PRATOS = [
  // ========== CAFÉ DA MANHÃ ==========
  'pão francês', 'pão de forma', 'pão integral', 'pão de leite', 'pão doce',
  'pão de queijo', 'pão de batata', 'pão sírio', 'pão australiano', 'pão ciabatta',
  'croissant', 'brioche', 'sonho', 'rosca', 'cuca',
  'bolo simples', 'bolo de fubá', 'bolo de milho', 'bolo de laranja', 'bolo de banana',
  'bolo de chocolate', 'bolo de cenoura', 'bolo formigueiro', 'bolo de coco',
  'biscoito água e sal', 'biscoito cream cracker', 'biscoito maisena', 'biscoito maria',
  'biscoito recheado', 'biscoito amanteigado', 'bolacha', 'cookie',
  'torrada', 'torrada integral', 'pão torrado',
  'manteiga', 'margarina', 'requeijão', 'cream cheese', 'patê',
  'geleia de morango', 'geleia de uva', 'geleia de goiaba', 'mel',
  'queijo minas', 'queijo prato', 'queijo mussarela', 'queijo coalho', 'queijo canastra',
  'presunto', 'peito de peru', 'mortadela', 'salame', 'copa', 'lombo defumado',
  'ovo cozido', 'ovo frito', 'ovo mexido', 'ovo pochê', 'omelete simples',
  'omelete de queijo', 'omelete de presunto', 'omelete de legumes',
  'tapioca', 'tapioca com queijo', 'tapioca com coco', 'crepioca',
  'panqueca', 'panqueca americana', 'waffle',
  'mingau de aveia', 'mingau de maisena', 'mingau de arroz', 'canjica',
  'vitamina de banana', 'vitamina de mamão', 'vitamina de morango',
  'iogurte natural', 'iogurte grego', 'iogurte de morango', 'coalhada',
  'leite integral', 'leite desnatado', 'leite semidesnatado', 'leite sem lactose',
  'café preto', 'café com leite', 'cappuccino', 'café expresso',
  'achocolatado', 'toddy', 'nescau', 'ovomaltine',
  'suco de laranja', 'suco de maracujá', 'suco de abacaxi', 'suco de manga',
  'granola', 'aveia em flocos', 'cereal matinal', 'muesli',
  
  // ========== FRUTAS ==========
  'abacate', 'abacaxi', 'açaí', 'acerola', 'ameixa', 'amora',
  'banana nanica', 'banana prata', 'banana maçã', 'banana da terra',
  'caju', 'caqui', 'carambola', 'cereja', 'coco', 'damasco',
  'figo', 'framboesa', 'goiaba', 'graviola', 'jabuticaba', 'jaca',
  'kiwi', 'laranja', 'laranja lima', 'limão', 'lichia',
  'maçã', 'maçã verde', 'mamão', 'mamão papaia', 'manga', 'manga palmer',
  'maracujá', 'melancia', 'melão', 'mexerica', 'tangerina',
  'morango', 'nectarina', 'pera', 'pêssego', 'pitanga', 'pitaya',
  'romã', 'tamarindo', 'uva', 'uva passa',
  
  // ========== VERDURAS E LEGUMES ==========
  'abóbora', 'abóbora cabotiá', 'abóbora moranga', 'abobrinha',
  'acelga', 'agrião', 'aipo', 'alcachofra', 'alface', 'alface americana',
  'alho', 'alho poró', 'almeirão', 'aspargo',
  'batata inglesa', 'batata doce', 'batata baroa', 'mandioquinha',
  'berinjela', 'beterraba', 'brócolis', 'broto de feijão',
  'cebola', 'cebolinha', 'cenoura', 'chicória', 'chuchu', 'coentro',
  'cogumelo', 'champignon', 'shimeji', 'shiitake',
  'couve', 'couve-flor', 'couve de bruxelas', 'espinafre',
  'ervilha', 'ervilha torta', 'vagem',
  'gengibre', 'inhame', 'jiló', 'mandioca', 'aipim',
  'maxixe', 'milho verde', 'mostarda', 'nabo',
  'palmito', 'pepino', 'pimentão', 'pimenta',
  'quiabo', 'rabanete', 'repolho', 'rúcula', 'salsa', 'salsão',
  'tomate', 'tomate cereja',
  
  // ========== CARNES ==========
  'acém', 'alcatra', 'contrafilé', 'costela', 'cupim',
  'filé mignon', 'fraldinha', 'lagarto', 'maminha', 'músculo',
  'patinho', 'picanha', 'coxão mole', 'coxão duro',
  'carne moída', 'carne de sol', 'carne seca', 'charque', 'jabá',
  'bife', 'bife acebolado', 'bife à milanesa', 'bife à parmegiana',
  'carne assada', 'carne de panela', 'carne ensopada',
  'churrasco', 'espetinho', 'kafta', 'kibe', 'quibe',
  'hambúrguer', 'almôndega', 'bolinho de carne',
  'fígado', 'língua', 'rabada', 'mocotó', 'dobradinha', 'buchada',
  'bacon', 'toucinho', 'torresmo',
  'linguiça', 'linguiça calabresa', 'linguiça toscana', 'linguiça de frango',
  'salsicha', 'salsicha de frango', 'salsicha de peru',
  'lombo', 'bisteca', 'pernil', 'costela de porco', 'leitão',
  'carneiro', 'cordeiro', 'cabrito',
  
  // ========== AVES ==========
  'frango inteiro', 'peito de frango', 'coxa de frango', 'sobrecoxa',
  'asa de frango', 'coxinha da asa', 'meio da asa', 'tulipa',
  'frango grelhado', 'frango assado', 'frango frito', 'frango empanado',
  'frango à milanesa', 'frango à parmegiana', 'frango xadrez',
  'frango ao molho', 'frango desfiado', 'frango recheado',
  'galinha', 'galinha caipira', 'galeto',
  'peru', 'peito de peru', 'chester',
  'pato', 'pato no tucupi', 'marreco',
  'codorna', 'perdiz',
  
  // ========== PEIXES E FRUTOS DO MAR ==========
  'atum', 'bacalhau', 'badejo', 'cação', 'corvina',
  'dourado', 'linguado', 'merluza', 'namorado', 'panga',
  'pescada', 'pintado', 'robalo', 'salmão', 'sardinha',
  'tainha', 'tilápia', 'truta', 'tucunaré',
  'peixe frito', 'peixe assado', 'peixe grelhado', 'peixe empanado',
  'moqueca', 'caldeirada', 'peixada',
  'camarão', 'camarão ao alho', 'camarão empanado', 'camarão na moranga',
  'lagosta', 'lagostim', 'caranguejo', 'siri',
  'lula', 'polvo', 'marisco', 'mexilhão', 'ostra', 'vieira',
  
  // ========== PRATOS PRINCIPAIS ==========
  'arroz branco', 'arroz integral', 'arroz parboilizado', 'arroz à grega',
  'arroz carreteiro', 'arroz de forno', 'arroz temperado', 'arroz com brócolis',
  'galinhada', 'risoto', 'paella',
  'feijão carioca', 'feijão preto', 'feijão branco', 'feijão fradinho',
  'feijão tropeiro', 'feijoada', 'tutu de feijão', 'virado à paulista',
  'baião de dois', 'dobradinha',
  'macarrão', 'espaguete', 'penne', 'fusilli', 'talharim', 'fetuccine',
  'macarrão à bolonhesa', 'macarrão ao sugo', 'macarrão ao alho e óleo',
  'macarrão ao molho branco', 'macarrão à carbonara', 'macarrão ao pesto',
  'lasanha', 'lasanha à bolonhesa', 'lasanha de frango', 'lasanha quatro queijos',
  'canelone', 'ravioli', 'capeletti', 'nhoque',
  'estrogonofe de carne', 'estrogonofe de frango', 'estrogonofe de camarão',
  'escondidinho', 'escondidinho de carne', 'escondidinho de frango',
  'empadão', 'empadão de frango', 'empadão de camarão',
  'torta salgada', 'torta de frango', 'torta de palmito',
  'quiche', 'quiche lorraine',
  'omelete', 'fritada', 'suflê',
  'polenta', 'angu', 'cuscuz', 'cuscuz paulista', 'cuscuz nordestino',
  'pirão', 'farofa', 'farofa de ovo', 'farofa de bacon',
  'purê de batata', 'batata frita', 'batata assada', 'batata sauté',
  'mandioca frita', 'mandioca cozida',
  
  // ========== COMIDA REGIONAL ==========
  'acarajé', 'abará', 'vatapá', 'caruru', 'efó',
  'xinxim de galinha', 'moqueca baiana', 'bobó de camarão',
  'sarapatel', 'buchada', 'panelada',
  'baião de dois', 'carne de sol com macaxeira', 'paçoca de carne de sol',
  'tapioca', 'beiju', 'goma',
  'tacacá', 'pato no tucupi', 'maniçoba', 'açaí com peixe',
  'barreado', 'pierogi',
  'arroz carreteiro', 'churrasco gaúcho',
  'pão de queijo', 'tutu à mineira', 'frango com quiabo',
  'virado à paulista', 'cuscuz paulista',
  
  // ========== LANCHES E SALGADOS ==========
  'coxinha', 'coxinha de frango', 'coxinha de carne',
  'pastel', 'pastel de carne', 'pastel de queijo', 'pastel de frango', 'pastel de camarão',
  'empada', 'empadinha', 'empada de frango', 'empada de camarão', 'empada de palmito',
  'esfiha', 'esfiha de carne', 'esfiha de queijo',
  'quibe', 'quibe frito', 'quibe assado', 'quibe cru',
  'bolinha de queijo', 'bolinha de bacalhau',
  'risole', 'risole de camarão', 'risole de palmito',
  'enroladinho', 'enroladinho de salsicha', 'enroladinho de presunto',
  'pão de queijo', 'pão de batata', 'pão de calabresa',
  'croissant', 'croissant de presunto e queijo',
  'folhado', 'folhado de frango', 'folhado de carne',
  'sanduíche natural', 'sanduíche de frango', 'sanduíche de atum',
  'misto quente', 'bauru', 'americano', 'beirute',
  'hambúrguer', 'cheeseburger', 'x-bacon', 'x-tudo', 'x-salada', 'x-egg',
  'cachorro quente', 'hot dog', 'hot dog completo', 'hot dog prensado',
  'pizza', 'pizza calabresa', 'pizza mussarela', 'pizza portuguesa',
  'pizza margherita', 'pizza quatro queijos', 'pizza pepperoni',
  'pizza de frango', 'pizza de atum', 'pizza vegetariana',
  'pizza doce', 'pizza de chocolate', 'pizza de brigadeiro',
  'wrap', 'burrito', 'taco', 'nachos', 'quesadilla',
  'crepe', 'crepe de frango', 'crepe de carne',
  
  // ========== COMIDA JAPONESA ==========
  'sushi', 'sashimi', 'temaki', 'uramaki', 'hot roll', 'niguiri',
  'yakisoba', 'lámen', 'udon', 'soba',
  'tempurá', 'gyoza', 'harumaki', 'sunomono',
  'missoshiru', 'tofu', 'edamame',
  
  // ========== SOPAS E CALDOS ==========
  'sopa de legumes', 'sopa de feijão', 'sopa de carne', 'sopa de frango',
  'sopa de abóbora', 'sopa de ervilha', 'sopa de lentilha',
  'canja', 'canja de galinha', 'caldo verde', 'caldo de feijão',
  'caldo de carne', 'caldo de frango', 'caldo de peixe',
  'minestrone', 'gazpacho', 'vichyssoise',
  'consomê', 'creme de aspargos', 'creme de milho',
  
  // ========== SALADAS ==========
  'salada verde', 'salada mista', 'salada de alface', 'salada de rúcula',
  'salada caesar', 'salada grega', 'salada caprese', 'salada tropical',
  'salada de batata', 'salada de maionese', 'salpicão',
  'tabule', 'coleslaw', 'vinagrete',
  'salada de frutas', 'salada de grãos',
  
  // ========== SOBREMESAS ==========
  'pudim', 'pudim de leite', 'pudim de chocolate', 'pudim de coco',
  'mousse', 'mousse de chocolate', 'mousse de maracujá', 'mousse de limão',
  'brigadeiro', 'beijinho', 'cajuzinho', 'olho de sogra',
  'trufa', 'bombom', 'chocolate',
  'bolo', 'bolo de chocolate', 'bolo de cenoura', 'bolo de laranja',
  'torta', 'torta de limão', 'torta de morango', 'torta de maçã',
  'cheesecake', 'petit gateau', 'brownie', 'cookie',
  'pavê', 'pavê de chocolate', 'pavê de amendoim',
  'manjar', 'manjar de coco', 'creme de papaya',
  'sorvete', 'picolé', 'açaí', 'frozen yogurt',
  'paçoca', 'pé de moleque', 'cocada', 'goiabada', 'doce de leite',
  'maria mole', 'suspiro', 'quindim', 'quindão',
  'romeu e julieta', 'banana caramelizada', 'rabanada',
  'arroz doce', 'canjica', 'curau', 'pamonha doce',
  
  // ========== BEBIDAS ==========
  'água', 'água de coco', 'água com gás', 'água tônica',
  'refrigerante', 'coca-cola', 'guaraná', 'fanta', 'sprite',
  'suco natural', 'suco de caixinha', 'néctar', 'refresco',
  'limonada', 'laranjada', 'maracujada',
  'chá', 'chá mate', 'chá verde', 'chá preto', 'chá de camomila',
  'café', 'café expresso', 'café coado', 'café gelado',
  'leite', 'achocolatado', 'vitamina', 'smoothie', 'milk shake',
  'cerveja', 'chopp', 'vinho', 'espumante', 'champagne',
  'caipirinha', 'caipiroska', 'mojito', 'margarita',
  'whisky', 'vodka', 'gin', 'rum', 'cachaça', 'tequila',
  'licor', 'conhaque', 'amaretto',
  'energético', 'isotônico', 'gatorade',
  
  // ========== MOLHOS E TEMPEROS ==========
  'molho de tomate', 'molho branco', 'molho bolonhesa', 'molho pesto',
  'molho barbecue', 'molho teriyaki', 'molho shoyu', 'molho agridoce',
  'ketchup', 'mostarda', 'maionese', 'molho rosé',
  'azeite', 'óleo de soja', 'óleo de girassol', 'óleo de coco',
  'vinagre', 'vinagre balsâmico',
  'sal', 'pimenta', 'orégano', 'manjericão', 'alecrim', 'tomilho',
  'cominho', 'curry', 'páprica', 'açafrão', 'cúrcuma',
  
  // ========== GRÃOS E CEREAIS ==========
  'arroz', 'feijão', 'lentilha', 'grão de bico', 'ervilha seca',
  'milho', 'trigo', 'aveia', 'centeio', 'cevada',
  'quinoa', 'amaranto', 'chia', 'linhaça', 'gergelim',
  'farinha de trigo', 'farinha de milho', 'farinha de mandioca',
  'fubá', 'polvilho', 'amido de milho', 'maisena',
  
  // ========== OLEAGINOSAS ==========
  'amendoim', 'castanha de caju', 'castanha do pará', 'castanha portuguesa',
  'nozes', 'amêndoas', 'avelã', 'pistache', 'macadâmia',
  'coco', 'coco ralado', 'leite de coco',
  
  // ========== LATICÍNIOS ==========
  'leite', 'leite em pó', 'leite condensado', 'creme de leite',
  'iogurte', 'coalhada', 'kefir',
  'queijo', 'queijo minas', 'queijo prato', 'queijo mussarela',
  'queijo parmesão', 'queijo gorgonzola', 'queijo brie', 'queijo camembert',
  'queijo cottage', 'ricota', 'cream cheese', 'requeijão',
  'manteiga', 'margarina', 'nata',
  
  // ========== DOCES E AÇÚCARES ==========
  'açúcar', 'açúcar mascavo', 'açúcar demerara', 'açúcar de coco',
  'mel', 'melado', 'rapadura',
  'chocolate', 'chocolate ao leite', 'chocolate amargo', 'chocolate branco',
  'cacau em pó', 'achocolatado em pó',
  'geleia', 'compota', 'doce de leite', 'goiabada',
  'adoçante', 'stevia', 'xilitol',
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
  console.log('🍽️  IMPORTADOR TBCA - PRATOS COMPLETOS\n');
  
  await carregarExistentes();
  console.log(`   ${jaExiste.size} alimentos já no banco\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  let total = 0;

  console.log(`📝 ${PRATOS.length} pratos/alimentos para buscar\n`);

  for (let i = 0; i < PRATOS.length; i++) {
    const termo = PRATOS[i];
    const salvos = await buscarTBCA(page, termo);
    total += salvos;
    
    if (salvos > 0) {
      process.stdout.write(`${termo}:+${salvos} `);
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`\n   [${i + 1}/${PRATOS.length}] Novos: ${total}`);
    }
    
    await sleep(300);
  }

  await browser.close();

  const tbcaTotal = await prisma.food.count({ where: { sourceTable: 'TBCA' } });
  const totalGeral = await prisma.food.count();

  console.log('\n\n' + '='.repeat(50));
  console.log(`📊 TBCA total: ${tbcaTotal}`);
  console.log(`📊 Total geral: ${totalGeral}`);
  console.log(`✅ Novos nesta execução: ${total}`);

  await prisma.$disconnect();
}

main().catch(console.error);
