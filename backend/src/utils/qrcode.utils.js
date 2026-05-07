const QRCode = require('qrcode')

const generateServiceQR = async (serviceId) => {
  const url = `${process.env.APP_URL || 'http://localhost:5000'}/services/${serviceId}`
  return QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
}

const generateMotorcycleQR = async (motoId, vin) => {
  const url = `${process.env.APP_URL || 'http://localhost:5000'}/motorcycles/${motoId}`
  return QRCode.toDataURL(url, { width: 300, margin: 2 })
}

module.exports = { generateServiceQR, generateMotorcycleQR }
