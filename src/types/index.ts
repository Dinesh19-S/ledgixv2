export interface Party {
  id: string;
  name: string;
  mobile: string;
  address: string;
  gst: string;
  openingBalance: number;
  balanceType: 'Debit' | 'Credit';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  debitParty: string;
  creditParty: string;
  amount: number;
  remarks: string;
  createdAt: string;
}

export interface PaymentEntry {
  id: string;
  voucherNo: string;
  date: string;
  partyName: string;
  paymentType: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  transactionType: 'Receive' | 'Pay';
  amount: number;
  remarks: string;
  createdAt: string;
}

export type Module = 'Dashboard' | 'Parties' | 'Journal' | 'Payments' | 'Reports' | 'FinancialStatements' | 'Spreadsheet' | 'Settings';
