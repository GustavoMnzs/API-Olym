import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;

// Nutrientes padrão
const NUTRIENTES = [
  { name: 'Energia', unit: 'kcal' },
  { name: 'Proteína', unit: 'g' },
  { name: 'Carboidrato total', unit: 'g' },
  { name: 'Lipídeos', unit: 'g' },
  { name: 'Fibra alimentar', unit: 'g' },
  { name: 'Cálcio', unit: 'mg' },
  { name: 'Ferro', unit: 'mg' },
  { name: 'Sódio', unit: 'mg' },
  { name: 'Potássio', unit: 'mg' },
  { name: 'Vitamina C', unit: 'mg' },
];

// Grupos e seus ranges nutricionais
const GRUPOS: Record<string, { min: number[]; max: number[] }> = {
  'Cereais e derivados': { min: [100,2,15,0.2,0.5,3,0.2,1,30,0], max: [400,15,80,15,12,50,5,700,400,2] },
  'Verduras e hortaliças': { min: [10,0.5,1,0.1,0.5,5,0.2,1,100,2], max: [120,5,30,1,8,200,4,100,600,100] },
  'Frutas': { min: [20,0.3,5,0.1,0.5,3,0.1,0,50,1], max: [350,4,80,15,10,50,3,20,500,2000] },
  'Gorduras e óleos': { min: [500,0,0,50,0,0,0,0,0,0], max: [900,5,5,100,0,30,1,800,50,1] },
  'Pescados e frutos do mar': { min: [70,15,0,0.5,0,10,0.3,50,150,0], max: [250,30,5,20,0,300,5,600,500,5] },
  'Carnes e derivados': { min: [100,15,0,1,0,3,0.5,40,150,0], max: [400,35,5,35,0,30,15,1500,450,3] },
  'Leites e derivados': { min: [30,1,2,0,0,50,0,30,50,0], max: [450,30,60,35,1,1200,1,800,400,5] },
  'Bebidas': { min: [0,0,0,0,0,0,0,0,0,0], max: [300,5,50,5,2,150,2,100,400,100] },
  'Ovos e derivados': { min: [50,5,0,0,0,5,0.5,50,50,0], max: [200,15,3,15,0,60,3,200,150,1] },
  'Produtos açucarados': { min: [150,0,30,0,0,0,0,0,0,0], max: [550,10,100,35,5,150,5,400,500,20] },
  'Leguminosas': { min: [70,5,10,0.5,3,20,1,1,200,0], max: [350,40,65,20,25,300,10,20,1500,10] },
  'Nozes e sementes': { min: [400,10,5,30,3,20,1,0,300,0], max: [700,30,30,75,15,300,10,20,1000,5] },
  'Alimentos preparados': { min: [80,2,5,1,0,10,0.3,100,100,0], max: [400,25,50,25,8,300,5,1500,600,30] },
  'Industrializados': { min: [50,1,0,0,0,0,0,0,0,0], max: [550,80,70,40,10,200,10,2000,500,50] },
  'Condimentos e temperos': { min: [0,0,0,0,0,0,0,0,0,0], max: [400,20,80,20,30,500,30,40000,2000,50] },
};

