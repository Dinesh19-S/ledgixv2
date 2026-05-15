-- ═══════════════════════════════════════════════════════════════════════════
-- LedgerERP Cloud Schema — Supabase PostgreSQL
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PARTIES TABLE
CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gst TEXT DEFAULT '',
  opening_balance NUMERIC(15,2) DEFAULT 0,
  balance_type TEXT CHECK (balance_type IN ('Debit', 'Credit')) DEFAULT 'Debit',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voucher_no TEXT NOT NULL,
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('Cash', 'Bank', 'UPI', 'Cheque')) DEFAULT 'Cash',
  transaction_type TEXT CHECK (transaction_type IN ('Receive', 'Pay')) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. JOURNALS TABLE
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voucher_no TEXT NOT NULL,
  date DATE NOT NULL,
  debit_party TEXT NOT NULL,
  credit_party TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SETTINGS TABLE (one row per user)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — ZERO DATA LEAKS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Parties: users can only CRUD their own data
CREATE POLICY "Users manage own parties" ON parties
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Payments: users can only CRUD their own data
CREATE POLICY "Users manage own payments" ON payments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Journals: users can only CRUD their own data
CREATE POLICY "Users manage own journals" ON journals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Settings: users can only CRUD their own data
CREATE POLICY "Users manage own settings" ON settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_parties_user ON parties(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(user_id, date);
CREATE INDEX idx_journals_user ON journals(user_id);
CREATE INDEX idx_journals_date ON journals(user_id, date);
CREATE INDEX idx_settings_user ON settings(user_id);
