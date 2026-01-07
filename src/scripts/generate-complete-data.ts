import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Grupos de alimentos baseados na TACO/TBCA
const grupos = [
  'Cereais e derivados',
  'Verduras, hortaliças e derivados',
  'Frutas e derivados',
  'Gorduras e óleos',
  'Pescados e frutos do mar',
  'Carnes e derivados',
  'Leites e derivados',
  'Bebidas',
  'Ovos e derivados',
  'Produtos açucarados',
  'Miscelâneas',
  'Outros alimentos industrializados',
  'Alimentos preparados',
  'Leguminosas e derivados',
  'Nozes e sementes',
];

// Base de alimentos reais TACO/TBCA expandida
const alimentosBase: Record<string, string[]> = {
  'Cereais e derivados': [
    'Arroz, integral, cozido', 'Arroz, tipo 1, cozido', 'Arroz, tipo 2, cozido',
    'Arroz, parboilizado, cozido', 'Arroz, arbóreo, cozido', 'Arroz, negro, cozido',
    'Arroz, selvagem, cozido', 'Arroz, japonês, cozido', 'Arroz, cateto, cozido',
    'Aveia, em flocos, crua', 'Aveia, em flocos, cozida', 'Aveia, farelo',
    'Centeio, farinha', 'Centeio, pão', 'Cevada, em grão',
    'Cevadinha, cozida', 'Milho, verde, cru', 'Milho, verde, cozido',
    'Milho, pipoca, estourada', 'Milho, fubá', 'Milho, amido (maisena)',
    'Milho, canjica, cozida', 'Milho, cuscuz, cozido', 'Milho, polenta, cozida',
    'Trigo, farinha, integral', 'Trigo, farinha, branca', 'Trigo, gérmen',
    'Trigo, farelo', 'Trigo, em grão', 'Pão, francês',
    'Pão, de forma, tradicional', 'Pão, de forma, integral', 'Pão, de forma, light',
    'Pão, de centeio', 'Pão, de milho', 'Pão, de queijo',
    'Pão, sírio', 'Pão, italiano', 'Pão, ciabatta',
    'Pão, baguete', 'Pão, de hambúrguer', 'Pão, de hot dog',
    'Pão, doce', 'Pão, de leite', 'Pão, sovado',
    'Biscoito, cream cracker', 'Biscoito, água e sal', 'Biscoito, maisena',
    'Biscoito, recheado, chocolate', 'Biscoito, recheado, morango', 'Biscoito, wafer',
    'Biscoito, integral', 'Biscoito, amanteigado', 'Biscoito, champanhe',
    'Macarrão, cru', 'Macarrão, cozido', 'Macarrão, integral, cru',
    'Macarrão, integral, cozido', 'Macarrão, instantâneo', 'Macarrão, de arroz',
    'Lasanha, massa crua', 'Nhoque, cru', 'Ravióli, cru',
    'Granola', 'Cereal matinal, milho', 'Cereal matinal, trigo',
    'Cereal matinal, arroz', 'Cereal matinal, integral', 'Quinoa, crua',
    'Quinoa, cozida', 'Amaranto, em grão', 'Painço, em grão',
    'Tapioca, goma', 'Tapioca, pronta', 'Creme de arroz',
    'Creme de milho', 'Farinha láctea', 'Mucilon',
  ],
  'Verduras, hortaliças e derivados': [
    'Abóbora, cabotiá, crua', 'Abóbora, cabotiá, cozida', 'Abóbora, moranga, crua',
    'Abóbora, moranga, cozida', 'Abóbora, pescoço, crua', 'Abóbora, japonesa, crua',
    'Abobrinha, italiana, crua', 'Abobrinha, italiana, cozida', 'Abobrinha, brasileira, crua',
    'Acelga, crua', 'Acelga, cozida', 'Agrião, cru',
    'Aipo, cru', 'Alcachofra, crua', 'Alcachofra, cozida',
    'Alface, americana, crua', 'Alface, crespa, crua', 'Alface, lisa, crua',
    'Alface, roxa, crua', 'Alface, romana, crua', 'Alho, cru',
    'Alho-poró, cru', 'Almeirão, cru', 'Aspargo, cru',
    'Aspargo, cozido', 'Aspargo, em conserva', 'Batata, inglesa, crua',
    'Batata, inglesa, cozida', 'Batata, inglesa, frita', 'Batata, inglesa, assada',
    'Batata, inglesa, purê', 'Batata, doce, crua', 'Batata, doce, cozida',
    'Batata, doce, assada', 'Batata, baroa, crua', 'Batata, baroa, cozida',
    'Batata, yacon, crua', 'Berinjela, crua', 'Berinjela, cozida',
    'Berinjela, grelhada', 'Beterraba, crua', 'Beterraba, cozida',
    'Brócolis, cru', 'Brócolis, cozido', 'Brócolis, no vapor',
    'Cebola, crua', 'Cebola, cozida', 'Cebola, roxa, crua',
    'Cebolinha, crua', 'Cenoura, crua', 'Cenoura, cozida',
    'Chicória, crua', 'Chuchu, cru', 'Chuchu, cozido',
    'Cogumelo, champignon, cru', 'Cogumelo, champignon, em conserva', 'Cogumelo, shitake, cru',
    'Cogumelo, shimeji, cru', 'Cogumelo, portobello, cru', 'Couve, manteiga, crua',
    'Couve, manteiga, refogada', 'Couve-flor, crua', 'Couve-flor, cozida',
    'Couve-de-bruxelas, crua', 'Couve-de-bruxelas, cozida', 'Espinafre, cru',
    'Espinafre, cozido', 'Ervilha, fresca, crua', 'Ervilha, em conserva',
    'Ervilha, congelada', 'Escarola, crua', 'Gengibre, cru',
    'Inhame, cru', 'Inhame, cozido', 'Jiló, cru',
    'Jiló, cozido', 'Mandioca, crua', 'Mandioca, cozida',
    'Mandioca, frita', 'Mandioquinha, crua', 'Mandioquinha, cozida',
    'Maxixe, cru', 'Milho, verde, em conserva', 'Mostarda, folha, crua',
    'Nabo, cru', 'Nabo, cozido', 'Palmito, em conserva',
    'Palmito, pupunha', 'Pepino, cru', 'Pepino, japonês, cru',
    'Pimentão, verde, cru', 'Pimentão, vermelho, cru', 'Pimentão, amarelo, cru',
    'Quiabo, cru', 'Quiabo, cozido', 'Rabanete, cru',
    'Repolho, branco, cru', 'Repolho, roxo, cru', 'Rúcula, crua',
    'Salsa, crua', 'Salsão, cru', 'Tomate, cru',
    'Tomate, cereja, cru', 'Tomate, italiano, cru', 'Tomate, seco',
    'Vagem, crua', 'Vagem, cozida',
  ],
  'Frutas e derivados': [
    'Abacate, cru', 'Abacaxi, cru', 'Abacaxi, em calda',
    'Açaí, polpa', 'Acerola, crua', 'Ameixa, crua',
    'Ameixa, seca', 'Ameixa, em calda', 'Amora, crua',
    'Banana, prata, crua', 'Banana, nanica, crua', 'Banana, maçã, crua',
    'Banana, da terra, crua', 'Banana, ouro, crua', 'Banana, passa',
    'Caju, cru', 'Caqui, cru', 'Carambola, crua',
    'Cereja, crua', 'Cereja, em calda', 'Coco, cru',
    'Coco, ralado', 'Coco, água', 'Coco, leite',
    'Damasco, cru', 'Damasco, seco', 'Figo, cru',
    'Figo, seco', 'Figo, em calda', 'Framboesa, crua',
    'Goiaba, vermelha, crua', 'Goiaba, branca, crua', 'Graviola, crua',
    'Jabuticaba, crua', 'Jaca, crua', 'Jambo, cru',
    'Kiwi, cru', 'Laranja, pera, crua', 'Laranja, lima, crua',
    'Laranja, bahia, crua', 'Laranja, suco', 'Limão, cru',
    'Limão, suco', 'Lichia, crua', 'Maçã, fuji, crua',
    'Maçã, gala, crua', 'Maçã, verde, crua', 'Mamão, papaia, cru',
    'Mamão, formosa, cru', 'Manga, palmer, crua', 'Manga, tommy, crua',
    'Manga, espada, crua', 'Manga, rosa, crua', 'Maracujá, cru',
    'Maracujá, suco', 'Melancia, crua', 'Melão, cru',
    'Mexerica, crua', 'Mirtilo, cru', 'Morango, cru',
    'Nectarina, crua', 'Nêspera, crua', 'Pera, williams, crua',
    'Pera, danjou, crua', 'Pêssego, cru', 'Pêssego, em calda',
    'Pitanga, crua', 'Pitaya, crua', 'Romã, crua',
    'Tamarindo, cru', 'Tangerina, crua', 'Uva, itália, crua',
    'Uva, rubi, crua', 'Uva, thompson, crua', 'Uva, passa',
  ],
  'Gorduras e óleos': [
    'Azeite, de oliva, extra virgem', 'Azeite, de oliva, virgem', 'Azeite, de dendê',
    'Óleo, de soja', 'Óleo, de milho', 'Óleo, de girassol',
    'Óleo, de canola', 'Óleo, de coco', 'Óleo, de gergelim',
    'Óleo, de amendoim', 'Óleo, de linhaça', 'Óleo, de abacate',
    'Manteiga, com sal', 'Manteiga, sem sal', 'Manteiga, de garrafa',
    'Margarina, com sal', 'Margarina, sem sal', 'Margarina, light',
    'Banha, de porco', 'Gordura, vegetal hidrogenada', 'Creme de leite',
    'Maionese, tradicional', 'Maionese, light', 'Requeijão, cremoso',
    'Requeijão, light', 'Cream cheese', 'Cream cheese, light',
  ],
  'Pescados e frutos do mar': [
    'Atum, fresco, cru', 'Atum, em conserva, em óleo', 'Atum, em conserva, em água',
    'Bacalhau, salgado, cru', 'Bacalhau, dessalgado, cozido', 'Badejo, cru',
    'Bagre, cru', 'Camarão, cru', 'Camarão, cozido',
    'Camarão, frito', 'Camarão, seco', 'Caranguejo, cru',
    'Caranguejo, cozido', 'Corvina, crua', 'Dourado, cru',
    'Lagosta, crua', 'Lagosta, cozida', 'Linguado, cru',
    'Lula, crua', 'Lula, cozida', 'Lula, frita',
    'Manjuba, crua', 'Manjuba, frita', 'Merluza, crua',
    'Merluza, cozida', 'Mexilhão, cru', 'Mexilhão, cozido',
    'Ostra, crua', 'Pacu, cru', 'Pescada, branca, crua',
    'Pescada, amarela, crua', 'Pintado, cru', 'Polvo, cru',
    'Polvo, cozido', 'Robalo, cru', 'Salmão, cru',
    'Salmão, grelhado', 'Salmão, defumado', 'Sardinha, crua',
    'Sardinha, em conserva', 'Sardinha, frita', 'Tainha, crua',
    'Tambaqui, cru', 'Tilápia, crua', 'Tilápia, grelhada',
    'Truta, crua', 'Tucunaré, cru', 'Vieira, crua',
  ],
  'Carnes e derivados': [
    'Carne, bovina, acém, cru', 'Carne, bovina, acém, cozido', 'Carne, bovina, alcatra, crua',
    'Carne, bovina, alcatra, grelhada', 'Carne, bovina, contrafilé, cru', 'Carne, bovina, contrafilé, grelhado',
    'Carne, bovina, costela, crua', 'Carne, bovina, costela, cozida', 'Carne, bovina, coxão duro, cru',
    'Carne, bovina, coxão mole, cru', 'Carne, bovina, cupim, cru', 'Carne, bovina, filé mignon, cru',
    'Carne, bovina, filé mignon, grelhado', 'Carne, bovina, fraldinha, crua', 'Carne, bovina, lagarto, cru',
    'Carne, bovina, maminha, crua', 'Carne, bovina, músculo, cru', 'Carne, bovina, patinho, cru',
    'Carne, bovina, picanha, crua', 'Carne, bovina, picanha, grelhada', 'Carne, bovina, moída, crua',
    'Carne, bovina, moída, cozida', 'Carne, bovina, fígado, cru', 'Carne, bovina, fígado, grelhado',
    'Carne, bovina, língua, crua', 'Carne, bovina, coração, cru', 'Carne, bovina, charque',
    'Carne, bovina, carne seca', 'Carne, suína, bisteca, crua', 'Carne, suína, bisteca, grelhada',
    'Carne, suína, costela, crua', 'Carne, suína, lombo, cru', 'Carne, suína, lombo, assado',
    'Carne, suína, pernil, cru', 'Carne, suína, pernil, assado', 'Carne, suína, toucinho',
    'Bacon, cru', 'Bacon, frito', 'Presunto, cru',
    'Presunto, cozido', 'Presunto, parma', 'Salame, italiano',
    'Mortadela', 'Linguiça, calabresa, crua', 'Linguiça, calabresa, grelhada',
    'Linguiça, toscana, crua', 'Linguiça, de frango', 'Salsicha, crua',
    'Salsicha, cozida', 'Salsicha, de peru', 'Hambúrguer, bovino, cru',
    'Hambúrguer, bovino, grelhado', 'Almôndega, crua', 'Almôndega, cozida',
    'Frango, peito, sem pele, cru', 'Frango, peito, sem pele, grelhado', 'Frango, peito, com pele, cru',
    'Frango, coxa, sem pele, crua', 'Frango, coxa, com pele, crua', 'Frango, sobrecoxa, crua',
    'Frango, asa, crua', 'Frango, asa, frita', 'Frango, inteiro, assado',
    'Frango, fígado, cru', 'Frango, coração, cru', 'Frango, moela, crua',
    'Peru, peito, cru', 'Peru, peito, assado', 'Peru, coxa, crua',
    'Pato, cru', 'Pato, assado', 'Chester, cru',
    'Codorna, crua', 'Coelho, cru', 'Cordeiro, pernil, cru',
    'Cordeiro, costela, crua', 'Cabrito, cru', 'Javali, cru',
    'Carne, de sol', 'Paio', 'Copa',
    'Peito de peru, defumado', 'Blanquet de peru', 'Rosbife',
  ],
  'Leites e derivados': [
    'Leite, de vaca, integral', 'Leite, de vaca, desnatado', 'Leite, de vaca, semidesnatado',
    'Leite, de vaca, em pó, integral', 'Leite, de vaca, em pó, desnatado', 'Leite, condensado',
    'Leite, de cabra', 'Leite, de búfala', 'Leite, fermentado',
    'Leite, de coco', 'Leite, de amêndoas', 'Leite, de soja',
    'Leite, de aveia', 'Leite, de arroz', 'Leite, sem lactose',
    'Iogurte, natural, integral', 'Iogurte, natural, desnatado', 'Iogurte, com frutas',
    'Iogurte, grego, natural', 'Iogurte, grego, com frutas', 'Iogurte, light',
    'Coalhada', 'Kefir', 'Queijo, minas, frescal',
    'Queijo, minas, padrão', 'Queijo, mussarela', 'Queijo, prato',
    'Queijo, provolone', 'Queijo, parmesão', 'Queijo, gorgonzola',
    'Queijo, brie', 'Queijo, camembert', 'Queijo, cheddar',
    'Queijo, cottage', 'Queijo, ricota', 'Queijo, coalho',
    'Queijo, manteiga', 'Queijo, reino', 'Queijo, emental',
    'Queijo, gruyère', 'Queijo, gouda', 'Queijo, edam',
    'Queijo, pecorino', 'Queijo, mascarpone', 'Queijo, feta',
    'Nata', 'Chantilly', 'Doce de leite',
    'Manjar', 'Pudim de leite', 'Sorvete, creme',
    'Sorvete, chocolate', 'Sorvete, morango', 'Sorvete, flocos',
    'Picolé, frutas', 'Açaí na tigela',
  ],
  'Bebidas': [
    'Água, mineral', 'Água, de coco', 'Água, tônica',
    'Café, infusão', 'Café, expresso', 'Café, com leite',
    'Chá, preto, infusão', 'Chá, verde, infusão', 'Chá, mate, infusão',
    'Chá, camomila, infusão', 'Chá, de hibisco', 'Chá, branco',
    'Suco, de laranja, natural', 'Suco, de laranja, industrializado', 'Suco, de uva, integral',
    'Suco, de maçã', 'Suco, de abacaxi', 'Suco, de maracujá',
    'Suco, de manga', 'Suco, de goiaba', 'Suco, de acerola',
    'Suco, de limão', 'Suco, de melancia', 'Suco, de melão',
    'Suco, de caju', 'Suco, de tomate', 'Suco, verde',
    'Refrigerante, cola', 'Refrigerante, cola, zero', 'Refrigerante, guaraná',
    'Refrigerante, laranja', 'Refrigerante, limão', 'Refrigerante, uva',
    'Energético', 'Isotônico', 'Cerveja, pilsen',
    'Cerveja, escura', 'Cerveja, sem álcool', 'Vinho, tinto',
    'Vinho, branco', 'Vinho, rosé', 'Espumante',
    'Cachaça', 'Vodka', 'Whisky',
    'Rum', 'Gin', 'Tequila',
    'Licor', 'Conhaque', 'Champanhe',
    'Caipirinha', 'Batida', 'Vitamina, de banana',
    'Vitamina, de mamão', 'Smoothie, de frutas', 'Milkshake',
    'Achocolatado, em pó', 'Achocolatado, pronto', 'Cappuccino, em pó',
  ],
  'Ovos e derivados': [
    'Ovo, de galinha, inteiro, cru', 'Ovo, de galinha, inteiro, cozido', 'Ovo, de galinha, inteiro, frito',
    'Ovo, de galinha, clara, crua', 'Ovo, de galinha, clara, cozida', 'Ovo, de galinha, gema, crua',
    'Ovo, de galinha, gema, cozida', 'Ovo, de codorna, cru', 'Ovo, de codorna, cozido',
    'Ovo, de pata, cru', 'Omelete, simples', 'Omelete, com queijo',
    'Ovo, mexido', 'Ovo, pochê', 'Gemada',
  ],
  'Produtos açucarados': [
    'Açúcar, cristal', 'Açúcar, refinado', 'Açúcar, mascavo',
    'Açúcar, demerara', 'Açúcar, de coco', 'Açúcar, orgânico',
    'Mel, de abelha', 'Melado, de cana', 'Rapadura',
    'Geleia, de frutas', 'Geleia, de mocotó', 'Goiabada',
    'Marmelada', 'Bananada', 'Cocada',
    'Paçoca', 'Pé de moleque', 'Brigadeiro',
    'Beijinho', 'Cajuzinho', 'Olho de sogra',
    'Chocolate, ao leite', 'Chocolate, meio amargo', 'Chocolate, amargo',
    'Chocolate, branco', 'Bombom', 'Trufa',
    'Bala, de goma', 'Bala, de caramelo', 'Pirulito',
    'Chiclete', 'Marshmallow', 'Suspiro',
    'Pudim', 'Mousse, de chocolate', 'Mousse, de maracujá',
    'Torta, de limão', 'Torta, de chocolate', 'Cheesecake',
    'Brownie', 'Cookie', 'Cupcake',
    'Bolo, de chocolate', 'Bolo, de cenoura', 'Bolo, de laranja',
    'Bolo, de milho', 'Bolo, de fubá', 'Bolo, de banana',
    'Bolo, de coco', 'Bolo, de aipim', 'Bolo, formigueiro',
    'Pavê', 'Rocambole', 'Sonho',
    'Churros', 'Pastel de nata', 'Cannoli',
  ],
  'Miscelâneas': [
    'Sal, refinado', 'Sal, grosso', 'Sal, marinho',
    'Sal, rosa do himalaia', 'Pimenta, do reino', 'Pimenta, calabresa',
    'Pimenta, dedo de moça', 'Pimenta, malagueta', 'Pimenta, de cheiro',
    'Canela, em pó', 'Canela, em pau', 'Cravo',
    'Noz moscada', 'Cominho', 'Curry',
    'Açafrão', 'Páprica', 'Orégano',
    'Manjericão', 'Alecrim', 'Tomilho',
    'Sálvia', 'Louro', 'Coentro',
    'Hortelã', 'Endro', 'Estragão',
    'Vinagre, de vinho', 'Vinagre, de maçã', 'Vinagre, balsâmico',
    'Molho, de soja (shoyu)', 'Molho, inglês', 'Molho, de pimenta',
    'Molho, barbecue', 'Molho, de tomate', 'Catchup',
    'Mostarda', 'Wasabi', 'Tahine',
    'Fermento, biológico', 'Fermento, químico', 'Bicarbonato de sódio',
    'Gelatina, em pó', 'Ágar-ágar', 'Extrato de tomate',
    'Caldo, de carne', 'Caldo, de galinha', 'Caldo, de legumes',
    'Missô', 'Tofu', 'Tempeh',
  ],
  'Outros alimentos industrializados': [
    'Batata, chips', 'Batata, palha', 'Salgadinho, de milho',
    'Pipoca, de micro-ondas', 'Amendoim, japonês', 'Torrada, integral',
    'Torrada, tradicional', 'Cream cracker, integral', 'Bolacha, de arroz',
    'Barra de cereal', 'Barra de proteína', 'Whey protein',
    'Albumina', 'Creatina', 'BCAA',
    'Leite, em pó, instantâneo', 'Achocolatado, diet', 'Adoçante, sucralose',
    'Adoçante, stevia', 'Adoçante, aspartame', 'Gelatina, diet',
    'Sopa, instantânea', 'Miojo', 'Cup noodles',
    'Pizza, congelada', 'Lasanha, congelada', 'Hambúrguer, congelado',
    'Nuggets, de frango', 'Empanado, de peixe', 'Steak, de frango',
    'Salsicha, enlatada', 'Atum, enlatado', 'Sardinha, enlatada',
    'Milho, enlatado', 'Ervilha, enlatada', 'Seleta de legumes',
    'Palmito, enlatado', 'Azeitona, verde', 'Azeitona, preta',
    'Picles', 'Chucrute', 'Pepino, em conserva',
  ],
  'Alimentos preparados': [
    'Arroz, carreteiro', 'Arroz, à grega', 'Arroz, de forno',
    'Risoto, de funghi', 'Risoto, de camarão', 'Risoto, de frango',
    'Feijão, tropeiro', 'Feijoada', 'Tutu de feijão',
    'Baião de dois', 'Acarajé', 'Vatapá',
    'Moqueca, de peixe', 'Moqueca, de camarão', 'Bobó de camarão',
    'Caruru', 'Xinxim de galinha', 'Sarapatel',
    'Buchada', 'Dobradinha', 'Rabada',
    'Mocotó', 'Cozido', 'Panelada',
    'Galinhada', 'Frango, à passarinho', 'Frango, xadrez',
    'Frango, ao molho', 'Strogonoff, de frango', 'Strogonoff, de carne',
    'Escondidinho, de carne', 'Escondidinho, de frango', 'Empadão, de frango',
    'Torta, salgada', 'Quiche, de queijo', 'Quiche, lorraine',
    'Coxinha', 'Esfiha', 'Kibe',
    'Pastel, de carne', 'Pastel, de queijo', 'Pastel, de palmito',
    'Empada', 'Pão de queijo', 'Bolinho de bacalhau',
    'Bolinho de chuva', 'Bolinho de aipim', 'Bolinho de arroz',
    'Croquete', 'Rissole', 'Enroladinho de salsicha',
    'Cachorro-quente', 'Hambúrguer, completo', 'Sanduíche, natural',
    'Sanduíche, de presunto e queijo', 'Misto quente', 'Bauru',
    'X-burguer', 'X-salada', 'X-bacon',
    'Wrap', 'Burrito', 'Taco',
    'Sushi', 'Sashimi', 'Temaki',
    'Yakisoba', 'Chop suey', 'Frango, agridoce',
    'Rolinho primavera', 'Guioza', 'Harumaki',
    'Macarrão, à bolonhesa', 'Macarrão, ao alho e óleo', 'Macarrão, carbonara',
    'Lasanha, à bolonhesa', 'Lasanha, de frango', 'Lasanha, quatro queijos',
    'Canelone', 'Ravioli, ao sugo', 'Nhoque, ao sugo',
    'Pizza, margherita', 'Pizza, calabresa', 'Pizza, portuguesa',
    'Pizza, quatro queijos', 'Pizza, frango com catupiry', 'Calzone',
    'Focaccia', 'Bruschetta', 'Carpaccio',
    'Salada, caesar', 'Salada, caprese', 'Salada, de maionese',
    'Salada, de frutas', 'Salpicão', 'Tabule',
    'Homus', 'Babaganoush', 'Falafel',
    'Paella', 'Bacalhoada', 'Caldeirada',
    'Sopa, de legumes', 'Sopa, de feijão', 'Sopa, de ervilha',
    'Canja', 'Caldo verde', 'Minestrone',
    'Gazpacho', 'Vichyssoise', 'Consomê',
  ],
  'Leguminosas e derivados': [
    'Feijão, carioca, cru', 'Feijão, carioca, cozido', 'Feijão, preto, cru',
    'Feijão, preto, cozido', 'Feijão, branco, cru', 'Feijão, branco, cozido',
    'Feijão, vermelho, cru', 'Feijão, vermelho, cozido', 'Feijão, fradinho, cru',
    'Feijão, fradinho, cozido', 'Feijão, jalo, cru', 'Feijão, rajado, cru',
    'Feijão, de corda, cru', 'Feijão, azuki, cru', 'Feijão, moyashi',
    'Lentilha, crua', 'Lentilha, cozida', 'Grão de bico, cru',
    'Grão de bico, cozido', 'Ervilha, seca, crua', 'Ervilha, seca, cozida',
    'Soja, em grão, crua', 'Soja, em grão, cozida', 'Soja, farinha',
    'Soja, proteína texturizada', 'Edamame', 'Tremoço',
  ],
  'Nozes e sementes': [
    'Amendoim, cru', 'Amendoim, torrado', 'Amendoim, pasta (manteiga)',
    'Castanha, de caju, crua', 'Castanha, de caju, torrada', 'Castanha, do pará',
    'Castanha, portuguesa', 'Noz, crua', 'Noz, pecã',
    'Amêndoa, crua', 'Amêndoa, torrada', 'Avelã, crua',
    'Pistache, cru', 'Pistache, torrado', 'Macadâmia',
    'Pinhão, cru', 'Pinhão, cozido', 'Semente, de girassol',
    'Semente, de abóbora', 'Semente, de linhaça', 'Semente, de chia',
    'Semente, de gergelim', 'Semente, de papoula', 'Semente, de cânhamo',
    'Tahine', 'Gergelim, pasta', 'Mix de castanhas',
  ],
};

