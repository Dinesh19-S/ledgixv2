import { TrendingUp, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="h-20 border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Ledgix Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-indigo-900/10" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Ledgix</h1>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Sign In</Link>
          <Link to="/register" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 px-8 text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap size={14} />
            <span>Modern Accounting for the Future</span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 leading-[1.1]">
            Manage your finances with <span className="text-indigo-600">precision</span> and <span className="text-indigo-600">style</span>.
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Ledgix is a professional, local-first accounting platform designed to help you track parties, 
            journal entries, and payment vouchers with zero complexity.
          </p>
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link to="/register" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center space-x-2">
              <span>Start Your Ledger</span>
              <ArrowRight size={20} />
            </Link>
            <button className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">
              Watch Demo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-24 text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Privacy First</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Your data never leaves your computer. Fully offline, encrypted, and secure ledger management.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Double Entry</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Built-in validation for journal entries ensures your books are always balanced and accurate.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fast Insights</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Generate professional PDF statements and reports in seconds with our high-speed reporting engine.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-8 text-center">
        <p className="text-slate-400 text-sm">© 2026 Ledgix - Leader Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
