import { useState, useMemo } from 'react';
import { FileText, Download, Calendar, Search, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import type { Party, PaymentEntry } from '../../types';
import { exportService } from '../../services/export';
import SearchablePartySelect from './SearchablePartySelect';
import toast from 'react-hot-toast';

interface ReportsProps {
  parties: Party[];
  payments: PaymentEntry[];
}

export default function Reports({ parties, payments }: ReportsProps) {


  const [selectedParty, setSelectedParty] = useState<string>(parties[0]?.name || '');
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);



  const ledgerData = useMemo(() => {
    const party = parties.find(p => p.name === selectedParty);
    if (!party) return null;

    const filteredPayments = payments.filter(p => 
      p.partyName === selectedParty && 
      p.date >= fromDate && 
      p.date <= toDate
    ).sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = party.balanceType === 'Debit' ? party.openingBalance : -party.openingBalance;
    const entries = filteredPayments.map(p => {
      const amount = p.transactionType === 'Pay' ? p.amount : -p.amount;
      runningBalance += amount;
      return {
        ...p,
        debit: p.transactionType === 'Pay' ? p.amount : 0,
        credit: p.transactionType === 'Receive' ? p.amount : 0,
        balance: runningBalance
      };
    });

    return {
      party,
      entries,
      totalDebit: entries.reduce((acc, curr) => acc + curr.debit, 0),
      totalCredit: entries.reduce((acc, curr) => acc + curr.credit, 0),
      closingBalance: runningBalance
    };
  }, [selectedParty, fromDate, toDate, parties, payments]);

  const handleExportPDF = () => {
    if (!ledgerData) return;
    toast.promise(
      new Promise((resolve) => {
        exportService.exportStatementPDF(selectedParty, fromDate, toDate, ledgerData.entries, ledgerData);
        resolve(true);
      }),
      {
        loading: 'Generating A4 PDF Statement...',
        success: 'PDF Statement Downloaded!',
        error: 'Export failed.',
      }
    );
  };

  const handleExportDataOnlyPDF = () => {
    if (!ledgerData) return;
    toast.promise(
      new Promise((resolve) => {
        exportService.exportStatementDataOnlyPDF(selectedParty, fromDate, toDate, ledgerData.entries, ledgerData);
        resolve(true);
      }),
      {
        loading: 'Generating data-only PDF...',
        success: 'Data PDF Downloaded!',
        error: 'Export failed.',
      }
    );
  };



  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Ledger Statements</h2>
          <p className="text-slate-700 font-bold uppercase tracking-tight text-xs">Generate, print and export high-resolution A4 statements.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportDataOnlyPDF}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-50 transition-all flex items-center space-x-2 shadow-sm"
          >
            <FileText size={18} />
            <span>Data-Only PDF</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export A4 PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-300 p-6 rounded-3xl grid grid-cols-3 gap-6 shadow-md print:hidden">
        <SearchablePartySelect
          parties={parties}
          selectedParty={selectedParty}
          onSelect={setSelectedParty}
          label="Search & Select Party"
        />

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Calendar size={14} className="text-indigo-600" />
            <span>From Date</span>
          </label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Calendar size={14} className="text-indigo-600" />
            <span>To Date</span>
          </label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {ledgerData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 print:grid-cols-4">
            <div className="bg-white border border-slate-300 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-600 font-black uppercase mb-1">Opening Balance</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-slate-900">₹{ledgerData.party.openingBalance.toLocaleString()}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  ledgerData.party.balanceType === 'Debit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {ledgerData.party.balanceType}
                </span>
              </div>
            </div>
            <div className="bg-white border border-slate-300 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-600 font-black uppercase mb-1">Total Transactions</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-rose-600">
                  <ArrowUpRight size={16} />
                  <span className="text-lg font-black">₹{ledgerData.totalDebit.toLocaleString()}</span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center space-x-1 text-emerald-600">
                  <ArrowDownLeft size={16} />
                  <span className="text-lg font-black">₹{ledgerData.totalCredit.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={48} className="text-indigo-600" />
              </div>
              <p className="text-[10px] text-indigo-700 font-black uppercase mb-1">Closing Balance</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-slate-900">₹{Math.abs(ledgerData.closingBalance).toLocaleString()}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  ledgerData.closingBalance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {ledgerData.closingBalance >= 0 ? 'Debit' : 'Credit'}
                </span>
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 bg-slate-50 border-b border-slate-300 flex justify-between items-center print:bg-white">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Account Statement: {selectedParty}</h3>
                <p className="text-xs text-slate-700 font-bold uppercase">Report Period: {fromDate} to {toDate}</p>
              </div>
              <div className="relative w-64 print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Quick filter entries..." 
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-700 font-black bg-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Particulars / Description</th>
                    <th className="px-6 py-4 text-right">Debit (Dr)</th>
                    <th className="px-6 py-4 text-right">Credit (Cr)</th>
                    <th className="px-6 py-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/50 italic">
                    <td className="px-6 py-3 text-[10px] text-slate-600 font-bold">{fromDate}</td>
                    <td className="px-6 py-3 text-sm text-slate-700 font-black uppercase">Opening Balance Brought Forward</td>
                    <td className="px-6 py-3 text-right text-sm text-slate-700 font-bold">
                      {ledgerData.party.balanceType === 'Debit' ? `₹${ledgerData.party.openingBalance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-slate-700 font-bold">
                      {ledgerData.party.balanceType === 'Credit' ? `₹${ledgerData.party.openingBalance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-black text-slate-900">
                      ₹{ledgerData.party.openingBalance.toLocaleString()} {ledgerData.party.balanceType.charAt(0)}
                    </td>
                  </tr>
                  {ledgerData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700 font-bold">{entry.date}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">{entry.remarks || 'Transaction'}</p>
                        <p className="text-[10px] text-slate-600 font-mono font-black uppercase tracking-tighter">{entry.voucherNo} | {entry.paymentType}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-sm font-black text-slate-900">₹{Math.abs(entry.balance).toLocaleString()}</span>
                          <span className="text-[10px] font-black text-slate-600">{entry.balance >= 0 ? 'DR' : 'CR'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                    <td colSpan={2} className="px-6 py-4 text-sm text-slate-900 text-right uppercase tracking-widest">Grand Totals</td>
                    <td className="px-6 py-4 text-right text-sm text-rose-600">₹{ledgerData.totalDebit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm text-emerald-600">₹{ledgerData.totalCredit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <span className="text-sm font-black text-slate-900">₹{Math.abs(ledgerData.closingBalance).toLocaleString()}</span>
                        <span className={`text-[10px] font-black ${ledgerData.closingBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {ledgerData.closingBalance >= 0 ? 'DR' : 'CR'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-100 rounded-3xl border border-slate-300 border-dashed shadow-inner">
          <div className="p-4 bg-white rounded-2xl text-slate-300 mb-4 shadow-sm">
            <FileText size={48} />
          </div>
          <p className="text-slate-600 text-sm font-black uppercase tracking-widest">Select a party to generate the A4 report.</p>
        </div>
      )}

    </div>
  );
}
