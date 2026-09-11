import { useEffect, useMemo, useState } from 'react'
import {
  approveWholesalerStock,
  getWholesalerApproveStockBills
} from '../api/wholesaler/wholesalerApi'

export default function ApproveStock() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bills, setBills] = useState([])
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedMedicines, setSelectedMedicines] = useState({})

  const wholesalerId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      return user?.id || user?.uid || ''
    } catch (_err) {
      return ''
    }
  }, [])

  const loadBills = async () => {
    if (!wholesalerId) {
      setError('Wholesaler session not found. Please login again.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await getWholesalerApproveStockBills(wholesalerId)
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
      const response = await approveWholesalerStock(
        wholesalerId,
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Approve Stock from Manufacturer</h1>
          <p className="text-slate-400">Review and approve received stock deliveries</p>
        </div>

        {loading ? (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center text-slate-300">
            Loading pending deliveries...
          </div>
        ) : error ? (
          <div className="bg-red-900/40 rounded-lg p-6 border border-red-700 text-red-100">
            {error}
          </div>
        ) : !selectedBill ? (
          <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Pending Deliveries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Manufacturer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Delivered Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-blue-400 font-semibold">{bill.billNo}</td>
                      <td className="px-6 py-4 text-white">{bill.manufacturer}</td>
                      <td className="px-6 py-4 text-slate-300">{bill.deliveredDate}</td>
                      <td className="px-6 py-4 text-green-400 font-bold text-lg">₹{bill.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleBillClick(bill)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          Review Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        No pending deliveries found. Purchases from manufacturer will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={handleBackToBills}
              className="mb-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              ← Back to Bills
            </button>

            <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Bill Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Bill Number</p>
                  <p className="text-white font-semibold">{selectedBill.billNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Manufacturer</p>
                  <p className="text-white font-semibold">{selectedBill.manufacturer}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Delivered Date</p>
                  <p className="text-white font-semibold">{selectedBill.deliveredDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                  <p className="text-green-400 font-bold text-xl">₹{selectedBill.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-white font-semibold">{selectedBill.orderStatus}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Select Medicines to Accept</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm font-semibold"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300">
                        <input type="checkbox" className="w-4 h-4" disabled />
                      </th>
                      <th className="px-4 py-3 text-left text-slate-300">Medicine Name</th>
                      <th className="px-4 py-3 text-left text-slate-300">Batch No</th>
                      <th className="px-4 py-3 text-left text-slate-300">Quantity</th>
                      <th className="px-4 py-3 text-left text-slate-300">Price</th>
                      <th className="px-4 py-3 text-left text-slate-300">MRP</th>
                      <th className="px-4 py-3 text-left text-slate-300">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-slate-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.medicines.map((medicine) => (
                      <tr
                        key={medicine.id}
                        className={`border-t border-slate-700 transition-colors ${
                          selectedMedicines[medicine.id] ? 'bg-green-900 bg-opacity-20' : 'hover:bg-slate-700'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedMedicines[medicine.id] || false}
                            onChange={() => handleMedicineToggle(medicine.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">{medicine.name}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-sm">{medicine.batch}</td>
                        <td className="px-4 py-3 text-slate-300">{medicine.quantity}</td>
                        <td className="px-4 py-3 text-slate-300">₹{medicine.price}</td>
                        <td className="px-4 py-3 text-slate-300">₹{medicine.mrp}</td>
                        <td className="px-4 py-3 text-slate-300">{medicine.expiry ? new Date(medicine.expiry).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-green-400 font-bold">₹{(medicine.price * medicine.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={handleBackToBills}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  {submitting ? 'Saving...' : 'Accept Selected Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
