export default function WholesalerDashboard() {
  // Product inventory with category and stock
  const products = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Strip', stock: 8, batchNo: 'PCT2024A123' },
    { id: 2, name: 'Aspirin 75mg', category: 'Strip', stock: 15, batchNo: 'ASP2024F678' },
    { id: 3, name: 'Vitamin C Tablets', category: 'Strip', stock: 3, batchNo: 'VTC2024B456' },
    { id: 4, name: 'Ibuprofen 400mg', category: 'Strip', stock: 25, batchNo: 'IBU2024D012' },
    { id: 5, name: 'Cough Syrup 100ml', category: 'Bottle', stock: 7, batchNo: 'CSY2024E345' },
    { id: 6, name: 'Amoxicillin Susp', category: 'Bottle', stock: 12, batchNo: 'AMX2024C789' },
    { id: 7, name: 'Multivitamin Syrup', category: 'Bottle', stock: 4, batchNo: 'MVS2024G123' },
    { id: 8, name: 'Insulin Injection', category: 'Amples', stock: 6, batchNo: 'INS2024L456' },
    { id: 9, name: 'Diclofenac Injection', category: 'Amples', stock: 2, batchNo: 'DCL2024H789' },
    { id: 10, name: 'B12 Injection', category: 'Amples', stock: 9, batchNo: 'B12-2024M345' },
    { id: 11, name: 'Gentamicin Injection', category: 'Amples', stock: 18, batchNo: 'GEN2024N901' },
    { id: 12, name: 'Metformin 500mg', category: 'Strip', stock: 5, batchNo: 'MET2024G901' },
    { id: 13, name: 'ORS Powder', category: 'Packet', stock: 6, batchNo: 'ORS2024P456' },
    { id: 14, name: 'Protein Powder', category: 'Packet', stock: 3, batchNo: 'PRT2024P789' },
    { id: 15, name: 'Glucose Powder', category: 'Packet', stock: 9, batchNo: 'GLU2024P123' },
    { id: 16, name: 'Electral Powder', category: 'Packet', stock: 15, batchNo: 'ELE2024P567' },
  ]

  // Shop supply frequency (how many times supplied in last 3 months)
  const shopSupplyFrequency = [
    { id: 1, shopName: 'City Pharmacy', licenseNo: 'CHE/RT/2024/56789', supplyCount: 28, totalValue: '₹3,25,000' },
    { id: 2, shopName: 'Central Pharmacy', licenseNo: 'CHE/RT/2024/56791', supplyCount: 24, totalValue: '₹2,95,000' },
    { id: 3, shopName: 'Main Street Clinic', licenseNo: 'CHE/RT/2024/56790', supplyCount: 19, totalValue: '₹2,15,000' },
    { id: 4, shopName: 'Green Valley Hospital', licenseNo: 'CHE/RT/2024/56792', supplyCount: 16, totalValue: '₹1,85,000' },
    { id: 5, shopName: 'Wellness Medico', licenseNo: 'CHE/RT/2024/56793', supplyCount: 12, totalValue: '₹1,42,000' },
    { id: 6, shopName: 'CarePoint Pharmacy', licenseNo: 'CHE/RT/2024/56794', supplyCount: 8, totalValue: '₹95,000' },
  ]

  // Filter all low stock items (< 10) regardless of category
  const lowStockProducts = products.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock)

  // Sort shops by supply frequency (descending)
  const topSuppliedShops = shopSupplyFrequency.sort((a, b) => b.supplyCount - a.supplyCount)

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full overflow-x-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Wholesaler Dashboard</h1>
          <p className="text-slate-400">Low stock alerts and supply frequency monitoring</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="mb-8">
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">🚨 Low Stock Alerts (Below 10 Units)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Batch No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <tr key={product.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold">{product.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-600 text-white">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-sm">{product.batchNo}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            product.stock <= 3 ? 'bg-red-600 text-white' :
                            product.stock <= 6 ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            {product.stock} units
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">All products have sufficient stock.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Most Frequently Supplied Shops */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">🏪 Most Frequently Supplied Shops</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Shop Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">License No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Supply Count (3M)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliedShops.map((shop, index) => (
                  <tr key={shop.id} className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-slate-400 text-black' : 
                        index === 2 ? 'bg-orange-600 text-white' : 
                        'bg-slate-600 text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">{shop.shopName}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm font-mono">{shop.licenseNo}</td>
                    <td className="px-6 py-4 text-blue-400 font-bold text-lg">{shop.supplyCount} times</td>
                    <td className="px-6 py-4 text-green-400 font-bold text-lg">{shop.totalValue}</td>
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