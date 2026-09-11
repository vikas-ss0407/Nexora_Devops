function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getPacking(type) {
  const normalized = String(type || '').toLowerCase()

  if (normalized === 'tablet' || normalized === 'capsule') {
    return { packType: 'Strip', packSize: "10's" }
  }

  if (normalized === 'syrup') {
    return { packType: 'Bottle', packSize: '100ml' }
  }

  if (normalized === 'injection') {
    return { packType: 'Ampoule', packSize: '2ml' }
  }

  if (normalized === 'inhaler') {
    return { packType: 'Unit', packSize: '1 inhaler' }
  }

  if (normalized === 'gel') {
    return { packType: 'Tube', packSize: '30g' }
  }

  if (normalized === 'powder') {
    return { packType: 'Jar', packSize: '100g' }
  }

  if (normalized === 'patch') {
    return { packType: 'Patch', packSize: '1 patch' }
  }

  return { packType: 'Unit', packSize: '1 unit' }
}

function getBaseMrp(type, isNarcotic) {
  const normalized = String(type || '').toLowerCase()

  if (isNarcotic) {
    if (normalized === 'injection') return 350
    if (normalized === 'patch') return 500
    if (normalized === 'syrup') return 180
    return 220
  }

  if (normalized === 'injection') return 120
  if (normalized === 'inhaler') return 260
  if (normalized === 'gel') return 90
  if (normalized === 'powder') return 160
  if (normalized === 'syrup') return 110
  if (normalized === 'capsule') return 140
  return 95
}

function generatePricing(type, isNarcotic, index) {
  const baseMrp = getBaseMrp(type, isNarcotic)
  const variance = (index % 9) * (isNarcotic ? 12 : 6)
  const mrp = Number((baseMrp + variance).toFixed(2))
  const rate = Number((mrp * (isNarcotic ? 0.82 : 0.72)).toFixed(2))

  return { mrp, rate }
}

