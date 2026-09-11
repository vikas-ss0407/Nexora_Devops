const path = require('path')
const fs = require('fs/promises')
const { getStorageBucket } = require('../config/firebaseAdmin')

const FILE_STORAGE_MODE = process.env.FILE_STORAGE_MODE || 'auto'
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

function sanitizePathSegment(value) {
  return String(value || 'unknown')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown'
}

function getExtension(fileName) {
  return path.extname(fileName || '').toLowerCase() || '.bin'
}

function shouldUseFirebaseStorage() {
  if (FILE_STORAGE_MODE === 'firebase') {
    return true
  }

  if (FILE_STORAGE_MODE === 'local') {
    return false
  }

  return Boolean(process.env.FIREBASE_STORAGE_BUCKET)
}

function isFirebaseStorageMisconfigured(error) {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()

  return (
    message.includes('specified bucket does not exist') ||
    message.includes('bucket') && message.includes('not found') ||
    code.includes('storage') ||
    code.includes('bucket')
  )
}

async function uploadSingleFileToLocalStorage({ file, destination }) {
  const relativePath = destination.replace(/\\/g, '/')
  const fullPath = path.join(LOCAL_UPLOADS_DIR, relativePath)

  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, file.buffer)

  return {
    fileName: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    storagePath: relativePath,
    url: `/uploads/${relativePath}`
  }
}

async function uploadSingleFileToFirebaseStorage({ file, destination }) {
  const bucket = getStorageBucket()
  const bucketFile = bucket.file(destination)

  await bucketFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype
    }
  })

  const [signedUrl] = await bucketFile.getSignedUrl({
    action: 'read',
    expires: '03-17-2031'
  })

  return {
    fileName: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    storagePath: destination,
    url: signedUrl
  }
}

async function uploadSingleFile({ file, destination }) {
  if (!shouldUseFirebaseStorage()) {
    return uploadSingleFileToLocalStorage({ file, destination })
  }

  try {
    return await uploadSingleFileToFirebaseStorage({ file, destination })
  } catch (error) {
    if (!isFirebaseStorageMisconfigured(error) || FILE_STORAGE_MODE === 'firebase') {
      throw error
    }

    return uploadSingleFileToLocalStorage({ file, destination })
  }
}

async function uploadLicenseFiles({ files, licenseNumber, username }) {
  const uploadedDocuments = {}
  const safeLicenseNumber = sanitizePathSegment(licenseNumber)
  const safeUsername = sanitizePathSegment(username)

  for (const [fieldName, fileList] of Object.entries(files || {})) {
    const file = Array.isArray(fileList) ? fileList[0] : fileList
    if (!file) {
      continue
    }

    const destination = `licenses/${safeLicenseNumber}/${safeUsername}/${fieldName}-${Date.now()}${getExtension(file.originalname)}`
    uploadedDocuments[fieldName] = await uploadSingleFile({
      file,
      destination
    })
  }

  return uploadedDocuments
}

module.exports = {
  uploadLicenseFiles
}
