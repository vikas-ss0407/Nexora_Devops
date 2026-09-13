const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const inspectorRoutes = require('./routes/inspectorRoutes')
const wholesalerRoutes = require('./routes/wholesalerRoutes')
const retailerRoutes = require('./routes/retailerRoutes')
const { ensureManufacturerCatalogSeeded } = require('./controllers/wholesalerController')

const app = express()
const PORT = process.env.PORT || 5000

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://drugguard-dotf.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/inspector', inspectorRoutes)
app.use('/api/wholesaler', wholesalerRoutes)
app.use('/api/retailer', retailerRoutes)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Nexora backend is running'
  })
})
app.listen(PORT, async () => {
  console.log(`DrugGuard backend running on port ${PORT}`)
  
})
