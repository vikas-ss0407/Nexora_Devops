import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Package,
  Store,
  Search,
  ArrowRight,
  Activity,
  ClipboardList,
  Lock,
  BarChart3,
  Globe,
  Cpu,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "inspector",
      title: "Drug Inspector",
      description:
        "Regulatory oversight and compliance auditing for nationwide distribution.",
      icon: <Search className="w-8 h-8" />,
      stats: "12k+ Audits"
    },
    {
      id: "wholesaler",
      title: "Wholesaler",
      description:
        "Bulk inventory management and seamless distribution to retail networks.",
      icon: <Package className="w-8 h-8" />,
      stats: "450+ Hubs"
    },
    {
      id: "retailer",
      title: "Retailer",
      description:
        "Point-of-sale tracking and localized inventory replenishment systems.",
      icon: <Store className="w-8 h-8" />,
      stats: "8k+ Outlets"
    }
  ];

  return (
    <div className="relative min-h-screen w-screen bg-[#020617] text-slate-200 overflow-x-hidden font-sans">

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[140px] animate-pulse rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[140px] animate-pulse rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:60px_60px] opacity-10" />
      </div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white">
            DRUG<span className="text-blue-500">GUARD</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-slate-400">
          <a className="hover:text-blue-400 transition">Docs</a>
          <a className="hover:text-blue-400 transition">Compliance</a>
          <a className="hover:text-blue-400 transition">Support</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center max-w-6xl mx-auto px-6 pt-10 pb-24">
        <h1 className="text-6xl md:text-7xl font-extrabold text-white leading-tight">
          Securing Every{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Pharmaceutical Movement
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-3xl mx-auto">
          A zero-trust, AI-powered supply chain intelligence system for monitoring,
          auditing, and protecting controlled drug distribution across regions.
        </p>

        <div className="mt-10 flex justify-center gap-6">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition transform hover:scale-105 shadow-lg"
          >
            Get Started
          </button>

          <button className="px-8 py-4 border border-white/20 rounded-xl hover:bg-white/5 transition">
            View Documentation
          </button>
        </div>
      </section>

      {/* ROLE CARDS */}
      <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => navigate(`/login?role=${role.id}`)}
            className="group relative cursor-pointer"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-0 group-hover:opacity-70 transition duration-500" />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:-translate-y-3 transition duration-300">
              <div className="mb-6 text-blue-400">{role.icon}</div>
              <h3 className="text-2xl font-bold text-white">{role.title}</h3>
              <p className="mt-4 text-slate-400">{role.description}</p>
              <div className="flex justify-between items-center mt-8">
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {role.stats}
                </span>
                <ArrowRight className="group-hover:translate-x-2 transition" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* STATS SECTION */}
      <section className="mt-32 py-20 bg-slate-900/40 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 text-center">
          {[
            { icon: <Globe />, label: "Countries Connected", value: "27+" },
            { icon: <BarChart3 />, label: "Transactions / Day", value: "1.2M+" },
            { icon: <Cpu />, label: "AI Checks", value: "400k+" },
            { icon: <ShieldCheck />, label: "Security Rating", value: "99.98%" }
          ].map((item, i) => (
            <div key={i} className="hover:scale-105 transition">
              <div className="flex justify-center mb-4 text-blue-400">
                {item.icon}
              </div>
              <h4 className="text-4xl font-bold text-white">{item.value}</h4>
              <p className="text-slate-400 mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-32 max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          How DRUGGUARD Works
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              icon: <ClipboardList />,
              title: "Track",
              desc: "Every drug batch is assigned encrypted identifiers."
            },
            {
              icon: <Activity />,
              title: "Monitor",
              desc: "Real-time analytics detect anomalies instantly."
            },
            {
              icon: <Lock />,
              title: "Secure",
              desc: "Zero-trust access ensures verified transactions only."
            }
          ].map((step, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-slate-900 border border-white/10 hover:bg-white/5 transition"
            >
              <div className="text-blue-400 mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="text-slate-400 mt-3">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="mt-32 text-center max-w-4xl mx-auto px-6">
        <Sparkles className="mx-auto text-blue-400 mb-6 w-10 h-10" />
        <p className="text-2xl italic text-slate-300">
          “DRUGGUARD transformed our regulatory monitoring. Real-time audits
          reduced compliance errors by 60%."
        </p>
        <p className="mt-4 text-slate-500 text-sm">
          — National Pharmaceutical Authority
        </p>
      </section>

      {/* CTA */}
      <section className="mt-32 py-24 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-t border-white/10 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Secure Your Network?
        </h2>
        <button
          onClick={() => navigate("/login")}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition transform hover:scale-105 shadow-xl"
        >
          Launch Dashboard
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-slate-500 text-sm border-t border-white/5">
        © 2026 DRUGGUARD PROTOCOL · Integrity in every milligram.
      </footer>
    </div>
  );
}