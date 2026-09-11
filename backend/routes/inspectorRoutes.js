const express = require('express')
const {
	createLicense,
	getInspectorProfile,
	getInspectorRetailerVisibility,
	getInspectorShops,
	getWholesalerSalesForInspector,
	getRetailerPurchasesForInspector,
	getDashboardSummaryForInspector
} = require('../controllers/inspectorController')

const router = express.Router()

router.post('/licenses', createLicense)
router.get('/profile', getInspectorProfile)
router.get('/shops', getInspectorShops)
router.get('/dashboard-summary', getDashboardSummaryForInspector)
router.get('/wholesaler-sales', getWholesalerSalesForInspector)
router.get('/retailer-purchases', getRetailerPurchasesForInspector)
router.get('/districts/:district/retailers-visible', getInspectorRetailerVisibility)

module.exports = router
