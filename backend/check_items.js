const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const serviceId = 'cmov1mftm0001e677b1ako1w5';
  const items = await prisma.serviceItem.findMany({ where: { serviceId } });
  console.log('Service Items:', JSON.stringify(items, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
