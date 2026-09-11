import { useEffect, useMemo, useState } from 'react'
import { getWholesalerStock } from '../api/wholesaler/wholesalerApi'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toISOString().slice(0, 10)
}

function getMinStock(currentStock) {
  const qty = Number(currentStock || 0)
  return Math.max(1, Math.round(qty * 0.4))
}

function getMaxStock(currentStock) {
  const qty = Number(currentStock || 0)
  return Math.max(1, Math.round(qty * 2))
}

function getStatus(currentStock, minStock) {
  const qty = Number(currentStock || 0)
  const min = Number(minStock || 0)

  if (qty <= Math.max(1, Math.round(min * 0.5))) return 'Critical'
  if (qty <= min) return 'Low Stock'
  return 'Optimal'
}

export default function StockManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    let active = true

    async function loadStock() {
      try {
        setIsLoading(true)
        setLoadError('')

        const session = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const wholesalerId = session?.id || session?.uid

        if (!wholesalerId) {
          throw new Error('Wholesaler session not found. Please login again.')
        }

        const response = await getWholesalerStock(wholesalerId)
        if (!active) return

        const mapped = (Array.isArray(response.stock) ? response.stock : []).map((item) => {
          const currentStock = Number(item.quantity || 0)
          const minStock = getMinStock(currentStock)
          const maxStock = getMaxStock(currentStock)
          const status = getStatus(currentStock, minStock)

          return {
            id: item.id,
            drug: item.medicineName || '-',
            batch: item.batch || '-',
            currentStock,
            minStock,
            maxStock,
            rate: Number(item.rate || 0),
            lastRestocked: formatDate(item.updatedAt || item.createdAt),
            status
          }
        })

        setInventory(mapped)
      } catch (error) {
        if (!active) return
        setLoadError(error.message || 'Failed to load stock from backend')
        setInventory([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadStock()

    return () => {
      active = false
    }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Optimal':
        return 'bg-green-500'
      case 'Low Stock':
        return 'bg-yellow-500'
      case 'Critical':
        return 'bg-red-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getProgressColor = (current, min, max) => {
    const denominator = Math.max(1, max - min)
    const percentage = ((current - min) / denominator) * 100
    if (percentage > 70) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const summary = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + Number(item.currentStock || 0) * Number(item.rate || 0), 0)
    const totalUnits = inventory.reduce((sum, item) => sum + Number(item.currentStock || 0), 0)
    const criticalItems = inventory.filter((item) => item.status === 'Critical').length

    return { totalValue, totalUnits, criticalItems }
  }, [inventory])

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Stock Management</h1>
          <p className="text-slate-400">Manage your drug inventory and stock levels</p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/40 p-4 text-red-200">{loadError}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Total Inventory Value</h3>
            <p className="text-3xl font-bold">₹{(summary.totalValue / 100000).toFixed(1)}L+</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-lg p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Total Units</h3>
            <p className="text-3xl font-bold">{new Intl.NumberFormat('en-IN').format(summary.totalUnits)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-lg p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Critical Stock Items</h3>
            <p className="text-3xl font-bold">{summary.criticalItems}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Drug Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Current Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Min/Max</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stock Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Last Restocked</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">Loading stock from backend...</td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No stock records found.</td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const denominator = Math.max(1, item.maxStock - item.minStock)
                    const percentage = ((item.currentStock - item.minStock) / denominator) * 100

                    return (
                      <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 text-slate-300 font-semibold">{item.drug}</td>
                        <td className="px-6 py-4 text-slate-300">{item.currentStock} units</td>
                        <td className="px-6 py-4 text-slate-300">{item.minStock} / {item.maxStock}</td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-700 rounded-full h-2 max-w-xs">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(item.currentStock, item.minStock, item.maxStock)}`}
                              style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{item.lastRestocked}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-lg text-sm font-semibold text-white transition-colors ${
                              item.status === 'Critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {item.status === 'Critical' ? 'Restock Now' : 'Restock'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            📥 Export Inventory
          </button>
        </div>
      </div>
    </div>
  )
}
