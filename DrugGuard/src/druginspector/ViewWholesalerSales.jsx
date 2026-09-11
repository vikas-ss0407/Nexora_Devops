import { useEffect, useMemo, useState } from 'react'
import { getInspectorWholesalerSales } from '../api/druginspector/wholesalerSalesApi'

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

function getProductLabel(tx) {
  const direct = String(tx?.productName || '').trim()
  if (direct && direct !== '-') {
    return direct
  }

  if (Array.isArray(tx?.items) && tx.items.length > 0) {
    const first = tx.items[0] || {}
    return String(first.medicineName || first.productName || first.name || first.drug || '-').trim() || '-'
  }

  return '-'
}

function buildShops(transactions) {
  const byWholesaler = new Map()

  transactions.forEach((tx) => {
    const key = tx.wholesalerId || 'unknown'
    if (!byWholesaler.has(key)) {
      byWholesaler.set(key, {
        id: key,
        name: tx.wholesalerName || 'Unknown Wholesaler',
        licenseNo: tx.wholesalerLicenseNo || '',
        totalBills: 0,
        totalQuantity: 0
      })
    }

    const shop = byWholesaler.get(key)
    shop.totalBills += 1
    shop.totalQuantity += Number(tx.quantity) || 0
  })

  return Array.from(byWholesaler.values())
}

