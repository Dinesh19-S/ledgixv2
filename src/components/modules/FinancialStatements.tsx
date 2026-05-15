import { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Party, PaymentEntry, JournalEntry } from '../../types';

interface Props {
  parties: Party[];
  payments: PaymentEntry[];
  journals: JournalEntry[];
}

type Tab = 'trial-balance' | 'profit-loss';

// ─── Trial Balance Row ──────────────────────────────────────────────────────
interface TrialBalanceRow {
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  transactionDebit: number;
  transactionCredit: number;
  closingDebit: number;
  closingCredit: number;
}

// ─── P&L Row ────────────────────────────────────────────────────────────────
interface PLRow {
  particular: string;
  amount: number;
  type: 'income' | 'expense';
}

export default function FinancialStatements({ parties, payments, journals }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('trial-balance');

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-COMPUTED TRIAL BALANCE
  // ═══════════════════════════════════════════════════════════════════════════
  const trialBalance = useMemo<TrialBalanceRow[]>(() => {
    const accountMap = new Map<string, TrialBalanceRow>();

    // Initialize from parties (opening balances)
    parties.forEach(party => {
      accountMap.set(party.name, {
        accountName: party.name,
        openingDebit: party.balanceType === 'Debit' ? party.openingBalance : 0,
        openingCredit: party.balanceType === 'Credit' ? party.openingBalance : 0,
        transactionDebit: 0,
        transactionCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      });
    });

    // Helper to ensure account exists
    const ensureAccount = (name: string) => {
      if (!accountMap.has(name)) {
        accountMap.set(name, {
          accountName: name,
          openingDebit: 0, openingCredit: 0,
          transactionDebit: 0, transactionCredit: 0,
          closingDebit: 0, closingCredit: 0,
        });
      }
    };

    // Process Payments
    payments.forEach(payment => {
      ensureAccount(payment.partyName);
      const account = accountMap.get(payment.partyName)!;
      if (payment.transactionType === 'Receive') {
        // Money received from party → Party account credited (their balance reduces)
        account.transactionCredit += payment.amount;
      } else {
        // Money paid to party → Party account debited (their balance increases)
        account.transactionDebit += payment.amount;
      }
    });

    // Process Journal Entries
    journals.forEach(journal => {
      ensureAccount(journal.debitParty);
      ensureAccount(journal.creditParty);
      const debitAccount = accountMap.get(journal.debitParty)!;
      const creditAccount = accountMap.get(journal.creditParty)!;
      debitAccount.transactionDebit += journal.amount;
      creditAccount.transactionCredit += journal.amount;
    });

    // Calculate closing balances
    accountMap.forEach(account => {
      const netDebit = account.openingDebit + account.transactionDebit;
      const netCredit = account.openingCredit + account.transactionCredit;
      if (netDebit >= netCredit) {
        account.closingDebit = netDebit - netCredit;
        account.closingCredit = 0;
      } else {
        account.closingDebit = 0;
        account.closingCredit = netCredit - netDebit;
      }
    });

    return Array.from(accountMap.values()).filter(
      row => row.openingDebit || row.openingCredit || row.transactionDebit || row.transactionCredit
    );
  }, [parties, payments, journals]);

  // Trial Balance Totals
  const tbTotals = useMemo(() => {
    return trialBalance.reduce(
      (acc, row) => ({
        openingDebit: acc.openingDebit + row.openingDebit,
        openingCredit: acc.openingCredit + row.openingCredit,
        transactionDebit: acc.transactionDebit + row.transactionDebit,
        transactionCredit: acc.transactionCredit + row.transactionCredit,
        closingDebit: acc.closingDebit + row.closingDebit,
        closingCredit: acc.closingCredit + row.closingCredit,
      }),
      { openingDebit: 0, openingCredit: 0, transactionDebit: 0, transactionCredit: 0, closingDebit: 0, closingCredit: 0 }
    );
  }, [trialBalance]);

  const isBalanced = Math.abs(tbTotals.closingDebit - tbTotals.closingCredit) < 0.01;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-COMPUTED PROFIT & LOSS
  // ═══════════════════════════════════════════════════════════════════════════
  const profitLoss = useMemo(() => {
    const incomeItems: PLRow[] = [];
    const expenseItems: PLRow[] = [];

    // Group payments by party and type
    const partyReceived = new Map<string, number>();
    const partyPaid = new Map<string, number>();

    payments.forEach(p => {
      if (p.transactionType === 'Receive') {
        partyReceived.set(p.partyName, (partyReceived.get(p.partyName) || 0) + p.amount);
      } else {
        partyPaid.set(p.partyName, (partyPaid.get(p.partyName) || 0) + p.amount);
      }
    });

    // Income: money received from parties
    partyReceived.forEach((amount, party) => {
      incomeItems.push({ particular: `Received from ${party}`, amount, type: 'income' });
    });

    // Add journal credit entries as income
    const journalCredits = new Map<string, number>();
    journals.forEach(j => {
      journalCredits.set(j.creditParty, (journalCredits.get(j.creditParty) || 0) + j.amount);
    });
    journalCredits.forEach((amount, party) => {
      incomeItems.push({ particular: `Journal Credit — ${party}`, amount, type: 'income' });
    });

    // Expenses: money paid to parties
    partyPaid.forEach((amount, party) => {
      expenseItems.push({ particular: `Paid to ${party}`, amount, type: 'expense' });
    });

    // Add journal debit entries as expense
    const journalDebits = new Map<string, number>();
    journals.forEach(j => {
      journalDebits.set(j.debitParty, (journalDebits.get(j.debitParty) || 0) + j.amount);
    });
    journalDebits.forEach((amount, party) => {
      expenseItems.push({ particular: `Journal Debit — ${party}`, amount, type: 'expense' });
    });

    const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenseItems.reduce((s, i) => s + i.amount, 0);
    const netProfitLoss = totalIncome - totalExpenses;

    return { incomeItems, expenseItems, totalIncome, totalExpenses, netProfitLoss };
  }, [payments, journals]);

  const fmt = (n: number) => n ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Financial Statements</h2>
          <p className="text-slate-600 font-bold">Auto-computed from your ledger data. No manual entry required.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="text-xs font-black text-emerald-700 uppercase">Live • Auto-Updated</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-slate-100 border border-slate-300 rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab('trial-balance')}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'trial-balance'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Scale size={18} />
          <span>Trial Balance</span>
        </button>
        <button
          onClick={() => setActiveTab('profit-loss')}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'profit-loss'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <DollarSign size={18} />
          <span>Profit & Loss Account</span>
        </button>
      </div>

      {/* ═══════════ TRIAL BALANCE ═══════════ */}
      {activeTab === 'trial-balance' && (
        <div className="space-y-4">
          {/* Balance Status Card */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center space-x-3">
              {isBalanced ? (
                <CheckCircle2 className="text-emerald-600" size={24} />
              ) : (
                <AlertTriangle className="text-rose-600" size={24} />
              )}
              <div>
                <p className={`font-black text-sm ${isBalanced ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {isBalanced ? 'Trial Balance is Balanced ✓' : 'Trial Balance has a Difference'}
                </p>
                <p className={`text-xs font-bold ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isBalanced
                    ? 'Total Debits equal Total Credits'
                    : `Difference: ₹${Math.abs(tbTotals.closingDebit - tbTotals.closingCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-black uppercase">As of</p>
              <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Trial Balance Table */}
          <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Trial Balance</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                Accounts: {trialBalance.length} • Period: Current Financial Year
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-black border-b border-slate-300">
                    <th className="px-5 py-3 text-slate-700 bg-slate-100" rowSpan={2}>Account Name</th>
                    <th className="px-4 py-2 text-center text-indigo-700 bg-indigo-50 border-l border-slate-200" colSpan={2}>Opening Balance</th>
                    <th className="px-4 py-2 text-center text-amber-700 bg-amber-50 border-l border-slate-200" colSpan={2}>Transactions</th>
                    <th className="px-4 py-2 text-center text-emerald-700 bg-emerald-50 border-l border-slate-200" colSpan={2}>Closing Balance</th>
                  </tr>
                  <tr className="text-[9px] uppercase tracking-widest font-black border-b border-slate-300 bg-slate-50">
                    <th className="px-4 py-2 text-right text-indigo-600 border-l border-slate-200">Debit</th>
                    <th className="px-4 py-2 text-right text-indigo-600">Credit</th>
                    <th className="px-4 py-2 text-right text-amber-600 border-l border-slate-200">Debit</th>
                    <th className="px-4 py-2 text-right text-amber-600">Credit</th>
                    <th className="px-4 py-2 text-right text-emerald-600 border-l border-slate-200">Debit</th>
                    <th className="px-4 py-2 text-right text-emerald-600">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-slate-400 italic text-sm font-bold">
                        No transactions found. Add parties and record payments to generate the Trial Balance automatically.
                      </td>
                    </tr>
                  ) : (
                    trialBalance.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-black text-slate-900">{row.accountName}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-slate-700 border-l border-slate-100">{fmt(row.openingDebit)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-slate-700">{fmt(row.openingCredit)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-slate-700 border-l border-slate-100">{fmt(row.transactionDebit)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-slate-700">{fmt(row.transactionCredit)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums font-black text-emerald-700 border-l border-slate-100">{fmt(row.closingDebit)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono tabular-nums font-black text-emerald-700">{fmt(row.closingCredit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {trialBalance.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black">
                      <td className="px-5 py-3 text-sm uppercase tracking-wider">Total</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.openingDebit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.openingCredit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.transactionDebit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.transactionCredit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.closingDebit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums">{fmt(tbTotals.closingCredit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PROFIT & LOSS ═══════════ */}
      {activeTab === 'profit-loss' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="text-emerald-600" size={18} />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Total Income</span>
              </div>
              <p className="text-2xl font-black text-emerald-700">₹{profitLoss.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="text-rose-600" size={18} />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Total Expenses</span>
              </div>
              <p className="text-2xl font-black text-rose-700">₹{profitLoss.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className={`border rounded-2xl p-5 shadow-sm ${
              profitLoss.netProfitLoss >= 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className={profitLoss.netProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'} size={18} />
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                  Net {profitLoss.netProfitLoss >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
              <p className={`text-2xl font-black ${profitLoss.netProfitLoss >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                ₹{Math.abs(profitLoss.netProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* P&L Table — T-Account Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: Expenses (Debit Side) */}
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
              <div className="p-4 border-b border-slate-200 bg-rose-50">
                <h3 className="font-black text-rose-800 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <TrendingDown size={14} />
                  <span>Expenditure (Dr)</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {profitLoss.expenseItems.length === 0 ? (
                  <div className="px-5 py-10 text-center text-slate-400 italic text-sm font-bold">No expenses recorded.</div>
                ) : (
                  profitLoss.expenseItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-bold text-slate-800">{item.particular}</span>
                      <span className="text-sm font-mono tabular-nums font-black text-rose-700">{fmt(item.amount)}</span>
                    </div>
                  ))
                )}
                {/* Net Profit goes on expenses side (if profit) */}
                {profitLoss.netProfitLoss > 0 && (
                  <div className="flex justify-between items-center px-5 py-3 bg-emerald-50 border-t-2 border-emerald-300">
                    <span className="text-sm font-black text-emerald-800 italic">Net Profit (transferred to Capital)</span>
                    <span className="text-sm font-mono tabular-nums font-black text-emerald-700">{fmt(profitLoss.netProfitLoss)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center px-5 py-3 bg-slate-900 text-white">
                <span className="text-sm font-black uppercase tracking-wider">Total</span>
                <span className="text-sm font-mono tabular-nums font-black">
                  {fmt(profitLoss.totalExpenses + Math.max(0, profitLoss.netProfitLoss))}
                </span>
              </div>
            </div>

            {/* RIGHT: Income (Credit Side) */}
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
              <div className="p-4 border-b border-slate-200 bg-emerald-50">
                <h3 className="font-black text-emerald-800 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <TrendingUp size={14} />
                  <span>Income (Cr)</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {profitLoss.incomeItems.length === 0 ? (
                  <div className="px-5 py-10 text-center text-slate-400 italic text-sm font-bold">No income recorded.</div>
                ) : (
                  profitLoss.incomeItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-bold text-slate-800">{item.particular}</span>
                      <span className="text-sm font-mono tabular-nums font-black text-emerald-700">{fmt(item.amount)}</span>
                    </div>
                  ))
                )}
                {/* Net Loss goes on income side (if loss) */}
                {profitLoss.netProfitLoss < 0 && (
                  <div className="flex justify-between items-center px-5 py-3 bg-rose-50 border-t-2 border-rose-300">
                    <span className="text-sm font-black text-rose-800 italic">Net Loss (transferred to Capital)</span>
                    <span className="text-sm font-mono tabular-nums font-black text-rose-700">{fmt(Math.abs(profitLoss.netProfitLoss))}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center px-5 py-3 bg-slate-900 text-white">
                <span className="text-sm font-black uppercase tracking-wider">Total</span>
                <span className="text-sm font-mono tabular-nums font-black">
                  {fmt(profitLoss.totalIncome + Math.max(0, -profitLoss.netProfitLoss))}
                </span>
              </div>
            </div>
          </div>

          {/* Accounting Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-black text-amber-800">Accounting Note</p>
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                This P&L statement is auto-generated from payment receipts and journal entries.
                Net Profit is shown on the Debit side (Expenses) and Net Loss on the Credit side (Income) to balance the account,
                following standard double-entry accounting conventions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
