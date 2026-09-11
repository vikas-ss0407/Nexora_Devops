const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')
const { getSeedCatalogDocs } = require('../services/manufacturerCatalogService')

async function ensureShopExists(collectionName, id) {
  if (!id) return null
  const doc = await db.collection(collectionName).doc(String(id)).get()
  return doc.exists ? { id: doc.id, ...doc.data() } : null
}

async function resolveWholesalerShop(identifier) {
  if (!identifier) return null

  const byId = await ensureShopExists(collections.WHOLESALERS, identifier)
  if (byId) return byId

  const byUsername = await db
    .collection(collections.WHOLESALERS)
    .where('username', '==', String(identifier))
    .limit(1)
    .get()

  if (!byUsername.empty) {
    const doc = byUsername.docs[0]
    return { id: doc.id, ...doc.data() }
  }

  // Try email (case-insensitive and trimmed)
  const normalizedIdentifier = String(identifier).toLowerCase().trim()
  
  const byEmail = await db
    .collection(collections.WHOLESALERS)
    .get()

  for (const doc of byEmail.docs) {
    const data = doc.data()
    const dbEmail = String(data.email || '').toLowerCase().trim()
    if (dbEmail === normalizedIdentifier) {
      return { id: doc.id, ...data }
    }
  }

  return null
}

function deriveManufactureDate(expiryDate, fallbackDate) {
  if (expiryDate) {
    const expiry = new Date(expiryDate)
    if (!Number.isNaN(expiry.getTime())) {
      expiry.setFullYear(expiry.getFullYear() - 2)
      return expiry.toISOString().slice(0, 10)
    }
  }

  if (fallbackDate) {
    const fallback = new Date(fallbackDate)
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toISOString().slice(0, 10)
    }
  }

  return new Date().toISOString().slice(0, 10)
}

async function ensureManufacturerCatalogSeeded() {
  const firstDoc = await db.collection(collections.MANUFACTURER_MEDICINES).limit(1).get()
  
  // Check if data has incorrect dates (from old seed logic)
  let needsReset = false
  if (!firstDoc.empty) {
    const sample = firstDoc.docs[0].data()
    const expiryYear = sample.expiryDate ? parseInt(sample.expiryDate.substring(0, 4)) : null
    // If expiry dates are 2028+, we have old bad data - need to reset
    if (expiryYear && expiryYear >= 2028) {
      needsReset = true
    }
  }

  if (!firstDoc.empty && !needsReset) {
    const existingSnapshot = await db.collection(collections.MANUFACTURER_MEDICINES).get()
    const docsNeedingBackfill = existingSnapshot.docs.filter((doc) => {
      const data = doc.data()
      return !data.manufactureDate
    })

    for (let i = 0; i < docsNeedingBackfill.length; i += 400) {
      const chunk = docsNeedingBackfill.slice(i, i + 400)
      const batch = db.batch()

      chunk.forEach((doc) => {
        const data = doc.data()
        batch.update(doc.ref, {
          manufactureDate: deriveManufactureDate(data.expiryDate, data.createdAt),
          updatedAt: new Date().toISOString()
        })
      })

      await batch.commit()
    }

    return
  }

  // If needs reset, delete all old documents in batches
  if (needsReset) {
    const snapshot = await db.collection(collections.MANUFACTURER_MEDICINES).get()
    const chunkSize = 400

    for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
      const chunk = snapshot.docs.slice(i, i + chunkSize)
      const batch = db.batch()

      chunk.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()
    }
  }

  const catalogDocs = getSeedCatalogDocs()
  const chunkSize = 400

  for (let i = 0; i < catalogDocs.length; i += chunkSize) {
    const chunk = catalogDocs.slice(i, i + chunkSize)
    const batch = db.batch()

    chunk.forEach((docData) => {
      const ref = db.collection(collections.MANUFACTURER_MEDICINES).doc()
      batch.set(ref, docData)
    })

    await batch.commit()
  }
}

