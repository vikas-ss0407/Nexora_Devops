import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Squares2X2Icon, 
  PlusCircleIcon, 
  PencilSquareIcon, 
  ChartBarIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  CheckBadgeIcon, 
  BanknotesIcon, 
  ArrowPathIcon, 
  UserCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function Sidebar({ userRole }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const location = useLocation()

  const menuItems = {
    inspector: [
      { label: 'Overview', path: '/inspector/dashboard', icon: Squares2X2Icon },
      { label: 'Issue License', path: '/inspector/create-license', icon: PlusCircleIcon },
      { label: 'Update Shop', path: '/inspector/update-shop', icon: PencilSquareIcon },
      { label: 'Wholesale Logs', path: '/inspector/view-wholesaler-sales', icon: BuildingOfficeIcon },
      { label: 'Retailer Logs', path: '/inspector/view-retailer-purchases', icon: BeakerIcon }
    ],
    wholesaler: [
      { label: 'Overview', path: '/wholesaler/dashboard', icon: Squares2X2Icon },
      { label: 'Buy Stock', path: '/wholesaler/purchase-from-manufacturer', icon: ShoppingCartIcon },
      { label: 'Confirm Delivery', path: '/wholesaler/approve-stock', icon: CheckBadgeIcon },
      { label: 'Sell Stock', path: '/wholesaler/sell-to-retailer', icon: BanknotesIcon },
      { label: 'Sales History', path: '/wholesaler/sales-history', icon: ChartBarIcon },
      { label: 'My Inventory', path: '/wholesaler/stock-management', icon: CubeIcon },
      { label: 'Returns', path: '/wholesaler/return-requests', icon: ArrowPathIcon },
      { label: 'My Profile', path: '/wholesaler/profile', icon: UserCircleIcon }
    ],
    retailer: [
      { label: 'Overview', path: '/retailer/dashboard', icon: Squares2X2Icon },
      { label: 'Order Stock', path: '/retailer/purchase-from-wholesaler', icon: ShoppingCartIcon },
      { label: 'Accept Stock', path: '/retailer/approve-stock', icon: CheckBadgeIcon },
      { label: 'Customer Sale', path: '/retailer/sell-to-customer', icon: BanknotesIcon },
      { label: 'Return Items', path: '/retailer/return-product', icon: ArrowPathIcon },
      { label: 'Order History', path: '/retailer/purchase-history', icon: ClipboardDocumentListIcon },
      { label: 'Sales History', path: '/retailer/sales-history', icon: ArrowTrendingUpIcon },
      { label: 'My Profile', path: '/retailer/profile', icon: UserCircleIcon }
    ]
  }

  const items = menuItems[userRole] || []
  const isActive = (path) => location.pathname === path

  return (
    <div className={`bg-[#0F172A] border-r border-white/5 text-white transition-all duration-300 min-h-[calc(100vh-64px)] sticky top-16 overflow-y-auto z-40 ${isExpanded ? 'w-64' : 'w-20'}`}>
      
      {/* Toggle Button Area */}
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-500 p-2 rounded-xl transition-all duration-200 border border-white/5"
        >
          {isExpanded ? (
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          ) : (
            <ChevronDoubleRightIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex flex-col h-full py-4">
        {/* Menu Section Label */}
        {isExpanded && (
          <p className="px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
            Main Terminal
          </p>
        )}

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? 'bg-amber-500 text-[#0F172A] font-bold shadow-[0_10px_20px_rgba(245,158,11,0.2)]'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:text-amber-500'}`} />
                
                {isExpanded && (
                  <span className="text-[11px] font-black uppercase tracking-widest truncate">
                    {item.label}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[#1E293B] text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-white/10 z-50 whitespace-nowrap shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom System Status */}
        {isExpanded && (
          <div className="mt-auto mx-4 mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Node</p>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Ledger v2.0 Active</p>
          </div>
        )}
      </div>
    </div>
  )
}