/** Builds a CSV file from rows and triggers a browser download - opens directly in Excel. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  // Leading BOM so Excel opens the UTF-8 file correctly (₹, etc. don't turn into mojibake).
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
