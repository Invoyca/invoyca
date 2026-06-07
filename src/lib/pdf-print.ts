// Tarayıcı-tabanlı PDF: şablon HTML'ini yeni pencerede açıp yazdırma diyaloğunu tetikler.
// Kullanıcı "PDF olarak kaydet" seçer. Chromium bağımlılığı yok, her tarayıcıda çalışır.

export function printInvoicePdf(innerHtml: string, filename: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 0; }
  html, body { width:210mm; background:#fff; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  .page { width:210mm; min-height:297mm; background:#fff; }
  .paper-inner { font-size:11px; line-height:1.45; color:#334155; }
  .lbl { font-size:9px; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; }
  table { border-collapse:collapse; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div class="page">${innerHtml}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Pop-up engellendi. PDF için pop-up'a izin ver."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
