import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Limpando banco de dados...\n');

  await prisma.foodNutrient.deleteMany({});
  console.log('   ✅ food_nutrients limpo');

  await prisma.measure.deleteMany({});
  console.log('   ✅ measures limpo');

  await prisma.food.deleteMany({});
  console.log('   ✅ foods limpo');

  await prisma.nutrient.deleteMany({});
  console.log('   ✅ nutrients limpo');

  console.log('\n🎉 Banco limpo! Pronto para novo seed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
