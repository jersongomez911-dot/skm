const { prisma } = require('../../config/database');

const getKpis = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    pending, inProgress, waitingParts, done, overdue,
    todayRevenue, monthRevenue,
    totalClients, totalMotorcycles, lowStockCount
  ] = await Promise.all([
    prisma.service.count({ where: { status: 'PENDING' } }),
    prisma.service.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.service.count({ where: { status: 'WAITING_PARTS' } }),
    prisma.service.count({ where: { status: 'DONE' } }),
    prisma.service.count({ where: { status: { in: ['IN_PROGRESS', 'WAITING_PARTS', 'PAUSED'] }, createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } }),
    prisma.service.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: today, lte: todayEnd } }, _sum: { totalCost: true } }),
    prisma.service.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: monthStart } }, _sum: { totalCost: true } }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.motorcycle.count({ where: { status: 'ACTIVE' } }),
    prisma.$queryRaw`SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= minStock AND isActive = 1`,
  ]);

  return {
    pending, inProgress, waitingParts, done, overdue,
    todayRevenue: todayRevenue._sum.totalCost || 0,
    monthRevenue: monthRevenue._sum.totalCost || 0,
    totalClients, totalMotorcycles,
    lowStockCount: Number(lowStockCount[0]?.count || 0),
  };
};

const getCharts = async () => {
  // Last 6 months of services + revenue
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('es', { month: 'short' }) });
  }

  const monthlyData = await Promise.all(months.map(async ({ year, month, label }) => {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);
    const [count, rev] = await Promise.all([
      prisma.service.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.service.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: from, lte: to } }, _sum: { totalCost: true } }),
    ]);
    return { label, services: count, revenue: rev._sum.totalCost || 0 };
  }));

  const byStatus = await prisma.service.groupBy({ by: ['status'], _count: { status: true } });
  const byPriority = await prisma.service.groupBy({ by: ['priority'], _count: { priority: true } });

  return { monthly: monthlyData, byStatus, byPriority };
};

const getAlerts = async () => {
  const [lowStock, criticalServices, overdueServices] = await Promise.all([
    prisma.$queryRaw`SELECT id, sku, name, quantity, minStock FROM inventory_items WHERE quantity <= minStock AND isActive = 1 LIMIT 10`,
    prisma.service.findMany({ where: { priority: 'CRITICAL', status: { notIn: ['DELIVERED', 'CANCELLED'] } }, include: { motorcycle: { include: { client: { select: { fullName: true } } } } }, take: 5 }),
    prisma.service.findMany({ where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] }, createdAt: { lt: new Date(Date.now() - 72 * 60 * 60 * 1000) } }, include: { motorcycle: { include: { client: { select: { fullName: true } } } } }, take: 5 }),
  ]);
  return { lowStock, criticalServices, overdueServices };
};

const getRecentServices = async () => prisma.service.findMany({
  where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
  include: { motorcycle: { include: { client: { select: { fullName: true } } } }, technician: { select: { name: true } } },
  orderBy: { updatedAt: 'desc' }, take: 10,
});

const getTopTechnicians = async () => {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  return prisma.service.groupBy({
    by: ['technicianId'],
    where: { technicianId: { not: null }, createdAt: { gte: monthStart } },
    _count: { technicianId: true },
    _sum: { totalCost: true },
    orderBy: { _count: { technicianId: 'desc' } },
    take: 5,
  });
};

module.exports = { getKpis, getCharts, getAlerts, getRecentServices, getTopTechnicians };
