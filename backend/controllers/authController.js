const { db } = require('../config/firebaseAdmin')
const collections = require('../models/collections')

async function findUserByIdentifier(collectionName, rawIdentifier) {
  const identifier = String(rawIdentifier || '').trim()
  if (!identifier) {
    return null
  }

  const byDocId = await db.collection(collectionName).doc(identifier).get()
  if (byDocId.exists) {
    return byDocId
  }

  const byUsername = await db
    .collection(collectionName)
    .where('username', '==', identifier)
    .limit(1)
    .get()
  if (!byUsername.empty) {
    return byUsername.docs[0]
  }

  const byEmail = await db
    .collection(collectionName)
    .where('email', '==', identifier)
    .limit(1)
    .get()
  if (!byEmail.empty) {
    return byEmail.docs[0]
  }

  const normalized = identifier.toLowerCase()
  const allUsers = await db.collection(collectionName).get()
  for (const doc of allUsers.docs) {
    const data = doc.data() || {}
    const username = String(data.username || '').trim().toLowerCase()
    const email = String(data.email || '').trim().toLowerCase()
    if (username === normalized || email === normalized) {
      return doc
    }
  }

  return null
}

async function loginCustomRole(req, res) {
  try {
    const { role, username, password } = req.body

    if (!role || !username || !password) {
      return res.status(400).json({ message: 'role, username, and password are required' })
    }

    if (role !== 'wholesaler' && role !== 'retailer') {
      return res.status(400).json({ message: 'Unsupported role for this endpoint' })
    }

    const collectionName = role === 'wholesaler' ? collections.WHOLESALERS : collections.RETAILERS
    const userDoc = await findUserByIdentifier(collectionName, username)

    if (!userDoc) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const userData = userDoc.data()

    if (userData.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    return res.json({
      role,
      user: {
        id: userDoc.id,
        uid: userDoc.id,
        username: userData.username,
        email: userData.email || '',
        district: userData.district,
        inspectorDistrict: userData.inspectorDistrict || null,
        shopFirmName: userData.shopFirmName || ''
      }
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  loginCustomRole
}
