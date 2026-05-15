import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, User, Phone, MapPin, Hash, IndianRupee } from 'lucide-react';
import type { Party } from '../../types';
import { storage } from '../../services/storage';
import toast from 'react-hot-toast';

interface PartiesProps {
  parties: Party[];
  onUpdate: () => void;
}

export default function Parties({ parties, onUpdate }: PartiesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    gst: '',
    openingBalance: 0,
    balanceType: 'Debit' as 'Debit' | 'Credit'
  });

  const handleOpenModal = (party?: Party) => {
    if (party) {
      setEditingParty(party);
      setFormData({
        name: party.name,
        mobile: party.mobile,
        address: party.address,
        gst: party.gst,
        openingBalance: party.openingBalance,
        balanceType: party.balanceType
      });
    } else {
      setEditingParty(null);
      setFormData({ name: '', mobile: '', address: '', gst: '', openingBalance: 0, balanceType: 'Debit' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParty) {
        await storage.updateParty(editingParty.id, formData);
        toast.success('Party details updated!');
      } else {
        await storage.addParty(formData);
        toast.success('New party created successfully!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save party.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this party?')) {
      try {
        await storage.deleteParty(id);
        toast.success('Party deleted.');
        onUpdate();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete party.');
      }
    }
  };

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mobile.includes(searchQuery) ||
    p.gst.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Party Management</h2>
          <p className="text-slate-600 font-bold">Manage your customers, vendors, and opening balances.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, mobile, or GST..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900"
          />
        </div>
        <div className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Showing {filteredParties.length} of {parties.length} parties
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-700 font-black bg-slate-100 border-b border-slate-300">
              <th className="px-6 py-4">Party Details</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">GST Number</th>
              <th className="px-6 py-4">Opening Bal</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredParties.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic text-sm font-bold">
                  No parties found.
                </td>
              </tr>
            ) : (
              filteredParties.map((party) => (
                <tr key={party.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all font-black">
                        {party.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{party.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-bold tracking-tight uppercase">{party.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-700 font-bold flex items-center space-x-1.5">
                        <Phone size={12} className="text-slate-500" />
                        <span>{party.mobile}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold flex items-center space-x-1.5">
                        <MapPin size={12} className="text-slate-500" />
                        <span className="truncate max-w-[150px]">{party.address}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-600 font-mono uppercase tracking-tight">{party.gst || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-900">₹{party.openingBalance.toLocaleString()}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        party.balanceType === 'Debit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {party.balanceType.charAt(0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(party)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(party.id)}
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
                <h3 className="text-xl font-black text-slate-900">{editingParty ? 'Edit Party' : 'Add New Party'}</h3>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-tight">Enter the party details below to save.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <User size={14} />
                    <span>Party Name</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <Phone size={14} />
                    <span>Mobile Number</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="10-digit mobile"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <MapPin size={14} />
                    <span>Address</span>
                  </label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px]"
                    placeholder="Full postal address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <Hash size={14} />
                    <span>GST Number</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.gst}
                    onChange={(e) => setFormData({...formData, gst: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase"
                    placeholder="Optional GSTIN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <IndianRupee size={14} />
                    <span>Opening Balance</span>
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({...formData, openingBalance: Number(e.target.value)})}
                      className="flex-1 bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <select 
                      value={formData.balanceType}
                      onChange={(e) => setFormData({...formData, balanceType: e.target.value as any})}
                      className="bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="Debit">DR</option>
                      <option value="Credit">CR</option>
                    </select>
                  </div>
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
                  {editingParty ? 'Update Party' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
