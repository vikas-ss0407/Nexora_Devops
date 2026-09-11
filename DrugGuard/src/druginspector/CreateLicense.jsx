import { useState } from 'react'
import { createLicenseByInspector } from '../api/druginspector/inspectorApi'

export default function CreateLicense() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // A. Basic Establishment Details
    fullName: '',
    dateOfBirth: '',
    licenseType: '', // Wholesale / Retail
    shopFirmName: '',
    ownershipType: '', // Individual / Partnership / Company
    doorNo: '',
    area: '',
    city: '',
    post: '',
    district: '',
    state: '',
    pinCode: '',
    mobileNumber: '',
    email: '',
    
    // Owner Documents
    ownerPanCard: '',
    ownerAadharNumber: '',
    
    // B. Pharmacist / Competent Person Details
    pharmacistName: '',
    registrationId: '',
    qualification: '', // D.Pharm / B.Pharm / M.Pharm
    yearsOfExperience: '',
    pharmacistDateOfBirth: '',
    aadhaarNumber: '',
    pharmacistMobile: '',
    pharmacistEmail: '',
    employmentType: '', // Full-time / Part-time
    
    // C. Shop Infrastructure Details
    totalShopArea: '',
    shopLength: '',
    shopBreadth: '',
    storageAreaAvailable: false,
    separateScheduleDrugStorage: false,
    powerBackupAvailable: false,
    
    // D. Equipment & Storage Details
    acAvailable: false,
    acBrand: '',
    acModel: '',
    acCapacity: '',
    refrigeratorAvailable: false,
    refrigeratorBrand: '',
    refrigeratorModel: '',
    refrigeratorCapacity: '',
    refrigeratorTempRange: '',
    
    // E. Login Credentials
    loginEmail: '',
    loginPassword: '',
    confirmPassword: '',
    
    // System Generated
    licenseNumber: '',
    generatedPassword: '',
    licenseCreationDate: new Date().toLocaleDateString()
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate License Number based on District and Year
  const generateLicenseNumber = () => {
    const year = new Date().getFullYear()
    const districtCode = formData.district.substring(0, 3).toUpperCase()
    const typeCode = formData.licenseType === 'Wholesale' ? 'WS' : 'RT'
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    return `DG-${districtCode}/${typeCode}/${year}/${randomNum}`
  }

  // Generate Random Password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Generate License Document
  const generateLicenseDocument = (licenseNumber) => {
    const licenseContent = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                          DRUG GUARD SYSTEM                                     ║
║                    PHARMACY LICENSE CERTIFICATE                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

LICENSE NUMBER: ${licenseNumber}
ISSUE DATE: ${new Date().toLocaleDateString()}
EXPIRY DATE: ${new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString()}

───────────────────────────────────────────────────────────────────────────────────

🏪 ESTABLISHMENT DETAILS
───────────────────────────────────────────────────────────────────────────────────
Shop/Firm Name         : ${formData.shopFirmName}
License Type           : ${formData.licenseType}
Ownership Type         : ${formData.ownershipType}
Total Shop Area        : ${formData.totalShopArea} Sq.ft

ADDRESS:
  Door No.             : ${formData.doorNo}
  Area                 : ${formData.area}
  City/Town            : ${formData.city}
  Post                 : ${formData.post}
  District             : ${formData.district}
  State                : ${formData.state}
  PIN Code             : ${formData.pinCode}

───────────────────────────────────────────────────────────────────────────────────

👤 OWNER DETAILS
───────────────────────────────────────────────────────────────────────────────────
Owner Name             : ${formData.fullName}
Date of Birth          : ${formData.dateOfBirth}
PAN Card No.           : ${formData.ownerPanCard}
Aadhaar Card No.       : ${formData.ownerAadharNumber}
Mobile Number          : ${formData.mobileNumber}
Email                  : ${formData.email}

Documents Attached:
  ✓ PAN Card Copy
  ✓ Aadhaar Number Verified
  ✓ Identity Details Verified

───────────────────────────────────────────────────────────────────────────────────

💊 PHARMACIST / COMPETENT PERSON DETAILS
───────────────────────────────────────────────────────────────────────────────────
Pharmacist Name        : ${formData.pharmacistName}
Registration ID        : ${formData.registrationId}
Qualification          : ${formData.qualification}
Date of Birth          : ${formData.pharmacistDateOfBirth}
Aadhaar Number         : ${maskAadhaar(formData.aadhaarNumber)}
Years of Experience    : ${formData.yearsOfExperience} years
Employment Type        : ${formData.employmentType}
Mobile Number          : ${formData.pharmacistMobile}
Email                  : ${formData.pharmacistEmail}

Documents Attached:
  ✓ Qualification (${formData.qualification}) Verified
  ✓ Employment Details Verified
  ✓ Registration Certificate from State Pharmacy Council

───────────────────────────────────────────────────────────────────────────────────

🏭 SHOP INFRASTRUCTURE
───────────────────────────────────────────────────────────────────────────────────
Total Shop Area        : ${formData.totalShopArea} Sq.ft
Shop Dimensions        : ${formData.shopLength}ft × ${formData.shopBreadth}ft
Storage Area Available : ${formData.storageAreaAvailable ? 'YES' : 'NO'}
Separate Drug Storage  : ${formData.separateScheduleDrugStorage ? 'YES' : 'NO'}
Power Backup Available : ${formData.powerBackupAvailable ? 'YES' : 'NO'}

───────────────────────────────────────────────────────────────────────────────────

⚙️ EQUIPMENT & STORAGE
───────────────────────────────────────────────────────────────────────────────────
${formData.acAvailable ? `
Air Conditioning Unit:
  Brand                : ${formData.acBrand}
  Model                : ${formData.acModel}
  Capacity             : ${formData.acCapacity} Ton
` : `Air Conditioning Unit  : NOT AVAILABLE\n`}
${formData.refrigeratorAvailable ? `
Refrigerator/Cold Storage:
  Brand                : ${formData.refrigeratorBrand}
  Model                : ${formData.refrigeratorModel}
  Capacity             : ${formData.refrigeratorCapacity} Liters
  Temperature Range    : ${formData.refrigeratorTempRange}
` : `Refrigerator/Storage   : NOT AVAILABLE\n`}

───────────────────────────────────────────────────────────────────────────────────

📋 COMPLIANCE CHECKLIST
───────────────────────────────────────────────────────────────────────────────────
✓ Owner Identification Documents Verified
✓ Pharmacist Credentials Verified
✓ Registration Certificate Verified
✓ Shop Infrastructure Inspected
✓ Storage Facilities Approved
✓ Equipment Details Recorded
✓ Required Information Captured
✓ Compliance Standards Met

───────────────────────────────────────────────────────────────────────────────────

🔐 LOGIN CREDENTIALS
───────────────────────────────────────────────────────────────────────────────────
Login Email            : ${formData.loginEmail}
Temporary Password     : [Provided Separately]
Account Status         : ACTIVE
Renewal Date           : ${new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString()}

───────────────────────────────────────────────────────────────────────────────────

⚖️ IMPORTANT NOTICES
───────────────────────────────────────────────────────────────────────────────────
1. This license is valid for 5 years from the date of issue.
2. The pharmacy must comply with all rules and regulations of the pharmaceutical board.
3. Any changes in ownership, pharmacist, or premises must be reported immediately.
4. The pharmacy must maintain proper records of all drugs purchased and sold.
5. Storage conditions must be maintained as per regulatory standards.
6. License must be displayed prominently in the pharmacy premises.
7. Renewal application must be submitted 3 months before expiry.

───────────────────────────────────────────────────────────────────────────────────

📄 DOCUMENTS ATTACHED WITH LICENSE
───────────────────────────────────────────────────────────────────────────────────
✓ PAN Card of Owner
✓ Aadhaar Number of Owner
✓ Pharmacist Qualification Details
✓ Pharmacist Employment Details
✓ Registration Certificate from State Pharmacy Council
✓ Shop Infrastructure Details
✓ Equipment Details
✓ Permission from Local Authorities
✓ Premises Inspection Report

═══════════════════════════════════════════════════════════════════════════════════

This License has been generated by Drug Guard System.
For any queries, contact: support@drugguard.com | Ph: 1800-DRUGGUARD

Authorized by: Drug Inspector Division
Generated on: ${new Date().toLocaleString()}
System Version: 1.0

═══════════════════════════════════════════════════════════════════════════════════
    `
    return licenseContent
  }

  const maskAadhaar = (aadhar) => {
    if (!aadhar) return ''
    return aadhar.slice(0, 4) + ' ' + '*'.repeat(4) + ' ' + aadhar.slice(-4)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateStep = () => {
    const newErrors = {}
    
    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required'
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
      if (!formData.licenseType) newErrors.licenseType = 'License type is required'
      if (!formData.shopFirmName) newErrors.shopFirmName = 'Shop/Firm name is required'
      if (!formData.ownershipType) newErrors.ownershipType = 'Ownership type is required'
      if (!formData.doorNo) newErrors.doorNo = 'Door number is required'
      if (!formData.area) newErrors.area = 'Area is required'
      if (!formData.city) newErrors.city = 'City is required'
      if (!formData.post) newErrors.post = 'Post is required'
      if (!formData.district) newErrors.district = 'District is required'
      if (!formData.state) newErrors.state = 'State is required'
      if (!formData.pinCode) newErrors.pinCode = 'PIN code is required'
      if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required'
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.ownerPanCard) newErrors.ownerPanCard = 'PAN Card number is required'
      if (!formData.ownerAadharNumber) newErrors.ownerAadharNumber = 'Aadhaar number is required'
    } else if (step === 2) {
      if (!formData.pharmacistName) newErrors.pharmacistName = 'Pharmacist name is required'
      if (!formData.registrationId) newErrors.registrationId = 'Registration ID is required'
      if (!formData.qualification) newErrors.qualification = 'Qualification is required'
      if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Experience is required'
      if (!formData.pharmacistDateOfBirth) newErrors.pharmacistDateOfBirth = 'Pharmacist date of birth is required'
      if (!formData.aadhaarNumber) newErrors.aadhaarNumber = 'Aadhaar number is required'
      if (!formData.pharmacistMobile) newErrors.pharmacistMobile = 'Mobile number is required'
      if (!formData.pharmacistEmail) newErrors.pharmacistEmail = 'Email is required'
      if (!formData.employmentType) newErrors.employmentType = 'Employment type is required'
    } else if (step === 3) {
      if (!formData.totalShopArea) newErrors.totalShopArea = 'Total shop area is required'
      if (!formData.shopLength) newErrors.shopLength = 'Shop length is required'
      if (!formData.shopBreadth) newErrors.shopBreadth = 'Shop breadth is required'
    } else if (step === 5) {
      if (!formData.loginEmail) newErrors.loginEmail = 'Login username is required'
      if (!formData.loginPassword) newErrors.loginPassword = 'Password is required'
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required'
      if (formData.loginPassword && formData.confirmPassword && formData.loginPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
      if (formData.loginPassword && formData.loginPassword.length < 8) {
        newErrors.loginPassword = 'Password must be at least 8 characters'
      }
    }
    
    return newErrors
  }

  const handleNext = () => {
    const newErrors = validateStep()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
    } else {
      setErrors({})
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateStep()

    if (Object.keys(newErrors).length === 0) {
      setSubmitError('')
      setIsSubmitting(true)
      const session = JSON.parse(localStorage.getItem('dg_user') || '{}')

      // Generate license number and password
      const licenseNumber = generateLicenseNumber()
      const generatedPassword = generatePassword()
      const licenseDocument = generateLicenseDocument(licenseNumber)

      const finalData = {
        ...formData,
        licenseNumber,
        generatedPassword,
        licenseDocument
      }

      try {
        console.log('📤 Submitting text-only license creation:', { licenseNumber })

        const result = await createLicenseByInspector({
          ...finalData,
          inspectorEmail: session.email || '',
          inspectorDistrict: session.district || formData.district,
          loginUsername: formData.loginEmail,
          loginPassword: formData.loginPassword
        })

        console.log('✅ License created successfully:', result)

        // Download license as text file
        const element = document.createElement('a')
        const file = new Blob([licenseDocument], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = `LICENSE_${licenseNumber.replace(/\//g, '_')}_${new Date().getTime()}.txt`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)

        // Show success message with credentials
        alert(
          `✅ LICENSE GENERATED SUCCESSFULLY!\n\n` +
          `License Number: ${licenseNumber}\n` +
          `Pharmacy: ${formData.shopFirmName}\n` +
          `Owner: ${formData.fullName}\n` +
          `Pharmacist: ${formData.pharmacistName}\n\n` +
          `LOGIN CREDENTIALS:\n` +
          `Username: ${formData.loginEmail}\n` +
          `Temporary Password: ${formData.loginPassword}\n\n` +
          `License Document has been downloaded!\n` +
          `Please save all documents securely.\n` +
          `License is valid for 5 years.`
        )

        console.log('License Data:', finalData)

        // Reset form
        setFormData({
          fullName: '', dateOfBirth: '', licenseType: '', shopFirmName: '', ownershipType: '',
          doorNo: '', area: '', city: '', post: '', district: '', state: '', pinCode: '',
          mobileNumber: '', email: '', ownerPanCard: '', ownerAadharNumber: '',
          pharmacistName: '', registrationId: '', qualification: '',
          yearsOfExperience: '', pharmacistDateOfBirth: '', aadhaarNumber: '',
          pharmacistMobile: '', pharmacistEmail: '', employmentType: '',
          totalShopArea: '', shopLength: '', shopBreadth: '', storageAreaAvailable: false,
          separateScheduleDrugStorage: false, powerBackupAvailable: false, acAvailable: false,
          acBrand: '', acModel: '', acCapacity: '', refrigeratorAvailable: false,
          refrigeratorBrand: '', refrigeratorModel: '', refrigeratorCapacity: '',
          refrigeratorTempRange: '', loginEmail: '', loginPassword: '', confirmPassword: '',
          licenseNumber: '', generatedPassword: '', licenseCreationDate: new Date().toLocaleDateString()
        })
        setStep(1)
      } catch (error) {
        console.error('❌ License creation failed:', {
          message: error.message,
          stack: error.stack,
          error
        })
        setSubmitError(error.message || 'Failed to create license in backend. Check console for details.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <div className="create-license-page min-h-screen w-full bg-[#0F172A] p-4 md:p-8 relative overflow-hidden text-white selection:bg-amber-500/30">
      <div className="absolute top-0 left-0 w-96 h-96 blur-[120px] opacity-20 bg-gradient-to-br from-amber-500 to-cyan-500"></div>
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] blur-[140px] opacity-10 bg-gradient-to-tr from-white to-amber-500"></div>
      <div className="create-license-shell w-full max-w-[1600px] mx-auto relative z-10">
        {/* Header */}
        <div className="license-hero mb-8">
          <h1 className="license-title text-3xl md:text-4xl font-black mb-2 tracking-tighter uppercase">Create New License</h1>
          <p className="license-subtitle text-slate-400 font-semibold max-w-3xl">Complete all steps to register a new wholesale or retail license inside the same secure DrugGuard workspace.</p>
        </div>

        {/* Progress Steps */}
        <div className="license-stepper mb-8">
          {['Establishment Details', 'Pharmacist Details', 'Infrastructure', 'Equipment & Storage', 'Login Credentials'].map((label, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className={`license-step-dot flex items-center justify-center w-10 h-10 rounded-full font-black ${
                step > idx + 1 ? 'bg-emerald-500 text-[#0F172A]' : step === idx + 1 ? 'bg-amber-500 text-[#0F172A]' : 'bg-white/5 text-slate-500 border border-white/10'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              {idx < 4 && <div className={`license-step-line flex-1 h-1 mx-2 rounded-full ${step > idx + 1 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>}
              <p className="license-step-label text-[10px] md:text-xs text-slate-400 ml-2 font-bold uppercase tracking-[0.18em]">{label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="license-form bg-[#1E293B]/70 rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl">
          
          {/* Step 1: Basic Establishment Details */}
          {step === 1 && (
            <div className="license-section space-y-6">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight">A. Basic Establishment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name (License Holder) *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">License Type *</label>
                  <select
                    name="licenseType"
                    value={formData.licenseType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  >
                    <option value="">Select Type</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Retail">Retail</option>
                  </select>
                  {errors.licenseType && <p className="text-red-400 text-sm mt-1">{errors.licenseType}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Shop / Firm Name *</label>
                  <input
                    type="text"
                    name="shopFirmName"
                    value={formData.shopFirmName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.shopFirmName && <p className="text-red-400 text-sm mt-1">{errors.shopFirmName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ownership Type *</label>
                  <select
                    name="ownershipType"
                    value={formData.ownershipType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  >
                    <option value="">Select Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Company">Company</option>
                  </select>
                  {errors.ownershipType && <p className="text-red-400 text-sm mt-1">{errors.ownershipType}</p>}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Shop Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Door No *</label>
                    <input
                      type="text"
                      name="doorNo"
                      value={formData.doorNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.doorNo && <p className="text-red-400 text-sm mt-1">{errors.doorNo}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Area *</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.area && <p className="text-red-400 text-sm mt-1">{errors.area}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City / Town *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Post *</label>
                    <input
                      type="text"
                      name="post"
                      value={formData.post}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.post && <p className="text-red-400 text-sm mt-1">{errors.post}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">District *</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.district && <p className="text-red-400 text-sm mt-1">{errors.district}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Code *</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      maxLength="6"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.pinCode && <p className="text-red-400 text-sm mt-1">{errors.pinCode}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Owner Documents & Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PAN Card Number *</label>
                    <input
                      type="text"
                      name="ownerPanCard"
                      value={formData.ownerPanCard}
                      onChange={handleInputChange}
                      placeholder="e.g., AAAPA1234A"
                      maxLength="10"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.ownerPanCard && <p className="text-red-400 text-sm mt-1">{errors.ownerPanCard}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Aadhaar Card Number *</label>
                    <input
                      type="text"
                      name="ownerAadharNumber"
                      value={formData.ownerAadharNumber}
                      onChange={handleInputChange}
                      maxLength="12"
                      placeholder="XXXX XXXX XXXX"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.ownerAadharNumber && <p className="text-red-400 text-sm mt-1">{errors.ownerAadharNumber}</p>}
                  </div>

                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      maxLength="10"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.mobileNumber && <p className="text-red-400 text-sm mt-1">{errors.mobileNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email ID *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pharmacist Details */}
          {step === 2 && (
            <div className="license-section space-y-6">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight">B. Pharmacist / Competent Person Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pharmacist / Competent Person Name *</label>
                  <input
                    type="text"
                    name="pharmacistName"
                    value={formData.pharmacistName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.pharmacistName && <p className="text-red-400 text-sm mt-1">{errors.pharmacistName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Registration ID (State Pharmacy Council) *</label>
                  <input
                    type="text"
                    name="registrationId"
                    value={formData.registrationId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.registrationId && <p className="text-red-400 text-sm mt-1">{errors.registrationId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Qualification *</label>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  >
                    <option value="">Select Qualification</option>
                    <option value="D.Pharm">D.Pharm</option>
                    <option value="B.Pharm">B.Pharm</option>
                    <option value="M.Pharm">M.Pharm</option>
                  </select>
                  {errors.qualification && <p className="text-red-400 text-sm mt-1">{errors.qualification}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Years of Experience *</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.yearsOfExperience && <p className="text-red-400 text-sm mt-1">{errors.yearsOfExperience}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    maxLength="12"
                    placeholder="XXXX XXXX XXXX"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.aadhaarNumber && <p className="text-red-400 text-sm mt-1">{errors.aadhaarNumber}</p>}
                  <p className="text-slate-400 text-xs mt-1 font-semibold">Will be stored in masked format</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="pharmacistMobile"
                    value={formData.pharmacistMobile}
                    onChange={handleInputChange}
                    maxLength="10"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.pharmacistMobile && <p className="text-red-400 text-sm mt-1">{errors.pharmacistMobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email ID *</label>
                  <input
                    type="email"
                    name="pharmacistEmail"
                    value={formData.pharmacistEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.pharmacistEmail && <p className="text-red-400 text-sm mt-1">{errors.pharmacistEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="pharmacistDateOfBirth"
                    value={formData.pharmacistDateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.pharmacistDateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.pharmacistDateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Employment Type *</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                  {errors.employmentType && <p className="text-red-400 text-sm mt-1">{errors.employmentType}</p>}
                </div>

              </div>
            </div>
          )}

          {/* Step 3: Shop Infrastructure */}
          {step === 3 && (
            <div className="license-section space-y-6">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight">C. Shop Infrastructure Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Shop Area (Square Feet) *</label>
                  <input
                    type="number"
                    name="totalShopArea"
                    value={formData.totalShopArea}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.totalShopArea && <p className="text-red-400 text-sm mt-1">{errors.totalShopArea}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Shop Length (ft) *</label>
                  <input
                    type="number"
                    name="shopLength"
                    value={formData.shopLength}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.shopLength && <p className="text-red-400 text-sm mt-1">{errors.shopLength}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Shop Breadth (ft) *</label>
                  <input
                    type="number"
                    name="shopBreadth"
                    value={formData.shopBreadth}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.shopBreadth && <p className="text-red-400 text-sm mt-1">{errors.shopBreadth}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="storageAreaAvailable"
                    checked={formData.storageAreaAvailable}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-slate-600 font-semibold">Storage Area Available</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="separateScheduleDrugStorage"
                    checked={formData.separateScheduleDrugStorage}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-slate-600 font-semibold">Separate Schedule Drug Storage</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="powerBackupAvailable"
                    checked={formData.powerBackupAvailable}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-slate-600 font-semibold">Power Backup Available</label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Equipment & Storage */}
          {step === 4 && (
            <div className="license-section space-y-6">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight">D. Equipment & Storage Details</h2>
              
              {/* Air Conditioner Section */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/70">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="acAvailable"
                    checked={formData.acAvailable}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-lg font-black text-slate-900">Air Conditioner Available</label>
                </div>

                {formData.acAvailable && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">AC Brand</label>
                      <input
                        type="text"
                        name="acBrand"
                        value={formData.acBrand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">AC Model</label>
                      <input
                        type="text"
                        name="acModel"
                        value={formData.acModel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">AC Capacity (Ton)</label>
                      <input
                        type="number"
                        name="acCapacity"
                        value={formData.acCapacity}
                        onChange={handleInputChange}
                        step="0.5"
                        min="0"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Refrigerator Section */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/70">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="refrigeratorAvailable"
                    checked={formData.refrigeratorAvailable}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-lg font-black text-slate-900">Refrigerator Available</label>
                </div>

                {formData.refrigeratorAvailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Brand</label>
                      <input
                        type="text"
                        name="refrigeratorBrand"
                        value={formData.refrigeratorBrand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Model</label>
                      <input
                        type="text"
                        name="refrigeratorModel"
                        value={formData.refrigeratorModel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Capacity (Liters)</label>
                      <input
                        type="number"
                        name="refrigeratorCapacity"
                        value={formData.refrigeratorCapacity}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Temperature Range</label>
                      <input
                        type="text"
                        name="refrigeratorTempRange"
                        value={formData.refrigeratorTempRange}
                        onChange={handleInputChange}
                        placeholder="e.g., 2°C to 8°C"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Login Credentials */}
          {step === 5 && (
            <div className="license-section space-y-6">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight">E. Login Credentials</h2>
              <p className="text-slate-400 mb-6">Create login credentials for this shop. This will be used to access the system.</p>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Login Username *</label>
                  <input
                    type="text"
                    name="loginEmail"
                    value={formData.loginEmail}
                    onChange={handleInputChange}
                    placeholder="Enter username (license username)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.loginEmail && <p className="text-red-400 text-sm mt-1">{errors.loginEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password *</label>
                  <input
                    type="password"
                    name="loginPassword"
                    value={formData.loginPassword}
                    onChange={handleInputChange}
                    placeholder="Enter password (min 8 characters)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.loginPassword && <p className="text-red-400 text-sm mt-1">{errors.loginPassword}</p>}
                  <p className="text-slate-400 text-xs mt-1 font-semibold">Password must be at least 8 characters long</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-400 outline-none transition-all text-slate-800 font-semibold"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="license-actions flex justify-between mt-8 pt-6 border-t border-white/10">
            {submitError && (
              <div className="license-alert w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 font-semibold">
                ❌ {submitError}
              </div>
            )}
            <div className="flex justify-between w-full mt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="license-button license-button-secondary px-6 py-3 rounded-2xl transition-all font-bold disabled:opacity-50"
                >
                  ← Previous
                </button>
              )}
              
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="license-button license-button-primary ml-auto px-6 py-3 rounded-2xl transition-all font-black tracking-wide disabled:opacity-50"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="license-button license-button-submit ml-auto px-8 py-3 rounded-2xl transition-all font-black tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    'Generate License & Create Account'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

