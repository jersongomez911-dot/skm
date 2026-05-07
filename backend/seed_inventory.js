const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Seeding additional inventory items...');

  const supplierId = 'sup-001'; // Existing supplier from seed.js

  const items = [
    // Engine
    { sku: 'GAS-KIT-250', name: 'Kit de Empaques Motor 250cc', category: 'Motor', brand: 'Vertex', quantity: 5, minStock: 2, unitCost: 120000, salePrice: 180000, supplierId },
    { sku: 'PIS-STD-SX', name: 'Pistón medida STD - KTM SX 250', category: 'Motor', brand: 'Wiseco', quantity: 3, minStock: 1, unitCost: 450000, salePrice: 620000, supplierId },
    { sku: 'VAL-IN-YZF', name: 'Válvula de Admisión Titanio YZF 250', category: 'Motor', brand: 'ProX', quantity: 8, minStock: 4, unitCost: 185000, salePrice: 240000, supplierId },
    { sku: 'SPK-BR9-EIX', name: 'Bujía Iridium NGK BR9EIX', category: 'Motor', brand: 'NGK', quantity: 15, minStock: 5, unitCost: 35000, salePrice: 55000, supplierId },
    
    // Transmission
    { sku: 'CHN-520-114', name: 'Cadena DID 520 x 114 eslabones Oro', category: 'Transmisión', brand: 'DID', quantity: 6, minStock: 2, unitCost: 280000, salePrice: 390000, supplierId },
    { sku: 'SPR-FR-13T', name: 'Piñón Ataque 13T Acerado', category: 'Transmisión', brand: 'Renthal', quantity: 10, minStock: 3, unitCost: 45000, salePrice: 75000, supplierId },
    { sku: 'SPR-RR-50T', name: 'Corona Trasera Aluminio 50T Azul', category: 'Transmisión', brand: 'ZF Sprockets', quantity: 4, minStock: 2, unitCost: 180000, salePrice: 260000, supplierId },
    { sku: 'CLU-KIT-STD', name: 'Kit de Discos de Clutch Completos', category: 'Transmisión', brand: 'Hinson', quantity: 3, minStock: 1, unitCost: 350000, salePrice: 480000, supplierId },

    // Suspension
    { sku: 'OIL-FORK-5W', name: 'Aceite Horquilla 5W 1L', category: 'Suspensión', brand: 'Motorex', quantity: 12, minStock: 4, unitCost: 65000, salePrice: 95000, supplierId },
    { sku: 'SEL-FORK-48', name: 'Sellos Horquilla 48mm KYB/Showa', category: 'Suspensión', brand: 'SKF', quantity: 8, minStock: 2, unitCost: 110000, salePrice: 165000, supplierId },
    { sku: 'BUSH-KIT-WP', name: 'Kit de Casquillos Horquilla WP', category: 'Suspensión', brand: 'Technical Touch', quantity: 2, minStock: 1, unitCost: 150000, salePrice: 210000, supplierId },

    // Braking
    { sku: 'PAD-RR-OFF', name: 'Pastillas Traseras Sinterizadas Off-Road', category: 'Frenos', brand: 'Brembo', quantity: 10, minStock: 3, unitCost: 95000, salePrice: 140000, supplierId },
    { sku: 'DSC-FR-WAV', name: 'Disco Delantero Wave 270mm', category: 'Frenos', brand: 'Galfer', quantity: 2, minStock: 1, unitCost: 380000, salePrice: 520000, supplierId },
    { sku: 'FLI-BRK-DOT4', name: 'Líquido de Frenos DOT 4 500ml', category: 'Frenos', brand: 'Liqui Moly', quantity: 10, minStock: 3, unitCost: 32000, salePrice: 50000, supplierId },

    // Bodywork & Protection
    { sku: 'PLA-KIT-KTM', name: 'Kit de Plásticos Full Naranja KTM 23-24', category: 'Estética', brand: 'Acerbis', quantity: 3, minStock: 1, unitCost: 420000, salePrice: 580000, supplierId },
    { sku: 'GRIP-SOFT-GR', name: 'Puños Soft Compound Grises', category: 'Accesorios', brand: 'ODI', quantity: 12, minStock: 5, unitCost: 45000, salePrice: 75000, supplierId },
    { sku: 'HND-GRD-BLK', name: 'Corta vientos Abiertos Negros', category: 'Accesorios', brand: 'Cycra', quantity: 5, minStock: 2, unitCost: 135000, salePrice: 195000, supplierId },
    { sku: 'SKD-PLT-ALU', name: 'Protector de Cárter Aluminio', category: 'Accesorios', brand: 'Moose Racing', quantity: 2, minStock: 1, unitCost: 290000, salePrice: 420000, supplierId },

    // Tires
    { sku: 'TIR-RR-110', name: 'Llanta Trasera 110/90-19 Soft/Mid', category: 'Llantas', brand: 'Dunlop MX33', quantity: 6, minStock: 2, unitCost: 280000, salePrice: 380000, supplierId },
    { sku: 'TIR-FR-80', name: 'Llanta Delantera 80/100-21 Soft/Mid', category: 'Llantas', brand: 'Dunlop MX33', quantity: 6, minStock: 2, unitCost: 220000, salePrice: 310000, supplierId },
    { sku: 'TUB-HD-19', name: 'Neumático Heavy Duty 19 Pulgadas', category: 'Llantas', brand: 'Michelin', quantity: 10, minStock: 4, unitCost: 65000, salePrice: 95000, supplierId },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {
        quantity: item.quantity,
        salePrice: item.salePrice,
        unitCost: item.unitCost
      },
      create: item
    });
  }

  console.log(`✅ Successfully added/updated ${items.length} items.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
