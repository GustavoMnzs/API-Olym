/**
 * Adicionar suplementos com dados nutricionais reais
 * Baseado em rótulos de produtos populares no Brasil
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Suplemento {
  nome: string;
  energia: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  fibra?: number;
  sodio?: number;
}

// Dados baseados em rótulos reais de produtos brasileiros
const SUPLEMENTOS: Suplemento[] = [
  // Whey Proteins
  { nome: 'Whey Protein Concentrado (por scoop 30g)', energia: 120, proteina: 24, carboidrato: 3, gordura: 1.5 },
  { nome: 'Whey Protein Isolado (por scoop 30g)', energia: 110, proteina: 27, carboidrato: 1, gordura: 0.5 },
  { nome: 'Whey Protein Hidrolisado (por scoop 30g)', energia: 115, proteina: 26, carboidrato: 2, gordura: 0.5 },
  { nome: 'Whey Gold Standard - Optimum (por scoop 30g)', energia: 120, proteina: 24, carboidrato: 3, gordura: 1 },
  { nome: 'Whey Iso Triple Zero - Integralmédica (por scoop 30g)', energia: 108, proteina: 26, carboidrato: 0, gordura: 0 },
  { nome: 'Whey 100% Pure - Probiótica (por scoop 30g)', energia: 117, proteina: 23, carboidrato: 4, gordura: 1 },
  { nome: 'Whey Protein 3W - Max Titanium (por scoop 30g)', energia: 118, proteina: 24, carboidrato: 3, gordura: 1.2 },
  { nome: 'ISO Whey - Integralmédica (por scoop 30g)', energia: 106, proteina: 26, carboidrato: 0.5, gordura: 0.3 },
  { nome: 'Whey Protein Blend - Growth (por scoop 30g)', energia: 115, proteina: 23, carboidrato: 4, gordura: 1 },
  
  // Caseínas
  { nome: 'Caseína Micelar (por scoop 30g)', energia: 110, proteina: 24, carboidrato: 3, gordura: 0.5 },
  { nome: 'Caseína Gold Standard - Optimum (por scoop 34g)', energia: 120, proteina: 24, carboidrato: 3, gordura: 1 },
  
  // Albuminas
  { nome: 'Albumina em pó (por porção 30g)', energia: 105, proteina: 25, carboidrato: 1, gordura: 0 },
  { nome: 'Albumina Naturovos (por porção 30g)', energia: 108, proteina: 24, carboidrato: 2, gordura: 0 },
  
  // Proteínas vegetais
  { nome: 'Proteína de Ervilha (por scoop 30g)', energia: 110, proteina: 21, carboidrato: 4, gordura: 1.5 },
  { nome: 'Proteína de Arroz (por scoop 30g)', energia: 115, proteina: 22, carboidrato: 3, gordura: 1 },
  { nome: 'Proteína Vegana Blend (por scoop 30g)', energia: 112, proteina: 20, carboidrato: 5, gordura: 2 },
  { nome: 'Proteína de Soja Isolada (por scoop 30g)', energia: 108, proteina: 25, carboidrato: 1, gordura: 0.5 },
  
  // Hipercalóricos
  { nome: 'Hipercalórico Mass Gainer (por porção 150g)', energia: 600, proteina: 30, carboidrato: 110, gordura: 5 },
  { nome: 'Serious Mass - Optimum (por porção 167g)', energia: 627, proteina: 25, carboidrato: 126, gordura: 2.5 },
  { nome: 'Mass Titanium - Max Titanium (por porção 150g)', energia: 580, proteina: 28, carboidrato: 105, gordura: 4 },
  { nome: 'Massa 3200 - Probiótica (por porção 100g)', energia: 380, proteina: 15, carboidrato: 72, gordura: 3 },
  
  // Creatinas
  { nome: 'Creatina Monohidratada (por dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Creatina Creapure (por dose 3g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Creatina HCL (por dose 2g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  
  // BCAAs
  { nome: 'BCAA em pó (por dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'BCAA 2:1:1 (por dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'BCAA 4:1:1 (por dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'BCAA cápsulas (por 4 cápsulas)', energia: 16, proteina: 4, carboidrato: 0, gordura: 0 },
  
  // Glutaminas
  { nome: 'L-Glutamina em pó (por dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  { nome: 'Glutamina Kyowa (por dose 5g)', energia: 20, proteina: 5, carboidrato: 0, gordura: 0 },
  
  // Pré-treinos
  { nome: 'Pré-treino C4 - Cellucor (por dose 6g)', energia: 5, proteina: 0, carboidrato: 1, gordura: 0 },
  { nome: 'Pré-treino Évora PW - Darkness (por dose 5g)', energia: 10, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Pré-treino Horus - Max Titanium (por dose 6g)', energia: 8, proteina: 0, carboidrato: 2, gordura: 0 },
  { nome: 'Pré-treino Insane - Darkness (por dose 6g)', energia: 12, proteina: 0, carboidrato: 3, gordura: 0 },
  
  // Termogênicos
  { nome: 'Termogênico Lipo 6 Black (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Termogênico Sineflex - Power Supplements (por dose)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Cafeína 200mg (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  
  // Carboidratos
  { nome: 'Maltodextrina (por porção 30g)', energia: 114, proteina: 0, carboidrato: 28.5, gordura: 0 },
  { nome: 'Dextrose (por porção 30g)', energia: 114, proteina: 0, carboidrato: 28.5, gordura: 0 },
  { nome: 'Waxy Maize (por porção 30g)', energia: 110, proteina: 0, carboidrato: 27.5, gordura: 0 },
  { nome: 'Palatinose (por porção 30g)', energia: 114, proteina: 0, carboidrato: 28.5, gordura: 0 },
  { nome: 'Carboidrato em gel (por sachê 30g)', energia: 80, proteina: 0, carboidrato: 20, gordura: 0 },
  
  // Ômega 3
  { nome: 'Ômega 3 1000mg (por cápsula)', energia: 9, proteina: 0, carboidrato: 0, gordura: 1 },
  { nome: 'Ômega 3 EPA/DHA (por cápsula)', energia: 9, proteina: 0, carboidrato: 0, gordura: 1 },
  
  // Vitaminas
  { nome: 'Multivitamínico (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Vitamina C 1000mg (por comprimido)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Vitamina D3 2000UI (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Complexo B (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'ZMA (por dose 3 cápsulas)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  
  // Colágeno
  { nome: 'Colágeno Hidrolisado (por dose 10g)', energia: 36, proteina: 9, carboidrato: 0, gordura: 0 },
  { nome: 'Colágeno Tipo II (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Colágeno Verisol (por dose 2.5g)', energia: 9, proteina: 2.25, carboidrato: 0, gordura: 0 },
  
  // Barras de proteína
  { nome: 'Barra de Proteína (média 45g)', energia: 180, proteina: 15, carboidrato: 20, gordura: 6 },
  { nome: 'Barra Quest Bar (60g)', energia: 200, proteina: 21, carboidrato: 21, gordura: 8, fibra: 14 },
  { nome: 'Barra Protein Crisp - Integralmédica (45g)', energia: 190, proteina: 12, carboidrato: 18, gordura: 8 },
  { nome: 'Barra Bold - Bold Snacks (60g)', energia: 200, proteina: 20, carboidrato: 18, gordura: 7, fibra: 10 },
  
  // Outros
  { nome: 'Arginina (por dose 3g)', energia: 12, proteina: 3, carboidrato: 0, gordura: 0 },
  { nome: 'Beta-Alanina (por dose 3g)', energia: 12, proteina: 3, carboidrato: 0, gordura: 0 },
  { nome: 'Citrulina Malato (por dose 6g)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'HMB (por dose 3g)', energia: 12, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Tribulus Terrestris (por cápsula)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
  { nome: 'Melatonina 3mg (por comprimido)', energia: 0, proteina: 0, carboidrato: 0, gordura: 0 },
];

async function getOrCreateNutrient(name: string, unit: string): Promise<number> {
  let nutrient = await prisma.nutrient.findFirst({ where: { name } });
  if (!nutrient) {
    nutrient = await prisma.nutrient.create({ data: { name, unit } });
  }
  return nutrient.id;
}

async function main() {
  console.log('🚀 ADICIONANDO SUPLEMENTOS COMPLETOS\n');

  let inseridos = 0;
  let existentes = 0;

  for (const sup of SUPLEMENTOS) {
    // Verificar se já existe
    const exists = await prisma.food.findFirst({
      where: { description: sup.nome }
    });

    if (exists) {
      existentes++;
      continue;
    }

    // Criar alimento
    const food = await prisma.food.create({
      data: {
        description: sup.nome,
        groupName: 'Suplementos',
        sourceTable: 'SUPLEMENTOS',
        portionGrams: 100,
      }
    });

    // Inserir nutrientes
    const nutrientes = [
      { name: 'Energia', unit: 'kcal', value: sup.energia },
      { name: 'Proteína', unit: 'g', value: sup.proteina },
      { name: 'Carboidrato', unit: 'g', value: sup.carboidrato },
      { name: 'Lipídios', unit: 'g', value: sup.gordura },
    ];

    if (sup.fibra) nutrientes.push({ name: 'Fibra alimentar', unit: 'g', value: sup.fibra });
    if (sup.sodio) nutrientes.push({ name: 'Sódio', unit: 'mg', value: sup.sodio });

    for (const n of nutrientes) {
      const nutrientId = await getOrCreateNutrient(n.name, n.unit);
      await prisma.foodNutrient.create({
        data: {
          foodId: food.id,
          nutrientId,
          valuePer100g: n.value,
        }
      });
    }

    inseridos++;
    console.log(`   ✅ ${sup.nome}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Inseridos: ${inseridos}`);
  console.log(`⏭️  Já existiam: ${existentes}`);

  const totalSup = await prisma.food.count({ where: { sourceTable: 'SUPLEMENTOS' } });
  console.log(`📊 Total suplementos: ${totalSup}`);

  await prisma.$disconnect();
}

main().catch(console.error);
