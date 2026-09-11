import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createRetailerOrder,
  getRetailerWholesalerCatalog,
  getRetailerWholesalers
} from '../api/retailer/retailerApi'

export default function PurchaseFromWholesaler() {
  const [loadingWholesalers, setLoadingWholesalers] = useState(true)
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [retailerId, setRetailerId] = useState('')
  const [wholesalers, setWholesalers] = useState([])
  const [availableDrugs, setAvailableDrugs] = useState([])
  const [formData, setFormData] = useState({
    wholesalerId: '',
    drugs: []
  })
  const [currentMedicine, setCurrentMedicine] = useState({
    drugId: '',
    quantity: ''
  })
  const [medicineSearch, setMedicineSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const quantityInputRef = useRef(null)

  useEffect(() => {
    let active = true

    async function loadWholesalers() {
      try {
        setLoadingWholesalers(true)

        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const currentRetailerId = user?.id || user?.uid
        if (!currentRetailerId) {
          throw new Error('Retailer session not found. Please login again.')
        }

        if (active) {
          setRetailerId(currentRetailerId)
        }

        const response = await getRetailerWholesalers(currentRetailerId)
        if (!active) return

        setWholesalers(Array.isArray(response.wholesalers) ? response.wholesalers : [])
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load wholesalers')
        }
      } finally {
        if (active) {
          setLoadingWholesalers(false)
        }
      }
    }

    loadWholesalers()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      if (!formData.wholesalerId || !retailerId) {
        if (active) {
          setAvailableDrugs([])
        }
        return
      }

      try {
        setLoadingMedicines(true)
        const response = await getRetailerWholesalerCatalog(retailerId, formData.wholesalerId)

        if (!active) return
        setAvailableDrugs(Array.isArray(response.medicines) ? response.medicines : [])
      } catch (error) {
        if (active) {
          setAvailableDrugs([])
          alert(error.message || 'Failed to load wholesaler medicines')
        }
      } finally {
        if (active) {
          setLoadingMedicines(false)
        }
      }
    }

    loadCatalog()

    return () => {
      active = false
    }
  }, [formData.wholesalerId, retailerId])

  const selectedWholesaler = useMemo(
    () => wholesalers.find((w) => w.id === formData.wholesalerId) || null,
    [wholesalers, formData.wholesalerId]
  )

  const filteredDrugs = useMemo(
    () =>
      availableDrugs.filter((d) =>
        d.name.toLowerCase().includes(medicineSearch.toLowerCase())
      ),
    [availableDrugs, medicineSearch]
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'wholesalerId') {
      setCurrentMedicine({ drugId: '', quantity: '' })
      setMedicineSearch('')
      setOpenDropdown(false)
      setHighlightedIndex(-1)
      setFormData((prev) => ({
        ...prev,
        wholesalerId: value,
        drugs: []
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addMedicineToOrder = () => {
    if (!formData.wholesalerId) {
      alert('Please select a wholesaler first')
      return
    }

    if (!currentMedicine.drugId || !currentMedicine.quantity) {
      alert('Please select a medicine and enter quantity')
      return
    }

    const selectedDrug = availableDrugs.find((d) => d.id === currentMedicine.drugId)
    if (!selectedDrug) {
      alert('Selected medicine is not available')
      return
    }

    const qty = Number(currentMedicine.quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    const alreadyAddedQty = formData.drugs
      .filter((d) => d.drugId === currentMedicine.drugId)
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0)

    if (alreadyAddedQty + qty > Number(selectedDrug.stock || 0)) {
      alert(`Insufficient stock. Available: ${selectedDrug.stock}, Already added: ${alreadyAddedQty}`)
      return
    }

    setFormData(prev => ({
      ...prev,
      drugs: [...prev.drugs, { drugId: currentMedicine.drugId, quantity: String(qty) }]
    }))

    setCurrentMedicine({ drugId: '', quantity: '' })
    setMedicineSearch('')
    setOpenDropdown(false)
    setHighlightedIndex(-1)

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  const selectMedicine = (drug) => {
    setCurrentMedicine(prev => ({ ...prev, drugId: drug.id }))
    setMedicineSearch(drug.name)
    setOpenDropdown(false)
    setHighlightedIndex(-1)

    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus()
      }
    }, 100)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < filteredDrugs.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      selectMedicine(filteredDrugs[highlightedIndex])
    } else if (e.key === 'Tab' && highlightedIndex >= 0) {
      e.preventDefault()
      selectMedicine(filteredDrugs[highlightedIndex])
    }
  }

  const handleQuantityKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addMedicineToOrder()
    }
  }

  const removeDrug = (index) => {
    setFormData(prev => ({
      ...prev,
      drugs: prev.drugs.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    return formData.drugs.reduce((total, drug) => {
      const drugInfo = availableDrugs.find(d => d.id === drug.drugId)
      return total + (drugInfo ? drugInfo.price * (drug.quantity || 0) : 0)
    }, 0).toFixed(2)
  }

  const handleClear = () => {
    setFormData({ wholesalerId: '', drugs: [] })
    setCurrentMedicine({ drugId: '', quantity: '' })
    setMedicineSearch('')
    setOpenDropdown(false)
    setHighlightedIndex(-1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.wholesalerId || formData.drugs.length === 0) {
      alert('Please select wholesaler and add drugs')
      return
    }

    try {
      setSubmitting(true)
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      const retailerShopId = user?.id || user?.uid

      if (!retailerShopId) {
        throw new Error('Retailer session not found. Please login again.')
      }

      if (!selectedWholesaler) {
        throw new Error('Selected wholesaler not found')
      }

      const items = formData.drugs
        .map((drug) => {
          const drugInfo = availableDrugs.find((d) => d.id === drug.drugId)
          if (!drugInfo) return null

          const qty = Number(drug.quantity || 0)
          return {
            id: String(drugInfo.id || drugInfo.medicineId || drugInfo.name),
            medicineName: drugInfo.name,
            batch: drugInfo.batch,
            quantity: qty,
            rate: Number(drugInfo.price),
            mrp: Number(drugInfo.mrp),
            manufactureDate: drugInfo.manufactureDate || null,
            expiryDate: drugInfo.expiryDate
          }
        })
        .filter(Boolean)

      if (items.length === 0) {
        throw new Error('No valid medicines found to place the order')
      }

      const response = await createRetailerOrder({
        retailerId: retailerShopId,
        retailerName: user.name || user.username || '',
        wholesalerId: selectedWholesaler.id,
        wholesalerName: selectedWholesaler.name,
        district: user.district || null,
        items
      })

      alert(`Order placed successfully!\nBill No: ${response.billNo}\nTotal: ₹${response.totalAmount}`)
      handleClear()
    } catch (error) {
      alert(error.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Purchase from Wholesaler</h1>
          <p className="text-slate-400">Create a new purchase order</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Wholesaler *</label>
              <select
                name="wholesalerId"
                value={formData.wholesalerId}
                onChange={handleInputChange}
                disabled={loadingWholesalers || submitting}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a wholesaler</option>
                {wholesalers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drugs Section */}
          <div className="mb-8">
            <div className="mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">📋 Add Medicines</h3>
                <p className="text-slate-400 text-sm mt-1">Search and select medicines for the order</p>
              </div>
            </div>

            {/* Single Search Row */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-600">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <label className="block text-xs font-medium text-slate-300 mb-2">Search Medicine</label>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={medicineSearch}
                      onChange={(e) => {
                        setMedicineSearch(e.target.value)
                        setOpenDropdown(true)
                        setHighlightedIndex(-1)
                      }}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => setOpenDropdown(true)}
                      onBlur={() => setTimeout(() => setOpenDropdown(false), 300)}
                      placeholder={loadingMedicines ? 'Loading medicines...' : 'Type medicine name...'}
                      disabled={!formData.wholesalerId || loadingMedicines}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    {openDropdown && (
                      <div className="absolute top-full left-0 mt-2 bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl z-[9999] w-full max-w-[900px] max-h-72 overflow-y-auto">
                        {filteredDrugs.length > 0 ? (
                          <div className="divide-y divide-slate-700">
                            {filteredDrugs.map((d, index) => (
                              <div
                                key={d.id}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  selectMedicine(d)
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`px-5 py-4 cursor-pointer transition-colors ${
                                  highlightedIndex === index 
                                    ? 'bg-blue-600/30 border-l-4 border-blue-500' 
                                    : 'hover:bg-slate-800'
                                }`}
                              >
                                <div className="font-bold text-white text-base mb-2">{d.name}</div>
                                <div className="grid grid-cols-8 gap-3 text-xs">
                                  <div>
                                    <div className="text-slate-500 mb-1">Company</div>
                                    <div className="text-slate-300 font-semibold">{d.company}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Batch</div>
                                    <div className="text-slate-300 font-mono">{d.batch}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Mfg</div>
                                    <div className="text-slate-300">{d.manufactureDate ? new Date(d.manufactureDate).toLocaleDateString() : '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Expiry</div>
                                    <div className="text-slate-300">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Price</div>
                                    <div className="text-green-400 font-bold">₹{d.price}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">MRP</div>
                                    <div className="text-blue-400 font-bold">₹{d.mrp}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Offer</div>
                                    <div className={`font-bold ${d.offer ? 'text-yellow-400' : 'text-slate-500'}`}>
                                      {d.offer ? d.offer : '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 mb-1">Type</div>
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${d.isNarcotic ? 'bg-red-600/20 text-red-300 border border-red-500/40' : 'bg-green-600/20 text-green-300 border border-green-500/40'}`}
                                    >
                                      {d.isNarcotic ? 'Narcotic' : 'Normal'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-8 text-center">
                            <div className="text-4xl mb-2">🔍</div>
                            <div className="text-slate-400">No medicines found</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-300 mb-2">Quantity</label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    value={currentMedicine.quantity}
                    onChange={(e) => setCurrentMedicine(prev => ({ ...prev, quantity: e.target.value }))}
                    onKeyPress={handleQuantityKeyPress}
                    disabled={!formData.wholesalerId || loadingMedicines}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Qty"
                  />
                </div>
                <button
                  type="button"
                  onClick={addMedicineToOrder}
                  disabled={!formData.wholesalerId || loadingMedicines}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-semibold shadow-lg"
                >
                  ➕ Add
                </button>
              </div>
            </div>
          </div>

          {formData.drugs.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 mb-8 border-2 border-slate-600 shadow-2xl overflow-hidden">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">📋 Order Summary</h3>
                <p className="text-slate-400 text-sm">Complete medicine details for your order</p>
              </div>

              {/* Order Summary Table */}
              <div className="bg-slate-800 rounded-lg border border-slate-600 overflow-visible shadow-lg">
                <div className="overflow-visible">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-2 border-slate-600">
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">S.No</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Medicine Name</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Batch</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Mfg</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Expiry</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Qty</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Price (₹)</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">MRP (₹)</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Offer</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Amount (₹)</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.drugs.map((drug, idx) => {
                        const drugInfo = availableDrugs.find(d => d.id === drug.drugId)
                        if (!drugInfo) return null
                        const amount = drugInfo.price * (drug.quantity || 0)

                        let qtyDisplay = drug.quantity || 0
                        if (drugInfo.offer && drug.quantity) {
                          const offerParts = drugInfo.offer.split('+')
                          const buyQty = parseInt(offerParts[0])
                          const freeQty = parseInt(offerParts[1])

                          if (parseInt(drug.quantity) >= buyQty) {
                            const sets = Math.floor(parseInt(drug.quantity) / buyQty)
                            const remaining = parseInt(drug.quantity) % buyQty

                            if (remaining === 0) {
                              qtyDisplay = `${drug.quantity}+${sets * freeQty}`
                            } else {
                              qtyDisplay = drug.quantity
                            }
                          }
                        }
                        
                        return (
                          <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                            <td className="px-4 py-4 text-center">
                              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-white text-sm font-medium">
                              {drugInfo.name}
                            </td>
                            <td className="px-4 py-4 text-white text-sm font-medium">
                              {drugInfo.company}
                            </td>
                            <td className="px-4 py-4 text-slate-300 text-sm font-mono">
                              {drugInfo.batch}
                            </td>
                            <td className="px-4 py-4 text-center text-sm">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${drugInfo.isNarcotic ? 'bg-red-600/20 text-red-300 border border-red-500/40' : 'bg-green-600/20 text-green-300 border border-green-500/40'}`}
                              >
                                {drugInfo.isNarcotic ? 'Narcotic' : 'Normal'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-300 text-sm">
                              {drugInfo.manufactureDate ? new Date(drugInfo.manufactureDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 text-slate-300 text-sm">
                              {drugInfo.expiryDate ? new Date(drugInfo.expiryDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 text-center text-slate-300 font-semibold">
                              {qtyDisplay}
                            </td>
                            <td className="px-4 py-4 text-center text-green-400 font-bold text-sm">
                              ₹{drugInfo.price}
                            </td>
                            <td className="px-4 py-4 text-center text-blue-400 font-bold text-sm">
                              ₹{drugInfo.mrp}
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-sm">
                              <span className={drugInfo.offer ? 'text-yellow-400' : 'text-slate-500'}>
                                {drugInfo.offer || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-white font-bold text-sm">
                              ₹{amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeDrug(idx)}
                                className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Section */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-green-600/40 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center mt-8">
                <div>
                  <p className="text-slate-300 mb-2">Total Items: <span className="text-white font-bold">{formData.drugs.length}</span></p>
                  <p className="text-slate-300">Total Quantity: <span className="text-white font-bold">{formData.drugs.reduce((sum, d) => sum + parseInt(d.quantity || 0), 0)}</span></p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <p className="text-slate-400 text-sm mb-1">Grand Total Amount</p>
                  <p className="text-4xl font-bold text-green-400">₹{calculateTotal()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}