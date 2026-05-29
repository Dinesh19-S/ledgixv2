import { useState, useCallback, useRef, useEffect } from 'react';
import { FileSpreadsheet, FileText, Plus, Trash2, Save, Search, Grid3X3, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import type { Party, JournalEntry, PaymentEntry } from '../../types';
import { storage } from '../../services/storage';
import { exportService } from '../../services/export';
import toast from 'react-hot-toast';

interface SpreadsheetProps {
  parties: Party[];
  payments: PaymentEntry[];
  journals: JournalEntry[];
  onUpdate: () => void;
}

type SheetTab = 'Parties' | 'Payments' | 'Journals' | 'Trial Balance' | 'P&L';

// Column definitions per sheet
const PARTY_COLUMNS = ['S.No', 'Name', 'Mobile', 'Address', 'GST', 'Opening Balance', 'Balance Type', 'Created At'];
const PAYMENT_COLUMNS = ['S.No', 'Voucher No', 'Date', 'Party Name', 'Payment Type', 'Transaction Type', 'Amount', 'Remarks', 'Created At'];
const JOURNAL_COLUMNS = ['S.No', 'Voucher No', 'Date', 'Debit Party', 'Credit Party', 'Amount', 'Remarks', 'Created At'];
const TRIAL_COLUMNS = ['Party Name', 'Opening Balance', 'Total Debit', 'Total Credit', 'Net Balance', 'Type'];
const PL_COLUMNS = ['Account Description', 'Debit (Expense)', 'Credit (Income)', 'Net Result'];

// Convert letter index to Excel column letter (0→A, 1→B, etc.)
function colLetter(index: number): string {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// Map data arrays to 2D string arrays for rendering
function partiesToGrid(parties: Party[]): string[][] {
  return parties.map((p, idx) => [
    (idx + 1).toString(), p.name, p.mobile, p.address, p.gst,
    p.openingBalance.toString(), p.balanceType, p.createdAt
  ]);
}

function paymentsToGrid(payments: PaymentEntry[]): string[][] {
  return payments.map((p, idx) => [
    (idx + 1).toString(), p.voucherNo, p.date, p.partyName, p.paymentType,
    p.transactionType, p.amount.toString(), p.remarks, p.createdAt
  ]);
}

function journalsToGrid(journals: JournalEntry[]): string[][] {
  return journals.map((j, idx) => [
    (idx + 1).toString(), j.voucherNo, j.date, j.debitParty, j.creditParty,
    j.amount.toString(), j.remarks, j.createdAt
  ]);
}

function calculateTrialBalance(parties: Party[], payments: PaymentEntry[], journals: JournalEntry[]): string[][] {
  return parties.map(party => {
    const pDebits = payments.filter(p => p.partyName === party.name && p.transactionType === 'Pay').reduce((s, p) => s + p.amount, 0);
    const pCredits = payments.filter(p => p.partyName === party.name && p.transactionType === 'Receive').reduce((s, p) => s + p.amount, 0);
    const jDebits = journals.filter(j => j.debitParty === party.name).reduce((s, j) => s + j.amount, 0);
    const jCredits = journals.filter(j => j.creditParty === party.name).reduce((s, j) => s + j.amount, 0);

    const totalDebit = pDebits + jDebits;
    const totalCredit = pCredits + jCredits;
    const net = (party.balanceType === 'Debit' ? party.openingBalance : -party.openingBalance) + totalDebit - totalCredit;

    return [
      party.name,
      party.openingBalance.toString(),
      totalDebit.toFixed(2),
      totalCredit.toFixed(2),
      Math.abs(net).toFixed(2),
      net >= 0 ? 'Debit' : 'Credit'
    ];
  });
}

function calculatePL(payments: PaymentEntry[]): string[][] {
  const totalExpense = payments.filter(p => p.transactionType === 'Pay').reduce((s, p) => s + p.amount, 0);
  const totalIncome = payments.filter(p => p.transactionType === 'Receive').reduce((s, p) => s + p.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return [
    ['Total Operational Expenses', totalExpense.toFixed(2), '0.00', '-'],
    ['Total Operational Income', '0.00', totalIncome.toFixed(2), '-'],
    ['NET PROFIT / LOSS', '-', '-', netProfit.toFixed(2)]
  ];
}

export default function Spreadsheet({ parties, payments, journals, onUpdate }: SpreadsheetProps) {
  const [activeSheet, setActiveSheet] = useState<SheetTab>('Parties');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mutable grid data
  const [partiesGrid, setPartiesGrid] = useState<string[][]>([]);
  const [paymentsGrid, setPaymentsGrid] = useState<string[][]>([]);
  const [journalsGrid, setJournalsGrid] = useState<string[][]>([]);
  const [trialGrid, setTrialGrid] = useState<string[][]>([]);
  const [plGrid, setPlGrid] = useState<string[][]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Sync from props
  useEffect(() => {
    setPartiesGrid(partiesToGrid(parties));
    setPaymentsGrid(paymentsToGrid(payments));
    setJournalsGrid(journalsToGrid(journals));
    setTrialGrid(calculateTrialBalance(parties, payments, journals));
    setPlGrid(calculatePL(payments));
    setHasUnsavedChanges(false);
  }, [parties, payments, journals]);

  const getColumns = (): string[] => {
    switch (activeSheet) {
      case 'Parties': return PARTY_COLUMNS;
      case 'Payments': return PAYMENT_COLUMNS;
      case 'Journals': return JOURNAL_COLUMNS;
      case 'Trial Balance': return TRIAL_COLUMNS;
      case 'P&L': return PL_COLUMNS;
    }
  };

  const getGrid = (): string[][] => {
    switch (activeSheet) {
      case 'Parties': return partiesGrid;
      case 'Payments': return paymentsGrid;
      case 'Journals': return journalsGrid;
      case 'Trial Balance': return trialGrid;
      case 'P&L': return plGrid;
    }
  };

  const setGrid = (newGrid: string[][]) => {
    switch (activeSheet) {
      case 'Parties': setPartiesGrid(newGrid); break;
      case 'Payments': setPaymentsGrid(newGrid); break;
      case 'Journals': setJournalsGrid(newGrid); break;
    }
    setHasUnsavedChanges(true);
  };

  const columns = getColumns();
  const grid = getGrid();

  // Filter rows based on search
  const filteredRows = searchQuery
    ? grid.filter(row => row.some(cell => cell.toLowerCase().includes(searchQuery.toLowerCase())))
    : grid;

  // Cell ref like "A1", "B3", etc.
  const getCellRef = (row: number, col: number) => `${colLetter(col)}${row + 1}`;

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    if (editingCell) {
      commitEdit();
    }
  };

  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    // Column 0 (ID) is read-only, and Trial/PL sheets are read-only
    if (colIndex === 0 || activeSheet === 'Trial Balance' || activeSheet === 'P&L') return;
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(filteredRows[rowIndex][colIndex]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const realRowIndex = searchQuery
      ? grid.indexOf(filteredRows[editingCell.row])
      : editingCell.row;

    if (realRowIndex >= 0) {
      const newGrid = grid.map((row, i) =>
        i === realRowIndex
          ? row.map((cell, j) => (j === editingCell.col ? editValue : cell))
          : [...row]
      );
      setGrid(newGrid);
    }
    setEditingCell(null);
  }, [editingCell, editValue, grid, filteredRows, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        commitEdit();
        // Move to next row
        if (selectedCell && selectedCell.row < filteredRows.length - 1) {
          setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        if (selectedCell && selectedCell.col < columns.length - 1) {
          const nextCol = selectedCell.col + 1;
          setSelectedCell({ row: selectedCell.row, col: nextCol });
        }
      }
      return;
    }

    if (!selectedCell) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedCell.row < filteredRows.length - 1) {
          setSelectedCell({ ...selectedCell, row: selectedCell.row + 1 });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedCell.row > 0) {
          setSelectedCell({ ...selectedCell, row: selectedCell.row - 1 });
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedCell.col < columns.length - 1) {
          setSelectedCell({ ...selectedCell, col: selectedCell.col + 1 });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedCell.col > 0) {
          setSelectedCell({ ...selectedCell, col: selectedCell.col - 1 });
        }
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        if (selectedCell.col > 0) {
          handleCellDoubleClick(selectedCell.row, selectedCell.col);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedCell.col > 0) {
          const realRowIndex = searchQuery
            ? grid.indexOf(filteredRows[selectedCell.row])
            : selectedCell.row;
          if (realRowIndex >= 0) {
            const newGrid = grid.map((row, i) =>
              i === realRowIndex
                ? row.map((cell, j) => (j === selectedCell.col ? '' : cell))
                : [...row]
            );
            setGrid(newGrid);
          }
        }
        break;
    }
  };

  // Save grid back to storage
  const handleSave = async () => {
    try {
      // Reconstruct objects from grids
      const newParties: Party[] = partiesGrid.map((row, i) => ({
        id: parties[i]?.id || `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: row[1],
        mobile: row[2],
        address: row[3],
        gst: row[4],
        openingBalance: parseFloat(row[5]) || 0,
        balanceType: (row[6] as 'Debit' | 'Credit') || 'Debit',
        createdAt: row[7]
      }));

      const newPayments: PaymentEntry[] = paymentsGrid.map((row, i) => ({
        id: payments[i]?.id || `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        voucherNo: row[1],
        date: row[2],
        partyName: row[3],
        paymentType: (row[4] as 'Cash' | 'Bank' | 'UPI' | 'Cheque') || 'Cash',
        transactionType: (row[5] as 'Pay' | 'Receive') || 'Pay',
        amount: parseFloat(row[6]) || 0,
        remarks: row[7],
        createdAt: row[8]
      }));

      const newJournals: JournalEntry[] = journalsGrid.map((row, i) => ({
        id: journals[i]?.id || `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        voucherNo: row[1],
        date: row[2],
        debitParty: row[3],
        creditParty: row[4],
        amount: parseFloat(row[5]) || 0,
        remarks: row[6],
        createdAt: row[7]
      }));

      await storage.saveParties(newParties);
      await storage.savePayments(newPayments);
      await storage.saveJournals(newJournals);
      setHasUnsavedChanges(false);
      onUpdate();
      toast.success('All spreadsheet data saved!');
    } catch {
      toast.error('Failed to save data.');
    }
  };

  // Add empty row
  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    let newRow: string[];

    if (activeSheet === 'Trial Balance' || activeSheet === 'P&L') {
      toast.error('Cannot add rows to report sheets');
      return;
    }

    switch (activeSheet) {
      case 'Parties':
        newRow = [(grid.length + 1).toString(), '', '', '', '', '0', 'Debit', today];
        break;
      case 'Payments':
        newRow = [(grid.length + 1).toString(), `VCH-${(paymentsGrid.length + 1).toString().padStart(5, '0')}`, today, '', 'Cash', 'Pay', '0', '', today];
        break;
      case 'Journals':
        newRow = [(grid.length + 1).toString(), `JV-${(journalsGrid.length + 1).toString().padStart(5, '0')}`, today, '', '', '0', '', today];
        break;
      default:
        return;
    }

    setGrid([...grid, newRow]);
    // Auto-scroll to bottom
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollTop = tableRef.current.scrollHeight;
      }
    }, 50);
  };

  // Delete selected row
  const handleDeleteRow = () => {
    if (!selectedCell) return;
    if (activeSheet === 'Trial Balance' || activeSheet === 'P&L') {
      toast.error('Cannot delete rows from report sheets');
      return;
    }
    if (!confirm('Delete this row?')) return;
    const realRowIndex = searchQuery
      ? grid.indexOf(filteredRows[selectedCell.row])
      : selectedCell.row;

    if (realRowIndex >= 0) {
      const newGrid = grid.filter((_, i) => i !== realRowIndex);
      setGrid(newGrid);
      setSelectedCell(null);
    }
  };

  // Export current sheet to Excel
  const handleExportExcel = () => {
    toast.promise(
      exportService.exportWorkbookToExcel({
        parties: partiesGrid,
        payments: paymentsGrid,
        journals: journalsGrid,
        trialBalance: trialGrid,
        pl: plGrid
      }),
      {
        loading: 'Creating full Excel workbook...',
        success: 'Full Excel workbook downloaded!',
        error: 'Export failed.',
      }
    );
  };

  // Data-only PDF
  const handleExportDataPDF = () => {
    toast.promise(
      new Promise((resolve) => {
        exportService.exportDataOnlyPDF();
        resolve(true);
      }),
      {
        loading: 'Generating data-only PDF...',
        success: 'PDF downloaded!',
        error: 'Export failed.',
      }
    );
  };

  const sheets: SheetTab[] = ['Parties', 'Payments', 'Journals', 'Trial Balance', 'P&L'];

  const sheetCounts: Record<SheetTab, number> = {
    Parties: partiesGrid.length,
    Payments: paymentsGrid.length,
    Journals: journalsGrid.length,
    'Trial Balance': trialGrid.length,
    'P&L': plGrid.length,
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-10rem)] animate-in fade-in slide-in-from-bottom-4 duration-500"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Toolbar — Excel-style ribbon */}
      <div className="bg-[#217346] rounded-t-2xl px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white">
            <Grid3X3 size={22} />
            <span className="font-black text-sm tracking-tight">Ledgix Workbook</span>
          </div>
          <div className="h-5 w-px bg-white/20"></div>

          {/* Action buttons */}
          <button
            onClick={handleSave}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              hasUnsavedChanges
                ? 'bg-white text-[#217346] shadow-md hover:scale-105'
                : 'bg-white/10 text-white/70 cursor-default'
            }`}
            disabled={!hasUnsavedChanges}
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>

          <button
            onClick={() => {
              if (activeSheet === 'Trial Balance' || activeSheet === 'P&L') {
                toast.error('Report sheets are read-only');
                return;
              }
              selectedCell && handleCellDoubleClick(selectedCell.row, selectedCell.col);
            }}
            disabled={!selectedCell || selectedCell.col === 0 || activeSheet === 'Trial Balance' || activeSheet === 'P&L'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedCell && selectedCell.col !== 0 && activeSheet !== 'Trial Balance' && activeSheet !== 'P&L' 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <Edit2 size={14} />
            <span>Edit Cell</span>
          </button>

          <button
            onClick={handleDeleteRow}
            disabled={!selectedCell}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedCell ? 'bg-white/10 text-white hover:bg-rose-500/80' : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <Trash2 size={14} />
            <span>Delete Row</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <FileSpreadsheet size={14} />
            <span>Export .xlsx</span>
          </button>
          <button
            onClick={handleExportDataPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <FileText size={14} />
            <span>Export PDF (Data)</span>
          </button>
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-white border-b border-slate-300 flex items-center px-2 py-1.5 space-x-2">
        <div className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-700 w-16 text-center select-none">
          {selectedCell ? getCellRef(selectedCell.row, selectedCell.col) : '—'}
        </div>
        <div className="text-xs text-slate-400 font-bold select-none">fx</div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1 text-sm font-mono text-slate-800 min-h-[24px] truncate">
          {selectedCell && filteredRows[selectedCell.row]
            ? filteredRows[selectedCell.row][selectedCell.col] || ''
            : ''}
        </div>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search cells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#217346]/30 transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto bg-white border-x border-slate-300 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <table className="w-full border-collapse text-left select-none" style={{ minWidth: columns.length * 140 }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Row number header */}
              <th className="sticky left-0 z-20 bg-[#f0f0f0] border-r border-b border-slate-300 px-1 py-1 text-center text-[10px] text-slate-500 font-bold w-10 min-w-[40px]">
                
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`bg-[#f0f0f0] border-r border-b border-slate-300 px-3 py-2 text-[11px] text-slate-700 font-black uppercase tracking-wide text-center min-w-[120px] cursor-pointer hover:bg-[#e2e2e2] transition-colors ${
                    selectedCell?.col === i ? 'bg-[#d6e4f0] text-[#217346]' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 font-mono mb-0.5">{colLetter(i)}</span>
                    <span>{col}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-20 text-slate-400 text-sm font-bold italic">
                  {searchQuery ? 'No matching rows found.' : 'No data yet. Click "Add Row" to start.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group">
                  {/* Row number */}
                  <td
                    className={`sticky left-0 z-10 bg-[#f0f0f0] border-r border-b border-slate-200 px-1 py-0 text-center text-[11px] font-bold text-slate-500 w-10 min-w-[40px] cursor-pointer select-none ${
                      selectedCell?.row === rowIndex ? 'bg-[#d6e4f0] text-[#217346]' : ''
                    }`}
                  >
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const isIdCol = colIndex === 0;
                    const isNumeric = !isNaN(Number(cell)) && cell !== '' && colIndex > 0;

                    return (
                      <td
                        key={colIndex}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                        className={`border-r border-b border-slate-200 px-2 py-0 text-[13px] min-w-[120px] h-[28px] transition-colors cursor-cell ${
                          isSelected
                            ? 'outline-2 outline-[#217346] bg-[#e8f5e9] z-10 relative'
                            : 'hover:bg-slate-50'
                        } ${isIdCol ? 'text-slate-400 font-mono text-[10px] bg-slate-50/50' : ''} ${
                          isNumeric ? 'text-right font-mono tabular-nums' : ''
                        }`}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            className="w-full h-full bg-white border-none outline-none text-[13px] font-medium px-0 py-0 -mx-0.5"
                            autoFocus
                          />
                        ) : (
                          <span className={`block truncate ${isIdCol ? '' : 'font-medium text-slate-800'}`}>
                            {cell}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
            {/* Extra empty rows to fill space (like a real spreadsheet) */}
            {Array.from({ length: Math.max(0, 20 - filteredRows.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="sticky left-0 z-10 bg-[#f0f0f0] border-r border-b border-slate-200 px-1 py-0 text-center text-[11px] font-bold text-slate-300 w-10 min-w-[40px]">
                  {filteredRows.length + i + 1}
                </td>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="border-r border-b border-slate-200 px-2 py-0 h-[28px] min-w-[120px]"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs — Bottom bar (Excel-style) */}
      <div className="bg-[#f0f0f0] border-t border-slate-300 rounded-b-2xl px-2 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-0">
          {/* Sheet navigation arrows */}
          <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors mr-1">
            <ChevronRight size={14} />
          </button>

          {/* Sheet tabs */}
          {sheets.map((sheet) => (
            <button
              key={sheet}
              onClick={() => {
                setActiveSheet(sheet);
                setSelectedCell(null);
                setEditingCell(null);
                setSearchQuery('');
              }}
              className={`px-4 py-1.5 text-xs font-black border transition-all rounded-t-lg relative ${
                activeSheet === sheet
                  ? 'bg-white text-[#217346] border-slate-300 border-b-white -mb-px z-10 shadow-sm'
                  : 'bg-[#e8e8e8] text-slate-600 border-transparent hover:bg-[#ddd] hover:text-slate-900'
              }`}
            >
              {sheet}
              <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded ${
                activeSheet === sheet ? 'bg-[#217346]/10 text-[#217346]' : 'bg-slate-300/50 text-slate-500'
              }`}>
                {sheetCounts[sheet]}
              </span>
            </button>
          ))}
        </div>

        {/* Status bar */}
        <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {selectedCell && (
            <>
              <span>Cell: {getCellRef(selectedCell.row, selectedCell.col)}</span>
              <span className="text-slate-300">|</span>
            </>
          )}
          <span>Rows: {filteredRows.length}</span>
          <span className="text-slate-300">|</span>
          <span>Cols: {columns.length}</span>
          {hasUnsavedChanges && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span>Unsaved Changes</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
