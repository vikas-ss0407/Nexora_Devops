const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')

function toIsoDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return parsed.toISOString().slice(0, 10)
}

function buildRetailerOrderBillNo() {
  return `WHL-${Date.now()}`
}

function buildRetailerCustomerBillNo() {
  return `CST-${Date.now()}`
}

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

function deriveLicenseExpiryDate(licenseData, retailerShop) {
  if (retailerShop.licenseExpiryDate) {
    return retailerShop.licenseExpiryDate
  }

  if (licenseData?.expiryDate) {
    return licenseData.expiryDate
  }

  const issueDate =
    parseDateSafe(licenseData?.licenseCreationDate) ||
    parseDateSafe(retailerShop.licenseIssueDate) ||
    parseDateSafe(licenseData?.createdAt) ||
    parseDateSafe(retailerShop.createdAt)

  if (!issueDate) {
    return '-'
  }

  const expiry = new Date(issueDate)
  expiry.setFullYear(expiry.getFullYear() + 5)
  return expiry.toISOString().slice(0, 10)
}

async function ensureShopExists(collectionName, id) {
  if (!id) return null
  const doc = await db.collection(collectionName).doc(String(id)).get()
  return doc.exists ? { id: doc.id, ...doc.data() } : null
}

async function resolveRetailerShop(identifier) {
  if (!identifier) return null

  const byId = await ensureShopExists(collections.RETAILERS, identifier)
  if (byId) {
    return byId
  }

  const byUsernameSnapshot = await db
    .collection(collections.RETAILERS)
    .where('username', '==', String(identifier))
    .limit(1)
    .get()

  if (!byUsernameSnapshot.empty) {
    const doc = byUsernameSnapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  }

  return null
}

function buildWholesalerLabel(wholesaler) {
  return (
    wholesaler.shopFirmName ||
    wholesaler.username ||
    wholesaler.companyName ||
    wholesaler.id
  )
}

