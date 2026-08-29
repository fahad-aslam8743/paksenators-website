import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/** One row in the exportable directory — normalized so both Senators and
 * MUN Members can share the exact same export code, regardless of their
 * underlying (slightly different) data shapes. */
export interface DirectoryRow {
  serial: number;
  name: string;
  fatherName: string;
  cnicNumber: string;
  committeeName: string;
  mobileNumber: string;
  address: string;
  province: string;
  district: string;
}

export type ExportFormat = 'pdf' | 'excel' | 'word';

interface ExportOptions {
  orgTitle: string; // "YOUTH SENATE OF PAKISTAN"
  subtitle: string; // e.g. "YOUTH SENATORS ATTENDANCE LIST" or "Punjab Province List"
  logoUrl: string;
  rows: DirectoryRow[];
  mode: 'attendance' | 'list';
  fileNamePrefix: string;
}

/** Attendance list has a blank Signature column instead of Committee/Province/District. */
function getColumns(mode: 'attendance' | 'list'): { header: string; key: keyof DirectoryRow | 'signature' }[] {
  if (mode === 'attendance') {
    return [
      { header: 'S.No', key: 'serial' },
      { header: 'Senator Name', key: 'name' },
      { header: 'Father Name', key: 'fatherName' },
      { header: 'CNIC', key: 'cnicNumber' },
      { header: 'Address', key: 'address' },
      { header: 'Phone Number', key: 'mobileNumber' },
      { header: 'Signature', key: 'signature' }
    ];
  }
  return [
    { header: 'S.No', key: 'serial' },
    { header: 'Name', key: 'name' },
    { header: 'Father Name', key: 'fatherName' },
    { header: 'CNIC', key: 'cnicNumber' },
    { header: 'Committee', key: 'committeeName' },
    { header: 'Mobile Number', key: 'mobileNumber' },
    { header: 'Address', key: 'address' },
    { header: 'Province', key: 'province' }
  ];
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function exportPdf(opts: ExportOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const columns = getColumns(opts.mode);

  const logoDataUrl = await loadImageAsDataUrl(opts.logoUrl);
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', pageWidth - 130, 20, 96, 96); } catch { /* ignore bad image formats */ }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(13, 59, 43); // deep green
  doc.text(opts.orgTitle, 40, 55);

  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(opts.subtitle, 40, 80);

  // Pad with blank rows so the table visually fills the page like a real
  // printed register — a short filtered list (e.g. one committee with 4-5
  // members) shouldn't leave the bottom half of the page empty. Attendance
  // sheets in particular benefit from this: extra blank rows double as
  // space to write in names by hand if needed. Row count is a rough
  // estimate of how many rows a landscape A4 page comfortably fits below
  // the header.
  const MIN_ROWS_TO_FILL_PAGE = 22;
  const blankRow = columns.map(() => '');
  const bodyRows = opts.rows.map(row => columns.map(c => (c.key === 'signature' ? '' : String((row as any)[c.key] ?? ''))));
  while (bodyRows.length < MIN_ROWS_TO_FILL_PAGE) bodyRows.push([...blankRow]);

  autoTable(doc, {
    startY: 110,
    head: [columns.map(c => c.header)],
    body: bodyRows,
    theme: 'grid', // draws a full grid: a line between every column and every row
    styles: {
      fontSize: 9,
      cellPadding: 6,
      minCellHeight: 22,
      lineColor: [0, 0, 0],
      lineWidth: 0.75
    },
    headStyles: {
      fillColor: [13, 59, 43],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.75
    },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: opts.mode === 'attendance' ? { 6: { cellWidth: 90 } } : undefined
  });

  doc.save(`${opts.fileNamePrefix}.pdf`);
}

async function exportExcel(opts: ExportOptions) {
  // Note: the older 'xlsx' (SheetJS community) package cannot write cell
  // borders at all — that's a Pro-only feature of that library. ExcelJS is
  // used here instead specifically so the grid lines below actually appear
  // in the downloaded file.
  const columns = getColumns(opts.mode);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Directory');

  sheet.columns = columns.map(() => ({ width: 22 }));

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } }
  };

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = opts.orgTitle;
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FF0D3B2B' } };

  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = opts.subtitle;
  sheet.getCell(2, 1).font = { bold: true, size: 12 };

  const headerRowIndex = 4;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3B2B' } };
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  opts.rows.forEach((row, rowIdx) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIdx);
    columns.forEach((c, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = c.key === 'signature' ? '' : ((row as any)[c.key] ?? '');
      cell.border = thinBorder; // vertical + horizontal line around every cell
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${opts.fileNamePrefix}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportWord(opts: ExportOptions) {
  // A real .docx requires a dedicated library; this widely-used technique
  // (an HTML table wrapped in Word-compatible XML namespaces, saved with a
  // .doc extension) opens correctly and editably in Microsoft Word, Google
  // Docs, and LibreOffice without adding a heavier dependency.
  const columns = getColumns(opts.mode);
  const theadHtml = columns.map(c => `<th style="background:#0d3b2b;color:#fff;padding:6px;border:1px solid #333;">${c.header}</th>`).join('');
  const rowsHtml = opts.rows.map(row => `<tr>${columns.map(c => `<td style="padding:6px;border:1px solid #333;">${c.key === 'signature' ? '' : String((row as any)[c.key] ?? '')}</td>`).join('')}</tr>`).join('');
  const logoDataUrl = await loadImageAsDataUrl(opts.logoUrl);
  const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" style="width:90px;height:90px;float:right;" />` : '';

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${opts.fileNamePrefix}</title></head>
    <body style="font-family: Calibri, sans-serif;">
      <div style="overflow:auto;">
        ${logoHtml}
        <h1 style="color:#0d3b2b; margin-bottom:2px;">${opts.orgTitle}</h1>
        <h3 style="margin-top:0;">${opts.subtitle}</h3>
      </div>
      <table style="border-collapse:collapse; width:100%; clear:both;">
        <thead><tr>${theadHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${opts.fileNamePrefix}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function exportDirectory(format: ExportFormat, opts: ExportOptions) {
  if (format === 'pdf') return exportPdf(opts);
  if (format === 'excel') return await exportExcel(opts);
  return exportWord(opts);
}
