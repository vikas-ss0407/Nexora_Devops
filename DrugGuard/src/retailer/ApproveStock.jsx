import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  approveRetailerStock,
  getRetailerApproveStockBills
} from '../api/retailer/retailerApi'

export default function ApproveStock() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bills, setBills] = useState([])
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedMedicines, setSelectedMedicines] = useState({})

  const retailerId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      return user?.id || user?.uid || ''
    } catch (_err) {
      return ''
    }
  }, [])

  const loadBills = async () => {
    if (!retailerId) {
      setError('Retailer session not found. Please login again.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await getRetailerApproveStockBills(retailerId)
      const nextBills = Array.isArray(response.bills) ? response.bills : []
      setBills(nextBills)

      if (selectedBill) {
        const refreshed = nextBills.find((bill) => bill.id === selectedBill.id)
        setSelectedBill(refreshed || null)
        if (!refreshed) {
          setSelectedMedicines({})
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load bills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBills()
  }, [])

  const handleBillClick = (bill) => {
    setSelectedBill(bill)
    const allSelected = {}
    bill.medicines.forEach((med) => {
      allSelected[med.id] = true
    })
    setSelectedMedicines(allSelected)
  }

  const handleSelectAll = () => {
    if (!selectedBill) return
    const allSelected = {}
    selectedBill.medicines.forEach((med) => {
      allSelected[med.id] = true
    })
    setSelectedMedicines(allSelected)
  }

  const handleDeselectAll = () => {
    setSelectedMedicines({})
  }

  const handleMedicineToggle = (medicineId) => {
    setSelectedMedicines((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }))
  }

  const handleAccept = async () => {
    if (!selectedBill) return

    const acceptedMeds = selectedBill.medicines.filter((med) => selectedMedicines[med.id])

    if (acceptedMeds.length === 0) {
      alert('Please select at least one medicine to accept')
      return
    }

    try {
      setSubmitting(true)
      const response = await approveRetailerStock(
        retailerId,
        selectedBill.id,
        acceptedMeds.map((med) => String(med.id))
      )

      alert(
        `Accepted ${response.acceptedCount} medicine(s)\n` +
          `${response.pendingCount > 0 ? `${response.pendingCount} medicine(s) marked as pending` : 'All medicines accepted'}`
      )

      setSelectedBill(null)
      setSelectedMedicines({})
      await loadBills()
    } catch (err) {
      alert(err.message || 'Failed to approve stock')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToBills = () => {
    setSelectedBill(null)
    setSelectedMedicines({})
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Approve Received Stock</h1>
            <p className="text-slate-400">Review and approve delivered stock items</p>
          </div>
          <Link 
            to="/retailer/pending-stock"
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center gap-2"
          >
            ⏳ View Pending Items
          </Link>
        </div>

        {loading ? (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center text-slate-300">
            Loading pending stock bills...
          </div>
        ) : error ? (
          <div className="bg-red-900/40 rounded-lg p-6 border border-red-700 text-red-100">
            {error}
          </div>
        ) : !selectedBill ? (
          /* Bills List */
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Wholesaler</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Delivered Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-blue-400 font-semibold">{bill.billNo}</td>
                      <td className="px-6 py-4 text-slate-300">{bill.wholesaler}</td>
                      <td className="px-6 py-4 text-green-400 font-bold">₹{bill.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-300">{bill.deliveredDate}</td>
                      <td className="px-6 py-4 text-slate-300">{bill.medicines.length} items</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleBillClick(bill)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-semibold"
                        >
                          View Items
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        No pending bills found. Place an order from Purchase From Wholesaler first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Medicine Details View */
          <div className="space-y-6">
            {/* Bill Header */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bill: {selectedBill.billNo}</h2>
                  <p className="text-slate-400">Wholesaler: <span className="text-white font-semibold">{selectedBill.wholesaler}</span></p>
                </div>
                <button
                  onClick={handleBackToBills}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  ← Back to Bills
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-400">₹{selectedBill.totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <p className="text-lg font-semibold text-white">{selectedBill.orderStatus}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Delivered Date</p>
                  <p className="text-lg font-semibold text-white">{selectedBill.deliveredDate}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleSelectAll}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                ✓ Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
              >
                ✗ Deselect All
              </button>
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {submitting ? 'Saving...' : 'Accept Selected'}
              </button>
            </div>

            {/* Medicines Table */}
            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        <input 
                          type="checkbox"
                          checked={selectedBill.medicines.every(med => selectedMedicines[med.id])}
                          onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                          className="w-5 h-5 rounded"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Medicine Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">MRP</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Expiry</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.medicines.map((medicine) => (
                      <tr 
                        key={medicine.id} 
                        className={`border-t border-slate-700 transition-colors ${
                          selectedMedicines[medicine.id] ? 'bg-green-900/20 hover:bg-green-900/30' : 'hover:bg-slate-700'
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedMedicines[medicine.id] || false}
                            onChange={() => handleMedicineToggle(medicine.id)}
                            className="w-5 h-5 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">{medicine.name}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{medicine.batch}</td>
                        <td className="px-6 py-4 text-slate-300">{medicine.quantity} units</td>
                        <td className="px-6 py-4 text-green-400 font-bold">₹{medicine.price}</td>
                        <td className="px-6 py-4 text-blue-400 font-bold">₹{medicine.mrp}</td>
                        <td className="px-6 py-4 text-slate-300">{medicine.expiry}</td>
                        <td className="px-6 py-4 text-white font-bold">₹{(medicine.price * medicine.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-green-600/40 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-300 mb-2">
                    Selected: <span className="text-white font-bold">
                      {Object.values(selectedMedicines).filter(Boolean).length} / {selectedBill.medicines.length} items
                    </span>
                  </p>
                  <p className="text-slate-300">
                    Pending: <span className="text-yellow-400 font-bold">
                      {selectedBill.medicines.length - Object.values(selectedMedicines).filter(Boolean).length} items
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm mb-1">Selected Amount</p>
                  <p className="text-4xl font-bold text-green-400">
                    ₹{selectedBill.medicines.filter(med => selectedMedicines[med.id]).reduce((sum, med) => sum + (med.price * med.quantity), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}