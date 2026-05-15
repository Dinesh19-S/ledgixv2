import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CreditCard, 
  FileText, 
  Settings as SettingsIcon,
  Search,
  Bell,
  User,
  LogOut,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Grid3X3,
  Scale,
  Loader2,
  ChevronRight
} from 'lucide-react';
import type { Module, Party, JournalEntry, PaymentEntry } from '../../types';
import { storage } from '../../services/storage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// ── Lazy-load modules (code splitting) ──────────────────────────────────
const Parties = React.lazy(() => import('../modules/Parties'));
const Payments = React.lazy(() => import('../modules/Payments'));
const Reports = React.lazy(() => import('../modules/Reports'));
const Journal = React.lazy(() => import('../modules/Journal'));
const Settings = React.lazy(() => import('../modules/Settings'));
const Spreadsheet = React.lazy(() => import('../modules/Spreadsheet'));
const FinancialStatements = React.lazy(() => import('../modules/FinancialStatements'));

// ── Module loading spinner ──────────────────────────────────────────────
const ModuleLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-3">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
      <p className="text-sm font-bold text-slate-500">Loading module...</p>
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 scale-[1.02]' 
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-500'} />
    <span className={`font-black text-sm ${active ? 'text-white' : 'text-slate-700'}`}>{label}</span>
    {active && <ChevronRight size={16} className="ml-auto text-white" />}
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white border border-slate-300 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-black px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-600 text-sm font-black mb-1 uppercase tracking-wider">{title}</h3>
    <p className="text-2xl font-black text-slate-900">{value}</p>
  </div>
);

