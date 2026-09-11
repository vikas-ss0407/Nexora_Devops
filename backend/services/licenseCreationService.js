const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')

const REQUIRED_FIELDS = [
  'inspectorEmail',
  'inspectorDistrict',
  'licenseType',
  'licenseNumber',
  'fullName',
  'shopFirmName',
  'district',
  'loginUsername',
  'loginPassword'
]

const BOOLEAN_FIELDS = [
  'storageAreaAvailable',
  'separateScheduleDrugStorage',
  'powerBackupAvailable',
  'acAvailable',
  'refrigeratorAvailable'
]

const NUMBER_FIELDS = [
  'yearsOfExperience',
  'totalShopArea',
  'shopLength',
  'shopBreadth',
  'acCapacity',
  'refrigeratorCapacity'
]

function normalizeValue(fieldName, value) {
  if (value === undefined || value === null) {
    return ''
  }

  if (BOOLEAN_FIELDS.includes(fieldName)) {
    return value === true || value === 'true'
  }

  if (NUMBER_FIELDS.includes(fieldName)) {
    if (value === '') {
      return null
    }

    const parsedValue = Number(value)
    return Number.isNaN(parsedValue) ? null : parsedValue
  }

  return typeof value === 'string' ? value.trim() : value
}

function normalizePayload(payload) {
  const normalizedPayload = {}

  for (const [fieldName, value] of Object.entries(payload || {})) {
    normalizedPayload[fieldName] = normalizeValue(fieldName, value)
  }

  normalizedPayload.loginUsername = normalizedPayload.loginUsername || normalizedPayload.loginEmail
  normalizedPayload.loginEmail = normalizedPayload.loginEmail || normalizedPayload.loginUsername

  return normalizedPayload
}

function validatePayload(payload) {
  for (const fieldName of REQUIRED_FIELDS) {
    if (!payload[fieldName]) {
      const error = new Error(`${fieldName} is required`)
      error.statusCode = 400
      throw error
    }
  }

  if (payload.licenseType !== 'Wholesale' && payload.licenseType !== 'Retail') {
    const error = new Error('licenseType must be either Wholesale or Retail')
    error.statusCode = 400
    throw error
  }

}

function getTargetCollection(licenseType) {
  return licenseType === 'Wholesale' ? collections.WHOLESALERS : collections.RETAILERS
}

function getAccountRole(licenseType) {
  return licenseType === 'Wholesale' ? 'wholesaler' : 'retailer'
}

function buildLicenseRecord(payload) {
  return {
    licenseNumber: payload.licenseNumber,
    licenseType: payload.licenseType,
    licenseDocument: payload.licenseDocument || '',
    generatedPassword: payload.generatedPassword || '',
    licenseCreationDate: payload.licenseCreationDate || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdByInspectorEmail: payload.inspectorEmail,
    inspectorDistrict: payload.inspectorDistrict,
    establishment: {
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth || '',
      shopFirmName: payload.shopFirmName,
      ownershipType: payload.ownershipType || '',
      address: {
        doorNo: payload.doorNo || '',
        area: payload.area || '',
        city: payload.city || '',
        post: payload.post || '',
        district: payload.district,
        state: payload.state || '',
        pinCode: payload.pinCode || ''
      },
      contact: {
        mobileNumber: payload.mobileNumber || '',
        email: payload.email || ''
      }
    },
    owner: {
      panCardNumber: payload.ownerPanCard || '',
      aadhaarNumber: payload.ownerAadharNumber || '',
      documents: {
        ownerAadharCardImage: null
      }
    },
    pharmacist: {
      name: payload.pharmacistName || '',
      registrationId: payload.registrationId || '',
      qualification: payload.qualification || '',
      yearsOfExperience: payload.yearsOfExperience,
      dateOfBirth: payload.pharmacistDateOfBirth || '',
      aadhaarNumber: payload.aadhaarNumber || '',
      mobileNumber: payload.pharmacistMobile || '',
      email: payload.pharmacistEmail || '',
      employmentType: payload.employmentType || '',
      documents: {
        pharmacistCertificate: null,
        pharmacistSignatureImage: null,
        appointmentDocument: null
      }
    },
    infrastructure: {
      totalShopArea: payload.totalShopArea,
      shopLength: payload.shopLength,
      shopBreadth: payload.shopBreadth,
      storageAreaAvailable: payload.storageAreaAvailable,
      separateScheduleDrugStorage: payload.separateScheduleDrugStorage,
      powerBackupAvailable: payload.powerBackupAvailable
    },
    equipment: {
      ac: {
        available: payload.acAvailable,
        brand: payload.acBrand || '',
        model: payload.acModel || '',
        capacity: payload.acCapacity
      },
      refrigerator: {
        available: payload.refrigeratorAvailable,
        brand: payload.refrigeratorBrand || '',
        model: payload.refrigeratorModel || '',
        capacity: payload.refrigeratorCapacity,
        temperatureRange: payload.refrigeratorTempRange || ''
      }
    },
    credentials: {
      username: payload.loginUsername,
      password: payload.loginPassword,
      email: payload.loginEmail || payload.loginUsername
    }
  }
}

function buildAccountRecord(payload, licenseId, accountRole) {
  return {
    username: payload.loginUsername,
    password: payload.loginPassword,
    email: payload.loginEmail || payload.loginUsername,
    role: accountRole,
    status: 'active',
    district: payload.district,
    inspectorDistrict: payload.inspectorDistrict,
    licenseId,
    licenseNumber: payload.licenseNumber,
    shopFirmName: payload.shopFirmName,
    ownerName: payload.fullName,
    mobileNumber: payload.mobileNumber || '',
    createdAt: new Date().toISOString()
  }
}

async function ensureAccountDoesNotExist(targetCollection, username) {
  const accountSnapshot = await db.collection(targetCollection).doc(username).get()
  if (accountSnapshot.exists) {
    const error = new Error('An account with this username already exists for the selected license type')
    error.statusCode = 409
    throw error
  }
}

async function createLicenseAndAccount(rawPayload) {
  const payload = normalizePayload(rawPayload)
  validatePayload(payload)

  const targetCollection = getTargetCollection(payload.licenseType)
  const accountRole = getAccountRole(payload.licenseType)
  await ensureAccountDoesNotExist(targetCollection, payload.loginUsername)

  const licenseRef = db.collection(collections.LICENSES).doc()
  const accountRef = db.collection(targetCollection).doc(payload.loginUsername)

  const licenseRecord = buildLicenseRecord(payload)
  const accountRecord = buildAccountRecord(payload, licenseRef.id, accountRole)

  const batch = db.batch()
  batch.set(licenseRef, licenseRecord)
  batch.set(accountRef, accountRecord)
  await batch.commit()

  return {
    licenseId: licenseRef.id,
    accountRole,
    username: payload.loginUsername
  }
}

module.exports = {
  createLicenseAndAccount
}
