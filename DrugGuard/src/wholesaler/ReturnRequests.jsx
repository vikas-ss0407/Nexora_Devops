import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getWholesalerReturnRequests, updateReturnRequestStatus } from '../api/wholesaler/wholesalerApi'

export default function ReturnRequests() {
  const [activeTab, setActiveTab] = useState('all')
  const [returnRequests, setReturnRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReturnRequests = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
        const wholesalerId = user.id || user.uid || user.username || user.email
        
        if (!wholesalerId) {
          setError('Wholesaler ID not found')
          return
        }

        const data = await getWholesalerReturnRequests(wholesalerId)
        setReturnRequests(data.returnRequests || [])
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to fetch return requests')
        console.error('Error fetching return requests:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReturnRequests()
  }, [])

  const handleApprove = async (requestId) => {
    try {
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      const wholesalerId = user.id

      await updateReturnRequestStatus(wholesalerId, requestId, 'Approved', 0)
      
      setReturnRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'Approved' } : req
        )
      )
    } catch (err) {
      console.error('Error approving return:', err)
    }
  }

  const handleReject = async (requestId) => {
    try {
      const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
      const wholesalerId = user.id

      await updateReturnRequestStatus(wholesalerId, requestId, 'Rejected', 0)
      
      setReturnRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'Rejected' } : req
        )
      )
    } catch (err) {
      console.error('Error rejecting return:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-600/20 text-green-400'
      case 'Pending': return 'bg-yellow-600/20 text-yellow-400'
      case 'Rejected': return 'bg-red-600/20 text-red-400'
      default: return 'bg-slate-600/20 text-slate-400'
    }
  }

  const getTypeColor = (type) => {
    if (type === 'expiry') return 'bg-yellow-600/20 text-yellow-400'
    return 'bg-blue-600/20 text-blue-400'
  }

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden flex items-center justify-center">
        <p className="text-slate-300">Loading return requests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  const filteredRequests = returnRequests.filter(req => {
    if (activeTab === 'expiry') return req.type === 'expiry'
    if (activeTab === 'other') return req.type !== 'expiry'
    return true
  })

  const expiryReturns = returnRequests.filter(req => req.type === 'expiry')
  const otherReturns = returnRequests.filter(req => req.type !== 'expiry')

  const stats = [
    { label: 'Total Returns', value: `${returnRequests.reduce((sum, r) => sum + r.quantity, 0)} units`, icon: '↩️', color: 'from-blue-600 to-blue-500' },
    { label: 'Expiry Returns', value: `${expiryReturns.length} requests`, icon: '📅', color: 'from-yellow-600 to-yellow-500' },
    { label: 'Other Returns', value: `${otherReturns.length} requests`, icon: '📦', color: 'from-purple-600 to-purple-500' },
    { label: 'Pending Approval', value: returnRequests.filter(r => r.status === 'Pending').length, icon: '⏳', color: 'from-orange-600 to-orange-500' }
  ]

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Return Requests</h1>
            <p className="text-slate-400">Manage product returns and refunds from retailers</p>
          </div>
          <Link 
            to="/wholesaler/pending-deliveries"
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"
          >
            📦 Pending Deliveries
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">{stat.label}</h3>
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 rounded-lg p-2 mb-6 border border-slate-700 flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            All Returns ({returnRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('expiry')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'expiry' 
                ? 'bg-yellow-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            📅 Expiry Returns ({expiryReturns.length})
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'other' 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            📦 Other Returns ({otherReturns.length})
          </button>
        </div>

        {/* Returns Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Retailer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Drug</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Refund</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-blue-400 font-semibold">{req.billNo}</td>
                    <td className="px-6 py-4 text-slate-300">{req.retailer}</td>
                    <td className="px-6 py-4 text-white font-semibold">{req.drug}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{req.batch}</td>
                    <td className="px-6 py-4 text-slate-300">{req.quantity} units</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(req.type)}`}>
                        {req.type === 'expiry' ? '📅 Expiry' : '📦 Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{req.reason}</td>
                    <td className="px-6 py-4 text-slate-300">{req.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-green-400 font-bold">₹{req.refund.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {req.status === 'Pending' ? (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                          View Details
                        </button>
                      )}
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