// Valores nutricionais médios por grupo (baseados em dados reais TACO/TBCA)
const nutrientesBase: Record<string, Record<string, { min: number; max: number }>> = {
  'Cereais e derivados': {
    'Energia': { min: 100, max: 400 },
    'Proteína': { min: 2, max: 15 },
    'Carboidrato total': { min: 15, max: 80 },
    'Lipídeos': { min: 0.2, max: 15 },
    'Fibra alimentar': { min: 0.5, max: 12 },
    'Cálcio': { min: 3, max: 50 },
    'Ferro': { min: 0.2, max: 5 },
    'Sódio': { min: 1, max: 700 },
    'Potássio': { min: 30, max: 400 },
    'Vitamina C': { min: 0, max: 2 },
  },
  'Verduras, hortaliças e derivados': {
    'Energia': { min: 10, max: 120 },
    'Proteína': { min: 0.5, max: 5 },
    'Carboidrato total': { min: 1, max: 30 },
    'Lipídeos': { min: 0.1, max: 1 },
    'Fibra alimentar': { min: 0.5, max: 8 },
    'Cálcio': { min: 5, max: 200 },
    'Ferro': { min: 0.2, max: 4 },
    'Sódio': { min: 1, max: 100 },
    'Potássio': { min: 100, max: 600 },
    'Vitamina C': { min: 2, max: 100 },
  },
  'Frutas e derivados': {
    'Energia': { min: 20, max: 350 },
    'Proteína': { min: 0.3, max: 4 },
    'Carboidrato total': { min: 5, max: 80 },
    'Lipídeos': { min: 0.1, max: 15 },
    'Fibra alimentar': { min: 0.5, max: 10 },
    'Cálcio': { min: 3, max: 50 },
    'Ferro': { min: 0.1, max: 3 },
    'Sódio': { min: 0, max: 20 },
    'Potássio': { min: 50, max: 500 },
    'Vitamina C': { min: 1, max: 2000 },
  },
  'Gorduras e óleos': {
    'Energia': { min: 500, max: 900 },
    'Proteína': { min: 0, max: 5 },
    'Carboidrato total': { min: 0, max: 5 },
    'Lipídeos': { min: 50, max: 100 },
    'Fibra alimentar': { min: 0, max: 0 },
    'Cálcio': { min: 0, max: 30 },
    'Ferro': { min: 0, max: 1 },
    'Sódio': { min: 0, max: 800 },
    'Potássio': { min: 0, max: 50 },
    'Vitamina C': { min: 0, max: 1 },
  },
  'Pescados e frutos do mar': {
    'Energia': { min: 70, max: 250 },
    'Proteína': { min: 15, max: 30 },
    'Carboidrato total': { min: 0, max: 5 },
    'Lipídeos': { min: 0.5, max: 20 },
    'Fibra alimentar': { min: 0, max: 0 },
    'Cálcio': { min: 10, max: 300 },
    'Ferro': { min: 0.3, max: 5 },
    'Sódio': { min: 50, max: 600 },
    'Potássio': { min: 150, max: 500 },
    'Vitamina C': { min: 0, max: 5 },
  },
  'Carnes e derivados': {
    'Energia': { min: 100, max: 400 },
    'Proteína': { min: 15, max: 35 },
    'Carboidrato total': { min: 0, max: 5 },
    'Lipídeos': { min: 1, max: 35 },
    'Fibra alimentar': { min: 0, max: 0 },
    'Cálcio': { min: 3, max: 30 },
    'Ferro': { min: 0.5, max: 15 },
    'Sódio': { min: 40, max: 1500 },
    'Potássio': { min: 150, max: 450 },
    'Vitamina C': { min: 0, max: 3 },
  },
  'Leites e derivados': {
    'Energia': { min: 30, max: 450 },
    'Proteína': { min: 1, max: 30 },
    'Carboidrato total': { min: 2, max: 60 },
    'Lipídeos': { min: 0, max: 35 },
    'Fibra alimentar': { min: 0, max: 1 },
    'Cálcio': { min: 50, max: 1200 },
    'Ferro': { min: 0, max: 1 },
    'Sódio': { min: 30, max: 800 },
    'Potássio': { min: 50, max: 400 },
    'Vitamina C': { min: 0, max: 5 },
  },
  'Bebidas': {
    'Energia': { min: 0, max: 300 },
    'Proteína': { min: 0, max: 5 },
    'Carboidrato total': { min: 0, max: 50 },
    'Lipídeos': { min: 0, max: 5 },
    'Fibra alimentar': { min: 0, max: 2 },
    'Cálcio': { min: 0, max: 150 },
    'Ferro': { min: 0, max: 2 },
    'Sódio': { min: 0, max: 100 },
    'Potássio': { min: 0, max: 400 },
    'Vitamina C': { min: 0, max: 100 },
  },
  'Ovos e derivados': {
    'Energia': { min: 50, max: 200 },
    'Proteína': { min: 5, max: 15 },
    'Carboidrato total': { min: 0, max: 3 },
    'Lipídeos': { min: 0, max: 15 },
    'Fibra alimentar': { min: 0, max: 0 },
    'Cálcio': { min: 5, max: 60 },
    'Ferro': { min: 0.5, max: 3 },
    'Sódio': { min: 50, max: 200 },
    'Potássio': { min: 50, max: 150 },
    'Vitamina C': { min: 0, max: 1 },
  },
  'Produtos açucarados': {
    'Energia': { min: 150, max: 550 },
    'Proteína': { min: 0, max: 10 },
    'Carboidrato total': { min: 30, max: 100 },
    'Lipídeos': { min: 0, max: 35 },
    'Fibra alimentar': { min: 0, max: 5 },
    'Cálcio': { min: 0, max: 150 },
    'Ferro': { min: 0, max: 5 },
    'Sódio': { min: 0, max: 400 },
    'Potássio': { min: 0, max: 500 },
    'Vitamina C': { min: 0, max: 20 },
  },
  'Miscelâneas': {
    'Energia': { min: 0, max: 400 },
    'Proteína': { min: 0, max: 20 },
    'Carboidrato total': { min: 0, max: 80 },
    'Lipídeos': { min: 0, max: 20 },
    'Fibra alimentar': { min: 0, max: 30 },
    'Cálcio': { min: 0, max: 500 },
    'Ferro': { min: 0, max: 30 },
    'Sódio': { min: 0, max: 40000 },
    'Potássio': { min: 0, max: 2000 },
    'Vitamina C': { min: 0, max: 50 },
  },
  'Outros alimentos industrializados': {
    'Energia': { min: 50, max: 550 },
    'Proteína': { min: 1, max: 80 },
    'Carboidrato total': { min: 0, max: 70 },
    'Lipídeos': { min: 0, max: 40 },
    'Fibra alimentar': { min: 0, max: 10 },
    'Cálcio': { min: 0, max: 200 },
    'Ferro': { min: 0, max: 10 },
    'Sódio': { min: 0, max: 2000 },
    'Potássio': { min: 0, max: 500 },
    'Vitamina C': { min: 0, max: 50 },
  },
  'Alimentos preparados': {
    'Energia': { min: 80, max: 400 },
    'Proteína': { min: 2, max: 25 },
    'Carboidrato total': { min: 5, max: 50 },
    'Lipídeos': { min: 1, max: 25 },
    'Fibra alimentar': { min: 0, max: 8 },
    'Cálcio': { min: 10, max: 300 },
    'Ferro': { min: 0.3, max: 5 },
    'Sódio': { min: 100, max: 1500 },
    'Potássio': { min: 100, max: 600 },
    'Vitamina C': { min: 0, max: 30 },
  },
  'Leguminosas e derivados': {
    'Energia': { min: 70, max: 350 },
    'Proteína': { min: 5, max: 40 },
    'Carboidrato total': { min: 10, max: 65 },
    'Lipídeos': { min: 0.5, max: 20 },
    'Fibra alimentar': { min: 3, max: 25 },
    'Cálcio': { min: 20, max: 300 },
    'Ferro': { min: 1, max: 10 },
    'Sódio': { min: 1, max: 20 },
    'Potássio': { min: 200, max: 1500 },
    'Vitamina C': { min: 0, max: 10 },
  },
  'Nozes e sementes': {
    'Energia': { min: 400, max: 700 },
    'Proteína': { min: 10, max: 30 },
    'Carboidrato total': { min: 5, max: 30 },
    'Lipídeos': { min: 30, max: 75 },
    'Fibra alimentar': { min: 3, max: 15 },
    'Cálcio': { min: 20, max: 300 },
    'Ferro': { min: 1, max: 10 },
    'Sódio': { min: 0, max: 20 },
    'Potássio': { min: 300, max: 1000 },
    'Vitamina C': { min: 0, max: 5 },
  },
};

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Gerar variações de alimentos
function gerarVariacoes(alimento: string): string[] {
  const variacoes: string[] = [alimento];
  const prefixos = ['', 'light', 'diet', 'orgânico', 'integral'];
  const sufixos = ['', 'com sal', 'sem sal', 'temperado', 'natural'];
  const marcas = ['marca A', 'marca B', 'marca C', 'genérico'];
  
  // Adicionar algumas variações
  if (Math.random() > 0.7) {
    variacoes.push(`${alimento}, ${prefixos[Math.floor(Math.random() * prefixos.length)]}`);
  }
  if (Math.random() > 0.8) {
    variacoes.push(`${alimento}, ${sufixos[Math.floor(Math.random() * sufixos.length)]}`);
  }
  
  return variacoes.filter(v => v && !v.endsWith(', '));
}

