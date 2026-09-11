import { useEffect, useMemo, useState } from 'react'
import { getRetailerPurchases } from '../api/retailer/retailerApi'

export default function RetailerPurchaseHistory() {
  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [selectedBill, setSelectedBill] = useState('')

  useEffect(() => {
    let active = true

    async function loadPurchases() {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const retailerId = user?.id || user?.uid

        if (!retailerId) {
          throw new Error('Retailer session not found. Please login again.')
        }

        const response = await getRetailerPurchases(retailerId)
        if (!active) return

        const mappedBills = (Array.isArray(response.transactions) ? response.transactions : [])
          .filter((tx) => tx.orderType === 'retailer_purchase_order')
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .map((tx) => {
            const products = Array.isArray(tx.items)
              ? tx.items.map((item, index) => ({
                  id: String(item.id || `${item.medicineName || 'item'}-${index}`),
                  name: item.medicineName || '-',
                  batch: item.batch || '-',
                  quantity: Number(item.quantity || 0),
                  rate: Number(item.rate || 0)
                }))
              : []

            const deliveredDate = tx.deliveredDate || String(tx.createdAt || '').slice(0, 10)
            const status = String(tx.orderStatus || 'pending_approval')

            return {
              id: tx.id,
              billNo: tx.billNo || tx.id,
              wholesaler: tx.sellerName || 'Unknown Wholesaler',
              date: deliveredDate || '-',
              totalAmount: Number(tx.totalAmount || 0),
              status,
              products
            }
          })

        setBills(mappedBills)
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load purchase history')
          setBills([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPurchases()

    return () => {
      active = false
    }
  }, [])

  const selectedBillData = useMemo(
    () => bills.find((bill) => bill.billNo === selectedBill) || null,
    [bills, selectedBill]
  )

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  const formatStatus = (status) => {
    if (status === 'approved') return 'Delivered'
    if (status === 'pending_approval') return 'Pending Approval'
    return status
  }

  const statusBadgeClass = (status) => {
    if (status === 'approved') return 'bg-green-600'
    if (status === 'pending_approval') return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Purchase History</h1>
          <p className="text-slate-400">View all your purchase transactions</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Bill Number</label>
          <select
            value={selectedBill}
            onChange={(e) => setSelectedBill(e.target.value)}
            disabled={loading}
            className="w-full md:w-96 px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a bill</option>
            {bills.map((bill) => (
              <option key={bill.billNo} value={bill.billNo}>
                {bill.billNo} - {bill.wholesaler}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Wholesaler</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {!loading && bills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      No purchase history found.
                    </td>
                  </tr>
                )}
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-semibold">{bill.billNo}</td>
                    <td className="px-6 py-4 text-slate-300">{bill.wholesaler}</td>
                    <td className="px-6 py-4 text-slate-300">{bill.date}</td>
                    <td className="px-6 py-4 text-slate-300 font-semibold">{formatCurrency(bill.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-white rounded-full text-xs font-semibold ${statusBadgeClass(bill.status)}`}>
                        {formatStatus(bill.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(bill.billNo)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        View Products
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBillData && (
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Products in {selectedBillData.billNo}</h2>
              <p className="text-slate-400 text-sm">Wholesaler: {selectedBillData.wholesaler}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBillData.products.map((product) => (
                    <tr key={product.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-slate-300">{product.name}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono">{product.batch}</td>
                      <td className="px-6 py-4 text-slate-300">{product.quantity} units</td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{formatCurrency(product.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
