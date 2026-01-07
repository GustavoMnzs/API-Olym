/**
 * Adiciona medidas caseiras REAIS aos alimentos
 * Baseado em dados oficiais de tabelas de medidas caseiras brasileiras
 * Fonte: Tabela de Medidas Caseiras - UNIFESP/EPM
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Medidas caseiras padrão (valores em gramas) - dados reais de referência
const MEDIDAS_PADRAO: Record<string, { descricao: string; gramas: number }[]> = {
  // Cereais e derivados
  'arroz': [
    { descricao: '1 colher de sopa', gramas: 25 },
    { descricao: '1 colher de servir', gramas: 45 },
    { descricao: '1 xícara de chá', gramas: 160 },
    { descricao: '1 escumadeira média', gramas: 90 },
  ],
  'feijão': [
    { descricao: '1 colher de sopa', gramas: 26 },
    { descricao: '1 concha média', gramas: 86 },
    { descricao: '1 xícara de chá', gramas: 170 },
  ],
  'macarrão': [
    { descricao: '1 colher de sopa', gramas: 25 },
    { descricao: '1 pegador', gramas: 110 },
    { descricao: '1 prato fundo', gramas: 220 },
    { descricao: '1 escumadeira', gramas: 90 },
  ],
  'pão': [
    { descricao: '1 unidade (francês)', gramas: 50 },
    { descricao: '1 fatia (forma)', gramas: 25 },
    { descricao: '1 unidade pequena', gramas: 35 },
  ],
  'aveia': [
    { descricao: '1 colher de sopa', gramas: 15 },
    { descricao: '1 xícara de chá', gramas: 80 },
    { descricao: '1 colher de chá', gramas: 5 },
  ],
  'farinha': [
    { descricao: '1 colher de sopa', gramas: 15 },
    { descricao: '1 xícara de chá', gramas: 120 },
    { descricao: '1 colher de chá', gramas: 5 },
  ],
  'biscoito': [
    { descricao: '1 unidade', gramas: 8 },
    { descricao: '1 pacote pequeno', gramas: 30 },
  ],
  'cereal': [
    { descricao: '1 xícara de chá', gramas: 30 },
    { descricao: '1 colher de sopa', gramas: 10 },
  ],
  // Carnes
  'carne': [
    { descricao: '1 bife médio', gramas: 100 },
    { descricao: '1 bife grande', gramas: 150 },
    { descricao: '1 porção', gramas: 120 },
    { descricao: '1 colher de sopa (moída)', gramas: 25 },
  ],
  'frango': [
    { descricao: '1 filé médio', gramas: 100 },
    { descricao: '1 coxa', gramas: 70 },
    { descricao: '1 sobrecoxa', gramas: 100 },
    { descricao: '1 peito inteiro', gramas: 200 },
    { descricao: '1 asa', gramas: 40 },
  ],
  'peixe': [
    { descricao: '1 filé médio', gramas: 120 },
    { descricao: '1 posta', gramas: 150 },
    { descricao: '1 porção', gramas: 100 },
  ],
  'ovo': [
    { descricao: '1 unidade', gramas: 50 },
    { descricao: '1 clara', gramas: 30 },
    { descricao: '1 gema', gramas: 20 },
  ],
  'linguiça': [
    { descricao: '1 gomo', gramas: 60 },
    { descricao: '1 unidade', gramas: 60 },
  ],
  'presunto': [
    { descricao: '1 fatia', gramas: 15 },
    { descricao: '2 fatias', gramas: 30 },
  ],
  // Laticínios
  'leite': [
    { descricao: '1 copo (200ml)', gramas: 200 },
    { descricao: '1 xícara de chá', gramas: 240 },
    { descricao: '1 colher de sopa', gramas: 15 },
  ],
  'queijo': [
    { descricao: '1 fatia fina', gramas: 20 },
    { descricao: '1 fatia média', gramas: 30 },
    { descricao: '1 colher de sopa (ralado)', gramas: 10 },
    { descricao: '1 pedaço (3x3cm)', gramas: 30 },
  ],
  'iogurte': [
    { descricao: '1 pote (170g)', gramas: 170 },
    { descricao: '1 copo (200ml)', gramas: 200 },
    { descricao: '1 colher de sopa', gramas: 20 },
  ],
  'manteiga': [
    { descricao: '1 colher de chá', gramas: 5 },
    { descricao: '1 colher de sopa', gramas: 12 },
    { descricao: '1 ponta de faca', gramas: 3 },
  ],
  'requeijão': [
    { descricao: '1 colher de sopa', gramas: 30 },
    { descricao: '1 colher de chá', gramas: 10 },
  ],
  // Frutas
  'banana': [
    { descricao: '1 unidade média', gramas: 86 },
    { descricao: '1 unidade pequena', gramas: 55 },
    { descricao: '1 unidade grande', gramas: 120 },
  ],
  'maçã': [
    { descricao: '1 unidade média', gramas: 130 },
    { descricao: '1 unidade pequena', gramas: 90 },
  ],
  'laranja': [
    { descricao: '1 unidade média', gramas: 180 },
    { descricao: '1 copo de suco (200ml)', gramas: 200 },
  ],
  'mamão': [
    { descricao: '1 fatia média', gramas: 170 },
    { descricao: '1 unidade (papaia)', gramas: 300 },
  ],
  'melancia': [
    { descricao: '1 fatia média', gramas: 200 },
    { descricao: '1 xícara de cubos', gramas: 150 },
  ],
  'uva': [
    { descricao: '1 cacho pequeno', gramas: 100 },
    { descricao: '10 unidades', gramas: 50 },
  ],
  'morango': [
    { descricao: '1 unidade média', gramas: 12 },
    { descricao: '10 unidades', gramas: 120 },
    { descricao: '1 xícara', gramas: 150 },
  ],
  'abacate': [
    { descricao: '1 unidade média', gramas: 200 },
    { descricao: '1 colher de sopa', gramas: 30 },
  ],
  'manga': [
    { descricao: '1 unidade média', gramas: 200 },
    { descricao: '1 fatia', gramas: 80 },
  ],
  // Verduras e legumes
  'alface': [
    { descricao: '1 folha média', gramas: 10 },
    { descricao: '1 prato de sobremesa', gramas: 30 },
  ],
  'tomate': [
    { descricao: '1 unidade média', gramas: 100 },
    { descricao: '1 fatia', gramas: 15 },
    { descricao: '1 colher de sopa (molho)', gramas: 25 },
  ],
  'cenoura': [
    { descricao: '1 unidade média', gramas: 80 },
    { descricao: '1 colher de sopa (ralada)', gramas: 12 },
  ],
  'batata': [
    { descricao: '1 unidade média', gramas: 140 },
    { descricao: '1 unidade pequena', gramas: 80 },
    { descricao: '1 colher de sopa (purê)', gramas: 45 },
  ],
  'cebola': [
    { descricao: '1 unidade média', gramas: 110 },
    { descricao: '1 colher de sopa (picada)', gramas: 10 },
  ],
  'alho': [
    { descricao: '1 dente', gramas: 4 },
    { descricao: '1 colher de chá (picado)', gramas: 5 },
  ],
  'brócolis': [
    { descricao: '1 ramo médio', gramas: 30 },
    { descricao: '1 xícara (cozido)', gramas: 90 },
  ],
  // Óleos e gorduras
  'azeite': [
    { descricao: '1 colher de sopa', gramas: 13 },
    { descricao: '1 colher de chá', gramas: 4 },
    { descricao: '1 fio', gramas: 5 },
  ],
  'óleo': [
    { descricao: '1 colher de sopa', gramas: 13 },
    { descricao: '1 colher de chá', gramas: 4 },
  ],
  'margarina': [
    { descricao: '1 colher de chá', gramas: 5 },
    { descricao: '1 colher de sopa', gramas: 12 },
  ],
  // Açúcares
  'açúcar': [
    { descricao: '1 colher de chá', gramas: 5 },
    { descricao: '1 colher de sopa', gramas: 15 },
    { descricao: '1 xícara de chá', gramas: 180 },
  ],
  'mel': [
    { descricao: '1 colher de chá', gramas: 10 },
    { descricao: '1 colher de sopa', gramas: 25 },
  ],
  'chocolate': [
    { descricao: '1 barra pequena (25g)', gramas: 25 },
    { descricao: '1 quadradinho', gramas: 5 },
    { descricao: '1 colher de sopa (em pó)', gramas: 10 },
  ],
  // Bebidas
  'café': [
    { descricao: '1 xícara pequena (50ml)', gramas: 50 },
    { descricao: '1 xícara média (100ml)', gramas: 100 },
  ],
  'suco': [
    { descricao: '1 copo (200ml)', gramas: 200 },
    { descricao: '1 copo (300ml)', gramas: 300 },
  ],
  'refrigerante': [
    { descricao: '1 lata (350ml)', gramas: 350 },
    { descricao: '1 copo (200ml)', gramas: 200 },
  ],
  // Suplementos
  'whey': [
    { descricao: '1 scoop (30g)', gramas: 30 },
    { descricao: '2 scoops', gramas: 60 },
    { descricao: '1 colher de sopa', gramas: 15 },
  ],
  'creatina': [
    { descricao: '1 dose (3g)', gramas: 3 },
    { descricao: '1 dose (5g)', gramas: 5 },
    { descricao: '1 colher de chá', gramas: 3 },
  ],
  'proteína': [
    { descricao: '1 scoop (30g)', gramas: 30 },
    { descricao: '1 colher de sopa', gramas: 15 },
  ],
  // Leguminosas
  'lentilha': [
    { descricao: '1 concha média', gramas: 80 },
    { descricao: '1 colher de sopa', gramas: 20 },
  ],
  'grão-de-bico': [
    { descricao: '1 concha média', gramas: 80 },
    { descricao: '1 colher de sopa', gramas: 20 },
  ],
  // Oleaginosas
  'castanha': [
    { descricao: '1 unidade', gramas: 4 },
    { descricao: '1 punhado (30g)', gramas: 30 },
  ],
  'amendoim': [
    { descricao: '1 colher de sopa', gramas: 15 },
    { descricao: '1 punhado', gramas: 30 },
  ],
};


async function main(): Promise<void> {
  console.log('🥄 Adicionando medidas caseiras aos alimentos...\n');

  let totalMedidas = 0;

  for (const [termo, medidas] of Object.entries(MEDIDAS_PADRAO)) {
    // Buscar alimentos que contenham o termo
    const foods = await prisma.food.findMany({
      where: {
        description: {
          contains: termo,
        },
      },
      select: { id: true, description: true },
    });

    console.log(`📦 "${termo}": ${foods.length} alimentos encontrados`);

    for (const food of foods) {
      for (const medida of medidas) {
        try {
          // Verificar se já existe
          const existing = await prisma.measure.findFirst({
            where: {
              foodId: food.id,
              measureDescription: medida.descricao,
            },
          });

          if (!existing) {
            await prisma.measure.create({
              data: {
                foodId: food.id,
                measureDescription: medida.descricao,
                grams: medida.gramas,
              },
            });
            totalMedidas++;
          }
        } catch (e) {
          // Ignorar erros
        }
      }
    }
  }

  const totalMeasures = await prisma.measure.count();
  console.log(`\n✅ Total de medidas adicionadas: ${totalMedidas}`);
  console.log(`📊 Total de medidas no banco: ${totalMeasures}`);

  await prisma.$disconnect();
}

main().catch(console.error);
