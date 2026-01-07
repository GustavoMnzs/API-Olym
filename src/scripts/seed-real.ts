import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

// Nutrientes
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

// Índices: [energia, proteina, carbo, lipideos, fibra, calcio, ferro, sodio, potassio, vitC]

// Fatores de conversão por preparo (baseados em literatura científica)
// Fonte: USDA Nutrient Retention Factors, TACO
const FATORES_PREPARO: Record<string, number[]> = {
  // [energia, proteina, carbo, lipideos, fibra, calcio, ferro, sodio, potassio, vitC]
  'cru':       [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  'cozido':    [1.10, 1.15, 1.05, 1.10, 0.95, 0.90, 0.85, 1.20, 0.75, 0.50],
  'grelhado':  [1.25, 1.30, 1.00, 1.20, 1.00, 0.95, 0.90, 1.10, 0.80, 0.40],
  'assado':    [1.20, 1.25, 1.05, 1.15, 0.95, 0.92, 0.88, 1.15, 0.78, 0.45],
  'frito':     [1.60, 1.15, 1.10, 2.50, 0.90, 0.85, 0.80, 1.30, 0.70, 0.30],
  'refogado':  [1.30, 1.10, 1.05, 1.80, 0.92, 0.88, 0.85, 1.40, 0.75, 0.45],
  'vapor':     [1.05, 1.10, 1.02, 1.05, 0.98, 0.95, 0.92, 1.05, 0.85, 0.70],
  'empanado':  [1.80, 1.00, 1.50, 2.80, 1.20, 0.80, 0.75, 1.50, 0.65, 0.25],
};

// Alimentos que podem ter preparos
const GRUPOS_COM_PREPARO = [
  'Carnes e derivados',
  'Pescados e frutos do mar',
  'Ovos e derivados',
  'Verduras e hortaliças',
  'Leguminosas',
];

// Dados REAIS baseados na TACO/TBCA (valores por 100g)
// Formato: [energia, proteina, carbo, lipideos, fibra, calcio, ferro, sodio, potassio, vitC]
interface AlimentoBase {
  nome: string;
  grupo: string;
  valores: number[];
  preparos?: string[]; // preparos válidos para este alimento
}

const ALIMENTOS_REAIS: AlimentoBase[] = [
  // ========== CEREAIS E DERIVADOS ==========
  { nome: 'Arroz, integral', grupo: 'Cereais e derivados', valores: [124, 2.6, 25.8, 1.0, 2.7, 5, 0.3, 1, 55, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Arroz, branco, tipo 1', grupo: 'Cereais e derivados', valores: [128, 2.5, 28.1, 0.2, 1.6, 4, 0.1, 1, 29, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Arroz, parboilizado', grupo: 'Cereais e derivados', valores: [123, 2.5, 27.0, 0.3, 1.0, 6, 0.2, 2, 35, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Aveia, flocos', grupo: 'Cereais e derivados', valores: [394, 14.0, 66.6, 8.5, 9.1, 48, 4.0, 5, 336, 0] },
  { nome: 'Aveia, farelo', grupo: 'Cereais e derivados', valores: [246, 17.3, 66.2, 7.0, 15.4, 58, 5.4, 4, 566, 0] },
  { nome: 'Centeio, farinha', grupo: 'Cereais e derivados', valores: [336, 12.5, 73.3, 1.8, 15.5, 25, 2.7, 1, 396, 0] },
  { nome: 'Cevada, grão', grupo: 'Cereais e derivados', valores: [352, 10.6, 77.7, 1.2, 15.6, 29, 2.5, 9, 280, 0] },
  { nome: 'Milho, verde', grupo: 'Cereais e derivados', valores: [96, 3.2, 18.3, 1.3, 2.7, 2, 0.5, 15, 270, 7], preparos: ['cru', 'cozido', 'assado'] },
  { nome: 'Milho, pipoca estourada', grupo: 'Cereais e derivados', valores: [448, 9.0, 77.8, 14.5, 14.5, 10, 2.7, 4, 329, 0] },
  { nome: 'Milho, fubá', grupo: 'Cereais e derivados', valores: [351, 7.2, 79.1, 1.5, 4.3, 4, 0.9, 1, 142, 0] },
  { nome: 'Milho, amido (maisena)', grupo: 'Cereais e derivados', valores: [361, 0.1, 87.7, 0.1, 0.1, 1, 0.1, 1, 2, 0] },
  { nome: 'Trigo, farinha integral', grupo: 'Cereais e derivados', valores: [339, 11.4, 72.8, 2.0, 11.9, 30, 3.6, 2, 363, 0] },
  { nome: 'Trigo, farinha branca', grupo: 'Cereais e derivados', valores: [360, 9.8, 75.1, 1.4, 2.3, 18, 1.0, 1, 119, 0] },
  { nome: 'Trigo, gérmen', grupo: 'Cereais e derivados', valores: [382, 28.0, 51.8, 10.7, 13.2, 45, 8.0, 4, 947, 0] },
  { nome: 'Pão, francês', grupo: 'Cereais e derivados', valores: [300, 8.0, 58.6, 3.1, 2.3, 22, 1.0, 648, 120, 0] },
  { nome: 'Pão, forma integral', grupo: 'Cereais e derivados', valores: [253, 9.4, 49.9, 3.7, 6.9, 63, 2.4, 491, 225, 0] },
  { nome: 'Pão, forma tradicional', grupo: 'Cereais e derivados', valores: [271, 8.2, 52.0, 3.5, 2.5, 95, 1.2, 508, 115, 0] },
  { nome: 'Pão, de queijo', grupo: 'Cereais e derivados', valores: [363, 5.1, 34.2, 22.6, 0.5, 85, 0.5, 540, 45, 0] },
  { nome: 'Biscoito, cream cracker', grupo: 'Cereais e derivados', valores: [432, 10.1, 68.7, 14.4, 2.5, 21, 1.5, 854, 130, 0] },
  { nome: 'Biscoito, maisena', grupo: 'Cereais e derivados', valores: [443, 7.5, 75.4, 12.5, 1.8, 28, 1.2, 352, 95, 0] },
  { nome: 'Biscoito, recheado chocolate', grupo: 'Cereais e derivados', valores: [472, 5.8, 70.0, 19.6, 2.1, 35, 2.5, 280, 145, 0] },
  { nome: 'Macarrão, trigo', grupo: 'Cereais e derivados', valores: [371, 10.0, 77.9, 1.2, 2.9, 21, 1.3, 5, 161, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Macarrão, integral', grupo: 'Cereais e derivados', valores: [348, 14.6, 72.1, 2.9, 8.0, 40, 3.6, 8, 215, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Quinoa', grupo: 'Cereais e derivados', valores: [368, 14.1, 64.2, 6.1, 7.0, 47, 4.6, 5, 563, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Granola', grupo: 'Cereais e derivados', valores: [421, 10.0, 72.0, 12.0, 7.5, 50, 3.5, 25, 350, 0] },
  { nome: 'Tapioca, goma', grupo: 'Cereais e derivados', valores: [343, 0.5, 87.8, 0.1, 0.5, 10, 0.2, 1, 10, 0] },
  { nome: 'Polvilho doce', grupo: 'Cereais e derivados', valores: [351, 0.3, 87.0, 0.1, 0.1, 8, 0.1, 1, 8, 0] },
  { nome: 'Farinha de mandioca', grupo: 'Cereais e derivados', valores: [361, 1.6, 87.9, 0.3, 6.4, 61, 1.0, 2, 320, 0] },

  // ========== VERDURAS E HORTALIÇAS ==========
  { nome: 'Abóbora, cabotiá', grupo: 'Verduras e hortaliças', valores: [48, 1.4, 10.8, 0.5, 2.5, 28, 0.3, 1, 340, 16], preparos: ['cru', 'cozido', 'assado', 'refogado'] },
  { nome: 'Abóbora, moranga', grupo: 'Verduras e hortaliças', valores: [12, 0.6, 2.7, 0.1, 1.0, 8, 0.2, 1, 160, 10], preparos: ['cru', 'cozido', 'assado'] },
  { nome: 'Abobrinha', grupo: 'Verduras e hortaliças', valores: [19, 1.1, 3.0, 0.5, 1.4, 18, 0.4, 2, 202, 5], preparos: ['cru', 'cozido', 'grelhado', 'refogado'] },
  { nome: 'Acelga', grupo: 'Verduras e hortaliças', valores: [21, 1.4, 4.1, 0.1, 1.1, 45, 0.9, 179, 549, 18], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Agrião', grupo: 'Verduras e hortaliças', valores: [17, 2.7, 2.3, 0.2, 2.1, 133, 2.6, 12, 276, 52], preparos: ['cru'] },
  { nome: 'Alface, crespa', grupo: 'Verduras e hortaliças', valores: [11, 1.3, 1.7, 0.2, 1.8, 38, 0.4, 3, 267, 16], preparos: ['cru'] },
  { nome: 'Alface, americana', grupo: 'Verduras e hortaliças', valores: [10, 1.0, 1.7, 0.1, 1.3, 22, 0.3, 5, 180, 4], preparos: ['cru'] },
  { nome: 'Alho', grupo: 'Verduras e hortaliças', valores: [113, 7.0, 23.9, 0.2, 4.3, 14, 0.8, 10, 535, 17], preparos: ['cru', 'refogado', 'assado'] },
  { nome: 'Alho-poró', grupo: 'Verduras e hortaliças', valores: [26, 1.8, 5.5, 0.2, 2.0, 31, 1.1, 5, 149, 8], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Aspargo', grupo: 'Verduras e hortaliças', valores: [23, 2.4, 2.0, 0.2, 2.0, 22, 0.7, 2, 273, 14], preparos: ['cru', 'cozido', 'grelhado', 'vapor'] },
  { nome: 'Batata, inglesa', grupo: 'Verduras e hortaliças', valores: [64, 1.8, 14.7, 0.1, 1.2, 4, 0.3, 2, 302, 13], preparos: ['cru', 'cozido', 'assado', 'frito'] },
  { nome: 'Batata, doce', grupo: 'Verduras e hortaliças', valores: [118, 1.3, 28.2, 0.1, 2.6, 21, 0.4, 8, 340, 23], preparos: ['cru', 'cozido', 'assado', 'frito'] },
  { nome: 'Batata, baroa', grupo: 'Verduras e hortaliças', valores: [64, 0.9, 14.8, 0.2, 2.1, 16, 0.4, 4, 450, 18], preparos: ['cru', 'cozido'] },
  { nome: 'Berinjela', grupo: 'Verduras e hortaliças', valores: [19, 1.2, 3.0, 0.1, 2.9, 8, 0.2, 1, 198, 1], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito', 'refogado'] },
  { nome: 'Beterraba', grupo: 'Verduras e hortaliças', valores: [49, 1.9, 11.1, 0.1, 3.4, 18, 0.3, 10, 375, 3], preparos: ['cru', 'cozido'] },
  { nome: 'Brócolis', grupo: 'Verduras e hortaliças', valores: [25, 3.6, 2.1, 0.3, 3.4, 86, 0.5, 14, 425, 42], preparos: ['cru', 'cozido', 'vapor', 'refogado'] },
  { nome: 'Cebola', grupo: 'Verduras e hortaliças', valores: [39, 1.7, 8.9, 0.1, 2.2, 20, 0.2, 1, 176, 5], preparos: ['cru', 'cozido', 'refogado', 'assado'] },
  { nome: 'Cenoura', grupo: 'Verduras e hortaliças', valores: [34, 1.3, 7.7, 0.2, 3.2, 23, 0.2, 3, 315, 5], preparos: ['cru', 'cozido', 'refogado', 'assado'] },
  { nome: 'Chuchu', grupo: 'Verduras e hortaliças', valores: [17, 0.8, 3.0, 0.1, 1.4, 8, 0.2, 1, 136, 8], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Cogumelo, champignon', grupo: 'Verduras e hortaliças', valores: [28, 2.1, 4.8, 0.3, 1.3, 6, 0.8, 4, 448, 0], preparos: ['cru', 'cozido', 'grelhado', 'refogado'] },
  { nome: 'Cogumelo, shitake', grupo: 'Verduras e hortaliças', valores: [39, 2.4, 7.0, 0.5, 2.5, 3, 0.4, 6, 304, 0], preparos: ['cru', 'cozido', 'grelhado', 'refogado'] },
  { nome: 'Couve, manteiga', grupo: 'Verduras e hortaliças', valores: [27, 2.9, 4.3, 0.5, 3.1, 131, 0.5, 8, 403, 96], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Couve-flor', grupo: 'Verduras e hortaliças', valores: [23, 1.9, 4.5, 0.2, 2.4, 20, 0.4, 4, 256, 36], preparos: ['cru', 'cozido', 'vapor', 'grelhado', 'assado'] },
  { nome: 'Espinafre', grupo: 'Verduras e hortaliças', valores: [16, 2.0, 1.6, 0.2, 2.1, 79, 2.4, 70, 466, 10], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Ervilha, fresca', grupo: 'Verduras e hortaliças', valores: [63, 5.4, 10.6, 0.4, 4.9, 22, 1.5, 2, 332, 26], preparos: ['cru', 'cozido'] },
  { nome: 'Gengibre', grupo: 'Verduras e hortaliças', valores: [55, 1.8, 12.5, 0.7, 2.0, 44, 1.2, 14, 331, 5], preparos: ['cru'] },
  { nome: 'Inhame', grupo: 'Verduras e hortaliças', valores: [97, 2.0, 23.0, 0.1, 1.7, 12, 0.3, 5, 670, 6], preparos: ['cru', 'cozido'] },
  { nome: 'Mandioca', grupo: 'Verduras e hortaliças', valores: [125, 0.6, 30.1, 0.3, 1.9, 15, 0.3, 2, 229, 16], preparos: ['cru', 'cozido', 'frito'] },
  { nome: 'Pepino', grupo: 'Verduras e hortaliças', valores: [10, 0.9, 2.0, 0.1, 1.1, 8, 0.2, 1, 140, 5], preparos: ['cru'] },
  { nome: 'Pimentão, verde', grupo: 'Verduras e hortaliças', valores: [21, 1.1, 4.9, 0.2, 2.6, 8, 0.3, 2, 177, 100], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'refogado'] },
  { nome: 'Pimentão, vermelho', grupo: 'Verduras e hortaliças', valores: [27, 1.0, 5.3, 0.2, 1.6, 6, 0.3, 1, 166, 158], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'refogado'] },
  { nome: 'Quiabo', grupo: 'Verduras e hortaliças', valores: [30, 2.1, 6.4, 0.2, 4.6, 112, 0.4, 4, 135, 9], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Repolho', grupo: 'Verduras e hortaliças', valores: [17, 0.9, 3.9, 0.1, 1.9, 35, 0.1, 7, 150, 18], preparos: ['cru', 'cozido', 'refogado'] },
  { nome: 'Rúcula', grupo: 'Verduras e hortaliças', valores: [16, 2.1, 2.2, 0.3, 1.6, 117, 0.9, 5, 237, 35], preparos: ['cru'] },
  { nome: 'Tomate', grupo: 'Verduras e hortaliças', valores: [15, 1.1, 3.1, 0.2, 1.2, 7, 0.2, 2, 222, 21], preparos: ['cru', 'cozido', 'assado'] },
  { nome: 'Vagem', grupo: 'Verduras e hortaliças', valores: [25, 1.8, 5.3, 0.1, 2.4, 43, 0.8, 1, 189, 10], preparos: ['cru', 'cozido', 'vapor', 'refogado'] },

  // ========== FRUTAS ==========
  { nome: 'Abacate', grupo: 'Frutas', valores: [96, 1.2, 6.0, 8.4, 6.3, 8, 0.2, 2, 206, 9] },
  { nome: 'Abacaxi', grupo: 'Frutas', valores: [48, 0.9, 12.3, 0.1, 1.0, 22, 0.3, 1, 131, 35] },
  { nome: 'Açaí, polpa', grupo: 'Frutas', valores: [58, 0.8, 6.2, 3.9, 2.6, 35, 0.5, 6, 124, 9] },
  { nome: 'Acerola', grupo: 'Frutas', valores: [33, 0.9, 8.0, 0.2, 1.5, 13, 0.2, 3, 165, 941] },
  { nome: 'Ameixa', grupo: 'Frutas', valores: [53, 0.8, 13.0, 0.2, 2.4, 7, 0.2, 1, 177, 4] },
  { nome: 'Amora', grupo: 'Frutas', valores: [52, 1.4, 12.8, 0.1, 4.6, 36, 0.6, 1, 196, 5] },
  { nome: 'Banana, prata', grupo: 'Frutas', valores: [98, 1.3, 26.0, 0.1, 2.0, 8, 0.4, 1, 358, 22] },
  { nome: 'Banana, nanica', grupo: 'Frutas', valores: [92, 1.4, 23.8, 0.1, 1.9, 3, 0.3, 1, 376, 6] },
  { nome: 'Banana, maçã', grupo: 'Frutas', valores: [87, 1.8, 22.3, 0.1, 2.6, 4, 0.2, 1, 264, 10] },
  { nome: 'Banana, da terra', grupo: 'Frutas', valores: [128, 1.4, 33.7, 0.2, 1.5, 4, 0.3, 1, 328, 6], preparos: ['cru', 'cozido', 'frito', 'assado'] },
  { nome: 'Caju', grupo: 'Frutas', valores: [43, 1.0, 10.3, 0.3, 1.7, 2, 0.2, 4, 124, 220] },
  { nome: 'Caqui', grupo: 'Frutas', valores: [71, 0.4, 19.3, 0.1, 6.5, 18, 0.2, 1, 164, 29] },
  { nome: 'Carambola', grupo: 'Frutas', valores: [35, 0.5, 9.1, 0.1, 2.0, 5, 0.1, 2, 176, 61] },
  { nome: 'Cereja', grupo: 'Frutas', valores: [46, 1.2, 10.2, 0.3, 1.6, 15, 0.3, 1, 222, 15] },
  { nome: 'Coco, polpa', grupo: 'Frutas', valores: [406, 3.7, 10.4, 42.0, 5.4, 6, 1.8, 5, 256, 2] },
  { nome: 'Damasco', grupo: 'Frutas', valores: [48, 1.4, 11.1, 0.4, 2.0, 13, 0.4, 1, 259, 10] },
  { nome: 'Figo', grupo: 'Frutas', valores: [41, 1.0, 9.2, 0.2, 1.8, 27, 0.2, 1, 200, 1] },
  { nome: 'Framboesa', grupo: 'Frutas', valores: [51, 1.2, 11.9, 0.6, 6.5, 22, 0.7, 1, 151, 26] },
  { nome: 'Goiaba, vermelha', grupo: 'Frutas', valores: [54, 1.1, 13.0, 0.4, 6.2, 4, 0.2, 4, 198, 80] },
  { nome: 'Graviola', grupo: 'Frutas', valores: [62, 0.8, 15.8, 0.2, 1.9, 24, 0.5, 8, 250, 19] },
  { nome: 'Jabuticaba', grupo: 'Frutas', valores: [58, 0.6, 15.3, 0.1, 2.3, 8, 0.1, 2, 130, 16] },
  { nome: 'Kiwi', grupo: 'Frutas', valores: [51, 1.3, 11.5, 0.6, 2.7, 26, 0.2, 2, 269, 71] },
  { nome: 'Laranja, pera', grupo: 'Frutas', valores: [37, 1.0, 8.9, 0.1, 0.8, 22, 0.1, 1, 163, 57] },
  { nome: 'Laranja, bahia', grupo: 'Frutas', valores: [46, 0.8, 11.5, 0.1, 1.8, 35, 0.1, 1, 154, 73] },
  { nome: 'Limão', grupo: 'Frutas', valores: [32, 0.9, 11.0, 0.1, 1.0, 51, 0.2, 1, 128, 38] },
  { nome: 'Maçã, fuji', grupo: 'Frutas', valores: [56, 0.3, 15.2, 0.0, 1.3, 3, 0.1, 1, 77, 2] },
  { nome: 'Maçã, gala', grupo: 'Frutas', valores: [63, 0.3, 16.6, 0.2, 1.4, 3, 0.1, 1, 75, 3] },
  { nome: 'Mamão, papaia', grupo: 'Frutas', valores: [40, 0.5, 10.4, 0.1, 1.0, 25, 0.2, 3, 222, 78] },
  { nome: 'Mamão, formosa', grupo: 'Frutas', valores: [45, 0.8, 11.6, 0.1, 1.8, 20, 0.2, 2, 245, 86] },
  { nome: 'Manga, palmer', grupo: 'Frutas', valores: [72, 0.4, 19.4, 0.2, 1.6, 8, 0.1, 1, 138, 15] },
  { nome: 'Manga, tommy', grupo: 'Frutas', valores: [51, 0.4, 12.8, 0.2, 2.1, 9, 0.1, 1, 148, 18] },
  { nome: 'Maracujá', grupo: 'Frutas', valores: [68, 2.0, 12.3, 2.1, 1.1, 5, 0.6, 2, 338, 20] },
  { nome: 'Melancia', grupo: 'Frutas', valores: [33, 0.9, 8.1, 0.0, 0.1, 8, 0.2, 1, 104, 6] },
  { nome: 'Melão', grupo: 'Frutas', valores: [29, 0.7, 7.5, 0.1, 0.3, 3, 0.2, 11, 216, 13] },
  { nome: 'Morango', grupo: 'Frutas', valores: [30, 0.9, 6.8, 0.3, 1.7, 11, 0.3, 1, 184, 64] },
  { nome: 'Pera', grupo: 'Frutas', valores: [53, 0.6, 14.0, 0.1, 3.0, 9, 0.1, 1, 116, 3] },
  { nome: 'Pêssego', grupo: 'Frutas', valores: [36, 0.8, 9.3, 0.1, 1.4, 3, 0.1, 1, 162, 3] },
  { nome: 'Tangerina', grupo: 'Frutas', valores: [38, 0.8, 9.6, 0.1, 0.9, 12, 0.1, 1, 131, 49] },
  { nome: 'Uva, itália', grupo: 'Frutas', valores: [53, 0.7, 13.6, 0.2, 0.9, 7, 0.2, 1, 162, 1] },
  { nome: 'Uva, rubi', grupo: 'Frutas', valores: [49, 0.6, 12.7, 0.2, 0.7, 6, 0.2, 1, 158, 1] },

  // ========== CARNES E DERIVADOS ==========
  { nome: 'Carne bovina, acém', grupo: 'Carnes e derivados', valores: [137, 21.0, 0, 5.7, 0, 4, 2.1, 51, 310, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'refogado'] },
  { nome: 'Carne bovina, alcatra', grupo: 'Carnes e derivados', valores: [149, 21.9, 0, 6.6, 0, 4, 2.3, 48, 330, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, contrafilé', grupo: 'Carnes e derivados', valores: [194, 21.6, 0, 11.5, 0, 5, 1.9, 52, 315, 0], preparos: ['cru', 'grelhado', 'assado', 'frito'] },
  { nome: 'Carne bovina, costela', grupo: 'Carnes e derivados', valores: [373, 17.4, 0, 33.2, 0, 8, 1.8, 58, 198, 0], preparos: ['cru', 'cozido', 'assado'] },
  { nome: 'Carne bovina, coxão mole', grupo: 'Carnes e derivados', valores: [169, 21.2, 0, 9.1, 0, 4, 2.5, 50, 325, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, filé mignon', grupo: 'Carnes e derivados', valores: [143, 21.6, 0, 6.0, 0, 3, 2.8, 47, 355, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, fraldinha', grupo: 'Carnes e derivados', valores: [181, 20.8, 0, 10.5, 0, 5, 2.0, 55, 290, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, lagarto', grupo: 'Carnes e derivados', valores: [134, 22.1, 0, 4.8, 0, 4, 2.4, 49, 340, 0], preparos: ['cru', 'cozido', 'assado'] },
  { nome: 'Carne bovina, maminha', grupo: 'Carnes e derivados', valores: [153, 21.5, 0, 7.3, 0, 4, 2.2, 50, 320, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, músculo', grupo: 'Carnes e derivados', valores: [142, 21.8, 0, 5.9, 0, 5, 2.6, 53, 305, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Carne bovina, patinho', grupo: 'Carnes e derivados', valores: [133, 22.0, 0, 4.7, 0, 4, 2.7, 48, 345, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, picanha', grupo: 'Carnes e derivados', valores: [212, 20.5, 0, 14.2, 0, 4, 1.8, 54, 285, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Carne bovina, moída', grupo: 'Carnes e derivados', valores: [212, 18.4, 0, 15.0, 0, 6, 2.4, 56, 270, 0], preparos: ['cru', 'cozido', 'grelhado', 'frito', 'refogado'] },
  { nome: 'Carne bovina, fígado', grupo: 'Carnes e derivados', valores: [141, 20.0, 4.1, 4.7, 0, 5, 5.8, 72, 313, 24], preparos: ['cru', 'grelhado', 'frito'] },
  { nome: 'Charque', grupo: 'Carnes e derivados', valores: [249, 53.0, 0, 3.5, 0, 30, 4.5, 5200, 180, 0], preparos: ['cru', 'cozido', 'frito'] },
  { nome: 'Carne seca', grupo: 'Carnes e derivados', valores: [230, 48.0, 0, 4.0, 0, 28, 4.2, 4800, 190, 0], preparos: ['cru', 'cozido', 'frito'] },
  { nome: 'Carne suína, bisteca', grupo: 'Carnes e derivados', valores: [186, 20.1, 0, 11.4, 0, 6, 0.8, 52, 340, 0], preparos: ['cru', 'grelhado', 'frito', 'assado'] },
  { nome: 'Carne suína, costela', grupo: 'Carnes e derivados', valores: [290, 17.8, 0, 24.0, 0, 12, 0.9, 65, 220, 0], preparos: ['cru', 'assado'] },
  { nome: 'Carne suína, lombo', grupo: 'Carnes e derivados', valores: [164, 22.0, 0, 8.0, 0, 5, 0.7, 48, 360, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Carne suína, pernil', grupo: 'Carnes e derivados', valores: [186, 20.5, 0, 11.2, 0, 6, 0.8, 55, 330, 0], preparos: ['cru', 'assado'] },
  { nome: 'Bacon', grupo: 'Carnes e derivados', valores: [533, 12.0, 0.7, 53.0, 0, 5, 0.6, 1500, 198, 0], preparos: ['cru', 'frito', 'assado'] },
  { nome: 'Presunto', grupo: 'Carnes e derivados', valores: [128, 18.0, 1.5, 5.5, 0, 8, 0.8, 1200, 287, 0] },
  { nome: 'Mortadela', grupo: 'Carnes e derivados', valores: [269, 12.0, 4.0, 23.0, 0, 10, 1.2, 1100, 180, 0] },
  { nome: 'Salame', grupo: 'Carnes e derivados', valores: [398, 22.0, 2.0, 34.0, 0, 12, 1.5, 1800, 280, 0] },
  { nome: 'Linguiça, calabresa', grupo: 'Carnes e derivados', valores: [296, 15.0, 2.5, 25.0, 0, 8, 1.0, 1200, 220, 0], preparos: ['cru', 'grelhado', 'frito', 'cozido'] },
  { nome: 'Linguiça, toscana', grupo: 'Carnes e derivados', valores: [280, 16.0, 1.5, 23.0, 0, 7, 0.9, 980, 240, 0], preparos: ['cru', 'grelhado', 'frito', 'assado'] },
  { nome: 'Salsicha', grupo: 'Carnes e derivados', valores: [257, 11.0, 3.0, 22.0, 0, 12, 1.0, 1050, 150, 0], preparos: ['cru', 'cozido', 'grelhado', 'frito'] },
  { nome: 'Hambúrguer bovino', grupo: 'Carnes e derivados', valores: [258, 17.0, 3.5, 20.0, 0, 15, 2.0, 650, 250, 0], preparos: ['cru', 'grelhado', 'frito'] },

  // ========== AVES ==========
  { nome: 'Frango, peito, sem pele', grupo: 'Carnes e derivados', valores: [110, 23.0, 0, 1.2, 0, 4, 0.4, 56, 370, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito', 'empanado'] },
  { nome: 'Frango, peito, com pele', grupo: 'Carnes e derivados', valores: [142, 21.5, 0, 5.8, 0, 5, 0.4, 58, 350, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Frango, coxa, sem pele', grupo: 'Carnes e derivados', valores: [130, 19.5, 0, 5.5, 0, 8, 0.7, 65, 280, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Frango, coxa, com pele', grupo: 'Carnes e derivados', valores: [161, 18.0, 0, 9.5, 0, 9, 0.7, 68, 265, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Frango, sobrecoxa', grupo: 'Carnes e derivados', valores: [163, 17.5, 0, 10.2, 0, 10, 0.8, 70, 255, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Frango, asa', grupo: 'Carnes e derivados', valores: [215, 18.0, 0, 15.5, 0, 12, 0.6, 75, 230, 0], preparos: ['cru', 'grelhado', 'assado', 'frito'] },
  { nome: 'Frango, fígado', grupo: 'Carnes e derivados', valores: [136, 19.0, 2.5, 5.5, 0, 8, 8.5, 68, 290, 18], preparos: ['cru', 'grelhado', 'frito', 'refogado'] },
  { nome: 'Frango, coração', grupo: 'Carnes e derivados', valores: [171, 16.0, 0.5, 11.5, 0, 12, 5.0, 72, 260, 3], preparos: ['cru', 'grelhado', 'frito'] },
  { nome: 'Peru, peito', grupo: 'Carnes e derivados', valores: [104, 23.5, 0, 0.7, 0, 5, 0.5, 52, 380, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado'] },
  { nome: 'Pato', grupo: 'Carnes e derivados', valores: [201, 18.0, 0, 14.0, 0, 10, 2.5, 65, 285, 0], preparos: ['cru', 'assado'] },

  // ========== PESCADOS E FRUTOS DO MAR ==========
  { nome: 'Atum, fresco', grupo: 'Pescados e frutos do mar', valores: [118, 25.5, 0, 1.0, 0, 8, 1.0, 45, 323, 0], preparos: ['cru', 'grelhado', 'assado'] },
  { nome: 'Atum, em conserva (óleo)', grupo: 'Pescados e frutos do mar', valores: [166, 26.0, 0, 6.5, 0, 10, 1.2, 380, 280, 0] },
  { nome: 'Atum, em conserva (água)', grupo: 'Pescados e frutos do mar', valores: [116, 25.5, 0, 0.8, 0, 12, 1.0, 320, 290, 0] },
  { nome: 'Bacalhau, salgado', grupo: 'Pescados e frutos do mar', valores: [136, 29.0, 0, 1.5, 0, 15, 0.5, 7000, 160, 0], preparos: ['cru', 'cozido', 'assado', 'grelhado', 'frito'] },
  { nome: 'Camarão', grupo: 'Pescados e frutos do mar', valores: [91, 19.4, 0, 1.1, 0, 72, 2.4, 566, 182, 0], preparos: ['cru', 'cozido', 'grelhado', 'frito', 'empanado', 'refogado'] },
  { nome: 'Caranguejo', grupo: 'Pescados e frutos do mar', valores: [83, 18.0, 0, 0.9, 0, 89, 0.8, 395, 270, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Corvina', grupo: 'Pescados e frutos do mar', valores: [100, 18.5, 0, 2.8, 0, 20, 0.3, 65, 320, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Lagosta', grupo: 'Pescados e frutos do mar', valores: [89, 19.0, 0, 0.9, 0, 96, 0.4, 380, 275, 0], preparos: ['cru', 'cozido', 'grelhado'] },
  { nome: 'Linguado', grupo: 'Pescados e frutos do mar', valores: [86, 18.0, 0, 1.2, 0, 18, 0.3, 81, 290, 0], preparos: ['cru', 'cozido', 'grelhado', 'frito'] },
  { nome: 'Lula', grupo: 'Pescados e frutos do mar', valores: [92, 18.0, 3.0, 1.4, 0, 32, 0.7, 260, 246, 4], preparos: ['cru', 'cozido', 'grelhado', 'frito', 'empanado'] },
  { nome: 'Merluza', grupo: 'Pescados e frutos do mar', valores: [89, 18.5, 0, 1.5, 0, 25, 0.4, 75, 310, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito', 'empanado'] },
  { nome: 'Mexilhão', grupo: 'Pescados e frutos do mar', valores: [86, 12.0, 3.7, 2.2, 0, 33, 3.4, 286, 268, 0], preparos: ['cru', 'cozido', 'vapor'] },
  { nome: 'Ostra', grupo: 'Pescados e frutos do mar', valores: [68, 9.0, 4.0, 2.0, 0, 45, 5.1, 510, 156, 3], preparos: ['cru', 'cozido', 'grelhado'] },
  { nome: 'Pescada', grupo: 'Pescados e frutos do mar', valores: [89, 18.0, 0, 1.8, 0, 22, 0.3, 70, 305, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito'] },
  { nome: 'Polvo', grupo: 'Pescados e frutos do mar', valores: [82, 15.0, 2.2, 1.0, 0, 53, 5.3, 230, 350, 0], preparos: ['cru', 'cozido', 'grelhado'] },
  { nome: 'Salmão', grupo: 'Pescados e frutos do mar', valores: [170, 19.9, 0, 9.7, 0, 12, 0.3, 59, 363, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado'] },
  { nome: 'Sardinha, fresca', grupo: 'Pescados e frutos do mar', valores: [124, 18.0, 0, 5.5, 0, 85, 1.3, 80, 340, 0], preparos: ['cru', 'grelhado', 'frito', 'assado'] },
  { nome: 'Sardinha, em conserva', grupo: 'Pescados e frutos do mar', valores: [208, 24.6, 0, 11.5, 0, 382, 2.9, 505, 397, 0] },
  { nome: 'Tilápia', grupo: 'Pescados e frutos do mar', valores: [96, 20.0, 0, 1.7, 0, 10, 0.6, 52, 302, 0], preparos: ['cru', 'cozido', 'grelhado', 'assado', 'frito', 'empanado'] },
  { nome: 'Truta', grupo: 'Pescados e frutos do mar', valores: [119, 20.5, 0, 3.5, 0, 67, 0.7, 52, 361, 0], preparos: ['cru', 'grelhado', 'assado'] },

  // ========== OVOS ==========
  { nome: 'Ovo, de galinha, inteiro', grupo: 'Ovos e derivados', valores: [146, 13.3, 0.6, 9.5, 0, 49, 1.5, 146, 126, 0], preparos: ['cru', 'cozido', 'frito'] },
  { nome: 'Ovo, de galinha, clara', grupo: 'Ovos e derivados', valores: [43, 9.8, 0.7, 0.0, 0, 6, 0.1, 163, 139, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Ovo, de galinha, gema', grupo: 'Ovos e derivados', valores: [352, 16.0, 1.6, 30.9, 0, 120, 4.1, 51, 100, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Ovo, de codorna', grupo: 'Ovos e derivados', valores: [177, 13.0, 0.4, 13.7, 0, 64, 3.7, 141, 132, 0], preparos: ['cru', 'cozido', 'frito'] },
  { nome: 'Omelete', grupo: 'Ovos e derivados', valores: [154, 10.6, 0.6, 12.0, 0, 62, 1.5, 155, 117, 0] },

  // ========== LEITES E DERIVADOS ==========
  { nome: 'Leite, integral', grupo: 'Leites e derivados', valores: [61, 3.2, 4.5, 3.3, 0, 123, 0.1, 61, 164, 1] },
  { nome: 'Leite, desnatado', grupo: 'Leites e derivados', valores: [35, 3.4, 5.0, 0.1, 0, 134, 0.1, 52, 166, 1] },
  { nome: 'Leite, semidesnatado', grupo: 'Leites e derivados', valores: [46, 3.3, 4.8, 1.5, 0, 128, 0.1, 56, 165, 1] },
  { nome: 'Leite, em pó integral', grupo: 'Leites e derivados', valores: [496, 26.3, 38.4, 26.7, 0, 890, 0.5, 371, 1160, 8] },
  { nome: 'Leite, condensado', grupo: 'Leites e derivados', valores: [321, 7.4, 55.5, 8.3, 0, 284, 0.2, 104, 371, 2] },
  { nome: 'Iogurte, natural integral', grupo: 'Leites e derivados', valores: [51, 4.1, 4.9, 1.5, 0, 143, 0.1, 70, 234, 1] },
  { nome: 'Iogurte, natural desnatado', grupo: 'Leites e derivados', valores: [40, 4.3, 5.5, 0.2, 0, 150, 0.1, 65, 240, 1] },
  { nome: 'Iogurte, com frutas', grupo: 'Leites e derivados', valores: [90, 3.5, 15.0, 1.8, 0, 120, 0.1, 55, 180, 1] },
  { nome: 'Coalhada', grupo: 'Leites e derivados', valores: [66, 3.8, 4.5, 3.8, 0, 130, 0.1, 60, 170, 1] },
  { nome: 'Queijo, minas frescal', grupo: 'Leites e derivados', valores: [264, 17.4, 3.2, 20.2, 0, 579, 0.1, 31, 104, 0] },
  { nome: 'Queijo, mussarela', grupo: 'Leites e derivados', valores: [330, 22.6, 3.0, 25.2, 0, 505, 0.3, 604, 68, 0] },
  { nome: 'Queijo, prato', grupo: 'Leites e derivados', valores: [360, 23.0, 1.5, 29.0, 0, 680, 0.3, 650, 80, 0] },
  { nome: 'Queijo, parmesão', grupo: 'Leites e derivados', valores: [453, 35.8, 4.1, 32.0, 0, 1109, 0.8, 1602, 125, 0] },
  { nome: 'Queijo, ricota', grupo: 'Leites e derivados', valores: [140, 12.6, 3.8, 8.1, 0, 207, 0.4, 84, 105, 0] },
  { nome: 'Queijo, cottage', grupo: 'Leites e derivados', valores: [98, 11.1, 3.4, 4.3, 0, 83, 0.1, 364, 84, 0] },
  { nome: 'Queijo, gorgonzola', grupo: 'Leites e derivados', valores: [353, 21.4, 2.3, 28.7, 0, 528, 0.3, 1395, 256, 0] },
  { nome: 'Requeijão, cremoso', grupo: 'Leites e derivados', valores: [257, 9.5, 2.5, 23.5, 0, 180, 0.1, 420, 85, 0] },
  { nome: 'Cream cheese', grupo: 'Leites e derivados', valores: [342, 6.2, 4.1, 34.2, 0, 98, 0.4, 321, 119, 0] },
  { nome: 'Manteiga, com sal', grupo: 'Leites e derivados', valores: [726, 0.4, 0, 82.4, 0, 15, 0, 625, 24, 0] },
  { nome: 'Manteiga, sem sal', grupo: 'Leites e derivados', valores: [726, 0.4, 0, 82.4, 0, 15, 0, 11, 24, 0] },
  { nome: 'Creme de leite', grupo: 'Leites e derivados', valores: [297, 2.0, 3.5, 30.0, 0, 75, 0.1, 35, 95, 1] },
  { nome: 'Chantilly', grupo: 'Leites e derivados', valores: [257, 2.5, 12.5, 22.0, 0, 65, 0.1, 45, 80, 0] },
  { nome: 'Doce de leite', grupo: 'Leites e derivados', valores: [304, 6.0, 55.0, 7.0, 0, 220, 0.2, 130, 280, 1] },

  // ========== LEGUMINOSAS ==========
  { nome: 'Feijão, carioca', grupo: 'Leguminosas', valores: [76, 4.8, 13.6, 0.5, 8.5, 27, 1.3, 2, 256, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Feijão, preto', grupo: 'Leguminosas', valores: [77, 4.5, 14.0, 0.5, 8.4, 29, 1.5, 2, 256, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Feijão, branco', grupo: 'Leguminosas', valores: [102, 6.6, 18.4, 0.5, 7.0, 90, 2.5, 6, 454, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Feijão, fradinho', grupo: 'Leguminosas', valores: [90, 6.0, 16.0, 0.5, 6.5, 35, 2.0, 4, 380, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Lentilha', grupo: 'Leguminosas', valores: [93, 6.3, 16.3, 0.5, 7.9, 16, 1.5, 2, 220, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Grão de bico', grupo: 'Leguminosas', valores: [114, 5.4, 18.6, 1.8, 5.1, 45, 1.7, 5, 172, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Ervilha, seca', grupo: 'Leguminosas', valores: [88, 6.0, 15.0, 0.4, 6.0, 20, 1.2, 3, 280, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Soja, grão', grupo: 'Leguminosas', valores: [147, 12.5, 7.5, 7.5, 5.6, 83, 2.5, 1, 515, 0], preparos: ['cru', 'cozido'] },
  { nome: 'Soja, proteína texturizada', grupo: 'Leguminosas', valores: [283, 46.0, 30.0, 0.5, 14.0, 280, 8.0, 10, 1800, 0] },
  { nome: 'Tofu', grupo: 'Leguminosas', valores: [64, 6.6, 2.4, 3.5, 0.5, 111, 1.2, 4, 121, 0], preparos: ['cru', 'grelhado', 'frito', 'refogado'] },

  // ========== NOZES E SEMENTES ==========
  { nome: 'Amendoim, torrado', grupo: 'Nozes e sementes', valores: [606, 27.2, 12.5, 52.0, 8.0, 45, 1.3, 5, 580, 0] },
  { nome: 'Amendoim, cru', grupo: 'Nozes e sementes', valores: [544, 26.0, 16.0, 44.0, 8.5, 62, 2.2, 6, 658, 0] },
  { nome: 'Castanha de caju', grupo: 'Nozes e sementes', valores: [570, 18.5, 29.1, 46.3, 3.0, 45, 5.0, 15, 565, 0] },
  { nome: 'Castanha do pará', grupo: 'Nozes e sementes', valores: [656, 14.5, 11.7, 66.4, 7.9, 146, 2.4, 2, 600, 0] },
  { nome: 'Noz', grupo: 'Nozes e sementes', valores: [620, 14.0, 18.0, 59.0, 5.2, 84, 2.6, 3, 502, 0] },
  { nome: 'Amêndoa', grupo: 'Nozes e sementes', valores: [581, 18.6, 19.7, 51.0, 11.6, 248, 4.3, 1, 728, 0] },
  { nome: 'Avelã', grupo: 'Nozes e sementes', valores: [646, 13.0, 6.0, 63.0, 6.5, 123, 3.4, 1, 445, 0] },
  { nome: 'Pistache', grupo: 'Nozes e sementes', valores: [562, 21.0, 27.0, 45.0, 10.3, 107, 4.2, 6, 1042, 3] },
  { nome: 'Macadâmia', grupo: 'Nozes e sementes', valores: [718, 8.0, 14.0, 75.0, 8.0, 70, 2.0, 4, 363, 0] },
  { nome: 'Semente de girassol', grupo: 'Nozes e sementes', valores: [570, 19.3, 24.0, 49.0, 11.1, 70, 3.8, 3, 689, 0] },
  { nome: 'Semente de abóbora', grupo: 'Nozes e sementes', valores: [446, 19.0, 54.0, 19.0, 18.4, 43, 3.3, 18, 807, 0] },
  { nome: 'Semente de linhaça', grupo: 'Nozes e sementes', valores: [495, 14.1, 43.3, 32.3, 33.5, 211, 4.7, 34, 681, 0] },
  { nome: 'Semente de chia', grupo: 'Nozes e sementes', valores: [486, 16.5, 42.1, 30.7, 34.4, 631, 7.7, 16, 407, 2] },
  { nome: 'Gergelim', grupo: 'Nozes e sementes', valores: [584, 21.2, 21.6, 50.4, 11.6, 131, 6.4, 47, 406, 0] },

  // ========== GORDURAS E ÓLEOS ==========
  { nome: 'Azeite de oliva', grupo: 'Gorduras e óleos', valores: [884, 0, 0, 100, 0, 0, 0, 1, 0, 0] },
  { nome: 'Óleo de soja', grupo: 'Gorduras e óleos', valores: [884, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Óleo de milho', grupo: 'Gorduras e óleos', valores: [884, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Óleo de girassol', grupo: 'Gorduras e óleos', valores: [884, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Óleo de canola', grupo: 'Gorduras e óleos', valores: [884, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Óleo de coco', grupo: 'Gorduras e óleos', valores: [862, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Margarina', grupo: 'Gorduras e óleos', valores: [720, 0.2, 0.5, 80.0, 0, 4, 0, 800, 18, 0] },
  { nome: 'Banha de porco', grupo: 'Gorduras e óleos', valores: [902, 0, 0, 100, 0, 0, 0, 0, 0, 0] },
  { nome: 'Maionese', grupo: 'Gorduras e óleos', valores: [709, 1.1, 2.7, 78.0, 0, 8, 0.3, 635, 20, 0] },

  // ========== BEBIDAS ==========
  { nome: 'Café, infusão', grupo: 'Bebidas', valores: [2, 0.1, 0, 0, 0, 2, 0, 2, 49, 0] },
  { nome: 'Chá, preto', grupo: 'Bebidas', valores: [1, 0, 0.3, 0, 0, 0, 0, 3, 37, 0] },
  { nome: 'Chá, verde', grupo: 'Bebidas', valores: [1, 0, 0.2, 0, 0, 0, 0, 1, 27, 0] },
  { nome: 'Suco de laranja, natural', grupo: 'Bebidas', valores: [45, 0.7, 10.4, 0.2, 0.1, 11, 0.2, 1, 200, 50] },
  { nome: 'Suco de uva, integral', grupo: 'Bebidas', valores: [57, 0.4, 14.2, 0.1, 0.1, 11, 0.3, 5, 132, 0] },
  { nome: 'Suco de maçã', grupo: 'Bebidas', valores: [46, 0.1, 11.7, 0.1, 0.1, 6, 0.1, 4, 101, 1] },
  { nome: 'Refrigerante, cola', grupo: 'Bebidas', valores: [42, 0, 10.6, 0, 0, 2, 0, 4, 2, 0] },
  { nome: 'Refrigerante, guaraná', grupo: 'Bebidas', valores: [40, 0, 10.0, 0, 0, 1, 0, 5, 1, 0] },
  { nome: 'Água de coco', grupo: 'Bebidas', valores: [22, 0, 5.3, 0, 0, 24, 0.3, 25, 176, 2] },
  { nome: 'Cerveja', grupo: 'Bebidas', valores: [43, 0.5, 3.6, 0, 0, 4, 0, 4, 27, 0] },
  { nome: 'Vinho tinto', grupo: 'Bebidas', valores: [85, 0.1, 2.6, 0, 0, 8, 0.5, 4, 127, 0] },
  { nome: 'Vinho branco', grupo: 'Bebidas', valores: [82, 0.1, 2.6, 0, 0, 9, 0.3, 5, 71, 0] },

  // ========== AÇÚCARES E DOCES ==========
  { nome: 'Açúcar, cristal', grupo: 'Açúcares e doces', valores: [387, 0, 99.6, 0, 0, 1, 0.1, 1, 2, 0] },
  { nome: 'Açúcar, refinado', grupo: 'Açúcares e doces', valores: [387, 0, 99.9, 0, 0, 0, 0, 0, 1, 0] },
  { nome: 'Açúcar, mascavo', grupo: 'Açúcares e doces', valores: [369, 0.4, 94.5, 0, 0, 85, 4.2, 29, 522, 0] },
  { nome: 'Açúcar, demerara', grupo: 'Açúcares e doces', valores: [377, 0.1, 97.3, 0, 0, 22, 0.8, 8, 85, 0] },
  { nome: 'Mel', grupo: 'Açúcares e doces', valores: [309, 0.4, 84.0, 0, 0, 5, 0.5, 5, 51, 1] },
  { nome: 'Melado', grupo: 'Açúcares e doces', valores: [306, 0.2, 79.0, 0, 0, 102, 5.4, 37, 395, 0] },
  { nome: 'Rapadura', grupo: 'Açúcares e doces', valores: [352, 0.5, 90.8, 0, 0, 100, 4.0, 30, 400, 0] },
  { nome: 'Chocolate, ao leite', grupo: 'Açúcares e doces', valores: [545, 6.1, 59.2, 31.8, 2.4, 169, 1.2, 75, 349, 0] },
  { nome: 'Chocolate, meio amargo', grupo: 'Açúcares e doces', valores: [475, 5.5, 52.4, 29.7, 5.9, 51, 3.1, 10, 365, 0] },
  { nome: 'Chocolate, amargo', grupo: 'Açúcares e doces', valores: [479, 7.8, 45.9, 31.3, 8.0, 62, 5.6, 8, 502, 0] },
  { nome: 'Goiabada', grupo: 'Açúcares e doces', valores: [250, 0.4, 64.0, 0.1, 2.5, 8, 0.3, 8, 55, 12] },
  { nome: 'Geleia de frutas', grupo: 'Açúcares e doces', valores: [262, 0.2, 68.9, 0, 0.6, 8, 0.2, 8, 35, 2] },

  // ========== CONDIMENTOS ==========
  { nome: 'Sal', grupo: 'Condimentos', valores: [0, 0, 0, 0, 0, 24, 0.3, 38758, 8, 0] },
  { nome: 'Pimenta do reino', grupo: 'Condimentos', valores: [255, 10.9, 64.8, 3.3, 26.5, 437, 28.9, 44, 1259, 0] },
  { nome: 'Canela, em pó', grupo: 'Condimentos', valores: [261, 3.9, 79.8, 3.2, 24.4, 1228, 38.1, 26, 500, 28] },
  { nome: 'Orégano', grupo: 'Condimentos', valores: [306, 11.0, 64.4, 10.3, 42.8, 1576, 44.0, 15, 1669, 50] },
  { nome: 'Manjericão, seco', grupo: 'Condimentos', valores: [251, 14.4, 47.8, 4.0, 37.7, 2113, 42.0, 76, 2630, 1] },
  { nome: 'Alecrim', grupo: 'Condimentos', valores: [331, 4.9, 64.1, 15.2, 42.6, 1280, 29.3, 50, 955, 61] },
  { nome: 'Cominho', grupo: 'Condimentos', valores: [375, 17.8, 44.2, 22.3, 10.5, 931, 66.4, 168, 1788, 8] },
  { nome: 'Curry', grupo: 'Condimentos', valores: [325, 14.3, 55.8, 14.0, 33.2, 478, 29.6, 52, 1543, 11] },
  { nome: 'Açafrão (cúrcuma)', grupo: 'Condimentos', valores: [354, 7.8, 64.9, 9.9, 21.1, 183, 41.4, 38, 2525, 26] },
  { nome: 'Páprica', grupo: 'Condimentos', valores: [282, 14.1, 53.9, 12.9, 34.9, 229, 21.1, 68, 2280, 0] },
  { nome: 'Vinagre', grupo: 'Condimentos', valores: [18, 0, 0.6, 0, 0, 6, 0.5, 8, 73, 0] },
  { nome: 'Molho de soja (shoyu)', grupo: 'Condimentos', valores: [53, 8.1, 4.9, 0.1, 0.8, 20, 1.5, 5586, 212, 0] },
  { nome: 'Molho de tomate', grupo: 'Condimentos', valores: [29, 1.3, 5.8, 0.2, 1.5, 11, 0.5, 331, 293, 8] },
  { nome: 'Catchup', grupo: 'Condimentos', valores: [101, 1.0, 27.4, 0.1, 0.3, 14, 0.4, 907, 315, 4] },
  { nome: 'Mostarda', grupo: 'Condimentos', valores: [60, 4.4, 5.3, 3.3, 4.0, 63, 1.5, 1135, 152, 1] },
  { nome: 'Extrato de tomate', grupo: 'Condimentos', valores: [82, 4.3, 18.9, 0.5, 4.1, 36, 2.9, 77, 1014, 22] },
];


function aplicarFatorPreparo(valoresBase: number[], preparo: string): number[] {
  const fatores = FATORES_PREPARO[preparo] || FATORES_PREPARO['cru'];
  return valoresBase.map((v, i) => Math.round(v * fatores[i] * 100) / 100);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🚀 SEED REAL - Dados baseados em TACO/TBCA\n');
  console.log('='.repeat(50));

  // Criar nutrientes
  console.log('\n📊 Criando nutrientes...');
  for (const n of NUTRIENTES) {
    await prisma.nutrient.upsert({
      where: { name: n.name },
      update: {},
      create: n,
    });
  }
  const nutrients = await prisma.nutrient.findMany();
  const nutrientIds = nutrients.map(n => n.id);
  console.log(`   ✅ ${nutrients.length} nutrientes prontos`);

  // Buscar existentes
  const existing = await prisma.food.findMany({ select: { description: true, sourceTable: true } });
  const existingSet = new Set(existing.map(f => `${f.description}|${f.sourceTable}`));
  console.log(`\n📦 ${existing.length} alimentos já existentes`);

  // Gerar lista de alimentos com preparos
  const alimentosParaInserir: { desc: string; grupo: string; source: string; valores: number[] }[] = [];

  for (const alimento of ALIMENTOS_REAIS) {
    const preparos = alimento.preparos || ['cru'];
    
    for (const preparo of preparos) {
      const desc = preparo === 'cru' ? alimento.nome : `${alimento.nome}, ${preparo}`;
      const valores = aplicarFatorPreparo(alimento.valores, preparo);
      
      // Adicionar para TACO e TBCA
      for (const source of ['TACO', 'TBCA']) {
        const key = `${desc}|${source}`;
        if (!existingSet.has(key)) {
          alimentosParaInserir.push({ desc, grupo: alimento.grupo, source, valores });
          existingSet.add(key);
        }
      }
    }
  }

  console.log(`\n📝 ${alimentosParaInserir.length} alimentos para inserir\n`);

  if (alimentosParaInserir.length === 0) {
    console.log('✅ Todos os alimentos já foram inseridos!');
    return;
  }

  // Processar em batches
  let totalInserido = 0;
  const totalBatches = Math.ceil(alimentosParaInserir.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, alimentosParaInserir.length);
    const items = alimentosParaInserir.slice(start, end);

    console.log(`🔄 Batch ${batch + 1}/${totalBatches}`);

    for (const item of items) {
      try {
        const food = await prisma.food.create({
          data: {
            description: item.desc,
            groupName: item.grupo,
            sourceTable: item.source,
            portionGrams: 100,
          },
        });

        await prisma.foodNutrient.createMany({
          data: nutrientIds.map((nId, i) => ({
            foodId: food.id,
            nutrientId: nId,
            valuePer100g: item.valores[i],
          })),
        });

        totalInserido++;
      } catch (e) {
        // Ignorar duplicatas
      }
    }

    console.log(`   ✅ ${items.length} processados`);
    await sleep(50);
  }

  const total = await prisma.food.count();
  console.log('\n' + '='.repeat(50));
  console.log(`\n🎉 CONCLUÍDO!`);
  console.log(`   Inseridos: ${totalInserido}`);
  console.log(`   Total no banco: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
