// SKM Taller — Database Seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skm.com' },
    update: {},
    create: {
      name: 'Administrador SKM',
      email: 'admin@skm.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@skm.com' },
    update: {},
    create: {
      name: 'Carlos Supervisor',
      email: 'supervisor@skm.com',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  const mechanic = await prisma.user.upsert({
    where: { email: 'mecanico@skm.com' },
    update: {},
    create: {
      name: 'Juan Mecánico',
      email: 'mecanico@skm.com',
      passwordHash,
      role: 'MECHANIC',
      isActive: true,
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'recepcion@skm.com' },
    update: {},
    create: {
      name: 'María Recepción',
      email: 'recepcion@skm.com',
      passwordHash,
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });

  // Checklist templates
  const mxTemplate = await prisma.checklistTemplate.upsert({
    where: { id: 'tpl-motocross-std' },
    update: {},
    create: {
      id: 'tpl-motocross-std',
      name: 'Revisión Estándar Motocross',
      motorcycleType: 'Motocross',
      description: 'Checklist de revisión completa para motos de motocross',
      templateItems: {
        create: [
          // Motor
          { category: 'Motor', label: 'Nivel de aceite motor', isRequired: true, order: 1 },
          { category: 'Motor', label: 'Filtro de aire', isRequired: true, order: 2 },
          { category: 'Motor', label: 'Bujía', isRequired: true, order: 3 },
          { category: 'Motor', label: 'Cadena de distribución', isRequired: false, order: 4 },
          { category: 'Motor', label: 'Refrigeración / líquido refrigerante', isRequired: false, order: 5 },
          // Suspensión
          { category: 'Suspensión', label: 'Horquilla delantera - fugas', isRequired: true, order: 6 },
          { category: 'Suspensión', label: 'Amortiguador trasero', isRequired: true, order: 7 },
          { category: 'Suspensión', label: 'Rodamientos de dirección', isRequired: false, order: 8 },
          { category: 'Suspensión', label: 'Bujes de basculante', isRequired: false, order: 9 },
          // Frenos
          { category: 'Frenos', label: 'Pastillas freno delantero', isRequired: true, order: 10 },
          { category: 'Frenos', label: 'Pastillas freno trasero', isRequired: true, order: 11 },
          { category: 'Frenos', label: 'Líquido de frenos', isRequired: true, order: 12 },
          { category: 'Frenos', label: 'Discos de freno', isRequired: false, order: 13 },
          // Eléctrico
          { category: 'Eléctrico', label: 'Batería / sistema eléctrico', isRequired: false, order: 14 },
          { category: 'Eléctrico', label: 'Luces (si aplica)', isRequired: false, order: 15 },
          // Chasis
          { category: 'Chasis', label: 'Cadena de transmisión - tensión', isRequired: true, order: 16 },
          { category: 'Chasis', label: 'Piñon y corona', isRequired: true, order: 17 },
          { category: 'Chasis', label: 'Neumáticos - desgaste y presión', isRequired: true, order: 18 },
          { category: 'Chasis', label: 'Pernos y tornillos generales', isRequired: false, order: 19 },
          // Estética
          { category: 'Estética', label: 'Carrocería / plásticos', isRequired: false, order: 20 },
          { category: 'Estética', label: 'Guardabarros', isRequired: false, order: 21 },
        ],
      },
    },
  });

  // Sample supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: 'sup-001' },
    update: {},
    create: {
      id: 'sup-001',
      name: 'Distribuidora MX Pro',
      contact: 'Pedro Gómez',
      email: 'pedido@mxpro.com',
      phone: '3001234567',
      address: 'Calle 45 #12-34, Bogotá',
    },
  });

  // Sample inventory
  await prisma.inventoryItem.upsert({
    where: { sku: 'FIL-AIR-001' },
    update: {},
    create: { sku: 'FIL-AIR-001', name: 'Filtro de Aire KTM SX 250', category: 'Filtros', brand: 'KTM', quantity: 10, minStock: 3, unitCost: 45000, salePrice: 65000, supplierId: supplier.id },
  });
  await prisma.inventoryItem.upsert({
    where: { sku: 'ACS-MOT-001' },
    update: {},
    create: { sku: 'ACS-MOT-001', name: 'Aceite Motor 10W40 1L', category: 'Lubricantes', brand: 'Motul', quantity: 25, minStock: 5, unitCost: 28000, salePrice: 40000, supplierId: supplier.id },
  });
  await prisma.inventoryItem.upsert({
    where: { sku: 'PAD-FRN-001' },
    update: {},
    create: { sku: 'PAD-FRN-001', name: 'Pastillas Freno Delantero Husqvarna', category: 'Frenos', brand: 'EBC', quantity: 8, minStock: 2, unitCost: 85000, salePrice: 120000, supplierId: supplier.id },
  });

  // Sample client
  const client = await prisma.client.upsert({
    where: { documentNumber: '1234567890' },
    update: {},
    create: {
      fullName: 'Diego Ramírez',
      documentNumber: '1234567890',
      phone: '3109876543',
      email: 'diego.ramirez@email.com',
      address: 'Carrera 15 #80-25',
      city: 'Bogotá',
      category: 'Nacional',
      team: 'SKM Racing',
      emergencyContact: 'Ana Ramírez - 3001112222',
    },
  });

  // Sample motorcycle
  const moto = await prisma.motorcycle.upsert({
    where: { vin: 'KTM2024SX250001' },
    update: {},
    create: {
      clientId: client.id,
      brand: 'KTM',
      model: 'SX 250',
      displacement: 250,
      year: 2024,
      vin: 'KTM2024SX250001',
      engineNumber: 'ENG-KTM-001',
      hoursUsed: 45.5,
      mileage: 1200,
      color: 'Naranja',
    },
  });

  console.log('✅ Seed completed!');
  console.log('─────────────────────────────────────');
  console.log('📧 Accounts created:');
  console.log('   admin@skm.com         | Admin123!  | ADMIN');
  console.log('   supervisor@skm.com    | Admin123!  | SUPERVISOR');
  console.log('   mecanico@skm.com      | Admin123!  | MECHANIC');
  console.log('   recepcion@skm.com     | Admin123!  | RECEPTIONIST');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
