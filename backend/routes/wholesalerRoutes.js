const express = require('express')
const {
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
} = require('../controllers/wholesalerController')

const router = express.Router()

// Static routes first
router.get('/manufacturer-medicines', getManufacturerMedicines)
router.post('/manufacturer-purchases', createPurchaseFromManufacturer)

// Dynamic routes with :wholesalerId parameter
router.post('/sales', createSaleToRetailer)
router.get('/:wholesalerId/sales-history', getWholesalerSalesHistory)
router.get('/:wholesalerId/stock', getWholesalerStock)
router.get('/:wholesalerId/sell-catalog', getWholesalerSellCatalog)
router.get('/:wholesalerId/approve-stock', getWholesalerApproveStockBills)
router.post('/:wholesalerId/approve-stock/:purchaseId/approve', approveWholesalerStock)
router.get('/:wholesalerId/return-requests', getWholesalerReturnRequests)
router.post('/:wholesalerId/return-requests', createReturnRequest)
router.put('/:wholesalerId/return-requests/:requestId/status', updateReturnRequestStatus)
router.get('/:wholesalerId/profile', getWholesalerProfile)

module.exports = router
