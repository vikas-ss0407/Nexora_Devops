const multer = require('multer')

const MAX_FILE_SIZE = 5 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  }
})

const uploadLicenseFilesMiddleware = upload.fields([
  { name: 'ownerAadharCardImage', maxCount: 1 },
  { name: 'appointmentDocument', maxCount: 1 },
  { name: 'pharmacistCertificate', maxCount: 1 },
  { name: 'pharmacistSignatureImage', maxCount: 1 }
])

function handleLicenseUpload(req, res, next) {
  uploadLicenseFilesMiddleware(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: 'Each uploaded file must be 5MB or smaller' })
        return
      }

      res.status(400).json({ message: error.message })
      return
    }

    res.status(400).json({ message: error.message || 'Unable to process uploaded files' })
  })
}

module.exports = {
  handleLicenseUpload
}
