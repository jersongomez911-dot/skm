const svc = require('./reports.service');

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '-';

const servicesReport = async (req, res, next) => {
  try {
    const { format = 'json', dateFrom, dateTo, status } = req.query;
    const data = await svc.getServicesData({ dateFrom, dateTo, status });

    if (format === 'pdf') {
      return svc.generatePDF('Reporte de Servicios',
        ['Fecha', 'Estado', 'Prioridad', 'Cliente', 'Motocicleta', 'VIN', 'Técnico', 'Costo Total'],
        data.map(s => [fmtDate(s.createdAt), s.status, s.priority, s.motorcycle.client.fullName, `${s.motorcycle.brand} ${s.motorcycle.model}`, s.motorcycle.vin, s.technician?.name || '-', fmt(s.totalCost)]),
        res
      );
    }

    if (format === 'xlsx') {
      const wb = await svc.generateExcel(data, {
        sheetName: 'Servicios',
        columns: [
          { header: 'Fecha', key: 'createdAt', width: 15 }, { header: 'Estado', key: 'status', width: 15 },
          { header: 'Prioridad', key: 'priority', width: 12 }, { header: 'Costo Total', key: 'totalCost', width: 15 },
        ],
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="servicios.xlsx"');
      return wb.xlsx.write(res).then(() => res.end());
    }

    res.json({ success: true, data, meta: { total: data.length } });
  } catch (err) { next(err); }
};

const revenueReport = async (req, res, next) => {
  try {
    const { format = 'json', dateFrom, dateTo } = req.query;
    const { services, total } = await svc.getRevenueData({ dateFrom, dateTo });

    if (format === 'pdf') {
      return svc.generatePDF(`Reporte de Ingresos — Total: ${fmt(total)}`,
        ['Fecha Entrega', 'Cliente', 'Moto', 'Mano de Obra', 'Repuestos', 'Total'],
        services.map(s => [fmtDate(s.deliveredAt), s.motorcycle.client.fullName, `${s.motorcycle.brand} ${s.motorcycle.model}`, fmt(s.laborCost), fmt(s.partsCost), fmt(s.totalCost)]),
        res
      );
    }
    
    if (format === 'xlsx') {
      const wb = await svc.generateExcel(services, {
        sheetName: 'Ingresos',
        columns: [
          { header: 'Fecha Entrega', key: 'deliveredAt', width: 15 },
          { header: 'Cliente', key: 'motorcycle.client.fullName', width: 25 },
          { header: 'Moto Marca', key: 'motorcycle.brand', width: 15 },
          { header: 'Moto Modelo', key: 'motorcycle.model', width: 15 },
          { header: 'Mano de Obra', key: 'laborCost', width: 15 },
          { header: 'Repuestos', key: 'partsCost', width: 15 },
          { header: 'Total', key: 'totalCost', width: 15 },
        ],
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="ingresos.xlsx"');
      return wb.xlsx.write(res).then(() => res.end());
    }

    res.json({ success: true, data: services, meta: { total } });
  } catch (err) { next(err); }
};

const inventoryReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const data = await svc.getInventoryData();

    if (format === 'pdf') {
      return svc.generatePDF('Reporte de Inventario',
        ['SKU', 'Nombre', 'Categoría', 'Marca', 'Stock', 'Stock Mín', 'Costo Unit.', 'Proveedor'],
        data.map(i => [i.sku, i.name, i.category || '-', i.brand || '-', i.quantity, i.minStock, fmt(i.unitCost), i.supplier?.name || '-']),
        res
      );
    }
    
    if (format === 'xlsx') {
      const wb = await svc.generateExcel(data, {
        sheetName: 'Inventario',
        columns: [
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Nombre', key: 'name', width: 25 },
          { header: 'Categoría', key: 'category', width: 15 },
          { header: 'Marca', key: 'brand', width: 15 },
          { header: 'Stock', key: 'quantity', width: 10 },
          { header: 'Stock Mínimo', key: 'minStock', width: 15 },
          { header: 'Costo Unitario', key: 'unitCost', width: 15 },
          { header: 'Proveedor', key: 'supplier.name', width: 20 },
        ],
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="inventario.xlsx"');
      return wb.xlsx.write(res).then(() => res.end());
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const techniciansReport = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await svc.getTechniciansData({ dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const clientsReport = async (req, res, next) => {
  try {
    const data = await svc.getClientsData();
    const { format = 'json' } = req.query;
    if (format === 'pdf') {
      return svc.generatePDF('Reporte de Clientes',
        ['Nombre', 'Documento', 'Email', 'Teléfono', 'Ciudad', 'Motos', 'Servicios'],
        data.map(c => [c.fullName, c.documentNumber, c.email, c.phone, c.city || '-', c._count.motorcycles, c.motorcycles.reduce((s, m) => s + m._count.services, 0)]),
        res
      );
    }
    
    if (format === 'xlsx') {
      const mappedData = data.map(c => ({
         ...c,
         totalMotos: c._count.motorcycles,
         totalServicios: c.motorcycles.reduce((s, m) => s + m._count.services, 0)
      }));

      const wb = await svc.generateExcel(mappedData, {
        sheetName: 'Clientes',
        columns: [
          { header: 'Nombre', key: 'fullName', width: 25 },
          { header: 'Documento', key: 'documentNumber', width: 15 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Teléfono', key: 'phone', width: 15 },
          { header: 'Ciudad', key: 'city', width: 15 },
          { header: 'Motos', key: 'totalMotos', width: 10 },
          { header: 'Servicios', key: 'totalServicios', width: 10 },
        ],
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="clientes.xlsx"');
      return wb.xlsx.write(res).then(() => res.end());
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { servicesReport, revenueReport, inventoryReport, techniciansReport, clientsReport };
