import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.tourPlan.findMany({
    orderBy: { updated_at: "desc" },
    select: {
      tour_code: true,
      updated_at: true,
      status: true
    }
  });

  console.log('All tours ordered by updated_at desc:');
  plans.forEach((p, i) => {
    console.log(`${i + 1}. ${p.tour_code} (${p.status}) - ${p.updated_at.toISOString()}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
