import { useEffect, useMemo, useState } from 'react'
import {
  createRetailerReturnRequest,
  getRetailerReturnProductBills
} from '../api/retailer/retailerApi'

export default function ReturnProduct() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [retailerId, setRetailerId] = useState('')
  const [bills, setBills] = useState([])
  const [selectedBillId, setSelectedBillId] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [returnReason, setReturnReason] = useState('')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    let active = true

    async function loadBills() {
      try {
        setLoading(true)

        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const currentRetailerId = user?.id || user?.uid
        if (!currentRetailerId) {
          throw new Error('Retailer session not found. Please login again.')
        }

        if (active) {
          setRetailerId(currentRetailerId)
        }

        const response = await getRetailerReturnProductBills(currentRetailerId)
        if (!active) return

        setBills(Array.isArray(response.bills) ? response.bills : [])
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load bills')
          setBills([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadBills()

    return () => {
      active = false
    }
  }, [])

  const returnReasons = [
    'Damaged packaging',
    'Expired batch',
    'Quality issue',
    'Storage issue',
    'Wrong item received',
    'Quantity mismatch',
    'Customer returned'
  ]

  const selectedBill = useMemo(
    () => bills.find((bill) => bill.id === selectedBillId) || null,
    [bills, selectedBillId]
  )

  const currentBillProducts = selectedBill?.products || []

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      const id = String(productId)
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBill || selectedProducts.length === 0 || !returnReason) {
      alert('Please fill all required fields and select at least one product')
      return
    }

    if (!retailerId) {
      alert('Retailer session not found. Please login again.')
      return
    }

    const selectedProductDetails = currentBillProducts.filter((product) =>
      selectedProducts.includes(String(product.id))
    )

    const returnType = returnReason === 'Expired batch' ? 'expiry' : 'other'

    try {
      setSubmitting(true)
      const response = await createRetailerReturnRequest(retailerId, {
        orderId: selectedBill.id,
        billNo: selectedBill.billNo,
        wholesalerId: selectedBill.wholesalerId,
        reason: returnReason,
        returnType,
        notes: returnNotes,
        items: selectedProductDetails.map((product) => ({
          medicineId: product.medicineId || product.id,
          medicineName: product.name,
          batch: product.batch,
          quantity: Number(product.quantity || 0)
        }))
      })

      alert(`Return request submitted successfully!\nBill: ${selectedBill.billNo}\nProducts: ${selectedProductDetails.length}\nRequests Created: ${response.requestCount || selectedProductDetails.length}`)

      setSelectedBillId('')
      setSelectedProducts([])
      setReturnReason('')
      setReturnNotes('')
    } catch (error) {
      alert(error.message || 'Failed to submit return request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Return Product</h1>
          <p className="text-slate-400">Submit a return request for medicines from bills</p>
        </div>

        {loading && (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-4 text-slate-300">
            Loading bills...
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          {/* Bill Selection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Bill *</label>
              <select
                value={selectedBillId}
                onChange={(e) => {
                  setSelectedBillId(e.target.value)
                  setSelectedProducts([])
                }}
                disabled={loading || submitting}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a bill</option>
                {bills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.billNo} - {bill.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products from Bill */}
          {selectedBill && currentBillProducts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Select Products to Return *</h3>
              <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 border-b border-slate-600">
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="w-4 h-4" />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Product Name</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-300">Batch</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Qty</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">Type</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-300">MRP (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBillProducts.map((product, idx) => (
                        <tr key={product.id} className="border-b border-slate-600 hover:bg-slate-600/50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(String(product.id))}
                              onChange={() => handleProductToggle(product.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4 text-white font-medium">
                            {product.name}
                          </td>
                          <td className="px-4 py-4 text-slate-300 font-mono">
                            {product.batch}
                          </td>
                          <td className="px-4 py-4 text-center text-slate-300 font-semibold">
                            {product.quantity}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
                              {product.packaging}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-blue-400 font-bold">
                            ₹{product.mrp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-2">Selected: {selectedProducts.length} product(s)</p>
            </div>
          )}

          {/* Return Details */}
          {selectedBill && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Return *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select reason</option>
                  {returnReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Provide any additional details"
                  rows="1"
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="reset"
              onClick={() => {
                setSelectedBillId('')
                setSelectedProducts([])
                setReturnReason('')
                setReturnNotes('')
              }}
              disabled={submitting}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-8 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
