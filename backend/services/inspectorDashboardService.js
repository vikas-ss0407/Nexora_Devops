const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')

const MS_IN_DAY = 1000 * 60 * 60 * 24
const ALERT_WINDOW_DAYS = 30
const LICENSE_VALIDITY_YEARS = 5

function parseDateSafe(value) {
  if (!value) {
    return null
  }

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  const normalized = String(value).trim()
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function getDaysLeft(expiryDate) {
  const now = new Date()
  const expiry = new Date(expiryDate)

  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const expiryMs = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime()

  return Math.ceil((expiryMs - todayMs) / MS_IN_DAY)
}

function buildShopAlert(docId, data) {
  const issueDate = parseDateSafe(data.licenseCreationDate) || parseDateSafe(data.createdAt)
  if (!issueDate) {
    return null
  }

  const expiryDate = new Date(issueDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + LICENSE_VALIDITY_YEARS)

  const daysLeft = getDaysLeft(expiryDate)
  if (daysLeft < -ALERT_WINDOW_DAYS || daysLeft > ALERT_WINDOW_DAYS) {
    return null
  }

  return {
    id: docId,
    entity: data.establishment?.shopFirmName || 'Unknown Shop',
    licenseNo: data.licenseNumber || '',
    expiryDate: formatIsoDate(expiryDate),
    daysLeft
  }
}

function buildPharmacistAlert(docId, data) {
  const issueDate = parseDateSafe(data.licenseCreationDate) || parseDateSafe(data.createdAt)
  if (!issueDate) {
    return null
  }

  const pharmacistName = data.pharmacist?.name
  const registrationId = data.pharmacist?.registrationId
  if (!pharmacistName && !registrationId) {
    return null
  }

  const expiryDate = new Date(issueDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + LICENSE_VALIDITY_YEARS)

  const daysLeft = getDaysLeft(expiryDate)
  if (daysLeft < -ALERT_WINDOW_DAYS || daysLeft > ALERT_WINDOW_DAYS) {
    return null
  }

  return {
    id: `${docId}-pharmacist`,
    entity: `${pharmacistName || 'Unknown Pharmacist'} (${data.establishment?.shopFirmName || 'Unknown Shop'})`,
    licenseNo: registrationId || '',
    expiryDate: formatIsoDate(expiryDate),
    daysLeft
  }
}

async function getInspectorDashboardSummary(district) {
  const snapshot = await db
    .collection(collections.LICENSES)
    .where('inspectorDistrict', '==', district)
    .get()

  const shopExpiryAlerts = []
  const pharmacistExpiryAlerts = []

  for (const doc of snapshot.docs) {
    const data = doc.data()

    const shopAlert = buildShopAlert(doc.id, data)
    if (shopAlert) {
      shopExpiryAlerts.push(shopAlert)
    }

    const pharmacistAlert = buildPharmacistAlert(doc.id, data)
    if (pharmacistAlert) {
      pharmacistExpiryAlerts.push(pharmacistAlert)
    }
  }

  shopExpiryAlerts.sort((a, b) => a.daysLeft - b.daysLeft)
  pharmacistExpiryAlerts.sort((a, b) => a.daysLeft - b.daysLeft)

  return {
    district,
    shopExpiryAlerts,
    pharmacistExpiryAlerts
  }
}

module.exports = {
  getInspectorDashboardSummary
}
