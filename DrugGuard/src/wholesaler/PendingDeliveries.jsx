export default function PendingDeliveries() {
  const pendingDeliveries = [
    { 
      id: 1, 
      billNo: 'WHL-001-2024', 
      retailer: 'City Pharmacy', 
      medicine: 'Paracetamol 500mg',
      batch: 'BAT001',
      quantity: 50,
      price: 20,
      mrp: 25,
      expiry: '2026-06-15',
      deliveredDate: '2024-02-03',
      status: 'Not Delivered',
      reason: 'Retailer reported not received'
    },
    { 
      id: 2, 
      billNo: 'WHL-002-2024', 
      retailer: 'Main Street Clinic', 
      medicine: 'Cough Syrup',
      batch: 'BAT005',
      quantity: 20,
      price: 45,
      mrp: 55,
      expiry: '2026-05-15',
      deliveredDate: '2024-02-02',
      status: 'Partially Delivered',
      reason: 'Incomplete delivery reported'
    },
    { 
      id: 3, 
      billNo: 'WHL-003-2024', 
      retailer: 'Green Valley Hospital', 
      medicine: 'Vitamin B12',
      batch: 'BAT006',
      quantity: 30,
      price: 18,
      mrp: 22,
      expiry: '2026-10-20',
      deliveredDate: '2024-02-01',
      status: 'Not Delivered',
      reason: 'Missing from package'
    }
  ]

  const handleResend = (id) => {
    if (confirm('Schedule this item for re-delivery?')) {
      alert(`Item #${id} scheduled for re-delivery`)
    }
  }

  const handleInvestigate = (id) => {
    alert(`Investigation initiated for item #${id}`)
  }

  const handleResolve = (id) => {
    if (confirm('Mark this issue as resolved?')) {
      alert(`Issue #${id} marked as resolved`)
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📦 Pending Deliveries</h1>
          <p className="text-slate-400">Items reported as not delivered or partially delivered by retailers</p>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Pending Deliveries</h3>
            <p className="text-slate-400">All deliveries have been successfully completed</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">{pendingDeliveries.length}</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Not Delivered</p>
                    <p className="text-3xl font-bold text-red-400">
                      {pendingDeliveries.filter(d => d.status === 'Not Delivered').length}
                    </p>
                  </div>
                  <div className="text-4xl">❌</div>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Partially Delivered</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {pendingDeliveries.filter(d => d.status === 'Partially Delivered').length}
                    </p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>
            </div>

            {/* Pending Items Table */}
            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bill Number</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Retailer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Medicine</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Quantity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Value</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Delivered Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reason</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeliveries.map((item) => (
                      <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 text-blue-400 font-semibold">{item.billNo}</td>
                        <td className="px-6 py-4 text-slate-300">{item.retailer}</td>
                        <td className="px-6 py-4 text-white font-semibold">{item.medicine}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{item.batch}</td>
                        <td className="px-6 py-4 text-slate-300">{item.quantity} units</td>
                        <td className="px-6 py-4 text-green-400 font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-300">{item.deliveredDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Not Delivered' 
                              ? 'bg-red-600/20 text-red-400' 
                              : 'bg-orange-600/20 text-orange-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{item.reason}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleResend(item.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                              Re-Deliver
                            </button>
                            <button
                              onClick={() => handleInvestigate(item.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              Investigate
                            </button>
                            <button
                              onClick={() => handleResolve(item.id)}
                              className="px-3 py-1 bg-slate-600 text-white rounded-lg text-xs hover:bg-slate-500 transition-colors whitespace-nowrap"
                            >
                              Resolve
                            </button>
                          </div>
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
                    Total Pending Items: <span className="text-yellow-400 font-bold">{pendingDeliveries.length}</span>
                  </p>
                  <p className="text-slate-300">
                    Total Pending Value: <span className="text-green-400 font-bold">
                      ₹{pendingDeliveries.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
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
