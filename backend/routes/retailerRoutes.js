const express = require('express')
const {
	getRetailerWholesalers,
	getRetailerWholesalerCatalog,
	getRetailerSellCatalog,
	createRetailerCustomerSale,
	getRetailerPendingStockItems,
	createRetailerPendingStockFollowUp,
	markRetailerPendingStockReceived,
	getRetailerReturnProductBills,
	createRetailerReturnRequest,
	getRetailerPurchaseHistory,
	getRetailerSalesHistory,
	getRetailerProfile,
	createRetailerOrder,
	getRetailerApproveStockBills,
	approveRetailerStock
} = require('../controllers/retailerController')

const router = express.Router()

router.get('/:retailerId/wholesalers', getRetailerWholesalers)
router.get('/:retailerId/wholesalers/:wholesalerId/catalog', getRetailerWholesalerCatalog)
router.get('/:retailerId/sell-catalog', getRetailerSellCatalog)
router.get('/:retailerId/pending-stock', getRetailerPendingStockItems)
router.post('/:retailerId/pending-stock/:orderId/follow-up', createRetailerPendingStockFollowUp)
router.post('/:retailerId/pending-stock/:orderId/mark-received', markRetailerPendingStockReceived)
router.get('/:retailerId/return-product-bills', getRetailerReturnProductBills)
router.post('/:retailerId/return-requests', createRetailerReturnRequest)
router.post('/sales', createRetailerCustomerSale)
router.post('/orders', createRetailerOrder)
router.get('/:retailerId/approve-stock', getRetailerApproveStockBills)
router.post('/:retailerId/approve-stock/:orderId/approve', approveRetailerStock)
router.get('/:retailerId/purchases', getRetailerPurchaseHistory)
router.get('/:retailerId/sales-history', getRetailerSalesHistory)
router.get('/:retailerId/profile', getRetailerProfile)

module.exports = router
