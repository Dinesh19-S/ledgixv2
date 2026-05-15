import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { storage } from './storage';

// ─── A4 Constants (Portrait, mm) ────────────────────────────────────────────
const A4 = {
  WIDTH: 210,
  HEIGHT: 297,
  MARGIN: 15,          // uniform margin on all sides
  get CONTENT_WIDTH() { return this.WIDTH - this.MARGIN * 2; },   // 180mm
  get FOOTER_Y() { return this.HEIGHT - 10; },                    // 287mm
};

// Helper: create a properly configured A4 portrait document
function createA4Doc(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
}

// Helper: add page footer to all pages
function addFooter(doc: jsPDF, text: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    // Centered at the bottom, inside the margin
    doc.text(
      `Page ${i} of ${pageCount}  |  ${text}  |  ${new Date().toLocaleDateString()}`,
      A4.WIDTH / 2,
      A4.FOOTER_Y,
      { align: 'center' }
    );
  }
}

// Helper: get finalY from last auto table
function lastTableY(doc: jsPDF): number {
  return (doc as any).lastAutoTable?.finalY ?? A4.MARGIN;
}

// Shared table margin config
const TABLE_MARGIN = { left: A4.MARGIN, right: A4.MARGIN, top: A4.MARGIN, bottom: 18 };

