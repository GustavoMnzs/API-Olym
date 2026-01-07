import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Padrões que não fazem sentido
const INVALIDOS = [
  'Creatina,', 'BCAA,', 'Whey protein,', 'Albumina,', 'Caseína,', 'Glutamina,', 'Maltodextrina,',
  'Hipercalórico,', 'Pré treino,', 'Colágeno,', 'Proteína soja isolada,', 'Proteína ervilha,',
  'Água mineral,', 'Água coco,', 'Água tônica,', 'Água gaseificada,',
  'Sal refinado,', 'Sal grosso,', 'Sal marinho,', 'Sal rosa,', 'Sal negro,',
  'Açúcar cristal,', 'Açúcar refinado,', 'Açúcar mascavo,', 'Açúcar demerara,', 'Açúcar confeiteiro,',
  'Fermento,', 'Bicarbonato,', 'Gelatina pó,', 'Ágar ágar,',
  'Refrigerante,', 'Energético,', 'Isotônico,',
  'Cerveja,', 'Vinho,', 'Cachaça,', 'Vodka,', 'Whisky,', 'Rum,', 'Gin,', 'Tequila,', 'Licor,',
  'Catchup,', 'Mostarda,', 'Maionese,', 'Molho,',
];

async function main() {
  console.log('🧹 Limpando alimentos inválidos...\n');

  let deleted = 0;

  for (const pattern of INVALIDOS) {
    const foods = await prisma.food.findMany({
      where: {
        description: { contains: pattern },
        OR: [
          { description: { contains: ', cru' } },
          { description: { contains: ', cozido' } },
          { description: { contains: ', assado' } },
          { description: { contains: ', grelhado' } },
          { description: { contains: ', frito' } },
          { description: { contains: ', refogado' } },
          { description: { contains: ', vapor' } },
          { description: { contains: ', empanado' } },
          { description: { contains: ', gratinado' } },
          { description: { contains: ', ensopado' } },
          { description: { contains: ', defumado' } },
          { description: { contains: ', marinado' } },
        ],
      },
      select: { id: true, description: true },
    });

    if (foods.length > 0) {
      const ids = foods.map(f => f.id);
      await prisma.foodNutrient.deleteMany({ where: { foodId: { in: ids } } });
      await prisma.food.deleteMany({ where: { id: { in: ids } } });
      deleted += foods.length;
      console.log(`   ❌ Removidos ${foods.length} "${pattern}..."`);
    }
  }

  const total = await prisma.food.count();
  console.log(`\n✅ Limpeza concluída! ${deleted} registros removidos.`);
  console.log(`📦 Total restante: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