export default function DashboardShell() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<Module>('Dashboard');
  const [parties, setParties] = useState<Party[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [userEmail, setUserEmail] = useState('');

  const loadData = async () => {
    try {
      const [p, pay, j] = await Promise.all([
        storage.getParties(),
        storage.getPayments(),
        storage.getJournals(),
      ]);
      setParties(p);
      setPayments(pay);
      setJournals(j);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const refreshParties = useCallback(async () => setParties(await storage.getParties()), []);
  const refreshPayments = useCallback(async () => setPayments(await storage.getPayments()), []);
  const refreshJournals = useCallback(async () => setJournals(await storage.getJournals()), []);
  const refreshAll = useCallback(async () => {
    const [p, pay, j] = await Promise.all([storage.getParties(), storage.getPayments(), storage.getJournals()]);
    setParties(p); setPayments(pay); setJournals(j);
  }, []);

  useEffect(() => {
    loadData();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email || '');
    });

    // --- REALTIME SYNC ---
    // Listen for any changes in the database and refresh local state automatically
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parties' },
        () => refreshParties()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => refreshPayments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journals' },
        () => refreshJournals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshParties, refreshPayments, refreshJournals]);

  const totalPayments = useMemo(() => payments.reduce((acc, curr) => acc + curr.amount, 0), [payments]);
  const pendingAmount = useMemo(() => parties.reduce((acc, curr) => acc + curr.openingBalance, 0), [parties]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex-1 flex text-slate-900 font-sans h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-300 flex flex-col p-4 space-y-8 bg-white shrink-0 shadow-xl z-20">
        <div className="px-4 flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Ledgix Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-indigo-900/10" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Ledgix</h1>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">Leader Management System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeModule === 'Dashboard'} onClick={() => setActiveModule('Dashboard')} />
          <SidebarItem icon={Users} label="Party Accounts" active={activeModule === 'Parties'} onClick={() => setActiveModule('Parties')} />
          <SidebarItem icon={BookOpen} label="Journal Entries" active={activeModule === 'Journal'} onClick={() => setActiveModule('Journal')} />
          <SidebarItem icon={CreditCard} label="Payment Entries" active={activeModule === 'Payments'} onClick={() => setActiveModule('Payments')} />
          <SidebarItem icon={FileText} label="Statement Reports" active={activeModule === 'Reports'} onClick={() => setActiveModule('Reports')} />
          <SidebarItem icon={Scale} label="Financial Statements" active={activeModule === 'FinancialStatements'} onClick={() => setActiveModule('FinancialStatements')} />
          <SidebarItem icon={Grid3X3} label="Excel Workbook" active={activeModule === 'Spreadsheet'} onClick={() => setActiveModule('Spreadsheet')} />
          <div className="pt-4 mt-4 border-t border-slate-300">
            <SidebarItem icon={SettingsIcon} label="Settings" active={activeModule === 'Settings'} onClick={() => setActiveModule('Settings')} />
          </div>
        </nav>

        <div className="bg-slate-100 rounded-2xl p-4 border border-slate-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-700">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{userEmail ? userEmail.split('@')[0] : 'User'}</p>
              <p className="text-[10px] text-slate-600 font-bold truncate">{userEmail || 'Loading...'}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-600 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-300 flex items-center justify-between px-8 bg-white shrink-0 z-10 shadow-sm">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input type="text" placeholder="Search parties, vouchers, or amounts..." className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-900 placeholder:text-slate-500" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex items-center space-x-3 bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5">
              <span className="text-xs font-black text-slate-600 uppercase">Status:</span>
              <span className="flex items-center space-x-1.5 text-xs font-black text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>System Live</span>
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-100/50">
          {activeModule === 'Dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">Financial Overview</h2>
                  <p className="text-slate-700 font-bold">Manage your accounts with high-performance tools.</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setActiveModule('Reports')} className="bg-white border border-slate-300 text-slate-900 px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm">Generate Report</button>
                  <button onClick={() => setActiveModule('Payments')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all">+ New Transaction</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Parties" value={parties.length} icon={Users} trend={12} color="indigo" />
                <StatCard title="Total Payments" value={`₹${totalPayments.toLocaleString()}`} icon={DollarSign} trend={8} color="emerald" />
                <StatCard title="Pending Amount" value={`₹${pendingAmount.toLocaleString()}`} icon={ArrowUpRight} trend={-2} color="rose" />
                <StatCard title="Cash Flow" value="₹84,200" icon={ArrowDownLeft} trend={15} color="amber" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
                  <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Recent Transactions</h3>
                    <button onClick={() => setActiveModule('Payments')} className="text-xs text-indigo-600 font-black hover:underline uppercase">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-slate-700 font-black bg-slate-100 border-b border-slate-200">
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Party</th>
                          <th className="px-6 py-4">Voucher</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {payments.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-600 italic text-sm font-bold">No transactions found.</td></tr>
                        ) : (
                          payments.slice(0, 5).map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-700 font-bold">{txn.date}</td>
                              <td className="px-6 py-4 text-sm font-black text-slate-900">{txn.partyName}</td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-500 font-bold">{txn.voucherNo}</td>
                              <td className="px-6 py-4 text-right text-sm font-black text-slate-900">₹{txn.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md space-y-6">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Quick Actions</h3>
                  <div className="space-y-4">
                    <div onClick={() => setActiveModule('Parties')} className="p-4 bg-slate-100 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md"><Users size={20} /></div>
                        <div><p className="text-sm font-black text-slate-900">Add Party</p><p className="text-[10px] text-slate-600 font-bold uppercase">Customer or vendor</p></div>
                      </div>
                    </div>
                    <div onClick={() => setActiveModule('Journal')} className="p-4 bg-slate-100 rounded-xl border border-slate-200 hover:border-rose-500 hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-md"><BookOpen size={20} /></div>
                        <div><p className="text-sm font-black text-slate-900">Journal Entry</p><p className="text-[10px] text-slate-600 font-bold uppercase">Internal adjustment</p></div>
                      </div>
                    </div>
                    <div onClick={() => setActiveModule('Reports')} className="p-4 bg-slate-100 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md"><FileText size={20} /></div>
                        <div><p className="text-sm font-black text-slate-900">Statement</p><p className="text-[10px] text-slate-600 font-bold uppercase">Export PDF report</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={<ModuleLoader />}>
            {activeModule === 'Parties' && <Parties parties={parties} onUpdate={refreshParties} />}
            {activeModule === 'Payments' && <Payments payments={payments} parties={parties} onUpdate={refreshPayments} />}
            {activeModule === 'Journal' && <Journal journals={journals} parties={parties} onUpdate={refreshJournals} />}
            {activeModule === 'Reports' && <Reports parties={parties} payments={payments} />}
            {activeModule === 'FinancialStatements' && <FinancialStatements parties={parties} payments={payments} journals={journals} />}
            {activeModule === 'Spreadsheet' && <Spreadsheet parties={parties} payments={payments} journals={journals} onUpdate={refreshAll} />}
            {activeModule === 'Settings' && <Settings />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
