import { useEffect, useMemo, useState } from 'react'
import { getWholesalerSalesHistory } from '../api/wholesaler/wholesalerApi'

function formatCurrency(value) {
  return `₹${new Intl.NumberFormat('en-IN').format(Number(value) || 0)}`
}

function getStatus(sale) {
  if (!sale.deliveryDate) {
    return 'Pending'
  }

  const delivery = new Date(sale.deliveryDate)
  const today = new Date()
  delivery.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(delivery.getTime())) {
    return 'Pending'
  }

  if (delivery.getTime() > today.getTime()) {
    return 'In Transit'
  }

  return 'Delivered'
}

export default function SalesHistory() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [salesData, setSalesData] = useState([])
  const [billSearch, setBillSearch] = useState('')
  const [retailerSearch, setRetailerSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let active = true

    async function loadSales() {
      try {
        setIsLoading(true)
        setLoadError('')

        const session = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const wholesalerId = session?.id || session?.uid

        if (!wholesalerId) {
          throw new Error('Wholesaler session not found. Please login again.')
        }

        const response = await getWholesalerSalesHistory(wholesalerId)
        if (!active) return

        const normalized = (Array.isArray(response.sales) ? response.sales : []).map((sale) => {
          const status = getStatus(sale)
          return {
            id: sale.id,
            billNo: sale.billNo || sale.id,
            retailer: sale.retailerName || 'Unknown Retailer',
            date: sale.date || '-',
            items: Number(sale.itemCount || 0),
            amountValue: Number(sale.totalAmount || 0),
            amount: formatCurrency(sale.totalAmount || 0),
            status
          }
        })

        setSalesData(normalized)
      } catch (error) {
        if (!active) return
        setLoadError(error.message || 'Failed to load sales history')
        setSalesData([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadSales()

    return () => {
      active = false
    }
  }, [])

  const filteredSales = useMemo(() => {
    const billQuery = billSearch.trim().toLowerCase()
    const retailerQuery = retailerSearch.trim().toLowerCase()

    return salesData.filter((sale) => {
      if (billQuery && !String(sale.billNo).toLowerCase().includes(billQuery)) {
        return false
      }

      if (retailerQuery && !String(sale.retailer).toLowerCase().includes(retailerQuery)) {
        return false
      }

      if (statusFilter !== 'All Status' && sale.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [salesData, billSearch, retailerSearch, statusFilter])

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.amountValue || 0), 0)
    const totalBills = filteredSales.length
    const completedOrders = filteredSales.filter((sale) => sale.status === 'Delivered').length
    const avgOrderValue = totalBills ? totalSales / totalBills : 0

    return [
      { label: 'Total Sales', value: formatCurrency(totalSales), icon: '💰', color: 'from-green-600 to-green-500' },
      { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), icon: '📊', color: 'from-blue-600 to-blue-500' },
      { label: 'Total Bills', value: String(totalBills), icon: '📋', color: 'from-purple-600 to-purple-500' },
      { label: 'Completed Orders', value: String(completedOrders), icon: '✓', color: 'from-orange-600 to-orange-500' }
    ]
  }, [filteredSales])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-500 text-white'
      case 'In Transit':
        return 'bg-blue-500 text-white'
      case 'Pending':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sales History</h1>
          <p className="text-slate-400">View all your sales transactions</p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/40 p-4 text-red-200">{loadError}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">{stat.label}</h3>
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700 flex gap-4 flex-wrap">
          <input
            type="text"
            value={billSearch}
            onChange={(e) => setBillSearch(e.target.value)}
            placeholder="Search bill number..."
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={retailerSearch}
            onChange={(e) => setRetailerSearch(e.target.value)}
            placeholder="Search retailer..."
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All Status</option>
            <option>Delivered</option>
            <option>In Transit</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Retailer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      Loading sales history from backend...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-t border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-slate-300 font-semibold">{sale.billNo}</td>
                      <td className="px-6 py-4 text-slate-300">{sale.retailer}</td>
                      <td className="px-6 py-4 text-slate-300">{sale.date}</td>
                      <td className="px-6 py-4 text-slate-300">{sale.items}</td>
                      <td className="px-6 py-4 text-slate-300 font-semibold text-green-400">{sale.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">View</button>
                        <button className="text-green-400 hover:text-green-300 text-sm font-semibold">Download</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
