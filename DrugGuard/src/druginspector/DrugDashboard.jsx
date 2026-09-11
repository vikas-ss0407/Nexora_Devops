import { useEffect, useState } from 'react'
import { getInspectorDashboardSummary } from '../api/druginspector/inspectorApi'
import { 
  Squares2X2Icon, 
  ClockIcon, 
  BuildingOffice2Icon, 
  UserGroupIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'

export default function DIDashboard() {
  const [shopExpiryAlerts, setShopExpiryAlerts] = useState([])
  const [pharmacistExpiryAlerts, setPharmacistExpiryAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      const session = JSON.parse(localStorage.getItem('dg_user') || '{}')
      const district = session.district || ''

      if (!district) {
        if (isMounted) {
          setLoadError('Inspector district not found in session. Please login again.')
          setIsLoading(false)
        }
        return
      }

      try {
        if (isMounted) setIsLoading(true)
        const response = await getInspectorDashboardSummary(district)
        if (!isMounted) return

        setShopExpiryAlerts(Array.isArray(response.shopExpiryAlerts) ? response.shopExpiryAlerts : [])
        setPharmacistExpiryAlerts(Array.isArray(response.pharmacistExpiryAlerts) ? response.pharmacistExpiryAlerts : [])
      } catch (error) {
        if (!isMounted) return
        setLoadError(error.message || 'Failed to load dashboard details from backend')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()
    return () => { isMounted = false }
  }, [])

  const renderExpiryBadge = (daysLeft) => {
    const isExpired = daysLeft < 0;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
        isExpired 
          ? 'bg-red-500 text-white shadow-red-500/20' 
          : 'bg-amber-500 text-[#0F172A] shadow-amber-500/20'
      }`}>
        <ClockIcon className="w-3 h-3" />
        {isExpired ? 'Expired' : 'Near Expiry'}
      </span>
    );
  }

  return (
    <div className="p-8 bg-[#0F172A] min-h-[calc(100vh-64px)] w-full font-sans selection:bg-amber-500/30">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Squares2X2Icon className="w-8 h-8 text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Drug Inspector <span className="text-amber-500">Dashboard</span></h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">License expiry monitoring (within 1 month window)</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#1E293B]/40 border border-white/5 px-6 py-3 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Alerts</p>
              <p className="text-2xl font-black text-white">{(shopExpiryAlerts.length + pharmacistExpiryAlerts.length)}</p>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 flex items-center gap-4">
            <ExclamationTriangleIcon className="w-6 h-6" />
            <p className="font-bold uppercase tracking-widest text-xs">{loadError}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-[#1E293B]/20 rounded-3xl border border-white/5 border-dashed">
            <CircleStackIcon className="w-12 h-12 text-amber-500/20 animate-bounce mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Loading dashboard details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Shop Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                <BuildingOffice2Icon className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Shop License Expiry</h2>
              </div>
              
              <div className="bg-[#1E293B]/40 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl min-h-[400px]">
                <div className="space-y-4">
                  {shopExpiryAlerts.length > 0 ? (
                    shopExpiryAlerts.map((item) => (
                      <DashboardCard key={item.id} item={item} badge={renderExpiryBadge(item.daysLeft)} />
                    ))
                  ) : (
                    <EmptyState message="No shop licenses in the 1 month expiry/expired window." />
                  )}
                </div>
              </div>
            </div>

            {/* Pharmacist Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                <UserGroupIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Pharmacist License Expiry</h2>
              </div>
              
              <div className="bg-[#1E293B]/40 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl min-h-[400px]">
                <div className="space-y-4">
                  {pharmacistExpiryAlerts.length > 0 ? (
                    pharmacistExpiryAlerts.map((item) => (
                      <DashboardCard key={item.id} item={item} badge={renderExpiryBadge(item.daysLeft)} />
                    ))
                  ) : (
                    <EmptyState message="No pharmacist licenses in the 1 month expiry/expired window." />
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

const DashboardCard = ({ item, badge }) => {
  const isExpired = item.daysLeft < 0;
  const renderExpiryText = (daysLeft) => {
    if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} days ago`
    if (daysLeft === 0) return 'Expires today'
    return `Expires in ${daysLeft} days`
  }
  
  return (
    <div className="group relative bg-[#0F172A]/80 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h4 className="text-base font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">
            {item.entity}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">License No: {item.licenseNo}</p>
        </div>
        {badge}
      </div>
      
      <div className="grid grid-cols-2 gap-6 pt-5 border-t border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Expiry Date</p>
          <p className="text-xs font-bold text-slate-300">{item.expiryDate}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Alert Status</p>
          <p className={`text-xs font-black uppercase tracking-tighter ${isExpired ? 'text-red-400' : 'text-amber-500'}`}>
            {renderExpiryText(item.daysLeft)}
          </p>
        </div>
      </div>
    </div>
  )
}

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-30 group">
    <BellAlertIcon className="w-16 h-16 text-slate-600 mb-6 transition-transform group-hover:scale-110" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-relaxed max-w-[250px]">
      {message}
    </p>
  </div>
)