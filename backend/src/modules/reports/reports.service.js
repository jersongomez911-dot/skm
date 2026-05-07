const { prisma } = require('../../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const BRAND_ORANGE = '#f97316';
const BRAND_DARK = '#111827';

// ─── Data Fetchers ──────────────────────────────────────────────────────────

const getServicesData = async ({ dateFrom, dateTo, status }) => {
  const where = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
  return prisma.service.findMany({
    where,
    include: {
      motorcycle: { include: { client: { select: { fullName: true, documentNumber: true } } } },
      technician: { select: { name: true } },
      receptionist: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getRevenueData = async ({ dateFrom, dateTo }) => {
  const where = { status: 'DELIVERED' };
  if (dateFrom || dateTo) { where.deliveredAt = {}; if (dateFrom) where.deliveredAt.gte = new Date(dateFrom); if (dateTo) where.deliveredAt.lte = new Date(dateTo); }
  const services = await prisma.service.findMany({ where, include: { motorcycle: { include: { client: { select: { fullName: true } } } } }, orderBy: { deliveredAt: 'desc' } });
  const total = services.reduce((s, r) => s + (r.totalCost || 0), 0);
  return { services, total };
};

const getInventoryData = async () => prisma.inventoryItem.findMany({
  include: { supplier: { select: { name: true } } },
  orderBy: { name: 'asc' },
});

const getTechniciansData = async ({ dateFrom, dateTo }) => {
  const where = { technicianId: { not: null } };
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
  return prisma.service.groupBy({
    by: ['technicianId'],
    where,
    _count: { technicianId: true },
    _sum: { totalCost: true, laborCost: true },
    orderBy: { _count: { technicianId: 'desc' } },
  });
};

const getClientsData = async () => prisma.client.findMany({
  where: { isActive: true },
  include: { _count: { select: { motorcycles: true } }, motorcycles: { include: { _count: { select: { services: true } } } } },
  orderBy: { fullName: 'asc' },
});

// ─── Excel Generator ─────────────────────────────────────────────────────────

const generateExcel = async (data, config) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SKM Servicio Técnico';
  const ws = wb.addWorksheet(config.sheetName);

  // Header style
  const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } }, alignment: { horizontal: 'center' } };

  ws.columns = config.columns;
  const headerRow = ws.getRow(1);
  config.columns.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col.header;
    headerRow.getCell(i + 1).style = headerStyle;
  });

  data.forEach(row => {
    const values = config.columns.map(col => {
      const v = col.key.split('.').reduce((o, k) => o?.[k], row);
      return v ?? '';
    });
    ws.addRow(values);
  });

  ws.getRow(1).height = 20;
  return wb;
};

// ─── PDF Generator ────────────────────────────────────────────────────────────

const generatePDF = (title, headers, rows, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 60).fill(BRAND_DARK);
  doc.fill('white').fontSize(18).font('Helvetica-Bold').text('SKM Servicio Técnico', 40, 15);
  doc.fill(BRAND_ORANGE).fontSize(12).text(title, 40, 38);
  doc.moveDown(2);

  // Table headers
  const colW = (doc.page.width - 80) / headers.length;
  let y = 75;
  doc.rect(40, y, doc.page.width - 80, 20).fill(BRAND_ORANGE);
  headers.forEach((h, i) => { doc.fill('white').fontSize(8).font('Helvetica-Bold').text(h, 42 + i * colW, y + 5, { width: colW - 4 }); });

  y += 20;
  rows.forEach((row, ri) => {
    if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
    if (ri % 2 === 0) doc.rect(40, y, doc.page.width - 80, 18).fill('#f3f4f6');
    row.forEach((cell, i) => { doc.fill('#111827').fontSize(7).font('Helvetica').text(String(cell ?? ''), 42 + i * colW, y + 4, { width: colW - 4 }); });
    y += 18;
  });

  doc.end();
};

module.exports = { getServicesData, getRevenueData, getInventoryData, getTechniciansData, getClientsData, generateExcel, generatePDF };