async function getManufacturerMedicines(req, res) {
  try {
    const { manufacturer } = req.query
    let query = db.collection(collections.MANUFACTURER_MEDICINES)

    if (manufacturer) {
      query = query.where('manufacturerName', '==', manufacturer)
    }

    const snapshot = await query.get()
    const medicines = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        manufactureDate: data.manufactureDate || deriveManufactureDate(data.expiryDate, data.createdAt)
      }
    })

    const manufacturers = Array.from(new Set(medicines.map((m) => m.manufacturerName))).sort()

    return res.json({
      manufacturers,
      medicines
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createPurchaseFromManufacturer(req, res) {
  try {
    const { wholesalerId, wholesalerName, manufacturer, items } = req.body

    if (!wholesalerId || !manufacturer || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'wholesalerId, manufacturer and items are required' })
    }

    const wholesalerShop = await resolveWholesalerShop(wholesalerId)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found for wholesalerId' })
    }

    const purchaseItems = []
    let totalAmount = 0

    for (const item of items) {
      const quantity = Number(item.quantity)
      if (!item.medicineId || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Each item must have medicineId and quantity > 0' })
      }

      const medicineDoc = await db
        .collection(collections.MANUFACTURER_MEDICINES)
        .doc(String(item.medicineId))
        .get()

      if (!medicineDoc.exists) {
        return res.status(404).json({ message: `Medicine not found for id: ${item.medicineId}` })
      }

      const medicineData = medicineDoc.data()
      const amount = Number((Number(medicineData.rate) * quantity).toFixed(2))

      purchaseItems.push({
        medicineId: medicineDoc.id,
        medicineName: medicineData.medicineName,
        manufacturerName: medicineData.manufacturerName,
        type: medicineData.type,
        isNarcotic: Boolean(medicineData.isNarcotic),
        drugClass: medicineData.drugClass || 'normal',
        isOriginal: medicineData.isOriginal !== false,
        packType: medicineData.packType,
        packSize: medicineData.packSize,
        batchNumber: medicineData.batchNumber,
        manufactureDate: medicineData.manufactureDate || deriveManufactureDate(medicineData.expiryDate, medicineData.createdAt),
        expiryDate: medicineData.expiryDate,
        mrp: Number(medicineData.mrp),
        rate: Number(medicineData.rate),
        colorCode: medicineData.colorCode || '#22c55e',
        quantity,
        amount
      })

      totalAmount += amount
    }

    const nowIso = new Date().toISOString()

    const purchase = {
      billNo: `MFR-${Date.now()}`,
      sellerRole: 'manufacturer',
      buyerRole: 'wholesaler',
      wholesalerId: wholesalerShop.id,
      wholesalerName: wholesalerName || wholesalerShop.shopFirmName || wholesalerShop.username || '',
      manufacturer,
      orderType: 'manufacturer_purchase_order',
      orderStatus: 'pending_approval',
      deliveredDate: nowIso.slice(0, 10),
      items: purchaseItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      createdAt: nowIso,
      updatedAt: nowIso
    }

    const purchaseRef = await db.collection(collections.WHOLESALER_PURCHASES).add(purchase)

    return res.status(201).json({
      message: 'Purchase from manufacturer recorded',
      purchaseId: purchaseRef.id,
      totalAmount: purchase.totalAmount
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerApproveStockBills(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const snapshot = await db
      .collection(collections.WHOLESALER_PURCHASES)
      .where('wholesalerId', '==', wholesalerShop.id)
      .get()

    const bills = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((tx) => tx.orderStatus !== 'approved')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((tx) => ({
        id: tx.id,
        billNo: tx.billNo || tx.id,
        manufacturer: tx.manufacturer || 'Unknown Manufacturer',
        deliveredDate: tx.deliveredDate || String(tx.createdAt || '').slice(0, 10),
        totalAmount: Number(tx.totalAmount || 0),
        orderStatus: tx.orderStatus || 'pending_approval',
        medicines: Array.isArray(tx.items)
          ? tx.items.map((item) => ({
              id: String(item.medicineId || item.medicineName || ''),
              name: item.medicineName || '-',
              batch: item.batchNumber || '-',
              quantity: Number(item.quantity || 0),
              price: Number(item.rate || 0),
              mrp: Number(item.mrp || 0),
              expiry: item.expiryDate || null,
              amount: Number(item.amount || Number(item.rate || 0) * Number(item.quantity || 0)),
              medicineId: item.medicineId || null,
              packType: item.packType || null,
              packSize: item.packSize || null,
              type: item.type || null,
              isNarcotic: Boolean(item.isNarcotic)
            }))
          : []
      }))

    return res.json({ wholesalerId: wholesalerShop.id, bills })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function approveWholesalerStock(req, res) {
  try {
    const { purchaseId } = req.params
    const wholesalerIdentifier = req.params.wholesalerId
    const { acceptedMedicineIds } = req.body

    if (!Array.isArray(acceptedMedicineIds) || acceptedMedicineIds.length === 0) {
      return res.status(400).json({ message: 'acceptedMedicineIds is required' })
    }

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const ref = db.collection(collections.WHOLESALER_PURCHASES).doc(purchaseId)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'Purchase order not found' })
    }

    const purchase = doc.data()
    if (purchase.wholesalerId !== wholesalerShop.id) {
      return res.status(403).json({ message: 'You are not allowed to update this purchase' })
    }

    const items = Array.isArray(purchase.items) ? purchase.items : []
    const acceptedSet = new Set(acceptedMedicineIds.map((id) => String(id)))
    const acceptedItems = items.filter((item) => acceptedSet.has(String(item.medicineId || item.medicineName || '')))
    const pendingItems = items.filter((item) => !acceptedSet.has(String(item.medicineId || item.medicineName || '')))

    if (acceptedItems.length === 0) {
      return res.status(400).json({ message: 'Select at least one medicine to approve' })
    }

    const nowIso = new Date().toISOString()

    for (const item of acceptedItems) {
      const medicineId = String(item.medicineId || '')
      const medicineName = item.medicineName || ''
      const batch = item.batchNumber || ''
      const quantity = Number(item.quantity || 0)

      if ((!medicineId && !medicineName) || quantity <= 0) {
        continue
      }

      let existingSnapshot = await db
        .collection(collections.WHOLESALER_STOCK)
        .where('wholesalerId', '==', wholesalerShop.id)
        .where('medicineId', '==', medicineId)
        .where('batch', '==', batch)
        .limit(1)
        .get()

      if (existingSnapshot.empty) {
        existingSnapshot = await db
          .collection(collections.WHOLESALER_STOCK)
          .where('wholesalerId', '==', wholesalerShop.id)
          .where('medicineName', '==', medicineName)
          .where('batch', '==', batch)
          .limit(1)
          .get()
      }

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0]
        const existingQty = Number(existingDoc.data().quantity || 0)

        await existingDoc.ref.update({
          quantity: existingQty + quantity,
          rate: Number(item.rate || 0),
          mrp: Number(item.mrp || 0),
          manufactureDate: item.manufactureDate || null,
          expiryDate: item.expiryDate || null,
          updatedAt: nowIso
        })
      } else {
        await db.collection(collections.WHOLESALER_STOCK).add({
          wholesalerId: wholesalerShop.id,
          medicineId: medicineId || null,
          medicineName,
          batch,
          quantity,
          rate: Number(item.rate || 0),
          mrp: Number(item.mrp || 0),
          manufactureDate: item.manufactureDate || null,
          expiryDate: item.expiryDate || null,
          packType: item.packType || null,
          packSize: item.packSize || null,
          type: item.type || null,
          isNarcotic: Boolean(item.isNarcotic),
          sourcePurchaseId: purchaseId,
          createdAt: nowIso,
          updatedAt: nowIso
        })
      }
    }

    await ref.update({
      orderStatus: 'approved',
      acceptedMedicineIds: acceptedItems.map((item) => String(item.medicineId || item.medicineName || '')),
      pendingMedicineIds: pendingItems.map((item) => String(item.medicineId || item.medicineName || '')),
      approvedAt: nowIso,
      updatedAt: nowIso
    })

    return res.json({
      message: 'Stock approval updated successfully',
      orderStatus: 'approved',
      acceptedCount: acceptedItems.length,
      pendingCount: pendingItems.length
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerSellCatalog(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
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
      .map((item) => ({
        id: item.id,
        medicineId: item.medicineId || item.id,
        name: item.medicineName || '-',
        batch: item.batch || '-',
        company: item.manufacturerName || item.companyName || '',
        manufactureDate: item.manufactureDate || null,
        expiryDate: item.expiryDate || null,
        rate: Number(item.rate || 0),
        mrp: Number(item.mrp || 0),
        category: item.packType || 'Unit',
        categoryUnit: item.packSize || '1 unit',
        stock: Number(item.quantity || 0),
        offer: item.offer || ''
      }))

    let retailerQuery = db.collection(collections.RETAILERS)
    if (wholesalerShop.inspectorDistrict) {
      retailerQuery = retailerQuery.where('inspectorDistrict', '==', wholesalerShop.inspectorDistrict)
    }

    const retailerSnapshot = await retailerQuery.get()
    const retailers = retailerSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().shopFirmName || doc.data().username || doc.id,
      district: doc.data().district || '',
      inspectorDistrict: doc.data().inspectorDistrict || ''
    }))

    return res.json({
      wholesalershopId: wholesalerShop.id,
      retailers,
      medicines
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerStock(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const stockSnapshot = await db
      .collection(collections.WHOLESALER_STOCK)
      .where('wholesalerId', '==', wholesalerShop.id)
      .get()

    const stock = stockSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(a.medicineName || '').localeCompare(String(b.medicineName || '')))
      .map((item) => ({
        id: item.id,
        medicineName: item.medicineName || '-',
        medicineId: item.medicineId || '',
        batch: item.batch || '-',
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        mrp: Number(item.mrp || 0),
        expiryDate: item.expiryDate || null,
        packType: item.packType || 'Unit',
        packSize: item.packSize || '1 unit',
        updatedAt: item.updatedAt || item.createdAt || null,
        createdAt: item.createdAt || null
      }))

    return res.json({ wholesalerId: wholesalerShop.id, stock })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createSaleToRetailer(req, res) {
  try {
    const {
      wholesalerId,
      retailerId,
      productName,
      quantity,
      district,
      items,
      deliveryDate,
      paymentTerms,
      specialNotes
    } = req.body

    if (!wholesalerId || !retailerId) {
      return res.status(400).json({ message: 'wholesalerId and retailerId are required' })
    }

    const wholesalerShop = await resolveWholesalerShop(wholesalerId)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found for wholesalerId' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found for retailerId' })
    }

    const nowIso = new Date().toISOString()
    const usingItems = Array.isArray(items) && items.length > 0

    let soldItems = []
    let totalAmount = 0
    let totalQuantity = 0

    if (usingItems) {
      for (const item of items) {
        const stockId = String(item.stockId || item.drugId || item.medicineId || '')
        const saleQty = Number(item.quantity)

        if (!stockId || !Number.isFinite(saleQty) || saleQty <= 0) {
          return res.status(400).json({ message: 'Each item must include valid stockId and quantity' })
        }

        const stockRef = db.collection(collections.WHOLESALER_STOCK).doc(stockId)
        const stockDoc = await stockRef.get()

        if (!stockDoc.exists) {
          return res.status(404).json({ message: `Stock item not found for id: ${stockId}` })
        }

        const stockData = stockDoc.data()
        if (String(stockData.wholesalerId) !== String(wholesalerShop.id)) {
          return res.status(403).json({ message: 'Stock item does not belong to this wholesaler' })
        }

        const availableQty = Number(stockData.quantity || 0)
        if (saleQty > availableQty) {
          return res.status(400).json({
            message: `Insufficient stock for ${stockData.medicineName || stockId}. Available: ${availableQty}`
          })
        }

        const rate = Number(stockData.rate || 0)
        const lineAmount = Number((rate * saleQty).toFixed(2))

        soldItems.push({
          stockId,
          medicineId: stockData.medicineId || stockId,
          medicineName: stockData.medicineName || '-',
          batch: stockData.batch || '-',
          quantity: saleQty,
          rate,
          mrp: Number(stockData.mrp || 0),
          expiryDate: stockData.expiryDate || null,
          amount: lineAmount
        })

        totalAmount += lineAmount
        totalQuantity += saleQty

        await stockRef.update({
          quantity: availableQty - saleQty,
          updatedAt: nowIso
        })
      }
    } else {
      if (!productName || !quantity) {
        return res.status(400).json({ message: 'Either items[] or productName and quantity are required' })
      }

      totalQuantity = Number(quantity) || 0
      soldItems = [
        {
          stockId: null,
          medicineId: null,
          medicineName: productName,
          batch: '-',
          quantity: totalQuantity,
          rate: 0,
          mrp: 0,
          expiryDate: null,
          amount: 0
        }
      ]
    }

    const billNo = `WS-${Date.now()}`

    const tx = {
      billNo,
      sellerRole: 'wholesaler',
      sellerId: wholesalerShop.id,
      sellerName: wholesalerShop.shopFirmName || wholesalerShop.username || wholesalerId,
      buyerRole: 'retailer',
      buyerId: retailerId,
      buyerName: retailerShop.shopFirmName || retailerShop.username || retailerId,
      productName: soldItems.length === 1 ? soldItems[0].medicineName : 'Multiple Medicines',
      quantity: totalQuantity,
      items: soldItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      paymentTerms: paymentTerms || '',
      deliveryDate: deliveryDate || null,
      specialNotes: specialNotes || '',
      district: district || null,
      createdAt: nowIso,
      updatedAt: nowIso
    }

    const ref = await db.collection(collections.TRANSACTIONS).add(tx)
    return res.status(201).json({
      message: 'Sale recorded',
      transactionId: ref.id,
      billNo,
      totalAmount: Number(totalAmount.toFixed(2))
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerSalesHistory(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const snapshot = await db
      .collection(collections.TRANSACTIONS)
      .where('sellerRole', '==', 'wholesaler')
      .where('sellerId', '==', wholesalerShop.id)
      .get()

    const sales = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((tx) => ({
        id: tx.id,
        billNo: tx.billNo || tx.id,
        retailerId: tx.buyerId || '',
        retailerName: tx.buyerName || tx.buyerId || 'Unknown Retailer',
        date: tx.createdAt ? String(tx.createdAt).slice(0, 10) : '',
        createdAt: tx.createdAt || '',
        items: Array.isArray(tx.items) ? tx.items : [],
        itemCount: Array.isArray(tx.items) ? tx.items.length : 0,
        totalQuantity: Number(tx.quantity || 0),
        totalAmount: Number(tx.totalAmount || 0),
        paymentTerms: tx.paymentTerms || '',
        deliveryDate: tx.deliveryDate || null,
        specialNotes: tx.specialNotes || ''
      }))

    return res.json({ wholesalerId: wholesalerShop.id, sales })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerReturnRequests(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const snapshot = await db
      .collection(collections.RETURN_REQUESTS)
      .where('wholesalerId', '==', wholesalerShop.id)
      .get()

    const returnRequests = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map((req) => ({
        id: req.id,
        billNo: req.billNo || req.id,
        retailer: req.retailerName || req.retailerId || 'Unknown Retailer',
        retailerId: req.retailerId || '',
        drug: req.medicineName || req.productName || '-',
        batch: req.batch || '-',
        quantity: Number(req.quantity || 0),
        reason: req.reason || '-',
        type: req.returnType || 'other',
        date: req.createdAt ? String(req.createdAt).slice(0, 10) : '',
        status: req.status || 'Pending',
        refund: Number(req.refundAmount || 0)
      }))

    return res.json({ wholesalerId: wholesalerShop.id, returnRequests })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function createReturnRequest(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId
    const { retailerId, billNo, medicineName, batch, quantity, reason, returnType } = req.body

    if (!retailerId || !medicineName || !quantity || !reason) {
      return res.status(400).json({ message: 'retailerId, medicineName, quantity, and reason are required' })
    }

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const retailerShop = await ensureShopExists(collections.RETAILERS, retailerId)
    if (!retailerShop) {
      return res.status(404).json({ message: 'Retailer shop not found' })
    }

    const nowIso = new Date().toISOString()

    const returnRequest = {
      billNo: billNo || `RET-${Date.now()}`,
      wholesalerId: wholesalerShop.id,
      wholesalerName: wholesalerShop.shopFirmName || wholesalerShop.username || '',
      retailerId: retailerShop.id,
      retailerName: retailerShop.shopFirmName || retailerShop.username || '',
      medicineName,
      batch: batch || '-',
      quantity: Number(quantity),
      reason,
      returnType: returnType || 'other',
      status: 'Pending',
      refundAmount: 0,
      approvedAt: null,
      rejectedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso
    }

    const ref = await db.collection(collections.RETURN_REQUESTS).add(returnRequest)
    return res.status(201).json({
      message: 'Return request created',
      requestId: ref.id,
      status: 'Pending'
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function updateReturnRequestStatus(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId
    const { requestId } = req.params
    const { status, refundAmount } = req.body

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Approved or Rejected) is required' })
    }

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    const ref = db.collection(collections.RETURN_REQUESTS).doc(requestId)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'Return request not found' })
    }

    const request = doc.data()
    if (request.wholesalerId !== wholesalerShop.id) {
      return res.status(403).json({ message: 'You are not allowed to update this return request' })
    }

    const nowIso = new Date().toISOString()

    await ref.update({
      status,
      refundAmount: status === 'Approved' ? Number(refundAmount || 0) : 0,
      [status === 'Approved' ? 'approvedAt' : 'rejectedAt']: nowIso,
      updatedAt: nowIso
    })

    return res.json({
      message: `Return request ${status.toLowerCase()}`,
      status
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

async function getWholesalerProfile(req, res) {
  try {
    const wholesalerIdentifier = req.params.wholesalerId

    const wholesalerShop = await resolveWholesalerShop(wholesalerIdentifier)
    if (!wholesalerShop) {
      return res.status(404).json({ message: 'Wholesaler shop not found' })
    }

    let licenseData = null
    if (wholesalerShop.licenseId) {
      const licenseDoc = await db.collection(collections.LICENSES).doc(String(wholesalerShop.licenseId)).get()
      if (licenseDoc.exists) {
        licenseData = licenseDoc.data()
      }
    }

    if (!licenseData && wholesalerShop.licenseNumber) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('licenseNumber', '==', String(wholesalerShop.licenseNumber))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && wholesalerShop.username) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('credentials.username', '==', String(wholesalerShop.username))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && wholesalerShop.email) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('credentials.email', '==', String(wholesalerShop.email))
        .limit(1)
        .get()
      if (!licenseSnapshot.empty) {
        licenseData = licenseSnapshot.docs[0].data()
      }
    }

    if (!licenseData && wholesalerShop.shopFirmName) {
      const licenseSnapshot = await db
        .collection(collections.LICENSES)
        .where('establishment.shopFirmName', '==', String(wholesalerShop.shopFirmName))
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

    const profile = {
      id: wholesalerShop.id,
      username: wholesalerShop.username || '',
      companyName: wholesalerShop.shopFirmName || establishment.shopFirmName || 'Unknown Company',
      registrationNumber: licenseData?.licenseNumber || wholesalerShop.licenseNumber || '-',
      email: wholesalerShop.email || '-',
      phone: wholesalerShop.mobileNumber || wholesalerShop.mobileNo || wholesalerShop.phone || establishmentContact.mobileNumber || '-',
      address: ([
        establishmentAddress.doorNo,
        establishmentAddress.area,
        establishmentAddress.city,
        establishmentAddress.district || wholesalerShop.district,
        wholesalerShop.address
      ]
        .map((part) => String(part || '').replace(/^\s*,\s*/, '').trim())
        .filter(Boolean)
        .join(', ') || '-'),
      warehouseArea: infrastructure.totalShopArea ? `${infrastructure.totalShopArea} Sq. Ft.` : '-',
      temperature: refrigerator.temperatureRange || '-',
      humidity: wholesalerShop.humidity || '-',
      pharmacist: {
        name: pharmacist.name || '-',
        license: pharmacist.registrationId || '-',
        email: pharmacist.email || '-',
        registeredDate: pharmacist.dateOfBirth || '-'
      },
      license: {
        status: licenseData?.status || wholesalerShop.licenseStatus || 'Not Available',
        issueDate: licenseData?.licenseCreationDate || wholesalerShop.licenseIssueDate || '-',
        expiryDate: wholesalerShop.licenseExpiryDate || '-',
        issuedBy: 'Ministry of Health & Family Welfare'
      },
      documents: [
        { name: 'GST Certificate', uploadedDate: wholesalerShop.createdAt ? wholesalerShop.createdAt.slice(0, 10) : '-', status: 'Verified' },
        { name: 'Business License', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' },
        { name: 'Pharmacist License', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' },
        { name: 'Warehouse Photos', uploadedDate: licenseData?.createdAt ? String(licenseData.createdAt).slice(0, 10) : '-', status: 'Verified' }
      ]
    }

    return res.json({ profile })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  ensureManufacturerCatalogSeeded,
  createSaleToRetailer,
  getWholesalerSalesHistory,
  getWholesalerStock,
  getManufacturerMedicines,
  createPurchaseFromManufacturer,
  getWholesalerSellCatalog,
  getWholesalerApproveStockBills,
  approveWholesalerStock,
  getWholesalerReturnRequests,
  createReturnRequest,
  updateReturnRequestStatus,
  getWholesalerProfile
}
