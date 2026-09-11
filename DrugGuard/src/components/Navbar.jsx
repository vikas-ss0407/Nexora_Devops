import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  ArrowRightOnRectangleIcon, 
  UserCircleIcon,
  MapPinIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

export default function Navbar({ userRole, onLogout }) {
  const navigate = useNavigate();

  let inspectorDistrict = '';
  let shopName = '';
  
  try {
    const session = JSON.parse(localStorage.getItem('dg_user') || '{}');
    inspectorDistrict = session.district || '';
    shopName =
      session.shopFirmName ||
      session.companyName ||
      session.username ||
      session.email ||
      '';
  } catch {
    inspectorDistrict = '';
    shopName = '';
  }

  const roleInfo = {
    inspector: { title: 'Drug Inspector' },
    wholesaler: { title: 'Wholesaler' },
    retailer: { title: 'Retailer' }
  };

  const current = roleInfo[userRole] || roleInfo.inspector;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleHome = () => {
    const dashboardPath = {
      inspector: '/inspector/dashboard',
      wholesaler: '/wholesaler/dashboard',
      retailer: '/retailer/dashboard'
    };
    navigate(dashboardPath[userRole] || '/');
  };

  return (
    <nav className="bg-[#0F172A] border-b border-white/5 text-white sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-8 py-3">
        <div className="flex items-center justify-between">
          
          {/* Left Side: Brand branding */}
          <div 
            className="flex items-center gap-4 cursor-pointer group" 
            onClick={handleHome}
          >
            <div className="bg-amber-500 p-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-all duration-300">
              <ShieldCheckIcon className="w-6 h-6 text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-amber-500 transition-colors duration-300">
                DrugGuard
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] -mt-1">
                {current.title} Portal
              </p>
            </div>
          </div>

          {/* Right Side: Identity & Actions */}
          <div className="flex items-center gap-8">
            
            {/* Session Metadata Container */}
            <div className="hidden lg:flex items-center gap-6 border-r border-white/10 pr-8">
              
              {/* Account Label */}
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
                   <UserCircleIcon className="w-5 h-5 text-amber-500/80" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] leading-none mb-1">Active Account</p>
                  <p className="text-[11px] font-bold text-slate-200 uppercase tracking-tight">{current.title}</p>
                </div>
              </div>

              {/* Entity/Location Data */}
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                {userRole === 'inspector' ? (
                  <MapPinIcon className="w-4 h-4 text-amber-500" />
                ) : (
                  <BuildingStorefrontIcon className="w-4 h-4 text-amber-500" />
                )}
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] leading-none mb-1">
                    {userRole === 'inspector' ? 'Jurisdiction' : 'Entity'}
                  </p>
                  <p className="text-[11px] font-black text-amber-500 uppercase tracking-wide">
                    {userRole === 'inspector' ? (inspectorDistrict || 'General') : (shopName || 'User Account')}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Terminal */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}