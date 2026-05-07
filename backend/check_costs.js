const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const serviceId = 'cmov1mftm0001e677b1ako1w5';
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { laborCost: true, partsCost: true, totalCost: true }
  });
  console.log('Service Costs:', JSON.stringify(service, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