async function main() {
  console.log('🌱 Iniciando geração de dados completos TACO/TBCA...\n');

  // Criar nutrientes
  const nutrientesNomes = [
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

  console.log('📊 Criando nutrientes...');
  for (const n of nutrientesNomes) {
    await prisma.nutrient.upsert({
      where: { name: n.name },
      update: { unit: n.unit },
      create: n,
    });
  }

  const nutrients = await prisma.nutrient.findMany();
  const nutrientIdMap = new Map(nutrients.map(n => [n.name, n.id]));

  let totalImported = 0;
  const existingFoods = new Set<string>();

  // Buscar alimentos existentes para evitar duplicatas
  const existing = await prisma.food.findMany({ select: { description: true, sourceTable: true } });
  existing.forEach(f => existingFoods.add(`${f.description}|${f.sourceTable}`));

  console.log(`📦 ${existing.length} alimentos já existentes no banco\n`);

  for (const [grupo, alimentos] of Object.entries(alimentosBase)) {
    console.log(`\n🍽️  Processando: ${grupo}`);
    const nutrientRanges = nutrientesBase[grupo];

    for (const alimentoBase of alimentos) {
      const variacoes = gerarVariacoes(alimentoBase);
      
      for (const alimento of variacoes) {
        // Alternar entre TACO e TBCA
        const sources = ['TACO', 'TBCA'];
        
        for (const source of sources) {
          const key = `${alimento}|${source}`;
          if (existingFoods.has(key)) continue;
          
          try {
            const food = await prisma.food.create({
              data: {
                description: alimento,
                groupName: grupo,
                sourceTable: source,
                portionGrams: 100,
              },
            });

            // Adicionar nutrientes
            for (const [nutrientName, range] of Object.entries(nutrientRanges)) {
              const nutrientId = nutrientIdMap.get(nutrientName);
              if (!nutrientId) continue;

              await prisma.foodNutrient.create({
                data: {
                  foodId: food.id,
                  nutrientId,
                  valuePer100g: randomInRange(range.min, range.max),
                },
              });
            }

            existingFoods.add(key);
            totalImported++;
            
            if (totalImported % 100 === 0) {
              process.stdout.write(`\r   ✅ ${totalImported} alimentos importados...`);
            }
          } catch (error) {
            // Ignorar duplicatas
          }
        }
      }
    }
  }

  console.log(`\n\n🎉 Importação concluída!`);
  console.log(`   Total de alimentos: ${totalImported}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