export default function ViewWholesalerSales() {
  const [view, setView] = useState('shops')
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const session = JSON.parse(localStorage.getItem('dg_user') || '{}')
      const district = session.district || ''

      if (!district) {
        if (isMounted) {
          setLoadError('Inspector district not found in session. Please login again.')
          setTransactions([])
          setIsLoading(false)
        }
        return
      }

      try {
        if (isMounted) {
          setIsLoading(true)
          setLoadError('')
        }

        const response = await getInspectorWholesalerSales(district)

        if (!isMounted) {
          return
        }

        setTransactions(Array.isArray(response.transactions) ? response.transactions : [])
      } catch (error) {
        if (!isMounted) {
          return
        }

        setLoadError(error.message || 'Failed to load wholesaler sales from backend')
        setTransactions([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const shops = useMemo(() => buildShops(transactions), [transactions])

  const selectedShopTransactions = useMemo(() => {
    if (!selectedShop) {
      return []
    }

    return transactions.filter((tx) => tx.wholesalerId === selectedShop.id)
  }, [selectedShop, transactions])

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return transactions
    }

    return transactions.filter((tx) => {
      return (
        String(tx.productName || '').toLowerCase().includes(query) ||
        String(tx.billId || '').toLowerCase().includes(query)
      )
    })
  }, [searchQuery, transactions])

  const handleShopClick = (shop) => {
    setSelectedShop(shop)
    setSelectedBill(null)
    setView('bills')
  }

  const handleBillClick = (bill) => {
    setSelectedBill(bill)
    setView('products')
  }

  const handleBackToShops = () => {
    setSelectedShop(null)
    setSelectedBill(null)
    setView('shops')
  }

  const handleBackToBills = () => {
    setSelectedBill(null)
    setView('bills')
  }

  return (
    <div 
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        color: '#f8fafc',
        padding: '1rem'
      }}
      className="md:p-8"
    >
      {/* Background gradient overlays */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '384px',
          height: '384px',
          filter: 'blur(120px)',
          opacity: 0.14,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent)',
          pointerEvents: 'none'
        }}
      ></div>
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '400px',
          height: '400px',
          filter: 'blur(120px)',
          opacity: 0.08,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3), transparent)',
          pointerEvents: 'none'
        }}
      ></div>

      <div className="w-full relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {view !== 'shops' && (
              <button
                onClick={view === 'bills' ? handleBackToShops : handleBackToBills}
                className="px-4 py-2 rounded-xl transition-all font-bold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="text-3xl font-black mb-2 tracking-tight" style={{ color: '#ffffff' }}>
                {view === 'shops' && 'Wholesaler Sales'}
                {view === 'bills' && `Bills - ${selectedShop?.name}`}
                {view === 'products' && `Bill Details - ${selectedBill?.billId}`}
              </h1>
              <p className="font-semibold" style={{ color: '#94a3b8' }}>
                {view === 'shops' && 'Data is loaded directly from database transactions'}
                {view === 'bills' && 'Sales entries by selected wholesaler'}
                {view === 'products' && 'Transaction product details'}
              </p>
            </div>
          </div>
        </div>

        <div 
          className="rounded-3xl p-6 mb-6 shadow-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(24px)'
          }}
        >
          <h3 className="text-lg font-black mb-4" style={{ color: '#ffffff' }}>Search by Product Name or Bill ID</h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product or bill id..."
            className="w-full px-4 py-3 rounded-2xl outline-none transition-all font-semibold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(245, 158, 11, 0.9)'
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.07)'
              e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.14)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'
              e.target.style.boxShadow = 'none'
            }}
          />

          {searchQuery && (
            <div className="mt-6">
              <h4 className="font-black mb-4" style={{ color: '#ffffff' }}>Search Results ({filteredTransactions.length})</h4>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Bill ID</th>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Date</th>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Product</th>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Quantity</th>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Retailer</th>
                        <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Wholesaler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr 
                          key={tx.id} 
                          className="transition-colors"
                          style={{ 
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <td className="px-4 py-3 font-semibold" style={{ color: '#60a5fa' }}>{tx.billId}</td>
                          <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{tx.date || '-'}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#e2e8f0' }}>{getProductLabel(tx)}</td>
                          <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{formatNumber(tx.quantity)}</td>
                          <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{tx.retailerName || '-'}</td>
                          <td className="px-4 py-3" style={{ color: '#60a5fa' }}>{tx.wholesalerName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4" style={{ color: '#64748b' }}>No transactions found matching "{searchQuery}"</p>
              )}
            </div>
          )}
        </div>

        {loadError && (
          <div 
            className="mb-6 rounded-2xl p-4 font-semibold"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(127, 29, 29, 0.2)',
              color: '#fca5a5'
            }}
          >
            {loadError}
          </div>
        )}

        {isLoading && (
          <div 
            className="rounded-3xl p-10 text-center font-semibold shadow-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8'
            }}
          >
            Loading wholesaler sales from database...
          </div>
        )}

        {!isLoading && view === 'shops' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => handleShopClick(shop)}
                className="rounded-3xl p-6 cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.36)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black mb-1" style={{ color: '#ffffff' }}>{shop.name}</h3>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>License: {shop.licenseNo || '-'}</p>
                  </div>
                  <span className="text-3xl">🏭</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Bills</p>
                    <p className="font-black text-lg" style={{ color: '#ffffff' }}>{shop.totalBills}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Qty Sold</p>
                    <p className="font-bold text-lg" style={{ color: '#4ade80' }}>{formatNumber(shop.totalQuantity)}</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>View Bills →</span>
                </div>
              </div>
            ))}

            {shops.length === 0 && (
              <div 
                className="col-span-full rounded-3xl p-10 text-center font-semibold shadow-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8'
                }}
              >
                No wholesaler sales found for your district.
              </div>
            )}
          </div>
        )}

        {!isLoading && view === 'bills' && selectedShop && (
          <div 
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Bill ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Retailer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#94a3b8' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedShopTransactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className="transition-colors"
                      style={{ 
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <td className="px-6 py-4 font-semibold" style={{ color: '#60a5fa' }}>{tx.billId}</td>
                      <td className="px-6 py-4" style={{ color: '#e2e8f0' }}>{tx.date || '-'}</td>
                      <td className="px-6 py-4" style={{ color: '#e2e8f0' }}>{tx.retailerName || '-'}</td>
                      <td className="px-6 py-4" style={{ color: '#e2e8f0' }}>{getProductLabel(tx)}</td>
                      <td className="px-6 py-4" style={{ color: '#e2e8f0' }}>{formatNumber(tx.quantity)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleBillClick(tx)}
                          className="px-4 py-2 rounded-xl transition-all text-sm font-bold"
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.25)'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && view === 'products' && selectedBill && (
          <div className="space-y-6">
            <div 
              className="rounded-3xl p-6 shadow-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Bill ID</p>
                  <p className="font-black text-lg" style={{ color: '#ffffff' }}>{selectedBill.billId}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Date</p>
                  <p className="font-semibold" style={{ color: '#e2e8f0' }}>{selectedBill.date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Retailer</p>
                  <p className="font-semibold" style={{ color: '#e2e8f0' }}>{selectedBill.retailerName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Quantity</p>
                  <p className="font-bold text-xl" style={{ color: '#4ade80' }}>{formatNumber(selectedBill.quantity)}</p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-3xl overflow-hidden shadow-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.88))',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                      <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Product Name</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Quantity</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Wholesaler</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#94a3b8' }}>Retailer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      style={{ 
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: '#ffffff' }}>{getProductLabel(selectedBill)}</td>
                      <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{formatNumber(selectedBill.quantity)}</td>
                      <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{selectedBill.wholesalerName || '-'}</td>
                      <td className="px-4 py-3" style={{ color: '#e2e8f0' }}>{selectedBill.retailerName || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


