import { useEffect, useMemo, useState } from 'react'
import { getRetailerPurchases, getRetailerSalesHistory } from '../api/retailer/retailerApi'

export default function RetailerPurchaseSalesHistory() {
  const [loading, setLoading] = useState(true)
  const [purchaseTransactions, setPurchaseTransactions] = useState([])
  const [salesTransactions, setSalesTransactions] = useState([])

  useEffect(() => {
    let active = true

    async function loadCombinedHistory() {
      try {
        setLoading(true)

        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const retailerId = user?.id || user?.uid

        if (!retailerId) {
          throw new Error('Retailer session not found. Please login again.')
        }

        const [purchasesResponse, salesResponse] = await Promise.all([
          getRetailerPurchases(retailerId),
          getRetailerSalesHistory(retailerId)
        ])

        if (!active) return

        const purchases = (Array.isArray(purchasesResponse.transactions) ? purchasesResponse.transactions : [])
          .filter((tx) => tx.orderType === 'retailer_purchase_order')
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .flatMap((tx) => {
            const items = Array.isArray(tx.items) && tx.items.length > 0
              ? tx.items
              : [{
                  id: tx.id,
                  medicineName: '-',
                  quantity: 0,
                  amount: tx.totalAmount || 0
                }]

            return items.map((item, index) => ({
              id: `${tx.id}-${item.id || index}`,
              reference: tx.billNo || tx.id,
              entity: tx.sellerName || 'Unknown Wholesaler',
              drug: item.medicineName || '-',
              quantity: Number(item.quantity || 0),
              amount: Number(item.amount || Number(item.rate || 0) * Number(item.quantity || 0)),
              date: tx.deliveredDate || String(tx.createdAt || '').slice(0, 10) || '-',
              status: tx.orderStatus === 'approved' ? 'Delivered' : String(tx.orderStatus || 'Pending')
            }))
          })

        const sales = (Array.isArray(salesResponse.sales) ? salesResponse.sales : [])
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .flatMap((sale) => {
            const items = Array.isArray(sale.items) && sale.items.length > 0
              ? sale.items
              : [{
                  id: sale.id,
                  medicineName: '-',
                  quantity: 0,
                  amount: sale.totalAmount || 0
                }]

            return items.map((item, index) => ({
              id: `${sale.id}-${item.id || index}`,
              reference: sale.billNo || sale.id,
              entity: `Customer - ${sale.customerName || 'Walk-in Customer'}`,
              drug: item.medicineName || '-',
              quantity: Number(item.quantity || 0),
              amount: Number(item.amount || 0),
              date: sale.date || String(sale.createdAt || '').slice(0, 10) || '-',
              status: sale.orderStatus === 'completed' ? 'Completed' : String(sale.orderStatus || 'Completed')
            }))
          })

        setPurchaseTransactions(purchases)
        setSalesTransactions(sales)
      } catch (error) {
        if (active) {
          alert(error.message || 'Failed to load purchase and sales history')
          setPurchaseTransactions([])
          setSalesTransactions([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCombinedHistory()

    return () => {
      active = false
    }
  }, [])

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  const stats = useMemo(() => {
    const totalPurchaseAmount = purchaseTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    const totalSalesAmount = salesTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    const totalTransactions = purchaseTransactions.length + salesTransactions.length
    const profitMargin = totalSalesAmount > 0
      ? `${(((totalSalesAmount - totalPurchaseAmount) / totalSalesAmount) * 100).toFixed(1)}%`
      : '0%'

    return [
      { label: 'Total Purchases', value: formatCurrency(totalPurchaseAmount), icon: '🛒' },
      { label: 'Total Sales', value: formatCurrency(totalSalesAmount), icon: '💳' },
      { label: 'Profit Margin', value: profitMargin, icon: '📈' },
      { label: 'Transactions', value: String(totalTransactions), icon: '📊' }
    ]
  }, [purchaseTransactions, salesTransactions])

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">History</h1>
          <p className="text-slate-400">View your purchase history and sales history separately</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">{stat.label}</h3>
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Purchase History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Purchase History</h2>
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reference</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Wholesaler</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Drug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && purchaseTransactions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                        No purchase history found.
                      </td>
                    </tr>
                  )}
                  {purchaseTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-slate-300 font-semibold">{tx.reference}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.entity}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.drug}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.quantity} units</td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Sales History</h2>
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reference</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Drug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && salesTransactions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                        No sales history found.
                      </td>
                    </tr>
                  )}
                  {salesTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 text-slate-300 font-semibold">{tx.reference}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.entity}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.drug}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.quantity} units</td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4 text-slate-300">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 text-right">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            📥 Export History
          </button>
        </div>
      </div>
    </div>
  )
}