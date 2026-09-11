import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  followUpRetailerPendingStock,
  getRetailerPendingStock,
  markRetailerPendingStockReceived
} from '../api/retailer/retailerApi'

export default function PendingStock() {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [pendingItems, setPendingItems] = useState([])

  const retailerId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      return user?.id || user?.uid || ''
    } catch (_error) {
      return ''
    }
  }, [])

  const loadPendingItems = async () => {
    if (!retailerId) {
      setPendingItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await getRetailerPendingStock(retailerId)
      setPendingItems(Array.isArray(response.pendingItems) ? response.pendingItems : [])
    } catch (error) {
      alert(error.message || 'Failed to load pending stock items')
      setPendingItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingItems()
  }, [])

  const handleFollowUp = async (item) => {
    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: true }))
      await followUpRetailerPendingStock(retailerId, item.orderId, item.medicineId)
      alert(`Follow-up request sent for ${item.medicine}`)
      await loadPendingItems()
    } catch (error) {
      alert(error.message || 'Failed to send follow-up request')
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  const handleMarkReceived = async (item) => {
    if (confirm('Mark this item as received?')) {
      try {
        setActionLoading((prev) => ({ ...prev, [item.id]: true }))
        await markRetailerPendingStockReceived(retailerId, item.orderId, item.medicineId)
        alert(`${item.medicine} marked as received`)
        await loadPendingItems()
      } catch (error) {
        alert(error.message || 'Failed to mark item as received')
      } finally {
        setActionLoading((prev) => ({ ...prev, [item.id]: false }))
      }
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">⏳ Pending Stock Items</h1>
            <p className="text-slate-400">Items not received or partially delivered</p>
          </div>
          <Link 
            to="/retailer/approve-stock"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
          >
            ← Back to Approve Stock
          </Link>
        </div>

        {loading ? (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Loading Pending Items...</h3>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Pending Items</h3>
            <p className="text-slate-400">All stock items have been received and approved</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Wholesaler</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Medicine</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Expiry</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Delivered Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reason</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-blue-400 font-semibold">{item.billNo}</td>
                      <td className="px-6 py-4 text-slate-300">{item.wholesaler}</td>
                      <td className="px-6 py-4 text-white font-semibold">{item.medicine}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono">{item.batch}</td>
                      <td className="px-6 py-4 text-slate-300">{item.quantity} units</td>
                      <td className="px-6 py-4 text-green-400 font-bold">₹{item.price}</td>
                      <td className="px-6 py-4 text-slate-300">{item.expiry}</td>
                      <td className="px-6 py-4 text-slate-300">{item.deliveredDate}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs font-semibold">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleFollowUp(item)}
                          disabled={actionLoading[item.id]}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          {actionLoading[item.id] ? 'Working...' : 'Follow Up'}
                        </button>
                        <button
                          onClick={() => handleMarkReceived(item)}
                          disabled={actionLoading[item.id]}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          {actionLoading[item.id] ? 'Working...' : 'Mark Received'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-slate-700 px-6 py-4 border-t border-slate-600">
              <div className="flex justify-between items-center">
                <p className="text-slate-300">
                  Total Pending Items: <span className="text-yellow-400 font-bold">{pendingItems.length}</span>
                </p>
                <p className="text-slate-300">
                  Total Pending Value: <span className="text-green-400 font-bold">
                    ₹{pendingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
