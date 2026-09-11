const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

function getServiceAccount() {
  // 1. Check if firebasesecurity.json or custom path exists with valid credentials
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.join(__dirname, '..', 'firebasesecurity.json'),
    path.join(process.cwd(), 'firebasesecurity.json')
  ].filter(Boolean)

  for (const filePath of candidatePaths) {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8').replace(/^\uFEFF/, '').trim()
        if (!fileContent) continue
        const parsed = JSON.parse(fileContent)
        if (parsed && parsed.project_id && parsed.client_email && parsed.private_key) {
          return {
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key.replace(/\\n/g, '\n')
          }
        }
      } catch (err) {
        console.warn(`[FirebaseAdmin] Warning: Could not parse ${resolvedPath}:`, err.message)
      }
    }
  }

  // 2. Check individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n')
    }
  }

  return null
}

function getStorageBucketName() {
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    return process.env.FIREBASE_STORAGE_BUCKET
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    return `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
  }

  return undefined
}

if (!admin.apps.length) {
  const serviceAccount = getServiceAccount()
  const storageBucket = getStorageBucketName()

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket
    })
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket
    })
  }
}

const db = admin.firestore()
const auth = admin.auth()

function getStorageBucket() {
  const storageBucketName = getStorageBucketName()
  if (storageBucketName) {
    return admin.storage().bucket(storageBucketName)
  }

  return admin.storage().bucket()
}

module.exports = {
  admin,
  db,
  auth,
  getStorageBucket
}
