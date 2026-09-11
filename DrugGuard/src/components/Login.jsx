import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  User,
  Lock,
  ShieldCheck,
  Search,
  Package,
  Store,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

import { loginInspector } from '../api/druginspector/inspectorApi'
import { loginWholesaler } from '../api/wholesaler/wholesalerApi'
import { loginRetailer } from '../api/retailer/retailerApi'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')

  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const roleDetails = {
    inspector: {
      title: 'Drug Inspector',
      path: '/inspector/dashboard',
      icon: <Search />,
      color: 'blue'
    },
    wholesaler: {
      title: 'Wholesaler',
      path: '/wholesaler/dashboard',
      icon: <Package />,
      color: 'emerald'
    },
    retailer: {
      title: 'Retailer',
      path: '/retailer/dashboard',
      icon: <Store />,
      color: 'violet'
    }
  }

  const currentRole = roleDetails[roleParam] || roleDetails.inspector

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (roleParam === 'inspector' || !roleParam)
        await loginInspector(formData.username.trim(), formData.password)
      else if (roleParam === 'wholesaler')
        await loginWholesaler(formData.username.trim(), formData.password)
      else if (roleParam === 'retailer')
        await loginRetailer(formData.username.trim(), formData.password)

      onLogin(roleParam || 'inspector')
      navigate(currentRole.path)
    } catch (error) {
      setErrors({ general: error.message || 'Authentication failed' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#020617] text-slate-200 relative overflow-hidden flex flex-col">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[140px] rounded-full animate-pulse" />
      </div>

      {/* TOP BAR */}
      <div className="w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400">
            DRUGGUARD Secure Access
          </span>
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest">
          Role: {currentRole.title}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 items-center justify-center px-6 py-14">

        <div className="grid lg:grid-cols-2 gap-20 w-full max-w-7xl mx-auto items-center">

          {/* LEFT PANEL */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-12 backdrop-blur-2xl shadow-xl w-full max-w-lg">

              <div className="text-left mb-10">
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                  Zero-Trust Authentication
                </h2>
                <p className="text-slate-400 leading-relaxed text-base">
                  Every session is verified, encrypted and logged.
                  Real-time audit tracing ensures pharmaceutical compliance integrity.
                </p>
              </div>

              <div className="space-y-7">

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <Lock />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Session Encryption</h4>
                    <p className="text-slate-400 text-sm">RSA-4096 secure transmission.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <ShieldCheck />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Audit Logging</h4>
                    <p className="text-slate-400 text-sm">All access points are traceable.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Search />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Live Monitoring</h4>
                    <p className="text-slate-400 text-sm">Anomaly detection enabled.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent rounded-3xl blur-2xl" />

              <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">

                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white">
                    Authenticate Identity
                  </h1>
                  <p className="text-slate-400 mt-2 text-sm">
                    Secure login as {currentRole.title}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">

                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500">
                      Identity
                    </label>
                    <div className="relative mt-2">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username or License ID"
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500">
                      Authorization
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {errors.general && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
                      <AlertCircle className="w-4 h-4" />
                      {errors.general}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isLoading ? "Authenticating..." : "Establish Secure Session"}
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </div>
                  </button>

                </form>

                <div className="mt-10 text-center text-[10px] text-slate-600 uppercase tracking-widest">
                  Protocol v4.0.2 • End-to-End Encrypted
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-white/5 py-3 text-center text-[10px] uppercase tracking-widest text-slate-500">
        System Status: Operational • Monitoring Active
      </div>

    </div>
  )
}