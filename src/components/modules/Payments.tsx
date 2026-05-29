import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Calendar, CreditCard, ArrowRight, IndianRupee } from 'lucide-react';
import type { PaymentEntry, Party } from '../../types';
import { storage } from '../../services/storage';
import SearchablePartySelect from './SearchablePartySelect';
import toast from 'react-hot-toast';


interface PaymentsProps {
  payments: PaymentEntry[];
  parties: Party[];
  onUpdate: () => void;
}

export default function Payments({ payments, parties, onUpdate }: PaymentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPayment, setEditingPayment] = useState<PaymentEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    amount: 0,
    paymentType: 'Cash' as 'Cash' | 'Bank' | 'UPI' | 'Cheque',
    transactionType: 'Pay' as 'Pay' | 'Receive',
    remarks: ''
  });

  const handleOpenModal = (payment?: PaymentEntry) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        date: payment.date,
        partyName: payment.partyName,
        amount: payment.amount,
        paymentType: payment.paymentType,
        transactionType: payment.transactionType,
        remarks: payment.remarks
      });
    } else {
      setEditingPayment(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        partyName: parties[0]?.name || '',
        amount: 0,
        paymentType: 'Cash',
        transactionType: 'Pay',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        // For updates, delete and re-add (Supabase doesn't have update on payments)
        await storage.deletePayment(editingPayment.id);
        await storage.addPayment({
          ...formData,
          voucherNo: editingPayment.voucherNo,
        });
        toast.success('Transaction updated!');
      } else {
        await storage.addPayment({
          ...formData,
          voucherNo: `VCH-${(payments.length + 1).toString().padStart(5, '0')}`,
        });
        toast.success('Transaction recorded!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save transaction.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await storage.deletePayment(id);
        toast.success('Transaction removed.');
        onUpdate();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete transaction.');
      }
    }
  };

  const filteredPayments = payments.filter((p, idx) => {
    const search = searchQuery.toLowerCase().trim();
    return (
      p.partyName.toLowerCase().includes(search) ||
      p.voucherNo.toLowerCase().includes(search) ||
      p.remarks.toLowerCase().includes(search) ||
      (idx + 1).toString() === search
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Transaction Entries</h2>
          <p className="text-slate-600 font-bold uppercase tracking-tight">Record and track payments and receipts.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by party, voucher, or remarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900"
          />
        </div>
        <div className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Total: {filteredPayments.length} entries
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-700 font-black bg-slate-100 border-b border-slate-300">
              <th className="px-6 py-4">Date & Voucher</th>
              <th className="px-6 py-4">Party Name</th>
              <th className="px-6 py-4">Mode & Type</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic text-sm font-bold uppercase tracking-widest">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">{payment.date}</p>
                    <p className="text-[10px] text-slate-500 font-mono font-bold tracking-tighter uppercase">{payment.voucherNo}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">{payment.partyName}</p>
                    <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{payment.remarks}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        payment.transactionType === 'Pay' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {payment.transactionType.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200 px-1.5 py-0.5 rounded-md">
                        {payment.paymentType}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-black ${
                    payment.transactionType === 'Pay' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(payment)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(payment.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900">{editingPayment ? 'Edit Transaction' : 'New Transaction Entry'}</h3>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-tight">Record details for the ledger entry.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <Calendar size={14} />
                    <span>Transaction Date</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <SearchablePartySelect
                  parties={parties}
                  selectedParty={formData.partyName}
                  onSelect={(name) => setFormData({ ...formData, partyName: name })}
                  label="Select Party"
                />

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <IndianRupee size={14} />
                    <span>Amount</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <CreditCard size={14} />
                    <span>Payment Mode</span>
                  </label>
                  <select 
                    value={formData.paymentType}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value as any})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <ArrowRight size={14} />
                    <span>Transaction Type</span>
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, transactionType: 'Pay'})}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        formData.transactionType === 'Pay' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      PAY (DR)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, transactionType: 'Receive'})}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        formData.transactionType === 'Receive' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      RECEIVE (CR)
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Remarks / Narration</label>
                  <input 
                    type="text" 
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Reason for payment"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all"
                >
                  {editingPayment ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
