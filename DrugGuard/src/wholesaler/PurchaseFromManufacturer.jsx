import { useEffect, useRef, useState } from 'react'
import {
  createWholesalerManufacturerPurchase,
  getManufacturerMedicines
} from '../api/wholesaler/wholesalerApi'

export default function PurchaseFromManufacturer() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [manufacturers, setManufacturers] = useState([])
  const [currentMedicines, setCurrentMedicines] = useState([])
  const [formData, setFormData] = useState({ manufacturer: '', drugs: [] })
  const [currentMedicine, setCurrentMedicine] = useState({ drugId: '', quantity: '' })
  const [medicineSearch, setMedicineSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const quantityInputRef = useRef(null)
  const dropdownItemsRef = useRef({})

  // Load manufacturers on mount
  useEffect(() => {
    let active = true

    async function loadManufacturers() {
      try {
        setLoading(true)
        const response = await getManufacturerMedicines()
        if (!active) return

        setManufacturers(Array.isArray(response.manufacturers) ? response.manufacturers : [])
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load manufacturers')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadManufacturers()

    return () => {
      active = false
    }
  }, [])

  // Load medicines when manufacturer is selected
  useEffect(() => {
    if (!formData.manufacturer) {
      setCurrentMedicines([])
      return
    }

    let active = true

    async function loadMedicinesForManufacturer() {
      try {
        setLoadingMedicines(true)
        const response = await getManufacturerMedicines(formData.manufacturer)
        if (!active) return

        setCurrentMedicines(Array.isArray(response.medicines) ? response.medicines : [])
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load medicines')
        }
      } finally {
        if (active) {
          setLoadingMedicines(false)
        }
      }
    }

    loadMedicinesForManufacturer()

    return () => {
      active = false
    }
  }, [formData.manufacturer])

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownItemsRef.current[highlightedIndex]) {
      dropdownItemsRef.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [highlightedIndex])

  const searchQuery = medicineSearch.trim().toLowerCase()
  const filteredDrugs = currentMedicines
    .filter((drug) => {
      if (!searchQuery) {
        return true
      }

      return (
        String(drug.medicineName || '').toLowerCase().includes(searchQuery) ||
        String(drug.manufacturerName || '').toLowerCase().includes(searchQuery) ||
        String(drug.type || '').toLowerCase().includes(searchQuery) ||
        String(drug.batchNumber || '').toLowerCase().includes(searchQuery)
      )
    })
    .slice(0, 80)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value, drugs: name === 'manufacturer' ? [] : prev.drugs }))
    if (name === 'manufacturer') {
      setCurrentMedicine({ drugId: '', quantity: '' })
      setMedicineSearch('')
      setOpenDropdown(false)
    }
  }

  const selectMedicine = (drug) => {
    setCurrentMedicine((prev) => ({ ...prev, drugId: drug.id }))
    setMedicineSearch(drug.medicineName)
    setOpenDropdown(false)
    setHighlightedIndex(-1)
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus()
      }
    }, 100)
  }

  const addMedicineToOrder = () => {
    if (!currentMedicine.drugId || !currentMedicine.quantity) {
      alert('Please select a medicine and enter quantity')
      return
    }

    const quantity = Number(currentMedicine.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    setFormData((prev) => ({ ...prev, drugs: [...prev.drugs, { ...currentMedicine, quantity: String(quantity) }] }))
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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpenDropdown(true)
      setHighlightedIndex((prev) => {
        if (filteredDrugs.length === 0) return -1
        if (prev < 0) return 0
        return prev < filteredDrugs.length - 1 ? prev + 1 : 0
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpenDropdown(true)
      setHighlightedIndex((prev) => {
        if (filteredDrugs.length === 0) return -1
        if (prev <= 0) return filteredDrugs.length - 1
        return prev - 1
      })
      return
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (highlightedIndex >= 0 && filteredDrugs[highlightedIndex]) {
        selectMedicine(filteredDrugs[highlightedIndex])
        return
      }

      if (filteredDrugs.length > 0) {
        selectMedicine(filteredDrugs[0])
      }
      return
    }

    // Default: open dropdown on any other key
    if (!openDropdown) {
      setOpenDropdown(true)
    }
  }

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      addMedicineToOrder()
    }
  }

  const removeMedicine = (index) => {
    setFormData((prev) => ({
      ...prev,
      drugs: prev.drugs.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    return formData.drugs.reduce((total, item) => {
      const drug = currentMedicines.find((d) => d.id === item.drugId)
      return total + (drug ? Number(drug.rate) * Number(item.quantity) : 0)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.manufacturer || formData.drugs.length === 0) {
      alert('Please select a manufacturer and add at least one medicine')
      return
    }

    try {
      setSubmitting(true)
      const storedUser = JSON.parse(localStorage.getItem('dg_user') || '{}')

      await createWholesalerManufacturerPurchase({
        wholesalerId: storedUser.id || 'unknown-wholesaler',
        wholesalerName: storedUser.shopFirmName || storedUser.username || '',
        manufacturer: formData.manufacturer,
        items: formData.drugs.map((item) => ({
          medicineId: item.drugId,
          quantity: Number(item.quantity)
        }))
      })

      alert(
        `Order placed successfully!\nManufacturer: ${formData.manufacturer}\nTotal Items: ${formData.drugs.length}\nTotal Amount: ₹${calculateTotal().toFixed(2)}`
      )

      setFormData({ manufacturer: '', drugs: [] })
      setCurrentMedicine({ drugId: '', quantity: '' })
      setMedicineSearch('')
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
          <h1 className="text-4xl font-bold text-white mb-2">Purchase from Manufacturer</h1>
          <p className="text-slate-400">Create a new purchase order to manufacturers</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Select Manufacturer</h3>
            <select
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a manufacturer...</option>
              {manufacturers.map((mfr) => (
                <option key={mfr} value={mfr}>
                  {mfr}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-1">Add Medicines</h3>
            <p className="text-sm text-slate-400 mb-4">
              Narcotic medicines are shown in red, and normal medicines in green.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-slate-400 text-sm mb-2">Search Medicine</label>
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
                  onBlur={() => setTimeout(() => setOpenDropdown(false), 200)}
                  placeholder="Type medicine name..."
                  disabled={!formData.manufacturer}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {loadingMedicines && openDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-700 rounded-lg shadow-lg p-6 border border-slate-600 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <p className="text-slate-300 text-sm">Loading medicines...</p>
                    </div>
                  </div>
                )}

                {openDropdown && !loadingMedicines && filteredDrugs.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto border border-slate-600">
                    {filteredDrugs.map((drug, index) => (
                      <div
                        key={drug.id}
                        ref={(el) => {
                          if (el) dropdownItemsRef.current[index] = el
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectMedicine(drug)
                        }}
                        className={`p-4 cursor-pointer transition-colors border-b border-slate-600 ${
                          index === highlightedIndex ? 'bg-blue-700 border-blue-600' : 'hover:bg-slate-600'
                        }`}
                      >
                        <p className="font-semibold text-white mb-1">{drug.medicineName}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Company: </span>
                            <span className="text-slate-300">{drug.manufacturerName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Batch: </span>
                            <span className="text-slate-300">{drug.batchNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Rate: </span>
                            <span className="text-green-400 font-semibold">₹{drug.rate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">MRP: </span>
                            <span className="text-blue-400 font-semibold">₹{drug.mrp}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Mfg: </span>
                            <span className="text-slate-300">{new Date(drug.manufactureDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Expiry: </span>
                            <span className="text-slate-300">{new Date(drug.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Pack: </span>
                            <span className="text-slate-300">{drug.packType} ({drug.packSize})</span>
                          </div>
                          <div className="col-span-2 flex gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded ${drug.isNarcotic ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                              {drug.isNarcotic ? 'Narcotic' : 'Normal'}
                            </span>
                            <span className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                              {drug.isOriginal ? 'Original' : 'Generic'}
                            </span>
                            <span className="px-2 py-1 bg-slate-600 text-white text-xs rounded">{drug.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {openDropdown && filteredDrugs.length === 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-700 rounded-lg shadow-lg border border-slate-600 p-4 text-sm text-slate-300">
                    No medicines found for your search.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Quantity</label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  value={currentMedicine.quantity}
                  onChange={(e) => setCurrentMedicine((prev) => ({ ...prev, quantity: e.target.value }))}
                  onKeyDown={handleQuantityKeyDown}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addMedicineToOrder}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              + Add Medicine
            </button>
          </div>

          {formData.drugs.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300">Medicine</th>
                      <th className="px-4 py-3 text-left text-slate-300">Rate</th>
                      <th className="px-4 py-3 text-left text-slate-300">Quantity</th>
                      <th className="px-4 py-3 text-left text-slate-300">Total</th>
                      <th className="px-4 py-3 text-left text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.drugs.map((item, index) => {
                      const drug = currentMedicines.find((d) => d.id === item.drugId)
                      const total = drug ? Number(drug.rate) * Number(item.quantity) : 0

                      return (
                        <tr key={`${item.drugId}-${index}`} className="border-t border-slate-700">
                          <td className="px-4 py-3 text-white">
                            <div>{drug?.medicineName}</div>
                            <div className="text-xs mt-1">
                              <span className={drug?.isNarcotic ? 'text-red-400' : 'text-green-400'}>
                                {drug?.isNarcotic ? 'Narcotic' : 'Normal'}
                              </span>
                              <span className="text-slate-500"> | </span>
                              <span className="text-slate-400">{drug?.packType} ({drug?.packSize})</span>
                              <span className="text-slate-500"> | </span>
                              <span className="text-slate-400">Mfg {drug?.manufactureDate ? new Date(drug.manufactureDate).toLocaleDateString() : '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">₹{drug?.rate}</td>
                          <td className="px-4 py-3 text-slate-300">{item.quantity}</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">₹{total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeMedicine(index)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-slate-600">
                      <td colSpan="3" className="px-4 py-4 text-right text-white font-bold text-lg">
                        Grand Total:
                      </td>
                      <td className="px-4 py-4 text-green-400 font-bold text-xl">₹{calculateTotal().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || submitting}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading medicines...' : submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
