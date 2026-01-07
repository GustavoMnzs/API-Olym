/**
 * Adiciona suplementos com dados nutricionais REAIS
 * Valores baseados em informações nutricionais padrão de suplementos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Suplementos com valores nutricionais reais (por 100g)
const SUPLEMENTOS = [
  // Creatinas
  {
    description: 'Creatina monohidratada, pó',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (3g)', g: 3 }, { desc: '1 dose (5g)', g: 5 }, { desc: '1 colher de chá', g: 3 }],
  },
  {
    description: 'Creatina micronizada, pó',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (3g)', g: 3 }, { desc: '1 dose (5g)', g: 5 }],
  },
  // Whey Proteins
  {
    description: 'Whey Protein Concentrado, pó',
    group: 'Suplementos',
    nutrients: { energia: 400, proteina: 80, carboidrato: 8, lipideos: 6, fibra: 0 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }, { desc: '2 scoops', g: 60 }],
  },
  {
    description: 'Whey Protein Isolado, pó',
    group: 'Suplementos',
    nutrients: { energia: 370, proteina: 90, carboidrato: 2, lipideos: 1, fibra: 0 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }, { desc: '2 scoops', g: 60 }],
  },
  {
    description: 'Whey Protein Hidrolisado, pó',
    group: 'Suplementos',
    nutrients: { energia: 375, proteina: 87, carboidrato: 3, lipideos: 2, fibra: 0 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }, { desc: '2 scoops', g: 60 }],
  },
  // Proteínas vegetais
  {
    description: 'Proteína de ervilha isolada, pó',
    group: 'Suplementos',
    nutrients: { energia: 370, proteina: 80, carboidrato: 5, lipideos: 5, fibra: 2 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }],
  },
  {
    description: 'Proteína de arroz, pó',
    group: 'Suplementos',
    nutrients: { energia: 380, proteina: 78, carboidrato: 8, lipideos: 4, fibra: 3 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }],
  },
  {
    description: 'Proteína de soja isolada, pó',
    group: 'Suplementos',
    nutrients: { energia: 340, proteina: 85, carboidrato: 0, lipideos: 3, fibra: 0 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }],
  },
  // Aminoácidos
  {
    description: 'BCAA (aminoácidos de cadeia ramificada), pó',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (5g)', g: 5 }, { desc: '1 colher de chá', g: 3 }],
  },
  {
    description: 'Glutamina, pó',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (5g)', g: 5 }, { desc: '1 colher de chá', g: 3 }],
  },
  {
    description: 'Beta-alanina, pó',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (3g)', g: 3 }],
  },
  {
    description: 'L-Carnitina, líquido',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (15ml)', g: 15 }],
  },
  // Carboidratos
  {
    description: 'Maltodextrina, pó',
    group: 'Suplementos',
    nutrients: { energia: 380, proteina: 0, carboidrato: 95, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 20 }, { desc: '1 scoop (30g)', g: 30 }],
  },
  {
    description: 'Dextrose, pó',
    group: 'Suplementos',
    nutrients: { energia: 380, proteina: 0, carboidrato: 95, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 20 }, { desc: '1 scoop (30g)', g: 30 }],
  },
  {
    description: 'Waxy Maize (amido de milho ceroso), pó',
    group: 'Suplementos',
    nutrients: { energia: 360, proteina: 0, carboidrato: 90, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 scoop (40g)', g: 40 }],
  },
  {
    description: 'Palatinose (isomaltulose), pó',
    group: 'Suplementos',
    nutrients: { energia: 400, proteina: 0, carboidrato: 100, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 20 }],
  },
  // Pré-treinos e energéticos
  {
    description: 'Cafeína anidra, cápsula',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 cápsula (200mg)', g: 0.2 }],
  },
  {
    description: 'Pré-treino em pó (média)',
    group: 'Suplementos',
    nutrients: { energia: 15, proteina: 0, carboidrato: 3, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 dose (10g)', g: 10 }],
  },
  // Hipercalóricos
  {
    description: 'Hipercalórico (mass gainer), pó',
    group: 'Suplementos',
    nutrients: { energia: 380, proteina: 15, carboidrato: 75, lipideos: 3, fibra: 2 },
    measures: [{ desc: '1 porção (150g)', g: 150 }, { desc: '1 scoop (50g)', g: 50 }],
  },
  // Ômega e gorduras
  {
    description: 'Ômega 3 (óleo de peixe), cápsula',
    group: 'Suplementos',
    nutrients: { energia: 900, proteina: 0, carboidrato: 0, lipideos: 100, fibra: 0 },
    measures: [{ desc: '1 cápsula (1g)', g: 1 }],
  },
  {
    description: 'TCM (triglicerídeos de cadeia média), óleo',
    group: 'Suplementos',
    nutrients: { energia: 860, proteina: 0, carboidrato: 0, lipideos: 100, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 14 }],
  },
  // Vitaminas e minerais
  {
    description: 'Vitamina C, comprimido efervescente',
    group: 'Suplementos',
    nutrients: { energia: 5, proteina: 0, carboidrato: 1, lipideos: 0, fibra: 0, vitC: 1000 },
    measures: [{ desc: '1 comprimido', g: 4 }],
  },
  {
    description: 'Vitamina D3, cápsula',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 cápsula', g: 0.5 }],
  },
  {
    description: 'ZMA (zinco, magnésio, B6), cápsula',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 cápsula', g: 1 }],
  },
  {
    description: 'Multivitamínico, comprimido',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 comprimido', g: 1 }],
  },
  // Fibras
  {
    description: 'Psyllium, pó',
    group: 'Suplementos',
    nutrients: { energia: 20, proteina: 0, carboidrato: 5, lipideos: 0, fibra: 80 },
    measures: [{ desc: '1 colher de sopa', g: 10 }, { desc: '1 colher de chá', g: 5 }],
  },
  {
    description: 'Fibra de aveia, pó',
    group: 'Suplementos',
    nutrients: { energia: 250, proteina: 15, carboidrato: 50, lipideos: 5, fibra: 25 },
    measures: [{ desc: '1 colher de sopa', g: 10 }],
  },
  // Colágeno
  {
    description: 'Colágeno hidrolisado, pó',
    group: 'Suplementos',
    nutrients: { energia: 350, proteina: 90, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 10 }, { desc: '1 dose (10g)', g: 10 }],
  },
  {
    description: 'Colágeno tipo II, cápsula',
    group: 'Suplementos',
    nutrients: { energia: 0, proteina: 0, carboidrato: 0, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 cápsula', g: 0.5 }],
  },
  // Albumina
  {
    description: 'Albumina (clara de ovo desidratada), pó',
    group: 'Suplementos',
    nutrients: { energia: 370, proteina: 82, carboidrato: 5, lipideos: 0, fibra: 0 },
    measures: [{ desc: '1 colher de sopa', g: 10 }, { desc: '1 scoop (30g)', g: 30 }],
  },
  // Caseína
  {
    description: 'Caseína micelar, pó',
    group: 'Suplementos',
    nutrients: { energia: 360, proteina: 80, carboidrato: 5, lipideos: 2, fibra: 0 },
    measures: [{ desc: '1 scoop (30g)', g: 30 }],
  },
  // Barras
  {
    description: 'Barra de proteína (média)',
    group: 'Suplementos',
    nutrients: { energia: 350, proteina: 30, carboidrato: 35, lipideos: 10, fibra: 5 },
    measures: [{ desc: '1 unidade (60g)', g: 60 }],
  },
  {
    description: 'Barra de cereal proteica',
    group: 'Suplementos',
    nutrients: { energia: 380, proteina: 20, carboidrato: 45, lipideos: 12, fibra: 4 },
    measures: [{ desc: '1 unidade (40g)', g: 40 }],
  },
];


async function main(): Promise<void> {
  console.log('💪 Adicionando suplementos ao banco de dados...\n');

  // Buscar IDs dos nutrientes
  const nutrients = await prisma.nutrient.findMany();
  const nutrientMap = new Map(nutrients.map(n => [n.name, n.id]));

  let adicionados = 0;

  for (const sup of SUPLEMENTOS) {
    // Verificar se já existe
    const existing = await prisma.food.findFirst({
      where: { description: sup.description },
    });

    if (existing) {
      console.log(`   ⏭️ Já existe: ${sup.description}`);
      continue;
    }

    try {
      // Criar alimento
      const food = await prisma.food.create({
        data: {
          description: sup.description,
          groupName: sup.group,
          sourceTable: 'SUPLEMENTOS',
          portionGrams: 100,
        },
      });

      // Adicionar nutrientes
      const nutrientData = [
        { name: 'Energia', value: sup.nutrients.energia },
        { name: 'Proteína', value: sup.nutrients.proteina },
        { name: 'Carboidrato total', value: sup.nutrients.carboidrato },
        { name: 'Lipídeos', value: sup.nutrients.lipideos },
        { name: 'Fibra alimentar', value: sup.nutrients.fibra },
      ];

      if ((sup.nutrients as any).vitC) {
        nutrientData.push({ name: 'Vitamina C', value: (sup.nutrients as any).vitC });
      }

      for (const nd of nutrientData) {
        const nid = nutrientMap.get(nd.name);
        if (nid && nd.value !== undefined) {
          await prisma.foodNutrient.create({
            data: { foodId: food.id, nutrientId: nid, valuePer100g: nd.value },
          });
        }
      }

      // Adicionar medidas
      for (const m of sup.measures) {
        await prisma.measure.create({
          data: {
            foodId: food.id,
            measureDescription: m.desc,
            grams: m.g,
          },
        });
      }

      console.log(`   ✅ ${sup.description}`);
      adicionados++;
    } catch (e) {
      console.log(`   ❌ Erro: ${sup.description}`);
    }
  }

  console.log(`\n📊 Suplementos adicionados: ${adicionados}`);
  
  const totalSup = await prisma.food.count({ where: { sourceTable: 'SUPLEMENTOS' } });
  console.log(`📊 Total de suplementos no banco: ${totalSup}`);

  await prisma.$disconnect();
}

main().catch(console.error);
