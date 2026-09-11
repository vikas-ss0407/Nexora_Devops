const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')
const { createLicenseAndAccount } = require('../services/licenseCreationService')
const {
  getInspectorWholesalerSales,
  getInspectorRetailerPurchases
} = require('../services/inspectorTransactionService')
const { getInspectorDashboardSummary } = require('../services/inspectorDashboardService')

async function createLicense(req, res) {
  try {
    const result = await createLicenseAndAccount(req.body)

    return res.status(201).json({
      message: 'License created successfully',
      ...result
    })
  } catch (error) {
    console.error('License creation error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      body: req.body ? Object.keys(req.body) : 'no body'
    })
    return res.status(error.statusCode || 500).json({ message: error.message })
  }
}

async function getInspectorProfile(req, res) {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ message: 'email is required' })
    }

    const snapshot = await db
      .collection(collections.INSPECTORS)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Inspector profile not found. Run seed script first.' })
    }

    const doc = snapshot.docs[0]
    return res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getInspectorRetailerVisibility(req, res) {
  try {
    const { district } = req.params

    const localRetailersSnapshot = await db
      .collection(collections.RETAILERS)
      .where('inspectorDistrict', '==', district)
      .get()

    const localRetailers = localRetailersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), source: 'local' }))

    const wholesalersSnapshot = await db
      .collection(collections.WHOLESALERS)
      .where('inspectorDistrict', '==', district)
      .get()

    const wholesalerIds = wholesalersSnapshot.docs.map((doc) => doc.id)

    let externalRetailerMap = new Map()
    if (wholesalerIds.length > 0) {
      for (let i = 0; i < wholesalerIds.length; i += 10) {
        const wholesalerChunk = wholesalerIds.slice(i, i + 10)
        const txSnapshot = await db
          .collection(collections.TRANSACTIONS)
          .where('sellerRole', '==', 'wholesaler')
          .where('sellerId', 'in', wholesalerChunk)
          .get()

        for (const txDoc of txSnapshot.docs) {
          const tx = txDoc.data()
          if (!tx.buyerId || tx.buyerRole !== 'retailer') {
            continue
          }

          if (externalRetailerMap.has(tx.buyerId)) {
            continue
          }

          const retailerDoc = await db.collection(collections.RETAILERS).doc(tx.buyerId).get()
          if (retailerDoc.exists) {
            const data = retailerDoc.data()
            if (data.inspectorDistrict !== district) {
              externalRetailerMap.set(tx.buyerId, {
                id: tx.buyerId,
                ...data,
                source: 'cross-district'
              })
            }
          }
        }
      }
    }

    return res.json({
      district,
      localRetailers,
      crossDistrictRetailers: Array.from(externalRetailerMap.values())
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getInspectorShops(req, res) {
  try {
    const { district } = req.query

    if (!district) {
      return res.status(400).json({ message: 'district is required' })
    }

    const snapshot = await db
      .collection(collections.LICENSES)
      .where('inspectorDistrict', '==', district)
      .get()

    const shops = snapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id,
        licenseId: doc.id,
        licenseNo: data.licenseNumber || '',
        type: data.licenseType || '',
        name: data.establishment?.shopFirmName || '',
        owner: data.establishment?.fullName || '',
        phone: data.establishment?.contact?.mobileNumber || '',
        email: data.establishment?.contact?.email || '',
        status: data.status || 'active',
        licenseData: data
      }
    })

    return res.json({ district, shops })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerSalesForInspector(req, res) {
  try {
    const { district } = req.query

    if (!district) {
      return res.status(400).json({ message: 'district is required' })
    }

    const result = await getInspectorWholesalerSales(district)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerPurchasesForInspector(req, res) {
  try {
    const { district } = req.query

    if (!district) {
      return res.status(400).json({ message: 'district is required' })
    }

    const result = await getInspectorRetailerPurchases(district)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getDashboardSummaryForInspector(req, res) {
  try {
    const { district } = req.query

    if (!district) {
      return res.status(400).json({ message: 'district is required' })
    }

    const result = await getInspectorDashboardSummary(district)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createLicense,
  getInspectorProfile,
  getInspectorRetailerVisibility,
  getInspectorShops,
  getWholesalerSalesForInspector,
  getRetailerPurchasesForInspector,
  getDashboardSummaryForInspector
}