function generateExpiry(index) {
  const year = 2026 + (index % 3)
  const month = ((index % 12) + 1).toString().padStart(2, '0')
  const day = ((index % 27) + 1).toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function generateManufactureDate(index) {
  const year = 2024 + (index % 2)
  const month = ((index % 12) + 1).toString().padStart(2, '0')
  const day = ((index % 27) + 1).toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildMedicineDoc(item, index) {
  const { packType, packSize } = getPacking(item.type)
  const { mrp, rate } = generatePricing(item.type, item.isNarcotic, index)

  return {
    manufacturerName: item.companyName,
    manufacturerSlug: toSlug(item.companyName),
    medicineName: item.medicineName,
    type: item.type,
    isNarcotic: item.isNarcotic,
    drugClass: item.isNarcotic ? 'narcotic' : 'normal',
    isOriginal: true,
    packType,
    packSize,
    batchNumber: `BATCH-${(10000 + index).toString()}`,
    manufactureDate: generateManufactureDate(index),
    expiryDate: generateExpiry(index),
    mrp,
    rate,
    colorCode: item.isNarcotic ? '#ef4444' : '#22c55e',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

const normalMedicines = [
  ['Apex Laboratories', 'P-500', 'Tablet'],
  ['Micro Labs', 'Dolo 650', 'Tablet'],
  ['GlaxoSmithKline', 'Calpol', 'Tablet'],
  ['GlaxoSmithKline', 'Augmentin', 'Tablet'],
  ['Cipla', 'Cifran', 'Tablet'],
  ['Cipla', 'Asthalin', 'Syrup'],
  ['FDC Limited', 'Zifi', 'Tablet'],
  ['Abbott', 'Digene', 'Syrup'],
  ['Abbott', 'Brufen', 'Tablet'],
  ['Sun Pharma', 'Pantocid', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Omez', 'Capsule'],
  ["Dr. Reddy's Laboratories", 'Stamlo', 'Tablet'],
  ['Alkem Laboratories', 'Taxim', 'Injection'],
  ['Aristo Pharmaceuticals', 'Monocef', 'Injection'],
  ['Mankind Pharma', 'Combiflam', 'Tablet'],
  ['Intas Pharmaceuticals', 'Cefaxone', 'Injection'],
  ['Himalaya Wellness', 'Liv 52', 'Syrup'],
  ['Abbott', 'Gelusil', 'Syrup'],
  ['Pfizer', 'Becosules', 'Capsule'],
  ['Pfizer', 'Corex', 'Syrup'],
  ['Glenmark Pharmaceuticals', 'Ascoril', 'Syrup'],
  ['Ipca Laboratories', 'Zerodol', 'Tablet'],
  ['Lupin', 'Azee', 'Tablet'],
  ['Zydus Cadila', 'Voveran', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Shelcal', 'Tablet'],
  ['Sanofi', 'Combiflam', 'Tablet'],
  ['Sun Pharma', 'Revital', 'Capsule'],
  ['Cipla', 'Omnacortil', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Nise', 'Tablet'],
  ['Alkem Laboratories', 'Pan 40', 'Tablet'],
  ['Cipla', 'Alex', 'Syrup'],
  ['Glenmark Pharmaceuticals', 'Ascoril C', 'Syrup'],
  ['Pfizer', 'Phensedyl', 'Syrup'],
  ['Sun Pharma', 'Cocorex', 'Syrup'],
  ['Cipla', 'Tossex', 'Syrup'],
  ['Mankind Pharma', 'Teddykoff', 'Syrup'],
  ["Dr. Reddy's Laboratories", 'Rexcof', 'Syrup'],
  ['Zydus Cadila', 'Oflin', 'Tablet'],
  ['Lupin', 'Suprax', 'Tablet'],
  ['Intas Pharmaceuticals', 'Pantodac', 'Tablet'],
  ['Sun Pharma', 'Volini', 'Gel'],
  ['Cipla', 'Budecort', 'Inhaler'],
  ['Cipla', 'Foracort', 'Inhaler'],
  ["Dr. Reddy's Laboratories", 'Razel', 'Tablet'],
  ['Alkem Laboratories', 'Clavam', 'Tablet'],
  ['Lupin', 'Cefakind', 'Tablet'],
  ['Zydus Cadila', 'Zyrova', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Telma', 'Tablet'],
  ['Sun Pharma', 'Glycomet', 'Tablet'],
  ['USV', 'Ecosprin', 'Tablet'],
  ['Abbott', 'Thyronorm', 'Tablet'],
  ['Sanofi', 'Amaryl', 'Tablet'],
  ['Sun Pharma', 'Istamet', 'Tablet'],
  ['Cipla', 'Gluconorm', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Reclide', 'Tablet'],
  ['Lupin', 'Gluconorm SR', 'Tablet'],
  ['Zydus Cadila', 'Metpure', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Losar', 'Tablet'],
  ['Sun Pharma', 'Cardace', 'Tablet'],
  ['Cipla', 'Amlong', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Stamlo Beta', 'Tablet'],
  ['Alkem Laboratories', 'Alkemix', 'Syrup'],
  ['Mankind Pharma', 'Unienzyme', 'Tablet'],
  ['Himalaya Wellness', 'Septilin', 'Syrup'],
  ['Dabur', 'Honitus', 'Syrup'],
  ['Zydus Wellness', 'Sugar Free', 'Powder'],
  ['Sun Pharma', 'Pantocid D', 'Capsule'],
  ['Cipla', 'Esomac', 'Capsule'],
  ["Dr. Reddy's Laboratories", 'Razo', 'Tablet'],
  ['Lupin', 'Pantocid IT', 'Capsule'],
  ['Alkem Laboratories', 'Pan D', 'Capsule'],
  ['Torrent Pharmaceuticals', 'Shelcal HD', 'Tablet'],
  ['Abbott', 'Digene Gel', 'Gel'],
  ['Cipla', 'Duolin', 'Inhaler'],
  ['Cipla', 'Seroflo', 'Inhaler'],
  ['Sun Pharma', 'Rosuvas', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Atorva', 'Tablet'],
  ['Lupin', 'Atorva Lupin', 'Tablet'],
  ['Zydus Cadila', 'Atorfit', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Nebicard', 'Tablet'],
  ['Sun Pharma', 'Ivabrad', 'Tablet'],
  ['Cipla', 'Clopitab', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Clopilet', 'Tablet'],
  ['Lupin', 'Clopitab Plus', 'Tablet'],
  ['Zydus Cadila', 'Clopivas', 'Tablet'],
  ['Abbott', 'Cremaffin', 'Syrup'],
  ['Dabur', 'Pudin Hara', 'Capsule'],
  ['Himalaya Wellness', 'Liv 52 DS', 'Syrup'],
  ['Mankind Pharma', 'Gas-O-Fast', 'Powder'],
  ['Sun Pharma', 'Movicol', 'Powder']
]

const narcoticMedicines = [
  ['Sun Pharma', 'Ultracet', 'Tablet'],
  ['Abbott Healthcare', 'Contramal', 'Injection'],
  ['Pfizer', 'Corex', 'Syrup'],
  ['Abbott', 'Phensedyl', 'Syrup'],
  ['Cipla', 'Codistar', 'Syrup'],
  ['Wockhardt', 'Proxyvon', 'Capsule'],
  ['Sun Pharma', 'Tramazac', 'Tablet'],
  ['Intas Pharmaceuticals', 'Tramadol Intas', 'Capsule'],
  ['Lupin', 'Tramadol Lupin', 'Tablet'],
  ['Zydus Cadila', 'Tramazyd', 'Tablet'],
  ['Alkem Laboratories', 'Tramacet', 'Tablet'],
  ['Mankind Pharma', 'Tramadol Mankind', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Tramadol DRL', 'Capsule'],
  ['Sun Pharma', 'Alprax', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Alprazolam Torrent', 'Tablet'],
  ['Intas Pharmaceuticals', 'Alprazolam Intas', 'Tablet'],
  ['Cipla', 'Alprazolam Cipla', 'Tablet'],
  ['Sun Pharma', 'Clonotril', 'Tablet'],
  ['Torrent Pharmaceuticals', 'Clonazepam Torrent', 'Tablet'],
  ['Intas Pharmaceuticals', 'Clonazepam Intas', 'Tablet'],
  ['Abbott', 'Valium', 'Injection'],
  ['Roche', 'Valium', 'Tablet'],
  ['Cipla', 'Diazepam Cipla', 'Tablet'],
  ['Sun Pharma', 'Nitrosun', 'Tablet'],
  ['Intas Pharmaceuticals', 'Nitrazepam Intas', 'Tablet'],
  ['Sun Pharma', 'Zapiz', 'Tablet'],
  ['Intas Pharmaceuticals', 'Zolpidem Intas', 'Tablet'],
  ['Cipla', 'Zolfresh', 'Tablet'],
  ['Sun Pharma', 'Buprenorphine Sun', 'Injection'],
  ['Rusan Pharma', 'Buprenorphine', 'Injection'],
  ['Neon Laboratories', 'Pentazocine', 'Injection'],
  ['Samarth Pharma', 'Pentazocine', 'Injection'],
  ['Sun Pharma', 'Fentanyl Patch', 'Patch'],
  ['Janssen', 'Duragesic', 'Patch'],
  ['Sun Pharma', 'Morphine Sulfate', 'Injection'],
  ['Troikaa Pharma', 'Morphine', 'Injection'],
  ['Sun Pharma', 'Methadone', 'Tablet'],
  ['Troikaa Pharma', 'Methadone', 'Injection'],
  ['Abbott', 'Tapentadol', 'Tablet'],
  ['Sun Pharma', 'Tapal', 'Tablet'],
  ['Intas Pharmaceuticals', 'Tapentadol Intas', 'Tablet'],
  ['Sun Pharma', 'Codeine Syrup', 'Syrup'],
  ['Abbott', 'Codeine Linctus', 'Syrup'],
  ['Cipla', 'Codeine Phosphate', 'Tablet'],
  ['Sun Pharma', 'Lorazepam', 'Tablet'],
  ['Intas Pharmaceuticals', 'Lorazepam Intas', 'Tablet'],
  ["Dr. Reddy's Laboratories", 'Lorazepam DRL', 'Tablet'],
  ['Sun Pharma', 'Midazolam', 'Injection'],
  ['Neon Laboratories', 'Midazolam', 'Injection'],
  ['Troikaa Pharma', 'Midazolam', 'Injection']
]

function getSeedCatalogDocs() {
  const medicines = [
    ...normalMedicines.map(([companyName, medicineName, type]) => ({
      companyName,
      medicineName,
      type,
      isNarcotic: false
    })),
    ...narcoticMedicines.map(([companyName, medicineName, type]) => ({
      companyName,
      medicineName,
      type,
      isNarcotic: true
    }))
  ]

  return medicines.map((item, index) => buildMedicineDoc(item, index + 1))
}

module.exports = {
  getSeedCatalogDocs
}