async function getRetailerWholesalers(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    let wholesalerQuery = db.collection(collections.WHOLESALERS)
    if (retailerShop.inspectorDistrict) {
      wholesalerQuery = wholesalerQuery.where('inspectorDistrict', '==', retailerShop.inspectorDistrict)
    }

    const wholesalerSnapshot = await wholesalerQuery.get()

    const wholesalers = wholesalerSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .map((wholesaler) => ({
        id: wholesaler.id,
        name: buildWholesalerLabel(wholesaler),
        district: wholesaler.district || '',
        inspectorDistrict: wholesaler.inspectorDistrict || ''
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))

    return res.json({ retailerId, wholesalers })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerWholesalerCatalog(req, res) {
  try {
    const { retailerId, wholesalerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const wholesalerShop = await ensureShopExists(collections.WHOLESALERS, wholesalerId)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const stockSnapshot = await db
      .collection(collections.WHOLESALER_STOCK)
      .where('wholesalerId', '==', wholesalerShop.id)
      .get()

    const medicines = stockSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => Number(item.quantity || 0) > 0)
      .map((item) => {
        const isNarcotic =
          Boolean(item.isNarcotic) || String(item.drugClass || '').toLowerCase() === 'narcotic'

        return {
          id: item.id,
          medicineId: item.medicineId || item.id,
          name: item.medicineName || '-',
          batch: item.batch || '-',
          company: item.manufacturerName || item.companyName || '',
          manufactureDate: item.manufactureDate || null,
          expiryDate: item.expiryDate || null,
          price: Number(item.rate || 0),
          mrp: Number(item.mrp || 0),
          stock: Number(item.quantity || 0),
          offer: item.offer || '',
          isNarcotic,
          drugClass: isNarcotic ? 'narcotic' : 'normal'
        }
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))

    return res.json({
      retailerId,
      wholesaler: {
        id: wholesalerShop.id,
        name: buildWholesalerLabel({ id: wholesalerShop.id, ...wholesalerShop })
      },
      medicines
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerSellCatalog(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const stockSnapshot = await db
      .collection(collections.RETAILER_STOCK)
      .where('retailerId', '==', retailerId)
      .get()

    const medicines = stockSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => Number(item.quantity || 0) > 0)
      .map((item) => {
        const packSizeText = String(item.packSize || '')
        const stripSizeMatch = packSizeText.match(/(\d+)/)
        const stripSize = stripSizeMatch ? Number(stripSizeMatch[1]) : 0

        return {
          id: item.id,
          stockId: item.id,
          medicineId: item.medicineId || item.id,
          name: item.medicineName || '-',
          batch: item.batch || '-',
          company: item.manufacturerName || item.companyName || '',
          manufactureDate: item.manufactureDate || null,
          expiryDate: item.expiryDate || null,
          stock: Number(item.quantity || 0),
          sellingPrice: Number(item.mrp || item.rate || 0),
          mrp: Number(item.mrp || 0),
          category: item.packType || 'Unit',
          categoryUnit: item.packSize || '1 unit',
          tabletsPerStrip: stripSize > 0 ? stripSize : 1,
          isNarcotic: Boolean(item.isNarcotic)
        }
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))

    return res.json({ retailerId, medicines })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createRetailerCustomerSale(req, res) {
  try {
    const {
      retailerId,
      customerName,
      customerPhone,
      doctorName,
      items
    } = req.body

    if (!retailerId || !customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'retailerId, customerName and items are required' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found for retailerId' })
    }

    const nowIso = new Date().toISOString()
    const saleItems = []
    let totalAmount = 0
    let totalQuantity = 0

    for (const item of items) {
      const stockId = String(item.stockId || item.drugId || item.medicineId || '')
      const saleQty = Number(item.quantity)

      if (!stockId || !Number.isFinite(saleQty) || saleQty <= 0) {
        return res.status(400).json({ message: 'Each item must include valid stockId and quantity' })
      }

      const stockRef = db.collection(collections.RETAILER_STOCK).doc(stockId)
      const stockDoc = await stockRef.get()

      if (!stockDoc.exists) {
        return res.status(404).json({ message: `Stock item not found for id: ${stockId}` })
      }

      const stockData = stockDoc.data()
      if (String(stockData.retailerId) !== String(retailerId)) {
        return res.status(403).json({ message: 'Stock item does not belong to this retailer' })
      }

      const availableQty = Number(stockData.quantity || 0)
      if (saleQty > availableQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${stockData.medicineName || stockId}. Available: ${availableQty}`
        })
      }

      const unitPrice = Number(stockData.mrp || stockData.rate || 0)
      const lineAmount = Number((unitPrice * saleQty).toFixed(2))

      saleItems.push({
        stockId,
        medicineId: stockData.medicineId || stockId,
        medicineName: stockData.medicineName || '-',
        batch: stockData.batch || '-',
        quantity: saleQty,
        packaging: item.packaging || '',
        rate: Number(stockData.rate || 0),
        mrp: Number(stockData.mrp || 0),
        manufactureDate: stockData.manufactureDate || null,
        expiryDate: stockData.expiryDate || null,
        isNarcotic: Boolean(stockData.isNarcotic),
        amount: lineAmount
      })

      totalAmount += lineAmount
      totalQuantity += saleQty

      await stockRef.update({
        quantity: availableQty - saleQty,
        updatedAt: nowIso
      })
    }

    const billNo = buildRetailerCustomerBillNo()

    const tx = {
      billNo,
      sellerRole: 'retailer',
      sellerId: retailerId,
      sellerName: retailerShop.shopFirmName || retailerShop.username || retailerId,
      buyerRole: 'customer',
      buyerId: null,
      buyerName: customerName,
      customerName,
      customerPhone: customerPhone || '',
      doctorName: doctorName || '',
      items: saleItems,
      quantity: totalQuantity,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderType: 'retailer_customer_sale',
      orderStatus: 'completed',
      createdAt: nowIso,
      updatedAt: nowIso
    }

    const ref = await db.collection(collections.TRANSACTIONS).add(tx)
    return res.status(201).json({
      message: 'Customer sale recorded',
      transactionId: ref.id,
      billNo,
      totalAmount: tx.totalAmount
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createRetailerOrder(req, res) {
  try {
    const {
      retailerId,
      retailerName,
      wholesalerId,
      wholesalerName,
      district,
      items
    } = req.body

    if (!retailerId || !wholesalerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'retailerId, wholesalerName and items are required' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found for retailerId' })
    }

    if (wholesalerId) {
      const wholesalerShop = await ensureShopExists(collections.WHOLESALERS, wholesalerId)
      if (!wholesalerShop) {
        return res.status(404).json({ message: 'Wholesaler shop not found for wholesalerId' })
      }
    }

    const normalizedItems = []
    let totalAmount = 0

    for (const item of items) {
      const quantity = Number(item.quantity)
      const rate = Number(item.rate)

      if (!item.medicineName || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Each item must include medicineName and valid quantity' })
      }

      const amount = Number((Number.isFinite(rate) ? rate * quantity : 0).toFixed(2))
      totalAmount += amount

      normalizedItems.push({
        id: String(item.id || `${item.medicineName}-${item.batch || ''}`),
        medicineName: item.medicineName,
        batch: item.batch || '',
        quantity,
        rate: Number.isFinite(rate) ? rate : 0,
        mrp: Number.isFinite(Number(item.mrp)) ? Number(item.mrp) : 0,
        manufactureDate: item.manufactureDate || null,
        expiryDate: item.expiryDate || null,
        amount
      })
    }

    const nowIso = new Date().toISOString()

    const orderPayload = {
      billNo: buildRetailerOrderBillNo(),
      sellerRole: 'wholesaler',
      sellerId: wholesalerId || null,
      sellerName: wholesalerName,
      buyerRole: 'retailer',
      buyerId: retailerId,
      buyerName: retailerName || '',
      district: district || null,
      orderType: 'retailer_purchase_order',
      orderStatus: 'pending_approval',
      deliveredDate: toIsoDate(nowIso),
      items: normalizedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      createdAt: nowIso,
      updatedAt: nowIso
    }

    const orderRef = await db.collection(collections.TRANSACTIONS).add(orderPayload)

    return res.status(201).json({
      message: 'Retailer order created successfully',
      orderId: orderRef.id,
      billNo: orderPayload.billNo,
      totalAmount: orderPayload.totalAmount
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerApproveStockBills(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('buyerRole', '==', 'retailer')
      .where('buyerId', '==', retailerId)
      .get()

    const bills = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((tx) => tx.orderType === 'retailer_purchase_order')
      .filter((tx) => tx.orderStatus !== 'approved')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((tx) => ({
        id: tx.id,
        billNo: tx.billNo || tx.id,
        wholesaler: tx.sellerName || 'Unknown Wholesaler',
        deliveredDate: tx.deliveredDate || toIsoDate(tx.createdAt),
        totalAmount: Number(tx.totalAmount || 0),
        orderStatus: tx.orderStatus || 'pending_approval',
        medicines: Array.isArray(tx.items)
          ? tx.items.map((item) => ({
              id: String(item.id || item.medicineName || Math.random()),
              name: item.medicineName || '-',
              batch: item.batch || '-',
              quantity: Number(item.quantity || 0),
              price: Number(item.rate || 0),
              mrp: Number(item.mrp || 0),
              expiry: item.expiryDate || null,
              amount: Number(item.amount || Number(item.rate || 0) * Number(item.quantity || 0))
            }))
          : []
      }))

    return res.json({ retailerId, bills })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function approveRetailerStock(req, res) {
  try {
    const { retailerId, orderId } = req.params
    const { acceptedMedicineIds } = req.body

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    if (!Array.isArray(acceptedMedicineIds) || acceptedMedicineIds.length === 0) {
      return res.status(400).json({ message: 'acceptedMedicineIds is required' })
    }

    const ref = db.collection(collections.TRANSACTIONS).doc(orderId)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const order = doc.data()
    if (order.buyerRole !== 'retailer' || order.buyerId !== retailerId) {
      return res.status(403).json({ message: 'You are not allowed to update this order' })
    }

    const items = Array.isArray(order.items) ? order.items : []
    const acceptedSet = new Set(acceptedMedicineIds.map((id) => String(id)))

    const acceptedItems = items.filter((item) => acceptedSet.has(String(item.id || item.medicineName || '')))
    const pendingItems = items.filter((item) => !acceptedSet.has(String(item.id || item.medicineName || '')))

    if (acceptedItems.length === 0) {
      return res.status(400).json({ message: 'Select at least one medicine to approve' })
    }

    const nowIso = new Date().toISOString()

    // Move accepted medicines into retailer stock.
    for (const item of acceptedItems) {
      const medicineName = item.medicineName || ''
      const batch = item.batch || ''
      const quantity = Number(item.quantity || 0)

      if (!medicineName || quantity <= 0) {
        continue
      }

      const existingSnapshot = await db
        .collection(collections.RETAILER_STOCK)
        .where('retailerId', '==', retailerId)
        .where('medicineName', '==', medicineName)
        .where('batch', '==', batch)
        .limit(1)
        .get()

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0]
        const existingQty = Number(existingDoc.data().quantity || 0)

        await existingDoc.ref.update({
          quantity: existingQty + quantity,
          rate: Number(item.rate || 0),
          mrp: Number(item.mrp || 0),
          expiryDate: item.expiryDate || null,
          updatedAt: nowIso
        })
      } else {
        await db.collection(collections.RETAILER_STOCK).add({
          retailerId,
          medicineName,
          batch,
          quantity,
          rate: Number(item.rate || 0),
          mrp: Number(item.mrp || 0),
          expiryDate: item.expiryDate || null,
          sourceOrderId: orderId,
          createdAt: nowIso,
          updatedAt: nowIso
        })
      }
    }

    // Once approval is submitted, clear this bill from Approve Stock list.
    const orderStatus = 'approved'

    await ref.update({
      orderStatus,
      acceptedMedicineIds: acceptedItems.map((item) => String(item.id || item.medicineName || '')),
      pendingMedicineIds: pendingItems.map((item) => String(item.id || item.medicineName || '')),
      approvedAt: nowIso,
      updatedAt: nowIso
    })

    return res.json({
      message: 'Stock approval updated successfully',
      orderStatus,
      acceptedCount: acceptedItems.length,
      pendingCount: pendingItems.length
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerPurchaseHistory(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('buyerRole', '==', 'retailer')
      .where('buyerId', '==', retailerId)
      .get()

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return res.json({ retailerId, transactions: items })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerPendingStockItems(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('buyerRole', '==', 'retailer')
      .where('buyerId', '==', retailerId)
      .get()

    const pendingItems = []

    snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((tx) => tx.orderType === 'retailer_purchase_order')
      .forEach((tx) => {
        const pendingIds = Array.isArray(tx.pendingMedicineIds) ? tx.pendingMedicineIds.map(String) : []
        if (pendingIds.length === 0) return

        const items = Array.isArray(tx.items) ? tx.items : []
        items.forEach((item) => {
          const itemId = String(item.id || item.medicineName || '')
          if (!pendingIds.includes(itemId)) return

          pendingItems.push({
            id: `${tx.id}-${itemId}`,
            orderId: tx.id,
            medicineId: itemId,
            billNo: tx.billNo || tx.id,
            wholesaler: tx.sellerName || 'Unknown Wholesaler',
            medicine: item.medicineName || '-',
            batch: item.batch || '-',
            quantity: Number(item.quantity || 0),
            price: Number(item.rate || 0),
            mrp: Number(item.mrp || 0),
            expiry: item.expiryDate || '-',
            deliveredDate: tx.deliveredDate || toIsoDate(tx.createdAt),
            reason: 'Not received in delivery',
            followUpRequested: Boolean(tx.pendingFollowUp?.[itemId]),
            followUpRequestedAt: tx.pendingFollowUp?.[itemId]?.requestedAt || null
          })
        })
      })

    pendingItems.sort((a, b) => String(b.deliveredDate || '').localeCompare(String(a.deliveredDate || '')))

    return res.json({ retailerId, pendingItems })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createRetailerPendingStockFollowUp(req, res) {
  try {
    const { retailerId, orderId } = req.params
    const { medicineId, note } = req.body

    if (!medicineId) {
      return res.status(400).json({ message: 'medicineId is required' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const ref = db.collection(collections.TRANSACTIONS).doc(String(orderId))
    const doc = await ref.get()
    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const order = doc.data()
    if (order.buyerRole !== 'retailer' || String(order.buyerId) !== String(retailerId)) {
      return res.status(403).json({ message: 'You are not allowed to update this order' })
    }

    const pendingIds = Array.isArray(order.pendingMedicineIds) ? order.pendingMedicineIds.map(String) : []
    if (!pendingIds.includes(String(medicineId))) {
      return res.status(400).json({ message: 'medicineId is not currently pending in this order' })
    }

    const nowIso = new Date().toISOString()
    const pendingFollowUp = {
      ...(order.pendingFollowUp || {}),
      [String(medicineId)]: {
        requestedAt: nowIso,
        note: note || ''
      }
    }

    await ref.update({
      pendingFollowUp,
      updatedAt: nowIso
    })

    return res.json({
      message: 'Follow-up request submitted',
      orderId,
      medicineId: String(medicineId)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function markRetailerPendingStockReceived(req, res) {
  try {
    const { retailerId, orderId } = req.params
    const { medicineId } = req.body

    if (!medicineId) {
      return res.status(400).json({ message: 'medicineId is required' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const ref = db.collection(collections.TRANSACTIONS).doc(String(orderId))
    const doc = await ref.get()
    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const order = doc.data()
    if (order.buyerRole !== 'retailer' || String(order.buyerId) !== String(retailerId)) {
      return res.status(403).json({ message: 'You are not allowed to update this order' })
    }

    const pendingIds = Array.isArray(order.pendingMedicineIds) ? order.pendingMedicineIds.map(String) : []
    if (!pendingIds.includes(String(medicineId))) {
      return res.status(400).json({ message: 'medicineId is not currently pending in this order' })
    }

    const items = Array.isArray(order.items) ? order.items : []
    const receivedItem = items.find((item) => String(item.id || item.medicineName || '') === String(medicineId))
    if (!receivedItem) {
      return res.status(404).json({ message: 'Pending medicine item not found in order' })
    }

    const nowIso = new Date().toISOString()
    const medicineName = receivedItem.medicineName || ''
    const batch = receivedItem.batch || ''
    const quantity = Number(receivedItem.quantity || 0)

    if (medicineName && quantity > 0) {
      const existingSnapshot = await db
        .collection(collections.RETAILER_STOCK)
        .where('retailerId', '==', retailerId)
        .where('medicineName', '==', medicineName)
        .where('batch', '==', batch)
        .limit(1)
        .get()

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0]
        const existingQty = Number(existingDoc.data().quantity || 0)
        await existingDoc.ref.update({
          quantity: existingQty + quantity,
          rate: Number(receivedItem.rate || 0),
          mrp: Number(receivedItem.mrp || 0),
          manufactureDate: receivedItem.manufactureDate || null,
          expiryDate: receivedItem.expiryDate || null,
          updatedAt: nowIso
        })
      } else {
        await db.collection(collections.RETAILER_STOCK).add({
          retailerId,
          medicineName,
          batch,
          quantity,
          rate: Number(receivedItem.rate || 0),
          mrp: Number(receivedItem.mrp || 0),
          manufactureDate: receivedItem.manufactureDate || null,
          expiryDate: receivedItem.expiryDate || null,
          sourceOrderId: orderId,
          createdAt: nowIso,
          updatedAt: nowIso
        })
      }
    }

    const nextPendingIds = pendingIds.filter((id) => id !== String(medicineId))
    const pendingFollowUp = { ...(order.pendingFollowUp || {}) }
    delete pendingFollowUp[String(medicineId)]

    await ref.update({
      pendingMedicineIds: nextPendingIds,
      pendingFollowUp,
      updatedAt: nowIso
    })

    return res.json({
      message: 'Pending stock marked as received',
      orderId,
      medicineId: String(medicineId),
      remainingPendingCount: nextPendingIds.length
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerSalesHistory(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('sellerRole', '==', 'retailer')
      .where('sellerId', '==', retailerId)
      .get()

    const sales = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((tx) => tx.orderType === 'retailer_customer_sale')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((tx) => ({
        id: tx.id,
        billNo: tx.billNo || tx.id,
        customerName: tx.customerName || tx.buyerName || 'Walk-in Customer',
        doctorName: tx.doctorName || '',
        date: tx.createdAt ? String(tx.createdAt).slice(0, 10) : '',
        createdAt: tx.createdAt || '',
        totalAmount: Number(tx.totalAmount || 0),
        orderStatus: tx.orderStatus || 'completed',
        items: Array.isArray(tx.items)
          ? tx.items.map((item, index) => ({
              id: String(item.stockId || item.medicineId || `${item.medicineName || 'item'}-${index}`),
              medicineName: item.medicineName || '-',
              batch: item.batch || '-',
              quantity: Number(item.quantity || 0),
              packaging: item.packaging || '',
              company: item.company || '',
              expiryDate: item.expiryDate || null,
              rate: Number(item.rate || 0),
              amount: Number(item.amount || Number(item.mrp || item.rate || 0) * Number(item.quantity || 0))
            }))
          : []
      }))

    return res.json({ retailerId, sales })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerReturnProductBills(req, res) {
  try {
    const { retailerId } = req.params

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('buyerRole', '==', 'retailer')
      .where('buyerId', '==', retailerId)
      .get()

    const bills = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((tx) => tx.orderType === 'retailer_purchase_order')
      .filter((tx) => tx.orderStatus === 'approved')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((tx) => ({
        id: tx.id,
        billNo: tx.billNo || tx.id,
        date: tx.deliveredDate || toIsoDate(tx.createdAt),
        wholesalerId: tx.sellerId || '',
        wholesalerName: tx.sellerName || 'Unknown Wholesaler',
        products: Array.isArray(tx.items)
          ? tx.items.map((item, index) => ({
              id: String(item.id || item.medicineId || `${item.medicineName || 'item'}-${index}`),
              medicineId: String(item.medicineId || item.id || ''),
              name: item.medicineName || '-',
              batch: item.batch || '-',
              quantity: Number(item.quantity || 0),
              packaging: item.packType || 'Unit',
              mrp: Number(item.mrp || 0),
              rate: Number(item.rate || 0),
              manufactureDate: item.manufactureDate || null,
              expiryDate: item.expiryDate || null,
              isNarcotic: Boolean(item.isNarcotic)
            }))
          : []
      }))

    return res.json({ retailerId, bills })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createRetailerReturnRequest(req, res) {
  try {
    const { retailerId } = req.params
    const {
      orderId,
      billNo,
      wholesalerId,
      reason,
      returnType,
      notes,
      items
    } = req.body

    if (!reason || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'reason and items are required' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    let orderRef = null
    let order = null

    if (orderId) {
      orderRef = db.collection(collections.TRANSACTIONS).doc(String(orderId))
      const doc = await orderRef.get()
      if (!doc.exists) {
        return res.status(404).json({ message: 'Order not found' })
      }
      order = doc.data()
    } else if (billNo) {
      const snapshot = await db
        .collection(collections.TRANSACTIONS)
        .where('buyerRole', '==', 'retailer')
        .where('buyerId', '==', retailerId)
        .where('billNo', '==', String(billNo))
        .limit(1)
        .get()

      if (snapshot.empty) {
        return res.status(404).json({ message: 'Order not found for billNo' })
      }

      orderRef = snapshot.docs[0].ref
      order = snapshot.docs[0].data()
    } else {
      return res.status(400).json({ message: 'orderId or billNo is required' })
    }

    if (order.buyerRole !== 'retailer' || String(order.buyerId) !== String(retailerId)) {
      return res.status(403).json({ message: 'You are not allowed to create return for this order' })
    }

    const resolvedWholesalerId = wholesalerId || order.sellerId
    if (!resolvedWholesalerId) {
      return res.status(400).json({ message: 'wholesalerId is missing for this order' })
    }

    const wholesalerShop = await ensureShopExists(collections.WHOLESALERS, resolvedWholesalerId)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const orderItems = Array.isArray(order.items) ? order.items : []
    const nowIso = new Date().toISOString()
    const requestGroupId = `RRG-${Date.now()}`
    const requestIds = []

    for (const item of items) {
      const requestQty = Number(item.quantity)
      if (!item.medicineName || !Number.isFinite(requestQty) || requestQty <= 0) {
        return res.status(400).json({ message: 'Each return item must include medicineName and valid quantity' })
      }

      const matchedOrderItem = orderItems.find((orderItem) => (
        String(orderItem.medicineName || '').toLowerCase() === String(item.medicineName || '').toLowerCase() &&
        String(orderItem.batch || '-') === String(item.batch || '-')
      ))

      if (!matchedOrderItem) {
        return res.status(400).json({ message: `Medicine not found in order: ${item.medicineName}` })
      }

      const maxQty = Number(matchedOrderItem.quantity || 0)
      if (requestQty > maxQty) {
        return res.status(400).json({
          message: `Return quantity exceeds purchased quantity for ${item.medicineName}. Max: ${maxQty}`
        })
      }

      const returnRequest = {
        billNo: order.billNo || orderRef.id,
        wholesalerId: wholesalerShop.id,
        wholesalerName: wholesalerShop.shopFirmName || wholesalerShop.username || '',
        retailerId: retailerShop.id,
        retailerName: retailerShop.shopFirmName || retailerShop.username || '',
        medicineName: matchedOrderItem.medicineName || item.medicineName,
        batch: matchedOrderItem.batch || item.batch || '-',
        quantity: requestQty,
        reason,
        returnType: returnType || 'other',
        status: 'Pending',
        refundAmount: 0,
        approvedAt: null,
        rejectedAt: null,
        requestGroupId,
        sourceOrderId: orderRef.id,
        notes: notes || '',
        createdAt: nowIso,
        updatedAt: nowIso
      }

      const ref = await db.collection(collections.RETURN_REQUESTS).add(returnRequest)
      requestIds.push(ref.id)
    }

    return res.status(201).json({
      message: 'Return request submitted',
      requestGroupId,
      requestCount: requestIds.length,
      requestIds
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getRetailerProfile(req, res) {
  try {
    const retailerIdentifier = req.params.retailerId

    const retailerShop = await resolveRetailerShop(retailerIdentifier)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    let licenseData = null
    if (retailerShop.licenseId) {
      const licenseDoc = await db.collection(collections.LICENSES).doc(String(retailerShop.licenseId)).get()
      if (licenseDoc.exists) {
        licenseData = licenseDoc.data()
      }
    }

    if (!licenseData && retailerShop.licenseNumber) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('licenseNumber', '==', String(retailerShop.licenseNumber))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && retailerShop.username) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('credentials.username', '==', String(retailerShop.username))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && retailerShop.email) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('credentials.email', '==', String(retailerShop.email))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && retailerShop.shopFirmName) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('establishment.shopFirmName', '==', String(retailerShop.shopFirmName))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    const establishment = licenseData?.establishment || {}
    const establishmentAddress = establishment.address || {}
    const establishmentContact = establishment.contact || {}
    const pharmacist = licenseData?.pharmacist || {}
    const infrastructure = licenseData?.infrastructure || {}
    const refrigerator = licenseData?.equipment?.refrigerator || {}
    const humidityValue =
      retailerShop.humidity ||
      retailerShop.humidityRange ||
      infrastructure.humidityRange ||
      refrigerator.humidityRange ||
      '-'

    const profile = {
      id: retailerShop.id,
      username: retailerShop.username || '',
      storeName: retailerShop.shopFirmName || establishment.shopFirmName || 'Unknown Store',
      registrationNumber: licenseData?.licenseNumber || retailerShop.licenseNumber || '-',
      email: retailerShop.email || establishmentContact.email || '-',
      phone: retailerShop.mobileNumber || retailerShop.mobileNo || retailerShop.phone || establishmentContact.mobileNumber || '-',
      address: ([
        establishmentAddress.doorNo,
        establishmentAddress.area,
        establishmentAddress.city,
        establishmentAddress.district || retailerShop.district,
        retailerShop.address
      ]
        .map((part) => String(part || '').replace(/^\s*,\s*/, '').trim())
        .filter(Boolean)
        .join(', ') || '-'),
      shopArea: infrastructure.totalShopArea ? `${infrastructure.totalShopArea} Sq. Ft.` : '-',
      temperature: refrigerator.temperatureRange || retailerShop.temperature || '-',
      humidity: humidityValue,
      pharmacist: {
        name: pharmacist.name || '-',
        license: pharmacist.registrationId || '-',
        email: pharmacist.email || '-',
        registeredDate: pharmacist.dateOfBirth || '-'
      },
      license: {
        status: licenseData?.status || retailerShop.licenseStatus || 'Not Available',
        issueDate: licenseData?.licenseCreationDate || retailerShop.licenseIssueDate || '-',
        expiryDate: deriveLicenseExpiryDate(licenseData, retailerShop),
        issuedBy: 'Ministry of Health & Family Welfare'
      },
      documents: [
        { name: 'GST Certificate', uploadedDate: retailerShop.createdAt ? String(retailerShop.createdAt).slice(0, 10) : '-', status: 'Verified' },
        { name: 'Business License', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' },
        { name: 'Pharmacist License', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' },
        { name: 'Shop Photos', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' }
      ]
    }

    return res.json({ profile })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getRetailerWholesalers,
  getRetailerWholesalerCatalog,
  getRetailerSellCatalog,
  createRetailerCustomerSale,
  getRetailerPendingStockItems,
  createRetailerPendingStockFollowUp,
  markRetailerPendingStockReceived,
  getRetailerReturnProductBills,
  createRetailerReturnRequest,
  getRetailerProfile,
  createRetailerOrder,
  getRetailerApproveStockBills,
  approveRetailerStock,
  getRetailerPurchaseHistory,
  getRetailerSalesHistory
}
