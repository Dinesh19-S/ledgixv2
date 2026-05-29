import { useState, useEffect } from 'react'; // Updated settings UI
import { User, Globe, Database, Trash2, Save, FileSpreadsheet, FileText } from 'lucide-react';
import { storage } from '../../services/storage';
import { exportService } from '../../services/export';
import toast from 'react-hot-toast';

// Updated for new settings columns
export default function Settings() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    storage.getSettings().then(s => setSettings(s)).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await storage.saveSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    }
  };

  const handleResetData = async () => {
    if (!confirm('⚠️ CAUTION: This will permanently delete ALL your parties, payments, and journal entries. This action cannot be undone!\n\nAre you absolutely sure?')) return;
    if (!confirm('🔴 FINAL WARNING: All data will be erased forever. Continue?')) return;

    try {
      const { supabase } = await import('../../services/supabase');
      
      // Delete all data from all tables
      const { error: e1 } = await supabase.from('journals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: e2 } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: e3 } = await supabase.from('parties').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (e1 || e2 || e3) {
        throw new Error(e1?.message || e2?.message || e3?.message || 'Delete failed');
      }

      toast.success('All application data has been cleared!');
      // Reload the page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset data.');
    }
  };

  const handleExportExcel = () => {
    toast.promise(
      exportService.exportBackupExcel(),
      {
        loading: 'Preparing Excel backup...',
        success: 'Excel Backup Downloaded!',
        error: 'Failed to export Excel.',
      }
    );
  };

  const handleExportPDF = () => {
    toast.promise(
      new Promise((resolve) => {
        exportService.exportBackupPDF();
        resolve(true);
      }),
      {
        loading: 'Preparing PDF backup...',
        success: 'PDF Backup Downloaded!',
        error: 'Failed to export PDF.',
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Application Settings</h2>
          <p className="text-slate-600 font-bold">Configure your business profile and app preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Settings */}
        <div className="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-md">
          <div className="p-6 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="./logo.png" alt="Ledgix Logo" className="w-8 h-8 object-contain rounded-lg" />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Business Profile</h3>
            </div>
            <User className="text-indigo-600" size={20} />
          </div>

          <div className="p-8 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Business Name</label>
              <input 
                type="text" 
                value={settings.businessName || ''}
                onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Tax ID / GSTIN</label>
              <input 
                type="text" 
                value={settings.gstin || ''}
                onChange={(e) => setSettings({...settings, gstin: e.target.value})}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20"
                placeholder="27AAAAA0000A1Z5"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Business Address</label>
              <textarea 
                value={settings.address || ''}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
                placeholder="Full business address for invoices"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-md">
          <div className="p-6 border-b border-slate-300 bg-slate-50 flex items-center space-x-3">
            <Globe className="text-indigo-600" size={20} />
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">App Preferences</h3>
          </div>
          <div className="p-8 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Currency</label>
              <select 
                value={settings.currency || 'INR'}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Date Format</label>
              <select 
                value={settings.dateFormat || 'YYYY-MM-DD'}
                onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
    {/* Data Management */}
        <div className="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-md">
          <div className="p-6 border-b border-slate-300 bg-slate-50 flex items-center space-x-3">
            <Database className="text-indigo-600" size={20} />
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Data Backup & Recovery</h3>
          </div>
          <div className="p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleExportExcel}
                className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-200 hover:border-emerald-500 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-black text-emerald-900">Excel Backup</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Full ledger in .xlsx format</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <FileSpreadsheet size={20} />
                </div>
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center justify-between p-5 bg-indigo-50 rounded-2xl border border-indigo-200 hover:border-indigo-500 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-black text-indigo-900">PDF Summary</p>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">Account summary in .pdf format</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
              </button>
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-200">
              <button 
                onClick={handleResetData}
                className="w-full flex items-center justify-center space-x-2 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all font-black text-sm"
              >
                <Trash2 size={18} />
                <span>Reset All Application Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
