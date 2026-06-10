// Tarayıcı-tabanlı PDF: şablon HTML'ini yeni pencerede açıp yazdırma diyaloğunu tetikler.
// Kullanıcı "PDF olarak kaydet" seçer. Chromium bağımlılığı yok, her tarayıcıda çalışır.
//
// SAYFALAMA MANTIĞI (kalem sayısından bağımsız, tüm şablonlar için):
// - İçerik bir A4'e sığarsa → tek sayfa
// - Sığmazsa → tarayıcı otomatik 2., 3. sayfaya böler
// - Tablo satırları (kalemler) sayfa ortasında BÖLÜNMEZ (break-inside: avoid)
// - Tablo başlığı her yeni sayfada TEKRARLANIR (thead display:table-header-group)
// - Toplam/ödeme bloğu birlikte kalır, ortadan bölünmez
// - Footer (ödeme + QR) içeriğin sonunda akışta kalır

export function printInvoicePdf(innerHtml: string, filename: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }

  /* A4 sayfa tanımı + güvenli kenar boşluğu */
  @page { size: A4; margin: 14mm 0 14mm 0; }

  html, body { width:210mm; background:#fff; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }

  /* Sayfa kapsayıcısı — sabit yükseklik DAYATMAZ, içerik kadar uzar, tarayıcı böler */
  .page { width:210mm; background:#fff; }

  .paper-inner { font-size:11px; line-height:1.45; color:#334155; }
  .paper-inner p { margin:0; }
  .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.4px; font-weight:600; }
  table { border-collapse:collapse; width:100%; }

  /* ---- SAYFALAMA KURALLARI ---- */

  /* Kalem tablosu: başlık her sayfada tekrar etsin */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  /* Tablo satırı sayfa ortasında bölünmesin (ama tablo bütün olarak bölünebilir) */
  tr { break-inside: avoid; page-break-inside: avoid; }

  /* Toplam ve footer bloklarını koru: bunlar tablodan SONRA gelen son bloklar.
     Tabloyu kapsayan div'i KORUMUYORUZ (yoksa uzun tablo bölünemez).
     Sadece son 2 bloğu (toplam + ödeme/QR) bütün tutuyoruz. */
  .paper-inner > div:last-child { break-inside: avoid; page-break-inside: avoid; }
  .paper-inner > div:nth-last-child(2) { break-inside: avoid; page-break-inside: avoid; }

  /* Başlık/logo bloğu hemen sonrasında bölünmesin */
  .paper-inner > div:first-child { break-after: avoid; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    /* Yazdırırken renkler tam çıksın */
    .page { box-shadow:none; }
  }
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
