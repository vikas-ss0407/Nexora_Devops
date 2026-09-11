import { useEffect, useMemo, useState } from 'react'
import { getRetailerSalesHistory } from '../api/retailer/retailerApi'

export default function RetailerSalesHistory() {
  const [loading, setLoading] = useState(true)
  const [salesRows, setSalesRows] = useState([])

  useEffect(() => {
    let active = true

    async function loadSalesHistory() {
      try {
        setLoading(true)

        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const retailerId = user?.id || user?.uid
        if (!retailerId) {
          throw new Error('Retailer session not found. Please login again.')
        }

        const response = await getRetailerSalesHistory(retailerId)
        if (!active) return

        const rows = (Array.isArray(response.sales) ? response.sales : []).flatMap((sale) => {
          const items = Array.isArray(sale.items) && sale.items.length > 0
            ? sale.items
            : [{
                id: sale.id,
                medicineName: '-',
                batch: '-',
                quantity: 0,
                packaging: '',
                company: '',
                expiryDate: null,
                amount: sale.totalAmount || 0
              }]

          return items.map((item, index) => ({
            id: `${sale.id}-${item.id || index}`,
            reference: sale.billNo,
            customerName: sale.customerName || '-',
            doctorName: sale.doctorName || '-',
            medicineName: item.medicineName || '-',
            packaging: item.packaging || 'Unit',
            batch: item.batch || '-',
            company: item.company || '-',
            expiryDate: item.expiryDate || null,
            quantity: Number(item.quantity || 0),
            amount: Number(item.amount || 0),
            date: sale.date || '-',
            status: String(sale.orderStatus || 'completed')
          }))
        })

        setSalesRows(rows)
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load sales history')
          setSalesRows([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSalesHistory()

    return () => {
      active = false
    }
  }, [])

  const sales = useMemo(() => salesRows, [salesRows])

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  const statusLabel = (status) => {
    if (status === 'completed') return 'Completed'
    return status
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sales History</h1>
          <p className="text-slate-400">View all your sales transactions</p>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reference</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Doctor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Medicine Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Expiry Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading && sales.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-6 py-10 text-center text-slate-400">
                      No sales history found.
                    </td>
                  </tr>
                )}
                {sales.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-semibold">{tx.reference}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.customerName}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.doctorName}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.medicineName}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{tx.batch}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.company}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.expiryDate ? new Date(tx.expiryDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {tx.quantity} {tx.packaging === 'Strip' ? 'strip' : tx.packaging === 'Tablet' ? 'tablet' : 'ml'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-semibold">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4 text-slate-300">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                        {statusLabel(tx.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