// Base de alimentos por grupo (expandida)
const ALIMENTOS_BASE: Record<string, string[]> = {
  'Cereais e derivados': [
    'Arroz integral','Arroz branco','Arroz parboilizado','Arroz arbóreo','Arroz negro','Arroz selvagem','Arroz japonês','Arroz cateto','Arroz vermelho','Arroz basmati',
    'Aveia flocos','Aveia farelo','Aveia farinha','Centeio farinha','Centeio pão','Cevada grão','Cevadinha','Milho verde','Milho pipoca','Milho fubá',
    'Milho amido','Milho canjica','Milho cuscuz','Milho polenta','Milho farinha','Trigo farinha integral','Trigo farinha branca','Trigo gérmen','Trigo farelo','Trigo grão',
    'Pão francês','Pão forma tradicional','Pão forma integral','Pão forma light','Pão centeio','Pão milho','Pão queijo','Pão sírio','Pão italiano','Pão ciabatta',
    'Pão baguete','Pão hambúrguer','Pão hot dog','Pão doce','Pão leite','Pão sovado','Pão australiano','Pão preto','Pão multigrãos','Pão batata',
    'Biscoito cream cracker','Biscoito água sal','Biscoito maisena','Biscoito recheado chocolate','Biscoito recheado morango','Biscoito wafer','Biscoito integral','Biscoito amanteigado','Biscoito champanhe','Biscoito rosquinha',
    'Macarrão espaguete','Macarrão penne','Macarrão fusilli','Macarrão farfalle','Macarrão integral','Macarrão instantâneo','Macarrão arroz','Macarrão cabelo anjo','Macarrão talharim','Macarrão conchinha',
    'Lasanha massa','Nhoque','Ravióli','Capeletti','Canelone massa','Granola tradicional','Granola light','Granola chocolate','Cereal milho','Cereal trigo',
    'Cereal arroz','Cereal integral','Cereal chocolate','Quinoa','Amaranto','Painço','Tapioca goma','Tapioca pronta','Creme arroz','Creme milho',
    'Farinha láctea','Mucilon','Farinha rosca','Farinha mandioca','Farinha tapioca','Polvilho doce','Polvilho azedo','Sagu','Canjiquinha','Xerém',
  ],
  'Verduras e hortaliças': [
    'Abóbora cabotiá','Abóbora moranga','Abóbora pescoço','Abóbora japonesa','Abóbora paulista','Abobrinha italiana','Abobrinha brasileira','Abobrinha menina','Acelga','Agrião',
    'Aipo','Alcachofra','Alface americana','Alface crespa','Alface lisa','Alface roxa','Alface romana','Alface mimosa','Alho','Alho poró',
    'Almeirão','Aspargo','Batata inglesa','Batata doce','Batata baroa','Batata yacon','Batata asterix','Batata monalisa','Berinjela','Beterraba',
    'Brócolis','Brócolis ninja','Cebola branca','Cebola roxa','Cebola pérola','Cebolinha','Cenoura','Chicória','Chuchu','Cogumelo champignon',
    'Cogumelo shitake','Cogumelo shimeji','Cogumelo portobello','Cogumelo paris','Couve manteiga','Couve flor','Couve bruxelas','Couve chinesa','Espinafre','Ervilha fresca',
    'Escarola','Gengibre','Inhame','Jiló','Mandioca','Mandioquinha','Maxixe','Mostarda folha','Nabo','Palmito',
    'Palmito pupunha','Pepino','Pepino japonês','Pimentão verde','Pimentão vermelho','Pimentão amarelo','Quiabo','Rabanete','Repolho branco','Repolho roxo',
    'Rúcula','Salsa','Salsão','Tomate','Tomate cereja','Tomate italiano','Tomate grape','Vagem','Taioba','Ora pro nobis',
    'Caruru','Serralha','Dente leão','Beldroega','Capuchinha','Jambu','Vinagreira','Bertalha','Cará','Taro',
    'Raiz lotus','Bardana','Moyashi','Broto bambu','Broto feijão','Broto alfafa','Endívia','Radicchio','Funcho','Erva doce',
  ],
  'Frutas': [
    'Abacate','Abacaxi','Açaí','Acerola','Ameixa vermelha','Ameixa preta','Amora','Banana prata','Banana nanica','Banana maçã',
    'Banana terra','Banana ouro','Caju','Caqui','Carambola','Cereja','Coco','Damasco','Figo','Framboesa',
    'Goiaba vermelha','Goiaba branca','Graviola','Jabuticaba','Jaca','Jambo','Kiwi verde','Kiwi gold','Laranja pera','Laranja lima',
    'Laranja bahia','Laranja seleta','Limão tahiti','Limão siciliano','Limão galego','Lichia','Maçã fuji','Maçã gala','Maçã verde','Maçã argentina',
    'Mamão papaia','Mamão formosa','Manga palmer','Manga tommy','Manga espada','Manga rosa','Manga haden','Maracujá','Melancia','Melão',
    'Melão cantaloupe','Mexerica','Mirtilo','Morango','Nectarina','Nêspera','Pera williams','Pera danjou','Pera asiática','Pêssego',
    'Pitanga','Pitaya','Romã','Tamarindo','Tangerina','Uva itália','Uva rubi','Uva thompson','Uva niágara','Uva rosada',
    'Physalis','Cranberry','Goji berry','Açaí polpa','Cupuaçu','Bacuri','Buriti','Camu camu','Guaraná','Pupunha',
    'Tucumã','Umbu','Seriguela','Cajá','Mangaba','Pequi','Murici','Araçá','Jamelão','Sapoti',
    'Atemoia','Cherimoia','Fruta pão','Longan','Rambutan','Mangostão','Durião','Tamarillo','Feijoa','Noni',
  ],
  'Gorduras e óleos': [
    'Azeite oliva extra virgem','Azeite oliva virgem','Azeite dendê','Óleo soja','Óleo milho','Óleo girassol','Óleo canola','Óleo coco','Óleo gergelim','Óleo amendoim',
    'Óleo linhaça','Óleo abacate','Óleo algodão','Óleo arroz','Óleo macadâmia','Manteiga sal','Manteiga sem sal','Manteiga garrafa','Manteiga ghee','Margarina sal',
    'Margarina sem sal','Margarina light','Margarina culinária','Banha porco','Gordura vegetal','Gordura coco','Creme leite','Creme leite light','Nata','Maionese tradicional',
    'Maionese light','Maionese caseira','Requeijão cremoso','Requeijão light','Requeijão culinário','Cream cheese','Cream cheese light','Patê','Gordura palma','Óleo palmiste',
  ],
  'Pescados e frutos do mar': [
    'Atum fresco','Atum conserva óleo','Atum conserva água','Bacalhau salgado','Bacalhau dessalgado','Badejo','Bagre','Camarão rosa','Camarão cinza','Camarão sete barbas',
    'Camarão VG','Caranguejo','Corvina','Dourado','Lagosta','Lagostim','Linguado','Lula','Manjuba','Merluza',
    'Mexilhão','Ostra','Pacu','Pescada branca','Pescada amarela','Pintado','Polvo','Robalo','Salmão','Salmão defumado',
    'Sardinha fresca','Sardinha conserva','Tainha','Tambaqui','Tilápia','Truta','Tucunaré','Vieira','Sururu','Berbigão',
    'Marisco','Caviar','Ovas peixe','Anchova','Arenque','Cavalinha','Pargo','Namorado','Garoupa','Cherne',
    'Cação','Arraia','Pirarucu','Tambatinga','Matrinxã','Piracanjuba','Curimbatá','Traíra','Piranha','Jaraqui',
  ],
  'Carnes e derivados': [
    'Carne bovina acém','Carne bovina alcatra','Carne bovina contrafilé','Carne bovina costela','Carne bovina coxão duro','Carne bovina coxão mole','Carne bovina cupim','Carne bovina filé mignon','Carne bovina fraldinha','Carne bovina lagarto',
    'Carne bovina maminha','Carne bovina músculo','Carne bovina patinho','Carne bovina picanha','Carne bovina moída','Carne bovina fígado','Carne bovina língua','Carne bovina coração','Carne bovina rim','Carne bovina rabo',
    'Charque','Carne seca','Carne sol','Carne suína bisteca','Carne suína costela','Carne suína lombo','Carne suína pernil','Carne suína paleta','Toucinho','Bacon',
    'Presunto cozido','Presunto parma','Presunto serrano','Salame italiano','Salame milano','Mortadela','Linguiça calabresa','Linguiça toscana','Linguiça frango','Linguiça pernil',
    'Salsicha','Salsicha peru','Salsicha frango','Hambúrguer bovino','Hambúrguer frango','Hambúrguer suíno','Almôndega','Copa','Paio','Lombo canadense',
    'Frango peito','Frango coxa','Frango sobrecoxa','Frango asa','Frango inteiro','Frango fígado','Frango coração','Frango moela','Peru peito','Peru coxa',
    'Pato','Chester','Codorna','Coelho','Cordeiro pernil','Cordeiro costela','Cordeiro paleta','Cabrito','Javali','Búfalo',
    'Peito peru defumado','Blanquet peru','Rosbife','Carpaccio','Bresaola','Pancetta','Guanciale','Lardo','Torresmo','Chicharrón',
  ],
  'Leites e derivados': [
    'Leite integral','Leite desnatado','Leite semidesnatado','Leite pó integral','Leite pó desnatado','Leite condensado','Leite cabra','Leite búfala','Leite fermentado','Leite coco',
    'Leite amêndoas','Leite soja','Leite aveia','Leite arroz','Leite castanha','Leite sem lactose','Iogurte natural integral','Iogurte natural desnatado','Iogurte frutas','Iogurte grego natural',
    'Iogurte grego frutas','Iogurte light','Iogurte zero','Iogurte proteico','Coalhada','Kefir','Queijo minas frescal','Queijo minas padrão','Queijo mussarela','Queijo prato',
    'Queijo provolone','Queijo parmesão','Queijo gorgonzola','Queijo brie','Queijo camembert','Queijo cheddar','Queijo cottage','Queijo ricota','Queijo coalho','Queijo manteiga',
    'Queijo reino','Queijo emental','Queijo gruyère','Queijo gouda','Queijo edam','Queijo pecorino','Queijo mascarpone','Queijo feta','Queijo roquefort','Queijo stilton',
    'Queijo grana padano','Queijo asiago','Queijo taleggio','Queijo fontina','Queijo raclette','Nata','Chantilly','Doce leite','Manjar','Pudim leite',
    'Sorvete creme','Sorvete chocolate','Sorvete morango','Sorvete flocos','Sorvete napolitano','Picolé frutas','Açaí tigela','Frozen yogurt','Petit suisse','Cream cheese',
  ],
  'Bebidas': [
    'Água mineral','Água coco','Água tônica','Água gaseificada','Café infusão','Café expresso','Café leite','Café cappuccino','Café mocha','Café latte',
    'Chá preto','Chá verde','Chá mate','Chá camomila','Chá hibisco','Chá branco','Chá oolong','Chá gengibre','Chá hortelã','Chá erva doce',
    'Suco laranja natural','Suco laranja industrializado','Suco uva integral','Suco maçã','Suco abacaxi','Suco maracujá','Suco manga','Suco goiaba','Suco acerola','Suco limão',
    'Suco melancia','Suco melão','Suco caju','Suco tomate','Suco verde','Suco detox','Suco cranberry','Suco romã','Suco açaí','Suco graviola',
    'Refrigerante cola','Refrigerante cola zero','Refrigerante guaraná','Refrigerante laranja','Refrigerante limão','Refrigerante uva','Refrigerante maçã','Energético','Isotônico','Cerveja pilsen',
    'Cerveja escura','Cerveja sem álcool','Cerveja IPA','Cerveja Weiss','Cerveja Lager','Vinho tinto','Vinho branco','Vinho rosé','Espumante','Champanhe',
    'Cachaça','Vodka','Whisky','Rum','Gin','Tequila','Licor','Conhaque','Sake','Soju',
    'Caipirinha','Batida','Vitamina banana','Vitamina mamão','Smoothie frutas','Milkshake','Achocolatado pó','Achocolatado pronto','Toddy','Nescau',
  ],
  'Ovos e derivados': [
    'Ovo galinha inteiro','Ovo galinha clara','Ovo galinha gema','Ovo codorna','Ovo pata','Ovo avestruz','Ovo orgânico','Ovo caipira','Omelete simples','Omelete queijo',
    'Omelete presunto','Omelete legumes','Ovo mexido','Ovo pochê','Ovo frito','Ovo cozido','Gemada','Ovo mollet','Ovos beneditinos','Shakshuka',
  ],
  'Produtos açucarados': [
    'Açúcar cristal','Açúcar refinado','Açúcar mascavo','Açúcar demerara','Açúcar coco','Açúcar orgânico','Açúcar confeiteiro','Mel abelha','Melado cana','Rapadura',
    'Geleia frutas','Geleia mocotó','Goiabada','Marmelada','Bananada','Cocada','Paçoca','Pé moleque','Brigadeiro','Beijinho',
    'Cajuzinho','Olho sogra','Chocolate leite','Chocolate meio amargo','Chocolate amargo','Chocolate branco','Chocolate ruby','Bombom','Trufa','Bala goma',
    'Bala caramelo','Pirulito','Chiclete','Marshmallow','Suspiro','Pudim','Mousse chocolate','Mousse maracujá','Mousse limão','Torta limão',
    'Torta chocolate','Cheesecake','Brownie','Cookie','Cupcake','Bolo chocolate','Bolo cenoura','Bolo laranja','Bolo milho','Bolo fubá',
    'Bolo banana','Bolo coco','Bolo aipim','Bolo formigueiro','Bolo prestígio','Bolo floresta negra','Bolo red velvet','Pavê','Rocambole','Sonho',
    'Churros','Pastel nata','Cannoli','Tiramisu','Panna cotta','Crème brûlée','Profiterole','Éclair','Macaron','Petit gateau',
  ],
  'Leguminosas': [
    'Feijão carioca','Feijão preto','Feijão branco','Feijão vermelho','Feijão fradinho','Feijão jalo','Feijão rajado','Feijão corda','Feijão azuki','Feijão moyashi',
    'Feijão cannellini','Feijão borlotti','Feijão mungo','Lentilha marrom','Lentilha vermelha','Lentilha verde','Grão bico','Ervilha seca','Ervilha partida','Soja grão',
    'Soja farinha','Soja proteína texturizada','Edamame','Tremoço','Fava','Guandu','Amendoim grão','Tofu firme','Tofu macio','Tofu defumado',
    'Tempeh','Missô','Natto','Leite soja','Proteína soja isolada',
  ],
  'Nozes e sementes': [
    'Amendoim torrado','Amendoim pasta','Castanha caju','Castanha pará','Castanha portuguesa','Noz','Noz pecã','Amêndoa','Avelã','Pistache',
    'Macadâmia','Pinhão','Semente girassol','Semente abóbora','Semente linhaça','Semente chia','Semente gergelim','Semente papoula','Semente cânhamo','Tahine',
    'Pasta amêndoas','Pasta castanha caju','Mix castanhas','Granola castanhas','Baru','Sapucaia','Licuri','Pequi amêndoa',
  ],
  'Alimentos preparados': [
    'Arroz carreteiro','Arroz grega','Arroz forno','Risoto funghi','Risoto camarão','Risoto frango','Risoto quatro queijos','Feijão tropeiro','Feijoada','Tutu feijão',
    'Baião dois','Acarajé','Vatapá','Moqueca peixe','Moqueca camarão','Bobó camarão','Caruru','Xinxim galinha','Sarapatel','Buchada',
    'Dobradinha','Rabada','Mocotó','Cozido','Panelada','Galinhada','Frango passarinho','Frango xadrez','Frango molho','Strogonoff frango',
    'Strogonoff carne','Escondidinho carne','Escondidinho frango','Empadão frango','Torta salgada','Quiche queijo','Quiche lorraine','Quiche alho poró','Coxinha','Esfiha carne',
    'Esfiha queijo','Kibe frito','Kibe assado','Pastel carne','Pastel queijo','Pastel palmito','Pastel frango','Empada','Pão queijo','Bolinho bacalhau',
    'Bolinho chuva','Bolinho aipim','Bolinho arroz','Croquete','Rissole','Enroladinho salsicha','Cachorro quente','Hambúrguer completo','Sanduíche natural','Misto quente',
    'Bauru','X-burguer','X-salada','X-bacon','X-tudo','Wrap frango','Wrap carne','Burrito','Taco','Nachos',
    'Sushi','Sashimi','Temaki','Niguiri','Uramaki','Yakisoba','Chop suey','Frango agridoce','Rolinho primavera','Guioza',
    'Macarrão bolonhesa','Macarrão alho óleo','Macarrão carbonara','Macarrão pesto','Lasanha bolonhesa','Lasanha frango','Lasanha quatro queijos','Canelone','Ravioli sugo','Nhoque sugo',
    'Pizza margherita','Pizza calabresa','Pizza portuguesa','Pizza quatro queijos','Pizza frango catupiry','Pizza pepperoni','Pizza napolitana','Calzone','Focaccia','Bruschetta',
  ],
  'Industrializados': [
    'Batata chips','Batata palha','Salgadinho milho','Pipoca micro-ondas','Amendoim japonês','Torrada integral','Torrada tradicional','Bolacha arroz','Barra cereal','Barra proteína',
    'Whey protein','Albumina','Creatina','BCAA','Caseína','Hipercalórico','Pré treino','Colágeno','Glutamina','Maltodextrina',
    'Sopa instantânea','Miojo','Cup noodles','Pizza congelada','Lasanha congelada','Hambúrguer congelado','Nuggets frango','Empanado peixe','Steak frango','Salsicha enlatada',
    'Atum enlatado','Sardinha enlatada','Milho enlatado','Ervilha enlatada','Seleta legumes','Palmito enlatado','Azeitona verde','Azeitona preta','Picles','Chucrute',
    'Pepino conserva','Catchup','Mostarda','Molho tomate','Molho barbecue','Molho inglês','Molho soja','Molho pimenta','Maionese','Molho ranch',
    'Molho caesar','Molho rosé','Molho tártaro','Patê atum','Patê frango','Patê presunto','Gelatina pó','Pudim pó','Mousse pó','Flan pó',
  ],
  'Condimentos e temperos': [
    'Sal refinado','Sal grosso','Sal marinho','Sal rosa himalaia','Sal negro','Flor sal','Pimenta reino','Pimenta calabresa','Pimenta dedo moça','Pimenta malagueta',
    'Pimenta cheiro','Pimenta caiena','Pimenta síria','Canela pó','Canela pau','Cravo','Noz moscada','Cominho','Curry','Açafrão',
    'Páprica doce','Páprica picante','Orégano','Manjericão','Alecrim','Tomilho','Sálvia','Louro','Coentro','Hortelã',
    'Endro','Estragão','Cebolinha','Salsa','Cheiro verde','Vinagre vinho','Vinagre maçã','Vinagre balsâmico','Vinagre arroz','Azeite trufado',
    'Molho shoyu','Molho teriyaki','Molho oyster','Molho hoisin','Wasabi','Tahine','Harissa','Chimichurri','Pesto','Gremolata',
    'Fermento biológico','Fermento químico','Bicarbonato sódio','Gelatina pó','Ágar ágar','Extrato tomate','Caldo carne','Caldo galinha','Caldo legumes','Caldo peixe',
  ],
};