export const exportService = {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. BRANDED STATEMENT PDF (A4 Portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  exportStatementPDF: async (partyName: string, fromDate: string, toDate: string, entries: any[], summary: any) => {
    try {
      const doc = createA4Doc();
      const settings = await storage.getSettings();

      // ── Branded Header Bar ──
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, A4.WIDTH, 38, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.businessName || 'Ledgix', A4.MARGIN, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.address || 'Business Address Not Set', A4.MARGIN, 24);
      doc.text(`GSTIN: ${settings.gstin || 'N/A'}  |  Generated: ${new Date().toLocaleString()}`, A4.MARGIN, 30);

      // ── Title ──
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`LEDGER STATEMENT: ${partyName.toUpperCase()}`, A4.MARGIN, 50);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Reporting Period: ${fromDate}  to  ${toDate}`, A4.MARGIN, 57);

      // ── Summary Table ── (4 cols × 45mm = 180mm)
      autoTable(doc, {
        startY: 64,
        head: [['Opening Balance', 'Total Debit', 'Total Credit', 'Closing Balance']],
        body: [[
          `₹${summary.party.openingBalance.toLocaleString()}`,
          `₹${summary.totalDebit.toLocaleString()}`,
          `₹${summary.totalCredit.toLocaleString()}`,
          `₹${Math.abs(summary.closingBalance).toLocaleString()} ${summary.closingBalance >= 0 ? 'DR' : 'CR'}`
        ]],
        theme: 'grid',
        tableWidth: A4.CONTENT_WIDTH,
        margin: TABLE_MARGIN,
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'center', fontSize: 9 },
        bodyStyles: { halign: 'center', fontSize: 11, fontStyle: 'bold', textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 },
        },
      });

      // ── Transaction Table ──
      const tableData = entries.map((entry: any) => [
        entry.date,
        entry.remarks || 'Transaction',
        entry.voucherNo,
        entry.paymentType,
        entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-',
        entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-',
        `₹${Math.abs(entry.balance).toLocaleString()} ${entry.balance >= 0 ? 'DR' : 'CR'}`
      ]);

      // 7 cols: 22+30+20+16+32+32+28 = 180mm
      autoTable(doc, {
        startY: lastTableY(doc) + 8,
        head: [['Date', 'Particulars', 'Voucher', 'Type', 'Debit (Dr)', 'Credit (Cr)', 'Balance']],
        body: tableData,
        theme: 'striped',
        tableWidth: A4.CONTENT_WIDTH,
        margin: TABLE_MARGIN,
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 22, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 32, halign: 'right' },
          6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
      });

      // ── Footer ──
      addFooter(doc, `Computer Generated Statement - ${settings.businessName || 'Ledgix'}`);

      doc.save(`Statement_${partyName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EXCEL BACKUP (Formatted like Tally)
  // ═══════════════════════════════════════════════════════════════════════════
  exportBackupExcel: async () => {
    try {
      const settings = await storage.getSettings();
      const parties = await storage.getParties();
      const payments = await storage.getPayments();
      const journals = await storage.getJournals();
      const businessName = settings.businessName || 'Ledgix';
      const today = new Date().toISOString().split('T')[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = businessName;
      wb.created = new Date();

      // ── Color constants ──
      const HEADER_BG = '4F46E5';   // Indigo
      const HEADER_FG = 'FFFFFF';
      const COL_HEAD_BG = '0E7C61'; // Teal green (like screenshot)
      const COL_HEAD_FG = 'FFFFFF';
      const TOTAL_BG = '0E7C61';
      const TOTAL_FG = 'FFFFFF';
      const BORDER_COLOR = '94A3B8';

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };

      // Helper: build a formatted sheet
      function buildSheet(
        ws: ExcelJS.Worksheet,
        title: string,
        columns: { header: string; key: string; width: number; isNumber?: boolean }[],
        rows: Record<string, any>[],
        totalKeys?: string[]
      ) {
        const colCount = columns.length;

        // Row 1: empty spacer
        ws.addRow([]);

        // Row 2: Business Name (merged, centered, indigo bg)
        const nameRow = ws.addRow([businessName]);
        ws.mergeCells(2, 1, 2, colCount);
        const nameCell = nameRow.getCell(1);
        nameCell.font = { bold: true, size: 16, color: { argb: HEADER_FG } };
        nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
        nameRow.height = 30;

        // Row 3: Report Title (merged, centered)
        const titleRow = ws.addRow([title]);
        ws.mergeCells(3, 1, 3, colCount);
        const titleCell = titleRow.getCell(1);
        titleCell.font = { bold: true, size: 12, color: { argb: '1E293B' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleRow.height = 22;

        // Row 4: Date range (merged, centered)
        const dateRow = ws.addRow([`Generated: ${today}`]);
        ws.mergeCells(4, 1, 4, colCount);
        const dateCell = dateRow.getCell(1);
        dateCell.font = { italic: true, size: 10, color: { argb: '64748B' } };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Row 5: Column Headers (teal bg, white text, bold)
        const headerValues = columns.map(c => c.header);
        const headerRow = ws.addRow(headerValues);
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, size: 10, color: { argb: COL_HEAD_FG } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEAD_BG } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = thinBorder;
        });

        // Set column widths
        columns.forEach((col, i) => {
          ws.getColumn(i + 1).width = col.width;
        });

        // Data rows (starting row 6)
        rows.forEach((item, index) => {
          const values = columns.map((col) => {
            if (col.key === '_sno') return index + 1;
            const val = item[col.key];
            if (col.isNumber && typeof val === 'number') return val;
            if (col.isNumber) return parseFloat(val) || 0;
            return val ?? '';
          });
          const dataRow = ws.addRow(values);
          dataRow.eachCell((cell, colNumber) => {
            cell.border = thinBorder;
            cell.font = { size: 10, color: { argb: '1E293B' } };
            cell.alignment = { vertical: 'middle' };
            if (columns[colNumber - 1]?.isNumber) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              cell.numFmt = '#,##0.00';
            }
          });
        });

        // TOTAL row
        if (totalKeys && totalKeys.length > 0) {
          const totalValues = columns.map((col) => {
            if (col.key === '_sno') return '';
            if (col.key === columns[0].key && columns[0].key !== '_sno') return 'TOTAL';
            if (columns[0].key === '_sno' && col === columns[1]) return 'TOTAL';
            if (totalKeys.includes(col.key)) {
              return rows.reduce((sum, item) => {
                const v = typeof item[col.key] === 'number' ? item[col.key] : parseFloat(item[col.key]) || 0;
                return sum + v;
              }, 0);
            }
            return '';
          });
          const totRow = ws.addRow(totalValues);
          totRow.height = 22;
          totRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, size: 10, color: { argb: TOTAL_FG } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
            cell.border = thinBorder;
            cell.alignment = { vertical: 'middle' };
            if (columns[colNumber - 1]?.isNumber) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              cell.numFmt = '#,##0.00';
            }
          });
        }
      }

      // ── Sheet 1: Parties ──
      const wsParties = wb.addWorksheet('Parties');
      buildSheet(wsParties, 'Party Directory', [
        { header: 'S.No', key: '_sno', width: 8 },
        { header: 'Name', key: 'name', width: 22 },
        { header: 'Mobile', key: 'mobile', width: 16 },
        { header: 'Address', key: 'address', width: 28 },
        { header: 'GST', key: 'gst', width: 20 },
        { header: 'Opening Balance', key: 'openingBalance', width: 18, isNumber: true },
        { header: 'Type', key: 'balanceType', width: 10 },
      ], parties, ['openingBalance']);

      // ── Sheet 2: Payments ──
      const wsPayments = wb.addWorksheet('Payments');
      buildSheet(wsPayments, 'Payment Entries', [
        { header: 'S.No', key: '_sno', width: 8 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Voucher No', key: 'voucherNo', width: 16 },
        { header: 'Party Name', key: 'partyName', width: 22 },
        { header: 'Mode', key: 'paymentType', width: 10 },
        { header: 'Type', key: 'transactionType', width: 10 },
        { header: 'Amount', key: 'amount', width: 16, isNumber: true },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ], payments, ['amount']);

      // ── Sheet 3: Journals ──
      const wsJournals = wb.addWorksheet('Journals');
      buildSheet(wsJournals, 'Journal Entries', [
        { header: 'S.No', key: '_sno', width: 8 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Voucher No', key: 'voucherNo', width: 16 },
        { header: 'Debit Party', key: 'debitParty', width: 22 },
        { header: 'Credit Party', key: 'creditParty', width: 22 },
        { header: 'Amount', key: 'amount', width: 16, isNumber: true },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ], journals, ['amount']);

      // ── Save file ──
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Ledgix_Backup_${today}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BACKUP SUMMARY PDF (A4 Portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  exportBackupPDF: async () => {
    try {
      const doc = createA4Doc();
      const settings = await storage.getSettings();
      const parties = await storage.getParties();
      const payments = await storage.getPayments();
      const journals = await storage.getJournals();

      // ── Header ──
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text(`${settings.businessName || 'Ledgix'} — Backup Summary`, A4.MARGIN, 20);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(`Archive created: ${new Date().toLocaleString()}`, A4.MARGIN, 27);

      // ── Divider ──
      doc.setDrawColor(220, 220, 220);
      doc.line(A4.MARGIN, 31, A4.WIDTH - A4.MARGIN, 31);

      // ── Parties Table ──
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Party Accounts', A4.MARGIN, 38);

      // 5 cols: 42+28+38+50+22 = 180mm
      autoTable(doc, {
        startY: 41,
        head: [['Name', 'Mobile', 'GST', 'Opening Balance', 'Type']],
        body: parties.map(p => [p.name, p.mobile, p.gst || 'N/A', `₹${p.openingBalance.toLocaleString()}`, p.balanceType]),
        theme: 'grid',
        tableWidth: A4.CONTENT_WIDTH,
        margin: TABLE_MARGIN,
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 38, halign: 'center' },
          3: { cellWidth: 50, halign: 'right' },
          4: { cellWidth: 22, halign: 'center' },
        },
      });

      // ── Payments Table ──
      const y1 = lastTableY(doc) + 10;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Entries', A4.MARGIN, y1);

      // 7 cols: 22+30+22+18+18+34+36 = 180mm
      autoTable(doc, {
        startY: y1 + 3,
        head: [['Date', 'Party', 'Voucher', 'Mode', 'Type', 'Amount', 'Remarks']],
        body: payments.map(p => [
          p.date, p.partyName, p.voucherNo, p.paymentType,
          p.transactionType, `₹${p.amount.toLocaleString()}`, p.remarks || '—'
        ]),
        theme: 'grid',
        tableWidth: A4.CONTENT_WIDTH,
        margin: TABLE_MARGIN,
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 22, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 34, halign: 'right' },
          6: { cellWidth: 36 },
        },
      });

      // ── Journals Table ──
      const y2 = lastTableY(doc) + 10;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Journal Entries', A4.MARGIN, y2);

      // 6 cols: 22+22+34+34+34+34 = 180mm
      autoTable(doc, {
        startY: y2 + 3,
        head: [['Date', 'Voucher', 'Debit Account', 'Credit Account', 'Amount', 'Remarks']],
        body: journals.map(j => [
          j.date, j.voucherNo, j.debitParty, j.creditParty,
          `₹${j.amount.toLocaleString()}`, j.remarks || '—'
        ]),
        theme: 'grid',
        tableWidth: A4.CONTENT_WIDTH,
        margin: TABLE_MARGIN,
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 22, halign: 'center' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 34 },
          3: { cellWidth: 34 },
          4: { cellWidth: 34, halign: 'right' },
          5: { cellWidth: 34 },
        },
      });

      // ── Footer ──
      addFooter(doc, `${settings.businessName || 'Ledgix'} — Full Backup`);

      doc.save(`Ledgix_Backup_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Backup Error:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. DATA-ONLY PDF (A4 Portrait) — Clean tables, no branding
  // ═══════════════════════════════════════════════════════════════════════════
  exportDataOnlyPDF: async () => {
    const doc = createA4Doc();
    const parties = await storage.getParties();
    const payments = await storage.getPayments();
    const journals = await storage.getJournals();

    // ── Section 1: Parties ──
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Parties Directory', A4.MARGIN, 18);

    // 6 cols: 30+25+35+30+40+20 = 180mm
    autoTable(doc, {
      startY: 22,
      head: [['Name', 'Mobile', 'Address', 'GST', 'Opening Bal.', 'Type']],
      body: parties.map(p => [
        p.name, p.mobile, p.address, p.gst || '—',
        `₹${p.openingBalance.toLocaleString()}`, p.balanceType
      ]),
      theme: 'grid',
      tableWidth: A4.CONTENT_WIDTH,
      margin: TABLE_MARGIN,
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 40, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' },
      },
    });

    // ── Section 2: Payments ──
    const y1 = lastTableY(doc) + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Entries', A4.MARGIN, y1);

    // 7 cols: 22+30+22+18+18+34+36 = 180mm
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Date', 'Party', 'Voucher', 'Mode', 'Type', 'Amount', 'Remarks']],
      body: payments.map(p => [
        p.date, p.partyName, p.voucherNo, p.paymentType,
        p.transactionType, `₹${p.amount.toLocaleString()}`, p.remarks || '—'
      ]),
      theme: 'grid',
      tableWidth: A4.CONTENT_WIDTH,
      margin: TABLE_MARGIN,
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 34, halign: 'right' },
        6: { cellWidth: 36 },
      },
    });

    // ── Section 3: Journals ──
    const y2 = lastTableY(doc) + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Journal Entries', A4.MARGIN, y2);

    // 6 cols: 22+22+34+34+34+34 = 180mm
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Date', 'Voucher', 'Debit Party', 'Credit Party', 'Amount', 'Remarks']],
      body: journals.map(j => [
        j.date, j.voucherNo, j.debitParty, j.creditParty,
        `₹${j.amount.toLocaleString()}`, j.remarks || '—'
      ]),
      theme: 'grid',
      tableWidth: A4.CONTENT_WIDTH,
      margin: TABLE_MARGIN,
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 34 },
        3: { cellWidth: 34 },
        4: { cellWidth: 34, halign: 'right' },
        5: { cellWidth: 34 },
      },
    });

    addFooter(doc, 'Ledgix — Data Export');

    doc.save(`Ledgix_Data_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. STATEMENT DATA-ONLY PDF (A4 Portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  exportStatementDataOnlyPDF: (partyName: string, fromDate: string, toDate: string, entries: any[], summary: any) => {
    const doc = createA4Doc();

    // ── Title ──
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ledger Statement: ${partyName}`, A4.MARGIN, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${fromDate}  to  ${toDate}`, A4.MARGIN, 25);

    // ── Summary Table ──
    // 4 cols × 45mm = 180mm
    autoTable(doc, {
      startY: 30,
      head: [['Opening Balance', 'Total Debit', 'Total Credit', 'Closing Balance']],
      body: [[
        `₹${summary.party.openingBalance.toLocaleString()}`,
        `₹${summary.totalDebit.toLocaleString()}`,
        `₹${summary.totalCredit.toLocaleString()}`,
        `₹${Math.abs(summary.closingBalance).toLocaleString()} ${summary.closingBalance >= 0 ? 'DR' : 'CR'}`
      ]],
      theme: 'grid',
      tableWidth: A4.CONTENT_WIDTH,
      margin: TABLE_MARGIN,
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', halign: 'center', fontSize: 9 },
      bodyStyles: { halign: 'center', fontSize: 10, fontStyle: 'bold', textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 45 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
      },
    });

    // ── Transaction Table ──
    const tableData = entries.map((entry: any) => [
      entry.date,
      entry.remarks || 'Transaction',
      entry.voucherNo,
      entry.paymentType,
      entry.debit > 0 ? entry.debit.toLocaleString() : '-',
      entry.credit > 0 ? entry.credit.toLocaleString() : '-',
      `${Math.abs(entry.balance).toLocaleString()} ${entry.balance >= 0 ? 'DR' : 'CR'}`
    ]);

    // 7 cols: 22+30+20+16+32+32+28 = 180mm
    autoTable(doc, {
      startY: lastTableY(doc) + 8,
      head: [['Date', 'Particulars', 'Voucher', 'Type', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'grid',
      tableWidth: A4.CONTENT_WIDTH,
      margin: TABLE_MARGIN,
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 32, halign: 'right' },
        6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
    });

    addFooter(doc, `Statement — ${partyName}`);

    doc.save(`Statement_Data_${partyName}_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FULL WORKBOOK EXCEL EXPORT
  // ═══════════════════════════════════════════════════════════════════════════
  exportWorkbookToExcel: async (data: { 
    parties: string[][], 
    payments: string[][], 
    journals: string[][], 
    trialBalance: string[][], 
    pl: string[][] 
  }) => {
    try {
      const settings = await storage.getSettings();
      const businessName = settings.businessName || 'Ledgix';
      const today = new Date().toISOString().split('T')[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = businessName;

      const addSheet = (name: string, headers: string[], rows: string[][]) => {
        const ws = wb.addWorksheet(name);
        
        // Style Header
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '217346' } };
          cell.alignment = { horizontal: 'center' };
        });

        // Add Data
        rows.forEach(row => ws.addRow(row));

        // Auto-width
        ws.columns.forEach(col => {
          col.width = 20;
        });
      };

      addSheet('Parties', ['ID', 'Name', 'Mobile', 'Address', 'GST', 'Opening Balance', 'Balance Type', 'Created At'], data.parties);
      addSheet('Payments', ['ID', 'Voucher No', 'Date', 'Party Name', 'Payment Type', 'Transaction Type', 'Amount', 'Remarks', 'Created At'], data.payments);
      addSheet('Journals', ['ID', 'Voucher No', 'Date', 'Debit Party', 'Credit Party', 'Amount', 'Remarks', 'Created At'], data.journals);
      addSheet('Trial Balance', ['Party Name', 'Opening Balance', 'Total Debit', 'Total Credit', 'Net Balance', 'Type'], data.trialBalance);
      addSheet('Profit & Loss', ['Account Description', 'Debit (Expense)', 'Credit (Income)', 'Net Result'], data.pl);

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Ledgix_Full_Workbook_${today}.xlsx`);
    } catch (error) {
      console.error('Workbook Export Error:', error);
      throw error;
    }
  }
};
