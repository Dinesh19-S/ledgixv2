import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Calendar, MessageSquare, IndianRupee } from 'lucide-react';
import type { JournalEntry, Party } from '../../types';
import { storage } from '../../services/storage';
import SearchablePartySelect from './SearchablePartySelect';
import toast from 'react-hot-toast';

interface JournalProps {
  journals: JournalEntry[];
  parties: Party[];
  onUpdate: () => void;
}

export default function Journal({ journals, parties, onUpdate }: JournalProps) {


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    debitParty: '',
    creditParty: '',
    amount: 0,
    remarks: ''
  });

  const handleOpenModal = (journal?: JournalEntry) => {
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        date: journal.date,
        debitParty: journal.debitParty,
        creditParty: journal.creditParty,
        amount: journal.amount,
        remarks: journal.remarks
      });
    } else {
      setEditingJournal(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        debitParty: parties[0]?.name || '',
        creditParty: parties[1]?.name || parties[0]?.name || '',
        amount: 0,
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        await storage.deleteJournal(editingJournal.id);
        await storage.addJournal({
          ...formData,
          voucherNo: editingJournal.voucherNo,
        });
        toast.success('Journal entry updated!');
      } else {
        await storage.addJournal({
          ...formData,
          voucherNo: `JV-${(journals.length + 1).toString().padStart(5, '0')}`,
        });
        toast.success('Journal entry recorded!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save journal entry.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await storage.deleteJournal(id);
        toast.success('Journal entry deleted.');
        onUpdate();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete journal entry.');
      }
    }
  };

  const filteredJournals = journals.filter(j => 
    j.debitParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.creditParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Journal Entries</h2>
          <p className="text-slate-600">Record double-entry transactions between ledger accounts.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>New Journal Voucher</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by party, voucher, or remarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing {filteredJournals.length} of {journals.length} entries
        </div>
      </div>

      {/* Journals Table */}
      <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-700 font-black bg-slate-100 border-b border-slate-300">
              <th className="px-6 py-4">Date & Voucher</th>
              <th className="px-6 py-4">Debit Account (Dr)</th>
              <th className="px-6 py-4">Credit Account (Cr)</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredJournals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  No journal entries found.
                </td>
              </tr>
            ) : (
              filteredJournals.map((journal) => (
                <tr key={journal.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{journal.date}</p>
                    <p className="text-[10px] text-slate-500 font-mono font-bold">{journal.voucherNo}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">{journal.debitParty}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">{journal.creditParty}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-900">₹{journal.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(journal)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(journal.id)}
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
                <h3 className="text-xl font-black text-slate-900">{editingJournal ? 'Edit Journal' : 'New Journal Voucher'}</h3>
                <p className="text-xs text-slate-600 font-bold">Double-entry voucher for internal adjustments.</p>
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
                    <span>Voucher Date</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                  />
                </div>
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
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                  />
                </div>
                <SearchablePartySelect
                  parties={parties}
                  selectedParty={formData.debitParty}
                  onSelect={(name) => setFormData({ ...formData, debitParty: name })}
                  label="Debit Account (Dr)"
                />

                <SearchablePartySelect
                  parties={parties}
                  selectedParty={formData.creditParty}
                  onSelect={(name) => setFormData({ ...formData, creditParty: name })}
                  label="Credit Account (Cr)"
                />

                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <MessageSquare size={14} />
                    <span>Remarks / Narration</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                    placeholder="Enter reason for adjustment"
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
                  {editingJournal ? 'Update Voucher' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