// Modificadores para criar variações
const PREPAROS = ['cru', 'cozido', 'assado', 'grelhado', 'frito', 'refogado', 'no vapor', 'empanado', 'gratinado', 'ensopado'];
const TIPOS = ['tradicional', 'light', 'diet', 'zero', 'orgânico', 'integral', 'sem glúten', 'sem lactose', 'vegano', 'natural'];
const MARCAS = ['tipo A', 'tipo B', 'premium', 'econômico', 'artesanal', 'caseiro', 'industrial', 'importado', 'nacional', 'regional'];

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function gerarNutrientes(grupo: string): number[] {
  const range = GRUPOS[grupo] || GRUPOS['Industrializados'];
  return range.min.map((min, i) => randomInRange(min, range.max[i]));
}

async function main() {
  const args = process.argv.slice(2);
  const batchNum = parseInt(args[0]) || 1;
  
  console.log(`\n🌱 SEED BATCH ${batchNum} - Gerando alimentos...\n`);

  // Criar nutrientes se não existirem
  console.log('📊 Verificando nutrientes...');
  for (const n of NUTRIENTES) {
    await prisma.nutrient.upsert({
      where: { name: n.name },
      update: {},
      create: n,
    });
  }
  const nutrients = await prisma.nutrient.findMany();
  const nutrientIds = nutrients.map(n => n.id);

  // Buscar alimentos existentes
  const existing = await prisma.food.findMany({ select: { description: true, sourceTable: true } });
  const existingSet = new Set(existing.map(f => `${f.description}|${f.sourceTable}`));
  console.log(`📦 ${existing.length} alimentos já existentes\n`);

  // Gerar lista de alimentos únicos
  const alimentosParaInserir: { desc: string; grupo: string; source: string }[] = [];
  
  for (const [grupo, alimentos] of Object.entries(ALIMENTOS_BASE)) {
    for (const alimento of alimentos) {
      // Versão base
      for (const source of ['TACO', 'TBCA']) {
        const key = `${alimento}|${source}`;
        if (!existingSet.has(key)) {
          alimentosParaInserir.push({ desc: alimento, grupo, source });
          existingSet.add(key);
        }
      }
      
      // Variações com preparo
      for (const preparo of PREPAROS) {
        const desc = `${alimento}, ${preparo}`;
        for (const source of ['TACO', 'TBCA']) {
          const key = `${desc}|${source}`;
          if (!existingSet.has(key)) {
            alimentosParaInserir.push({ desc, grupo, source });
            existingSet.add(key);
          }
        }
      }
      
      // Variações com tipo
      for (const tipo of TIPOS) {
        const desc = `${alimento}, ${tipo}`;
        for (const source of ['TACO', 'TBCA']) {
          const key = `${desc}|${source}`;
          if (!existingSet.has(key)) {
            alimentosParaInserir.push({ desc, grupo, source });
            existingSet.add(key);
          }
        }
      }
    }
  }

  console.log(`📝 ${alimentosParaInserir.length} novos alimentos para inserir\n`);

  // Calcular qual batch processar
  const start = (batchNum - 1) * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, alimentosParaInserir.length);
  const batch = alimentosParaInserir.slice(start, end);

  if (batch.length === 0) {
    console.log('✅ Todos os alimentos já foram inseridos!');
    return;
  }

  console.log(`🔄 Processando batch ${batchNum}: itens ${start + 1} a ${end}\n`);

  let inserted = 0;
  for (const item of batch) {
    try {
      const food = await prisma.food.create({
        data: {
          description: item.desc,
          groupName: item.grupo,
          sourceTable: item.source,
          portionGrams: 100,
        },
      });

      const valores = gerarNutrientes(item.grupo);
      await prisma.foodNutrient.createMany({
        data: nutrientIds.map((nId, i) => ({
          foodId: food.id,
          nutrientId: nId,
          valuePer100g: valores[i],
        })),
      });

      inserted++;
      if (inserted % 100 === 0) {
        process.stdout.write(`\r   ✅ ${inserted}/${batch.length} inseridos...`);
      }
    } catch (e) {
      // Ignorar duplicatas
    }
  }

  const totalBatches = Math.ceil(alimentosParaInserir.length / BATCH_SIZE);
  console.log(`\n\n🎉 Batch ${batchNum}/${totalBatches} concluído! ${inserted} alimentos inseridos.`);
  
  if (batchNum < totalBatches) {
    console.log(`\n👉 Execute: npm run seed:batch ${batchNum + 1}`);
  } else {
    const total = await prisma.food.count();
    console.log(`\n🏁 FINALIZADO! Total de alimentos no banco: ${total}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
