import { supabase } from './supabase';
import type { Party, JournalEntry, PaymentEntry } from '../types';

// ─── Helper: Get current user ID ────────────────────────────────────────────
async function getUserId(): Promise<string> { // Force reload for new schema
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ─── Snake ↔ Camel case mappers ─────────────────────────────────────────────
function toParty(row: any): Party {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile || '',
    address: row.address || '',
    gst: row.gst || '',
    openingBalance: parseFloat(row.opening_balance) || 0,
    balanceType: row.balance_type || 'Debit',
    createdAt: row.created_at,
  };
}

function toPayment(row: any): PaymentEntry {
  return {
    id: row.id,
    voucherNo: row.voucher_no,
    date: row.date,
    partyName: row.party_name,
    paymentType: row.payment_type || 'Cash',
    transactionType: row.transaction_type,
    amount: parseFloat(row.amount) || 0,
    remarks: row.remarks || '',
    createdAt: row.created_at,
  };
}

function toJournal(row: any): JournalEntry {
  return {
    id: row.id,
    voucherNo: row.voucher_no,
    date: row.date,
    debitParty: row.debit_party,
    creditParty: row.credit_party,
    amount: parseFloat(row.amount) || 0,
    remarks: row.remarks || '',
    createdAt: row.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLOUD STORAGE SERVICE (Supabase)
// ═══════════════════════════════════════════════════════════════════════════
export const storage = {

  // ─── PARTIES ──────────────────────────────────────────────────────────────
  getParties: async (): Promise<Party[]> => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) { console.warn('getParties error:', error.message); return []; }
      return (data || []).map(toParty);
    } catch { return []; }
  },

  addParty: async (party: Omit<Party, 'id' | 'createdAt'>): Promise<Party> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('parties')
      .insert({
        user_id: userId,
        name: party.name,
        mobile: party.mobile,
        address: party.address,
        gst: party.gst,
        opening_balance: party.openingBalance,
        balance_type: party.balanceType,
      })
      .select()
      .single();
    if (error) throw error;
    return toParty(data);
  },

  updateParty: async (id: string, party: Partial<Party>): Promise<void> => {
    const updates: any = {};
    if (party.name !== undefined) updates.name = party.name;
    if (party.mobile !== undefined) updates.mobile = party.mobile;
    if (party.address !== undefined) updates.address = party.address;
    if (party.gst !== undefined) updates.gst = party.gst;
    if (party.openingBalance !== undefined) updates.opening_balance = party.openingBalance;
    if (party.balanceType !== undefined) updates.balance_type = party.balanceType;

    const { error } = await supabase.from('parties').update(updates).eq('id', id);
    if (error) throw error;
  },

  deleteParty: async (id: string): Promise<void> => {
    const { error } = await supabase.from('parties').delete().eq('id', id);
    if (error) throw error;
  },

  saveParties: async (parties: Party[]): Promise<void> => {
    const userId = await getUserId();
    // Delete all existing and re-insert (for spreadsheet bulk save)
    await supabase.from('parties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (parties.length > 0) {
      const rows = parties.map(p => ({
        user_id: userId,
        name: p.name,
        mobile: p.mobile,
        address: p.address,
        gst: p.gst,
        opening_balance: p.openingBalance,
        balance_type: p.balanceType,
      }));
      const { error } = await supabase.from('parties').insert(rows);
      if (error) throw error;
    }
  },

  // ─── PAYMENTS ─────────────────────────────────────────────────────────────
  getPayments: async (): Promise<PaymentEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) { console.warn('getPayments error:', error.message); return []; }
      return (data || []).map(toPayment);
    } catch { return []; }
  },

  addPayment: async (payment: Omit<PaymentEntry, 'id' | 'createdAt'>): Promise<PaymentEntry> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        voucher_no: payment.voucherNo,
        date: payment.date,
        party_name: payment.partyName,
        payment_type: payment.paymentType,
        transaction_type: payment.transactionType,
        amount: payment.amount,
        remarks: payment.remarks,
      })
      .select()
      .single();
    if (error) throw error;
    return toPayment(data);
  },

  deletePayment: async (id: string): Promise<void> => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  savePayments: async (payments: PaymentEntry[]): Promise<void> => {
    const userId = await getUserId();
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (payments.length > 0) {
      const rows = payments.map(p => ({
        user_id: userId,
        voucher_no: p.voucherNo,
        date: p.date,
        party_name: p.partyName,
        payment_type: p.paymentType,
        transaction_type: p.transactionType,
        amount: p.amount,
        remarks: p.remarks,
      }));
      const { error } = await supabase.from('payments').insert(rows);
      if (error) throw error;
    }
  },

  // ─── JOURNALS ─────────────────────────────────────────────────────────────
  getJournals: async (): Promise<JournalEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) { console.warn('getJournals error:', error.message); return []; }
      return (data || []).map(toJournal);
    } catch { return []; }
  },

  addJournal: async (journal: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('journals')
      .insert({
        user_id: userId,
        voucher_no: journal.voucherNo,
        date: journal.date,
        debit_party: journal.debitParty,
        credit_party: journal.creditParty,
        amount: journal.amount,
        remarks: journal.remarks,
      })
      .select()
      .single();
    if (error) throw error;
    return toJournal(data);
  },

  deleteJournal: async (id: string): Promise<void> => {
    const { error } = await supabase.from('journals').delete().eq('id', id);
    if (error) throw error;
  },

  saveJournals: async (journals: JournalEntry[]): Promise<void> => {
    const userId = await getUserId();
    await supabase.from('journals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (journals.length > 0) {
      const rows = journals.map(j => ({
        user_id: userId,
        voucher_no: j.voucherNo,
        date: j.date,
        debit_party: j.debitParty,
        credit_party: j.creditParty,
        amount: j.amount,
        remarks: j.remarks,
      }));
      const { error } = await supabase.from('journals').insert(rows);
      if (error) throw error;
    }
  },

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  getSettings: async (): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();
      if (error) { console.warn('getSettings error:', error.message); return {}; }
      if (!data) return {};
      return {
        businessName: data.business_name || 'Abirami javulistore',
        address: data.address || '',
        gstin: data.gstin || '',
        phone: data.phone || '',
        email: data.email || '',
        currency: data.currency || 'INR',
        dateFormat: data.date_format || 'YYYY-MM-DD',
      };
    } catch { return {}; }
  },

  saveSettings: async (settings: any): Promise<void> => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        business_name: settings.businessName || 'Abirami javulistore',
        address: settings.address || '',
        gstin: settings.gstin || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || 'INR',
        date_format: settings.dateFormat || 'YYYY-MM-DD',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) throw error;
  },
};
