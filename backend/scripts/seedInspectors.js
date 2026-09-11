require('dotenv').config()
const { auth, db } = require('../config/firebaseAdmin')
const districts = require('../models/districts')
const collections = require('../models/collections')

async function upsertInspector(inspector) {
  const email = `${inspector.emailLocal}@gmail.com`
  const password = `${inspector.code}@${inspector.pinCode}`

  let userRecord
  try {
    userRecord = await auth.getUserByEmail(email)
  } catch (_error) {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: `${inspector.name} Drug Inspector`
    })
  }

  await db.collection(collections.INSPECTORS).doc(userRecord.uid).set({
    uid: userRecord.uid,
    role: 'inspector',
    district: inspector.name,
    districtCode: inspector.code,
    pinCode: inspector.pinCode,
    email,
    passwordHint: `${inspector.code}@${inspector.pinCode}`,
    updatedAt: new Date().toISOString()
  })

  return { email, password, uid: userRecord.uid }
}

async function run() {
  const created = []
  for (const district of districts) {
    const item = await upsertInspector(district)
    created.push(item)
  }

  console.log('Seed complete. Inspector accounts:')
  created.forEach((entry) => {
    console.log(`${entry.email} | ${entry.password}`)
  })
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
