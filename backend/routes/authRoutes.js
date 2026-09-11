const express = require('express')
const { loginCustomRole } = require('../controllers/authController')

const router = express.Router()

router.post('/custom-login', loginCustomRole)

module.exports = router
