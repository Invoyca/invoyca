// Fatura şablon render motoru — galeri dosyalarından BİREBİR çıkarılmıştır.
// 25 varyant × tema × dil × QR modu × vergi modu. HTML string üretir.
// React'te dangerouslySetInnerHTML ile gösterilir (galeri ile aynı çıktı).

import { SAMPLE, TPL_LABELS, THEMES } from "./data";
import { esc, escDeep } from "./escape";

export type InvoiceData = {
  sender: { name: string; addr: string[]; tax: string; vat: string; email: string };
  client: { name: string; addr: string[]; vat: string; email: string };
  meta: { no: string; issue: string; due: string; ref: string };
  bank: { name: string; iban: string; swift: string };
  items: [string, string, number, string, string][];
  subtotal: string; vat: string; total: string; totalReverse: string;
};

export type RenderOpts = {
  variant: string;
  theme: string;
  lang: string;
  docType: string;
  qrMode: string;
  qrImage?: string; // kullanıcının yüklediği QR resmi (base64 data URL)
  logoUrl?: string; // kullanıcının yüklediği logo (base64 data URL)
  taxMode: string;
  data?: InvoiceData; // verilmezse SAMPLE kullanılır (önizleme için)
};

export function renderInvoiceHTML(opts: RenderOpts): string {
  const curVar = opts.variant;
  const qrMode = opts.qrMode;
  const qrImage = opts.qrImage || "";
  const logoUrl = opts.logoUrl || "";
  const taxMode = opts.taxMode;

  // Gerçek veri verilmişse onu, yoksa örnek veriyi kullan
  const RAW = opts.data || SAMPLE;

  const D = escDeep(RAW);
  const SENDER = D.sender;
  const CLIENT = D.client;
  const META = D.meta;
  const IBAN = D.bank.iban;
  const SWIFT = D.bank.swift;
  const BANKNAME = D.bank.name;

  const themeObj = THEMES.find((t) => t.id === opts.theme) || THEMES[0];
  const curTheme = { color: themeObj.color, light: themeObj.light };

  // Çeviri sözlüğü — galeri "d" objesi. Ek olarak dt ve items alanları.
  const base = (TPL_LABELS as Record<string, Record<string, string>>)[opts.lang] || TPL_LABELS.EN;
  const d: any = {
    ...base,
    dt: { invoice: base.invoice, proforma: base.proforma, commercial: base.commercial, quote: base.quote },
    notes_lbl: base.notes,
    reverse_short: base.reverse,
    exempt_short: base.exempt,
    items: D.items,
    subtotal: base.subtotal, vat: base.vat, total: base.total, discount: "İndirim",
    _subtotalVal: D.subtotal, _vatVal: (D as any).vatAmount || (D as any).vat || "0", _totalVal: D.total, _totalNoVat: D.totalReverse,
    gibno: "GİB No", ettn: "ETTN",
  };
  // Kullanıcı kendi notunu/şartını/alt başlığını girdiyse varsayılanın yerine koy
  if ((D as any).userNotes) d.notes_val = (D as any).userNotes;
  if ((D as any).userTerms) d.terms_val = (D as any).userTerms;
  d.subtitle = (D as any).subtitle || "";

  // ---- Galeri yardımcı fonksiyonları (birebir) ----
function logo(c:string,size:number){
  // Kullanıcı kendi logosunu yüklediyse onu göster
  if(logoUrl){
    return `<img src="${logoUrl}" style="display:block;max-width:${size*2.4}px;max-height:${size}px;object-fit:contain" alt="logo" />`;
  }
  const r=size*0.18; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none"><rect x="1" y="1" width="${size-2}" height="${size-2}" rx="${r}" fill="${c}1a" stroke="${c}55" stroke-width="1.2" stroke-dasharray="4 3"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size*0.2}" font-family="sans-serif" font-weight="600" fill="${c}" letter-spacing="1">LOGO</text></svg>`; }


  function qr(c:string, size:number){
    // Kullanıcı kendi QR resmini yüklediyse onu göster
    if(qrImage){
      return `<img src="${qrImage}" width="${size}" height="${size}" style="display:block;object-fit:contain" alt="QR" />`;
    }
    // Yüklenmemişse: ince kenarlıklı boş alan + "QR" ipucu (sahte QR deseni YOK)
    return `<div style="width:${size}px;height:${size}px;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:${size*0.18}px;font-weight:600;letter-spacing:1px">QR</div>`;
  }
function manyItems(d:any){
    const base=d.items;
    const extra=[
      [d.items[0][0],base[0][1],4,base[0][3],"€8.000,00"],
      [d.items[1][0],base[1][1],6,base[1][3],"€900,00"],
      [d.items[2][0],base[2][1],2,base[2][3],"€1.000,00"],
      [d.items[0][0],base[0][1],1,base[0][3],"€2.000,00"],
      [d.items[1][0],base[1][1],12,base[1][3],"€1.800,00"],
      [d.items[2][0],base[2][1],3,base[2][3],"€1.500,00"],
    ];
    return base.concat(extra);
  }
function itemsTable(d:any,c:string,opts?:any){
    const showUnit = opts.unit!==false;
    const data = opts.many ? manyItems(d) : d.items;
    const head = `<tr style="${opts.headStyle}">
      <th style="text-align:left;padding:${opts.hpad}">${d.desc}</th>
      ${showUnit?`<th style="text-align:center;padding:${opts.hpad};width:54px">${d.unit}</th>`:``}
      <th style="text-align:center;padding:${opts.hpad};width:42px">${d.qty}</th>
      <th style="text-align:right;padding:${opts.hpad};width:84px">${d.price}</th>
      <th style="text-align:right;padding:${opts.hpad};width:88px">${d.amount}</th></tr>`;
    const rows = data.map((it:any,i:number)=>`<tr style="${opts.rowStyle}${opts.zebra&&i%2===1?`;background:${opts.zebraColor||'#f8fafc'}`:''}">
      <td style="padding:${opts.rpad};color:#334155">${it[0]}</td>
      ${showUnit?`<td style="padding:${opts.rpad};text-align:center;color:#94a3b8">${it[1]}</td>`:``}
      <td style="padding:${opts.rpad};text-align:center;color:#64748b">${it[2]}</td>
      <td style="padding:${opts.rpad};text-align:right;color:#64748b">${it[3]}</td>
      <td style="padding:${opts.rpad};text-align:right;color:#0f172a;font-weight:500">${it[4]}</td></tr>`).join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:10.5px"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }
function totals(d:any,c:string){
    let vatRow, totalVal, note="";
    if(taxMode==="reverse"){
      vatRow=`<div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.reverse_short}</span><span>€0,00</span></div>`;
      totalVal=d._totalNoVat;
      note=`<div style="margin-top:8px;padding:7px 10px;background:${c}12;border-left:3px solid ${c};border-radius:0 4px 4px 0"><p style="font-size:8.5px;color:#475569;line-height:1.45">${d.rc_note}</p></div>`;
    } else if(taxMode==="exempt"){
      vatRow=`<div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.exempt_short}</span><span>€0,00</span></div>`;
      totalVal=d._totalNoVat;
      note=`<div style="margin-top:8px;padding:7px 10px;background:${c}12;border-left:3px solid ${c};border-radius:0 4px 4px 0"><p style="font-size:8.5px;color:#475569;line-height:1.45">${d.ex_note}</p></div>`;
    } else {
      vatRow=`<div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.vat}</span><span>${d._vatVal}</span></div>`;
      totalVal=d._totalVal;
    }
    return `<div style="width:250px;font-size:11px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.discount}</span><span>– €0,00</span></div>
      ${vatRow}
      <div style="display:flex;justify-content:space-between;padding:9px 0;margin-top:4px;border-top:2px solid ${c};font-weight:700;color:${c};font-size:14px"><span>${d.total}</span><span>${totalVal}</span></div>
      ${note}
    </div>`;
  }
  // Tax Focused için: çok kolonlu vergi tablosu (indirim, matrah, KDV oranı, KDV tutarı, satır toplamı)
  function taxItemsTable(d:any,c:string){
    const rows = d.items.map((it:any,i:number)=>{
      // örnek: matrah = tutar, KDV %20
      const lineNet = it[4];
      return `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:7px 6px;color:#334155">${it[0]}</td>
        <td style="padding:7px 4px;text-align:center;color:#94a3b8">${it[2]}</td>
        <td style="padding:7px 4px;text-align:center;color:#94a3b8">${it[1]}</td>
        <td style="padding:7px 4px;text-align:right;color:#64748b">${it[3]}</td>
        <td style="padding:7px 4px;text-align:right;color:#94a3b8">€0,00</td>
        <td style="padding:7px 4px;text-align:right;color:#64748b">${lineNet}</td>
        <td style="padding:7px 4px;text-align:center;color:#64748b">%20</td>
        <td style="padding:7px 4px;text-align:right;color:#64748b">${d._vatVal!=="0"?"—":"€0,00"}</td>
        <td style="padding:7px 6px;text-align:right;color:#0f172a;font-weight:500">${lineNet}</td>
      </tr>`;
    }).join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:9px">
      <thead><tr style="background:${c};color:#fff;font-size:7.5px;text-transform:uppercase;letter-spacing:.2px">
        <th style="text-align:left;padding:7px 6px">${d.desc}</th>
        <th style="text-align:center;padding:7px 4px">${d.qty}</th>
        <th style="text-align:center;padding:7px 4px">${d.unit}</th>
        <th style="text-align:right;padding:7px 4px">${d.price}</th>
        <th style="text-align:right;padding:7px 4px">${d.discount}</th>
        <th style="text-align:right;padding:7px 4px">Matrah</th>
        <th style="text-align:center;padding:7px 4px">KDV%</th>
        <th style="text-align:right;padding:7px 4px">KDV</th>
        <th style="text-align:right;padding:7px 6px">${d.amount}</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }
  // Tax Focused için: detaylı vergi özeti (KDV oranına göre döküm + tevkifat satırı)
  function taxSummary(d:any,c:string){
    return `<div style="width:280px;font-size:10.5px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.discount}</span><span>– €0,00</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b;border-top:1px dashed #e2e8f0"><span>Matrah (KDV hariç)</span><span>${d._subtotalVal}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>KDV %20</span><span>${d._vatVal}</span></div>
      <div style="display:flex;justify-content:space-between;padding:9px 0;margin-top:4px;border-top:2px solid ${c};font-weight:700;color:${c};font-size:14px"><span>${d.total}</span><span>${d._totalVal}</span></div>
    </div>`;
  }
  // Service Invoice için: saatlik/hizmet tablosu (açıklama, dönem, saat, ücret, toplam)
  function serviceItemsTable(d:any,c:string){
    const periods = ["01–15 "+(d.issue==="Tarih"?"Haz":"Jun"), "01–30 "+(d.issue==="Tarih"?"Haz":"Jun"), "10–20 "+(d.issue==="Tarih"?"Haz":"Jun")];
    const rows = d.items.map((it:any,i:number)=>`<tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:9px 6px;color:#334155">${it[0]}</td>
      <td style="padding:9px 6px;text-align:center;color:#94a3b8;font-size:9px">${periods[i%periods.length]}</td>
      <td style="padding:9px 6px;text-align:center;color:#64748b">${it[2]*8}h</td>
      <td style="padding:9px 6px;text-align:right;color:#64748b">${it[3]}</td>
      <td style="padding:9px 6px;text-align:right;color:#0f172a;font-weight:500">${it[4]}</td>
    </tr>`).join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:10.5px">
      <thead><tr style="border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8">
        <th style="text-align:left;padding:8px 6px">${d.desc}</th>
        <th style="text-align:center;padding:8px 6px;width:90px">${d.issue==="Tarih"?"Dönem":"Period"}</th>
        <th style="text-align:center;padding:8px 6px;width:50px">${d.issue==="Tarih"?"Saat":"Hours"}</th>
        <th style="text-align:right;padding:8px 6px;width:84px">${d.issue==="Tarih"?"Ücret":"Rate"}</th>
        <th style="text-align:right;padding:8px 6px;width:88px">${d.amount}</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }
  // Inventory için: SKU/ürün kodlu kompakt tablo
  function skuItemsTable(d:any,c:string){
    const skus = ["SKU-1042","SKU-2071","SKU-3318","SKU-4405","SKU-5560","SKU-6612"];
    const data = d.items.length>3 ? d.items : d.items;
    const rows = data.map((it:any,i:number)=>`<tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:5px 8px;color:#94a3b8;font-family:monospace;font-size:9px">${skus[i%skus.length]}</td>
      <td style="padding:5px 8px;color:#334155">${it[0]}</td>
      <td style="padding:5px 6px;text-align:center;color:#94a3b8">${it[1]}</td>
      <td style="padding:5px 6px;text-align:center;color:#64748b">${it[2]}</td>
      <td style="padding:5px 6px;text-align:right;color:#64748b">${it[3]}</td>
      <td style="padding:5px 6px;text-align:right;color:#94a3b8">€0,00</td>
      <td style="padding:5px 8px;text-align:right;color:#0f172a;font-weight:500">${it[4]}</td>
    </tr>`).join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:9.5px">
      <thead><tr style="background:${c};color:#fff;font-size:8px;text-transform:uppercase;letter-spacing:.3px">
        <th style="text-align:left;padding:6px 8px;width:70px">${d.issue==="Tarih"?"Stok Kodu":"SKU"}</th>
        <th style="text-align:left;padding:6px 8px">${d.desc}</th>
        <th style="text-align:center;padding:6px 6px;width:44px">${d.unit}</th>
        <th style="text-align:center;padding:6px 6px;width:38px">${d.qty}</th>
        <th style="text-align:right;padding:6px 6px;width:74px">${d.price}</th>
        <th style="text-align:right;padding:6px 6px;width:60px">${d.discount}</th>
        <th style="text-align:right;padding:6px 8px;width:82px">${d.amount}</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }
function notesblock(d:any,c:string,style?:string){
    return `<div style="${style||''}"><p class="lbl" style="color:${c};font-weight:600;margin-bottom:4px">${d.notes_lbl}</p>
      <p style="font-size:10px;color:#64748b;line-height:1.55">${d.notes_val}</p></div>`;
  }
function qrblock(d:any,c:string,size?:number){
    if(qrMode==="off") return "";
    if(!qrImage) return ""; // QR yüklenmemişse hiç gösterme (sahte QR yok)
    const s = size||56;
    const label = qrMode==="verify" ? d.scan_verify : d.scan;
    return `<div style="display:flex;align-items:center;gap:10px">
      <div style="padding:5px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0">${qr(c,s)}</div>
      <div><p class="lbl" style="color:${c};font-weight:600;margin-bottom:2px">${label}</p></div>
    </div>`;
  }
function payblock(d:any,c:string,style?:string){
    return `<div style="${style||''}"><p class="lbl" style="color:${c};font-weight:600;margin-bottom:4px">${d.payinfo}</p>
      <p style="font-size:10px;color:#475569;line-height:1.6">${d.bank}: ${BANKNAME}<br>IBAN: ${IBAN}<br>SWIFT/BIC: ${SWIFT}</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:6px"><b style="color:#64748b">${d.terms}:</b> ${d.terms_val}</p></div>`;
  }
function partyBlock(d:any,label:string,party:any,extra:string){
    return `<div><p class="lbl" style="margin-bottom:4px">${label}</p>
      <p style="font-weight:600;color:#0f172a;font-size:12px">${party.name}</p>
      <p style="font-size:10px;color:#94a3b8;line-height:1.55">${party.addr.join("<br>")}</p>
      ${extra}</div>`;
  }

  // ---- renderPaper head ----
  const c = curTheme.color, lt = curTheme.light;
  const _dtBase = d.dt[opts.docType];
  // Alt başlık varsa belge başlığının altına küçük punto ekle (tüm 25 varyantta çalışır)
  const dt = d.subtitle
    ? `${_dtBase}<span style="display:block;font-size:11px;font-weight:500;color:#94a3b8;letter-spacing:0;margin-top:3px;line-height:1.3">${esc(d.subtitle)}</span>`
    : _dtBase;
  const senderTax = `<p style="font-size:10px;color:#94a3b8;margin-top:3px">${d.vkn}: ${SENDER.tax}${SENDER.vat?` \u00b7 ${d.vatid}: ${SENDER.vat}`:''}</p>`;
  const clientTax = `<p style="font-size:10px;color:#94a3b8;margin-top:3px">${d.vatid}: ${CLIENT.vat}</p>`;
  const metaRows = `<p>${d.invno}: <b style="color:#475569">${META.no}</b></p><p style="margin-top:2px">${d.issue}: <span style="color:#475569">${META.issue}</span></p><p style="margin-top:2px">${d.due}: <span style="color:#475569">${META.due}</span></p>`;

  // ---- TÜM ŞABLONLAR İÇİN ORTAK TİPOGRAFİ ----
  // .lbl (Ödeme, Doğrulamak için tarayın, Not, Şartlar başlıkları) önceden tanımsızdı,
  // tarayıcı varsayılanı (16px) alıp orantısız büyüyordu. Tek noktadan düzeltiyoruz.
  const baseStyle = `<style>
    .paper-inner{font-size:11px;line-height:1.5;color:#334155;padding-bottom:38px}
    .paper-inner p{margin:0}
    .paper-inner .lbl{font-size:10.5px;font-weight:600;letter-spacing:.2px;text-transform:uppercase}
  </style>`;

  let html="";


if(curVar==="standard"){
      html=`<div class="paper-inner" style="padding:42px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
          <div style="max-width:55%">${logo(c,40)}
            <p style="font-weight:700;margin-top:9px;color:#0f172a;font-size:13px">${SENDER.name}</p>
            <p style="font-size:10px;color:#94a3b8;line-height:1.55;margin-top:2px">${SENDER.addr.join("<br>")}</p>${senderTax}
          </div>
          <div style="text-align:right">
            <p style="font-size:26px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1.1">${dt}</p>
            <table style="margin-top:10px;font-size:10px;color:#94a3b8;margin-left:auto">
              <tr><td style="text-align:right;padding:1.5px 8px 1.5px 0">${d.invno}:</td><td style="text-align:right;color:#0f172a;font-weight:600">${META.no}</td></tr>
              <tr><td style="text-align:right;padding:1.5px 8px 1.5px 0">${d.issue}:</td><td style="text-align:right;color:#475569">${META.issue}</td></tr>
              <tr><td style="text-align:right;padding:1.5px 8px 1.5px 0">${d.due}:</td><td style="text-align:right;color:#475569">${META.due}</td></tr>
            </table>
          </div>
        </div>
        <div style="display:flex;gap:30px;margin-bottom:24px;padding-bottom:22px;border-bottom:1px solid #eef2f7">
          <div style="flex:1">${partyBlock(d,d.from,SENDER,`<p style="font-size:9px;color:#cbd5e1;margin-top:2px">${SENDER.email}</p>`)}</div>
          <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        </div>
        ${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div>
        <div style="margin-top:28px;padding-top:18px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:14px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,60)}
        </div>
        <p style="margin-top:20px;font-size:10px;color:#cbd5e1;text-align:center">${d.thanks}</p>
      </div>`;
    }

    else if(curVar==="bordered"){
      html=`<div class="paper-inner" style="padding:30px">
        <div style="border:1.5px solid ${c}44;border-radius:6px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1.5px solid ${c}44;background:${lt}">
            <div style="display:flex;align-items:center;gap:10px">${logo(c,34)}<div><p style="font-weight:600;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${d.vkn}: ${SENDER.tax} · ${d.vatid}: ${SENDER.vat}</p></div></div>
            <p style="font-size:22px;font-weight:700;color:${c}">${dt}</p>
          </div>
          <div style="display:flex;border-bottom:1.5px solid ${c}22">
            <div style="flex:1;padding:16px 24px;border-right:1.5px solid ${c}22">${partyBlock(d,d.from,SENDER,'')}</div>
            <div style="flex:1;padding:16px 24px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 24px;font-size:10px;color:#94a3b8;border-bottom:1.5px solid ${c}22;background:#fafbfc"><span>${d.invno}: <b style="color:#475569">${META.no}</b></span><span>${d.issue}: ${META.issue}</span><span>${d.due}: ${META.due}</span></div>
          <div style="padding:6px 24px;flex:1">${itemsTable(d,c,{headStyle:`background:${c};color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:.4px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 8px',rpad:'8px 8px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:14px">${totals(d,c)}</div></div>
          <div style="padding:14px 24px;border-top:1.5px solid ${c}44;background:${lt};display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:10px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,54)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="centered"){
      html=`<div class="paper-inner" style="padding:40px 44px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${c};padding-bottom:16px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,36)}<div><p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.email}</p></div></div>
          <div style="text-align:right"><p style="font-size:22px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1.1">${dt}</p><p style="font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no}</p></div>
        </div>
        <div style="display:flex;gap:24px;margin-bottom:18px">
          <div style="flex:1">
            <p class="lbl" style="color:${c};margin-bottom:4px">${d.from}</p>
            <p style="font-weight:600;color:#0f172a;font-size:11px">${SENDER.name}</p>
            <p style="font-size:9.5px;color:#94a3b8;line-height:1.55">${SENDER.addr.join("<br>")}</p>
            <p style="font-size:9.5px;color:#475569;margin-top:3px"><b>${d.vatid}:</b> ${SENDER.vat}</p>
          </div>
          <div style="flex:1">
            <p class="lbl" style="color:${c};margin-bottom:4px">${d.billto}</p>
            <p style="font-weight:600;color:#0f172a;font-size:11px">${CLIENT.name}</p>
            <p style="font-size:9.5px;color:#94a3b8;line-height:1.55">${CLIENT.addr.join("<br>")}</p>
            <p style="font-size:9.5px;color:#475569;margin-top:3px"><b>${d.vatid}:</b> ${CLIENT.vat}</p>
          </div>
          <div style="width:150px;font-size:9px;color:#94a3b8">
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.issue}</span><span style="color:#475569">${META.issue}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.due}</span><span style="color:#475569">${META.due}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.ref}</span><span style="color:#475569">${META.ref}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;border-top:1px solid #eef2f7;margin-top:3px"><span>${d.payinfo}</span><span style="color:#475569">${SWIFT}</span></div>
          </div>
        </div>
        ${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:16px">${totals(d,c)}</div>
        <div style="margin-top:8px;padding:10px 14px;background:${lt};border-radius:6px">
          <p style="font-size:9px;color:#475569;line-height:1.5"><b style="color:${c}">${d.reverse_short}:</b> ${d.rc_note}</p>
        </div>
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">
            <p class="lbl" style="color:${c};margin-bottom:4px">${d.payinfo}</p>
            <p style="font-size:10px;color:#475569;line-height:1.7">${d.bank}: ${BANKNAME}<br>IBAN: ${IBAN}<br>SWIFT/BIC: ${SWIFT}</p>
          </div>
          ${qrblock(d,c,52)}
        </div>
      </div>`;
    }

    else if(curVar==="letterhead"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column">
        <div style="height:6px;background:${c}"></div>
        <div style="padding:32px 42px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid #eef2f7;margin-bottom:22px">
            <div style="display:flex;align-items:center;gap:10px">${logo(c,38)}<div><p style="font-weight:700;color:#0f172a;font-size:14px;letter-spacing:.3px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8">${SENDER.addr.join(", ")}</p><p style="font-size:9px;color:#cbd5e1">${d.vkn}: ${SENDER.tax}${SENDER.vat?` · ${d.vatid}: ${SENDER.vat}`:''} · ${SENDER.email}</p></div></div>
            <div style="text-align:right"><p style="font-size:20px;font-weight:700;color:${c}">${dt}</p></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:20px">
            ${partyBlock(d,d.billto,CLIENT,clientTax)}
            <div style="text-align:right;font-size:10px;color:#94a3b8">${metaRows}</div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:${c}`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 6px',rpad:'9px 6px'})}
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px;gap:20px">
              <div style="flex:1;padding-top:4px">${notesblock(d,c)}</div>
              ${totals(d,c)}
            </div></div>
        </div>
        <div style="background:${c};color:#fff;padding:16px 42px;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;gap:16px">
          <div><b>${d.payinfo}</b><br>${BANKNAME} · ${IBAN}<br>SWIFT: ${SWIFT}</div>
          <div style="text-align:right;opacity:.85"><b>${d.terms}</b><br>${d.terms_val}</div>
          ${(qrMode!=="off"&&qrImage)?`<div style="background:#fff;padding:4px;border-radius:6px;flex-shrink:0">${qr(c,50)}</div>`:''}
        </div>
      </div>`;
    }

    else if(curVar==="detailed"){
      html=`<div class="paper-inner" style="padding:34px 38px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
          <div>${logo(c,36)}<p style="font-weight:700;margin-top:7px;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p><p style="font-size:9px;color:#cbd5e1;margin-top:2px">${d.vkn}: ${SENDER.tax} · ${d.vatid}: ${SENDER.vat}</p></div>
          <div style="text-align:right"><p style="font-size:20px;font-weight:800;color:${c};line-height:1.1">${dt}</p>
            <table style="margin-top:8px;font-size:9px;color:#94a3b8;margin-left:auto">
              <tr><td style="text-align:right;padding:1px 8px 1px 0">${d.invno}:</td><td style="text-align:right;color:#475569;font-weight:600">${META.no}</td></tr>
              <tr><td style="text-align:right;padding:1px 8px 1px 0">${d.issue}:</td><td style="text-align:right;color:#475569">${META.issue}</td></tr>
              <tr><td style="text-align:right;padding:1px 8px 1px 0">${d.due}:</td><td style="text-align:right;color:#475569">${META.due}</td></tr>
              <tr><td style="text-align:right;padding:1px 8px 1px 0">${d.ref}:</td><td style="text-align:right;color:#475569">${META.ref}</td></tr>
            </table>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <div style="flex:1;padding:11px 14px;background:${lt};border-radius:6px">${partyBlock(d,d.from,SENDER,`<p style="font-size:9px;color:#cbd5e1;margin-top:2px">${d.vatid}: ${SENDER.vat}</p>`)}</div>
          <div style="flex:1;padding:11px 14px;background:${lt};border-radius:6px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        </div>
        ${taxItemsTable(d,c)}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px;gap:20px">
          <div style="flex:1;padding-top:4px"><p class="lbl" style="margin-bottom:3px;color:${c}">${d.terms}</p><p style="font-size:9px;color:#94a3b8;line-height:1.5">${d.terms_val}</p></div>
          ${taxSummary(d,c)}
        </div>
        <div style="margin-top:20px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}</div>
          ${qrblock(d,c,56)}
        </div>
      </div>`;
    }
if(curVar==="band"){
      html=`<div class="paper-inner" style="padding:38px 42px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px">
          <div style="display:flex;align-items:center;gap:11px">${logo(c,36)}<div><p style="font-weight:700;font-size:14px;color:#0f172a">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
          <div style="text-align:right"><p style="font-size:24px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1.1">${dt}</p><p style="font-size:10px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no}</p></div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:22px">
          <div style="flex:1;border:1px solid #eef2f7;border-radius:12px;padding:14px 16px">
            <p class="lbl" style="color:${c};margin-bottom:5px">${d.billto}</p>
            <p style="font-weight:600;color:#0f172a;font-size:11px">${CLIENT.name}</p>
            <p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${CLIENT.addr.join("<br>")}</p>
          </div>
          <div style="width:42%;border:1px solid #eef2f7;border-radius:12px;padding:14px 16px;font-size:10px;color:#64748b">
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.issue}</span><span style="color:#0f172a">${META.issue}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.due}</span><span style="color:#0f172a">${META.due}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.terms}</span><span style="color:#0f172a">30 ${d.issue==="Tarih"?"gün":"days"}</span></div>
          </div>
        </div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`background:${lt};color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 14px',rpad:'11px 14px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:18px"><div style="background:${lt};border-radius:12px;padding:14px 18px">${totals(d,c)}</div></div></div>
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,56)}
        </div>
      </div>`;
    }

    else if(curVar==="sidebar"){
      html=`<div class="paper-inner" style="display:flex">
        <div style="width:150px;background:linear-gradient(180deg,${c},${c}dd);color:#fff;padding:28px 20px;display:flex;flex-direction:column;flex-shrink:0">
          <div style="background:#fff;border-radius:9px;padding:5px;width:34px;margin-bottom:auto">${logo(c,24)}</div>
          <div style="margin-top:24px">
            <p style="font-size:8px;text-transform:uppercase;letter-spacing:.8px;opacity:.7;margin-bottom:2px">${d.invno}</p><p style="font-size:12px;font-weight:600;margin-bottom:12px">${META.no}</p>
            <p style="font-size:8px;text-transform:uppercase;letter-spacing:.8px;opacity:.7;margin-bottom:2px">${d.issue}</p><p style="font-size:11px;margin-bottom:12px">${META.issue}</p>
            <p style="font-size:8px;text-transform:uppercase;letter-spacing:.8px;opacity:.7;margin-bottom:2px">${d.due}</p><p style="font-size:11px;margin-bottom:18px">${META.due}</p>
            <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:14px"><p style="font-size:8px;text-transform:uppercase;letter-spacing:.8px;opacity:.7;margin-bottom:3px">${d.payinfo}</p><p style="font-size:8.5px;line-height:1.6;opacity:.92">${BANKNAME}<br>${IBAN}<br>${SWIFT}</p></div>
          </div>
        </div>
        <div style="flex:1;padding:30px 32px;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px"><p style="font-size:26px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1.1">${dt}</p></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;gap:16px">
            <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          </div>
          <div style="background:${lt};border-radius:8px;padding:10px 14px;margin-bottom:16px;display:flex;gap:18px;font-size:9px;color:#64748b">
            <div><p style="text-transform:uppercase;letter-spacing:.5px;font-size:7.5px;color:#94a3b8">${d.ref}</p><p style="color:#0f172a;font-weight:600;font-size:10px;margin-top:1px">${META.ref}</p></div>
            <div><p style="text-transform:uppercase;letter-spacing:.5px;font-size:7.5px;color:#94a3b8">${d.issue}</p><p style="color:#475569;font-size:10px;margin-top:1px">${META.issue}</p></div>
            <div><p style="text-transform:uppercase;letter-spacing:.5px;font-size:7.5px;color:#94a3b8">${d.due}</p><p style="color:#475569;font-size:10px;margin-top:1px">${META.due}</p></div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:16px">${totals(d,c)}</div></div>
          <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
            <div style="flex:1">${notesblock(d,c)}</div>
            ${qrblock(d,c,52)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="split"){
      html=`<div class="paper-inner" style="padding:38px 42px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,34)}<div><p style="font-weight:700;font-size:13px;color:#0f172a">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.email}</p></div></div>
          <div style="text-align:right"><p style="font-size:23px;font-weight:800;color:${c};line-height:1.1">${dt}</p><p style="font-size:10px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no}</p></div>
        </div>
        <div style="background:${lt};border-radius:10px;padding:14px 18px;margin-bottom:20px">
          <p class="lbl" style="color:${c};margin-bottom:8px">${d.issue==="Tarih"?"Hizmet Detayları":"Service Details"}</p>
          <div style="display:flex;gap:24px;font-size:9.5px;color:#64748b">
            <div><span style="color:#94a3b8">${d.ref}:</span> <b style="color:#0f172a">${META.ref}</b></div>
            <div><span style="color:#94a3b8">${d.issue}:</span> ${META.issue}</div>
            <div><span style="color:#94a3b8">${d.due}:</span> ${META.due}</div>
            <div style="margin-left:auto"><span style="color:#94a3b8">${d.billto}:</span> <b style="color:#0f172a">${CLIENT.name}</b></div>
          </div>
        </div>
        <div style="flex:1">${serviceItemsTable(d,c)}
          <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,56)}
        </div>
      </div>`;
    }

    else if(curVar==="card"){
      html=`<div class="paper-inner" style="padding:38px 42px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,36)}<div><p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.email}</p></div></div>
          <p style="font-size:23px;font-weight:800;color:${c};line-height:1.1">${dt}</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px">
          <div style="flex:1;background:${c};color:#fff;border-radius:12px;padding:14px 18px">
            <p style="font-size:8px;text-transform:uppercase;letter-spacing:.8px;opacity:.8">${d.issue==="Tarih"?"Fatura Dönemi":"Billing Period"}</p>
            <p style="font-size:15px;font-weight:700;margin-top:3px">01 – 30 ${d.issue==="Tarih"?"Haziran 2026":"June 2026"}</p>
            <p style="font-size:9px;opacity:.85;margin-top:5px">${d.issue==="Tarih"?"Sonraki fatura":"Next billing"}: 01.07.2026</p>
          </div>
          <div style="width:40%;border:1px solid #eef2f7;border-radius:12px;padding:13px 16px;font-size:9.5px;color:#64748b">
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.invno}</span><span style="color:#0f172a;font-weight:600">${META.no}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.issue}</span><span style="color:#475569">${META.issue}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${d.due}</span><span style="color:#475569">${META.due}</span></div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;border-top:1px solid #eef2f7;margin-top:2px"><span>${d.billto}</span><span style="color:#0f172a">${CLIENT.name}</span></div>
          </div>
        </div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 4px',rpad:'10px 4px'})}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <div style="width:280px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#64748b"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#64748b"><span>${d.vat}</span><span>${d._vatVal}</span></div>
            <div style="background:${c};color:#fff;border-radius:10px;padding:12px 16px;margin-top:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;opacity:.85">${d.issue==="Tarih"?"Ödenecek Tutar":"Amount Due"}</span>
              <span style="font-size:19px;font-weight:800">${d._totalVal}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
          <div style="flex:1">${payblock(d,c)}</div>
          ${qrblock(d,c,54)}
        </div>
      </div>`;
    }

    else if(curVar==="accent"){
      html=`<div class="paper-inner" style="padding:40px 44px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,36)}<div><p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
          <div style="text-align:right">
            <p style="font-size:23px;font-weight:800;color:${c};line-height:1.1">${dt}</p>
            <span style="display:inline-block;margin-top:5px;background:#fef3c7;color:#92400e;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:3px 10px;border-radius:20px">${d.issue==="Tarih"?"Ödenmedi":"Unpaid"}</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:20px;gap:16px">
          <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="text-align:right;font-size:9.5px;color:#94a3b8">${metaRows}</div>
        </div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:14px">
            <div style="width:240px;font-size:10.5px">
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b"><span>${d.vat}</span><span>${d._vatVal}</span></div>
            </div>
          </div></div>
        <div style="margin-top:18px;background:${c};border-radius:14px;padding:20px 24px;color:#fff;display:flex;justify-content:space-between;align-items:center">
          <div>
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;opacity:.85">${d.issue==="Tarih"?"Ödenecek Tutar":"Amount Due"}</p>
            <p style="font-size:30px;font-weight:800;letter-spacing:.5px;margin-top:2px">${d._totalVal}</p>
            <p style="font-size:9.5px;opacity:.85;margin-top:3px">${d.due}: ${META.due}</p>
          </div>
          <div style="text-align:center">
            <div style="background:#fff;padding:6px;border-radius:10px">${qr(c,72)}</div>
            <p style="font-size:8.5px;opacity:.9;margin-top:5px">${d.issue==="Tarih"?"Ödemek için tarayın":"Scan to pay"}</p>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
          <div style="flex:1;font-size:9.5px;color:#64748b"><b style="color:${c}">${d.issue==="Tarih"?"Banka havalesi":"Bank transfer"}:</b> ${BANKNAME} · ${IBAN}</div>
        </div>
      </div>`;
    }
if(curVar==="mono"){
      html=`<div class="paper-inner" style="padding:42px 46px;color:#475569">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:9px">${logo(c,28)}<div><span style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</span><p style="font-size:9px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
          <div style="text-align:right"><p style="font-size:18px;font-weight:700;letter-spacing:.5px;color:#0f172a">${dt}</p><p style="font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no} · ${META.issue}</p></div>
        </div>
        <div style="background:${lt};border-radius:8px;padding:11px 16px;margin-bottom:20px">
          <p class="lbl" style="color:${c};margin-bottom:3px;font-size:9px">${d.billto}</p>
          <p style="font-weight:600;color:#0f172a;font-size:11.5px">${CLIENT.name}</p>
          <p style="font-size:9.5px;color:#94a3b8">${CLIENT.addr.join(", ")} · ${d.vatid}: ${CLIENT.vat}</p>
        </div>
        ${itemsTable(d,c,{headStyle:`background:${c};color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:.4px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 8px',rpad:'11px 8px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:16px">${totals(d,c)}</div>
        <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
          <div style="flex:1">${payblock(d,c)}</div>
          ${qrblock(d,c,50)}
        </div>
      </div>`;
    }

    else if(curVar==="wide"){
      html=`<div class="paper-inner" style="padding:56px 54px;color:#475569">
        <p style="font-size:11px;font-weight:500;letter-spacing:6px;text-transform:uppercase;color:${c};margin-bottom:4px">${dt}</p>
        <div style="width:36px;height:2px;background:${c};margin-bottom:40px"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:46px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,28)}<div><p style="font-weight:600;color:#334155;font-size:12px;letter-spacing:.5px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8;letter-spacing:.3px">${SENDER.addr.join(" · ")}</p></div></div>
          <div style="text-align:right;font-size:9.5px;color:#94a3b8;letter-spacing:.5px;line-height:1.9"><span style="color:#cbd5e1">${d.invno}</span> ${META.no}<br><span style="color:#cbd5e1">${d.issue}</span> ${META.issue}<br><span style="color:#cbd5e1">${d.due}</span> ${META.due}</div>
        </div>
        <p class="lbl" style="letter-spacing:2px;margin-bottom:6px">${d.billto}</p>
        <p style="font-weight:600;color:#0f172a;font-size:13px;letter-spacing:.3px">${CLIENT.name}</p>
        <p style="font-size:10px;color:#94a3b8;margin-bottom:38px">${CLIENT.addr.join(" · ")} · ${d.vatid}: ${CLIENT.vat}</p>
        ${itemsTable(d,c,{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#cbd5e1;border-bottom:1px solid #e2e8f0',rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'12px 4px',rpad:'13px 4px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:24px">${totals(d,c)}</div>
        <div style="margin-top:44px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:14px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,54)}
        </div>
      </div>`;
    }

    else if(curVar==="line"){
      html=`<div class="paper-inner" style="padding:46px 48px;color:#475569">
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:14px;border-bottom:2px solid #0f172a;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:9px">${logo(c,26)}<span style="font-weight:600;color:#0f172a;font-size:13px">${SENDER.name}</span></div>
          <p style="font-size:16px;font-weight:600;letter-spacing:1px;color:#0f172a">${dt}</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;padding:6px 0 26px"><span>${SENDER.addr.join(", ")} · ${d.vkn}: ${SENDER.tax}</span><span>${META.no} · ${META.issue}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:26px;font-size:10px">
          <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="text-align:right"><p class="lbl" style="margin-bottom:4px">${d.due}</p><p style="color:#0f172a;font-weight:500">${META.due}</p></div>
        </div>
        ${itemsTable(d,c,{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0',rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 4px',rpad:'10px 4px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div>
        <div style="margin-top:30px;padding-top:14px;border-top:2px solid #0f172a;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,54)}
        </div>
      </div>`;
    }

    else if(curVar==="corner"){
      html=`<div class="paper-inner" style="padding:46px 48px;color:#475569;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div>${logo(c,34)}<p style="font-weight:600;margin-top:8px;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p>${senderTax}</div>
          <div style="text-align:right"><p style="font-size:24px;font-weight:600;letter-spacing:1px;color:${c}">${dt}</p><p style="font-size:9.5px;color:#94a3b8;margin-top:6px;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</p></div>
        </div>
        <div style="margin-bottom:24px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        ${itemsTable(d,c,{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#cbd5e1;border-bottom:1px solid #e2e8f0',rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 4px',rpad:'10px 4px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div>
        <div style="margin-top:auto"></div>
        <div style="margin-top:30px;display:flex;justify-content:space-between;align-items:flex-end;gap:30px;padding-top:18px;border-top:1px solid #e2e8f0">
          <div style="flex:1">${payblock(d,c)}</div>
          <div style="width:200px;text-align:center">
            <div style="border-bottom:1px solid #cbd5e1;height:38px;margin-bottom:6px"></div>
            <p style="font-size:9px;color:#94a3b8">${d.issue==="Tarih"?"Yetkili İmza":"Authorized Signature"}</p>
            <p style="font-size:8.5px;color:#cbd5e1;margin-top:1px">${SENDER.name} · ${d.issue} _______</p>
          </div>
        </div>
        <p style="margin-top:14px;font-size:9.5px;color:#94a3b8;text-align:center;font-style:italic">${d.notes_val}</p>
      </div>`;
    }

    else if(curVar==="serif"){
      html=`<div class="paper-inner" style="padding:48px 50px;color:#334155">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #334155;margin-bottom:28px">
          <div><p style="font-weight:700;color:#0f172a;font-size:16px;letter-spacing:.5px">${SENDER.name}</p><p style="font-size:9.5px;color:#64748b;margin-top:2px">${SENDER.addr.join(" · ")}</p><p style="font-size:9px;color:#94a3b8">${d.vkn}: ${SENDER.tax}${SENDER.vat?` · ${d.vatid}: ${SENDER.vat}`:''}</p></div>
          <div style="text-align:right"><p style="font-size:17px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#0f172a">${dt}</p></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:26px">
          <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="text-align:right;font-size:10px;color:#64748b;line-height:1.9"><span style="color:#94a3b8">${d.invno}</span> ${META.no}<br><span style="color:#94a3b8">${d.issue}</span> ${META.issue}<br><span style="color:#94a3b8">${d.due}</span> ${META.due}</div>
        </div>
        ${itemsTable(d,"#334155",{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;border-top:1.5px solid #334155;border-bottom:1px solid #cbd5e1',rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 6px',rpad:'11px 6px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:20px">${totals(d,"#0f172a")}</div>
        <div style="margin-top:32px;padding-top:16px;border-top:1.5px solid #334155;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,"#334155")}<div style="margin-top:12px">${notesblock(d,"#334155")}</div></div>
        </div>
      </div>`;
    }
if(curVar==="dense"){
      html=`<div class="paper-inner" style="padding:26px 30px;font-size:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2px solid ${c};margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">${logo(c,26)}<div><p style="font-weight:700;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:8.5px;color:#94a3b8">${SENDER.addr.join(", ")} · ${d.vkn}: ${SENDER.tax}</p></div></div>
          <div style="text-align:right"><p style="font-size:18px;font-weight:700;color:${c}">${dt}</p><p style="font-size:8.5px;color:#94a3b8">${META.no} · ${META.issue} · ${d.due}: ${META.due}</p></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#64748b;margin-bottom:10px"><span><b style="color:#475569">${d.billto}:</b> ${CLIENT.name}, ${CLIENT.addr.join(", ")}</span><span>${d.vatid}: ${CLIENT.vat}</span></div>
        ${itemsTable(d,c,{many:true,headStyle:`background:${lt};color:${c};font-size:8.5px;text-transform:uppercase;letter-spacing:.3px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'5px 7px',rpad:'4px 7px'})}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;gap:16px">
          <div style="flex:1;font-size:8.5px">${payblock(d,c)}<div style="margin-top:7px">${notesblock(d,c)}</div></div>
          <div style="width:230px">${totals(d,c)}</div>
        </div>
        ${qrMode!=="off"?`<div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">${qrblock(d,c,48)}</div>`:''}
      </div>`;
    }

    else if(curVar==="grid"){
      html=`<div class="paper-inner" style="padding:30px 34px;font-size:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:9px">${logo(c,28)}<span style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</span></div>
          <p style="font-size:19px;font-weight:700;color:${c}">${dt}</p>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:14px">
          <div style="flex:1">${partyBlock(d,d.from,SENDER,senderTax)}</div>
          <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="font-size:9px;color:#94a3b8;text-align:right;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</div>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">${itemsTable(d,c,{many:true,zebra:true,zebraColor:lt,headStyle:`background:${c};color:#fff;font-size:8.5px;text-transform:uppercase;letter-spacing:.3px`,rowStyle:'',hpad:'7px 9px',rpad:'6px 9px'})}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:12px">${totals(d,c)}</div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
          <div style="flex:1;font-size:9px">${payblock(d,c)}<div style="margin-top:7px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,50)}
        </div>
      </div>`;
    }

    else if(curVar==="header"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column;font-size:10.5px">
        <div style="background:${lt};padding:20px 34px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${c}">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,30)}<div><p style="font-weight:700;font-size:14px;color:#0f172a">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
          <div style="text-align:right"><p style="font-size:22px;font-weight:800;color:${c};line-height:1.1">${dt}</p><p style="font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no}</p></div>
        </div>
        <div style="padding:22px 34px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:18px">
            <div><p class="lbl" style="color:${c};margin-bottom:3px">${d.billto}</p><p style="font-weight:600;color:#0f172a;font-size:11.5px">${CLIENT.name}</p><p style="font-size:9.5px;color:#94a3b8">${CLIENT.addr.join(", ")}</p></div>
            <div style="text-align:right;font-size:10px;color:#64748b"><p>${d.issue}: ${META.issue}</p><p style="margin-top:2px">${d.due}: ${META.due}</p></div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 8px',rpad:'10px 8px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:16px">${totals(d,c)}</div></div>
          <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:10px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,52)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="twin"){
      html=`<div class="paper-inner" style="padding:28px 32px;font-size:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">${logo(c,26)}<span style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</span></div>
          <p style="font-size:18px;font-weight:700;color:${c}">${dt}</p>
        </div>
        <div style="display:flex;gap:0;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:6px;font-size:8.5px">
          <div style="flex:1;padding:8px 12px;border-right:1px solid #e2e8f0"><span class="lbl" style="font-size:8px">${d.billto}</span><br><b style="color:#0f172a">${CLIENT.name}</b> · ${CLIENT.addr.join(", ")} · ${d.vatid}: ${CLIENT.vat}</div>
          <div style="flex:1;padding:8px 12px"><span class="lbl" style="font-size:8px">${d.issue==="Tarih"?"Teslimat / Sevkiyat":"Delivery / Shipment"}</span><br>${d.issue==="Tarih"?"Sipariş":"Order"}: ORD-2026-0042 · ${d.issue==="Tarih"?"Teslim":"Delivery"}: ${META.due}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:8.5px;color:#94a3b8;margin-bottom:10px"><span>${d.invno}: ${META.no}</span><span>${d.issue}: ${META.issue}</span><span>${d.due}: ${META.due}</span></div>
        ${skuItemsTable(d,c)}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;gap:16px">
          <div style="flex:1;font-size:8.5px">${payblock(d,c)}</div>
          <div style="width:230px">${totals(d,c)}</div>
        </div>
        ${qrMode!=="off"?`<div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">${qrblock(d,c,46)}</div>`:''}
      </div>`;
    }

    else if(curVar==="receipt"){
      html=`<div class="paper-inner" style="padding:22px 28px;font-size:9px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:2px solid ${c};margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:7px">${logo(c,22)}<div><span style="font-weight:700;color:#0f172a;font-size:11px">${SENDER.name}</span><span style="font-size:8px;color:#94a3b8"> · ${SENDER.addr.join(", ")} · ${d.vkn}: ${SENDER.tax}</span></div></div>
          <div style="text-align:right"><span style="font-size:15px;font-weight:800;color:${c}">${dt}</span><span style="font-size:8px;color:#94a3b8"> ${META.no}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:8px;color:#64748b;margin-bottom:8px">
          <span><b style="color:#475569">${d.billto}:</b> ${CLIENT.name} · ${CLIENT.addr.join(", ")} · ${d.vatid}: ${CLIENT.vat}</span>
          <span>${d.issue}: ${META.issue} · ${d.due}: ${META.due}</span>
        </div>
        ${itemsTable(d,c,{many:true,headStyle:`background:${lt};color:${c};font-size:8px;text-transform:uppercase;letter-spacing:.2px`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'4px 6px',rpad:'3px 6px'})}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:8px;gap:14px">
          <div style="flex:1;font-size:8px;color:#64748b"><b style="color:${c}">${d.payinfo}:</b> ${BANKNAME} · ${IBAN} · ${SWIFT}<br><span style="color:#94a3b8">${d.terms}: ${d.terms_val}</span></div>
          <div style="width:210px">${totals(d,c)}</div>
        </div>
        ${qrMode!=="off"?`<div style="margin-top:8px;padding-top:6px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end">${qrblock(d,c,42)}</div>`:''}
      </div>`;
    }
if(curVar==="block"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column">
        <div style="background:${c};padding:40px 44px 36px;color:#fff">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="background:#fff;border-radius:11px;padding:7px;display:inline-block;margin-bottom:20px">${logo(c,32)}</div>
              <p style="font-size:44px;font-weight:800;letter-spacing:-.5px;line-height:.9">${dt}</p>
            </div>
            <div style="text-align:right;padding-top:6px">
              <p style="font-size:13px;font-weight:600">${SENDER.name}</p>
              <p style="font-size:10px;opacity:.85;margin-top:6px;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</p>
            </div>
          </div>
        </div>
        <div style="padding:30px 44px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;margin-bottom:24px">
            <div>${partyBlock(d,d.from,SENDER,senderTax)}</div>
            <div style="text-align:right">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:3px solid ${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:${c}`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 6px',rpad:'11px 6px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,58)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="dark"){
      html=`<div class="paper-inner" style="padding:40px 44px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:10px">${logo(c,36)}<div><p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
          <div style="text-align:right"><p style="font-size:22px;font-weight:800;color:${c};line-height:1.1">${dt}</p><p style="font-size:9.5px;color:#94a3b8;margin-top:5px;line-height:1.3">${d.invno}: ${META.no} · ${META.issue}</p></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:20px;gap:16px">
          <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        </div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'9px 6px',rpad:'10px 6px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:14px">
            <div style="width:230px;font-size:10.5px">
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b"><span>${taxMode==="reverse"?d.reverse_short:(taxMode==="exempt"?d.exempt_short:d.vat)}</span><span>${taxMode==="normal"?d._vatVal:"€0,00"}</span></div>
            </div>
          </div></div>
        <div style="margin-top:18px;border:2px solid ${c};border-radius:14px;padding:22px 28px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:${c};font-weight:600">${d.issue==="Tarih"?"Ödenecek Tutar":"Amount Due"}</p>
            <p style="font-size:9.5px;color:#94a3b8;margin-top:4px">${d.due}: ${META.due}</p>
          </div>
          <p style="font-size:38px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1">${taxMode==="normal"?d._totalVal:d._totalNoVat}</p>
        </div>
        ${(taxMode==="reverse"||taxMode==="exempt")?`<p style="font-size:8.5px;color:#94a3b8;margin-top:8px">${taxMode==="reverse"?d.rc_note:d.ex_note}</p>`:''}
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
          <div style="flex:1">${payblock(d,c)}</div>
          ${qrblock(d,c,52)}
        </div>
      </div>`;
    }

    else if(curVar==="diagonal"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column;position:relative">
        <div style="background:${c};color:#fff;padding:34px 44px 56px;clip-path:polygon(0 0,100% 0,100% 72%,0 100%)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:center;gap:11px"><div style="background:#fff;border-radius:9px;padding:6px">${logo(c,28)}</div><div><p style="font-weight:700;font-size:14px">${SENDER.name}</p><p style="font-size:9px;opacity:.85">${SENDER.addr.join(", ")}</p></div></div>
            <p style="font-size:30px;font-weight:800;letter-spacing:1px">${dt}</p>
          </div>
        </div>
        <div style="padding:8px 44px 30px;flex:1;display:flex;flex-direction:column;margin-top:-10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:22px">
            <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
            <div style="text-align:right;font-size:10px;color:#94a3b8;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`background:${lt};color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 12px',rpad:'11px 12px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
          <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,58)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="stamp"){
      html=`<div class="paper-inner" style="padding:40px 44px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
          <div>
            ${logo(c,40)}<p style="font-weight:700;margin-top:8px;color:#0f172a;font-size:13px">${SENDER.name}</p>
            <p style="font-size:10px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p>${senderTax}
          </div>
          <div style="text-align:right">
            <p style="font-size:28px;font-weight:800;color:${c};letter-spacing:.5px;line-height:1.1">${dt}</p>
            <div style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:${lt};border:1px solid ${c}33;border-radius:8px;padding:5px 12px">
              <span style="width:6px;height:6px;border-radius:50%;background:${c}"></span>
              <span style="font-size:10px;font-weight:600;color:${c};letter-spacing:.3px">${META.no}</span>
            </div>
          </div>
        </div>
        <div style="margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="text-align:right;font-size:10px;color:#94a3b8">${metaRows}</div>
        </div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}44;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'9px 6px',rpad:'10px 6px'})}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;gap:20px">
          <div style="flex:1;font-size:10px">
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b;max-width:200px"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b;max-width:200px"><span>${taxMode==="reverse"?d.reverse_short:(taxMode==="exempt"?d.exempt_short:d.vat)}</span><span>${taxMode==="normal"?d._vatVal:"€0,00"}</span></div>
          </div>
          <div style="background:${c};color:#fff;border-radius:14px;padding:18px 28px;text-align:right;box-shadow:0 8px 20px ${c}55">
            <p style="font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:.85">${d.total}</p>
            <p style="font-size:30px;font-weight:800;letter-spacing:.5px;line-height:1">${taxMode==="normal"?d._totalVal:d._totalNoVat}</p>
          </div>
        </div>
        ${(taxMode==="reverse"||taxMode==="exempt")?`<p style="font-size:8.5px;color:#94a3b8;margin-top:8px;text-align:right">${taxMode==="reverse"?d.rc_note:d.ex_note}</p>`:''}
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,54)}
        </div>
      </div>`;
    }

    else if(curVar==="frame"){
      html=`<div class="paper-inner" style="padding:18px">
        <div style="border:8px solid ${c};border-radius:4px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden">
          <div style="background:${c};color:#fff;padding:20px 30px;display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px"><div style="background:#fff;border-radius:8px;padding:5px">${logo(c,26)}</div><div><p style="font-weight:700;font-size:14px">${SENDER.name}</p><p style="font-size:9px;opacity:.85">${SENDER.addr.join(", ")}</p></div></div>
            <p style="font-size:26px;font-weight:800;letter-spacing:1px;line-height:1.1">${dt}</p>
          </div>
          <div style="padding:24px 30px;flex:1;display:flex;flex-direction:column">
            <div style="display:flex;justify-content:space-between;margin-bottom:20px">
              <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
              <div style="text-align:right;font-size:10px;color:#94a3b8;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</div>
            </div>
            <div style="flex:1">${itemsTable(d,c,{headStyle:`background:${lt};color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'9px 10px',rpad:'10px 10px'})}
              <div style="display:flex;justify-content:flex-end;margin-top:16px">${totals(d,c)}</div></div>
            <div style="margin-top:18px;padding-top:14px;border-top:2px solid ${c}33;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
              <div style="flex:1">${payblock(d,c)}<div style="margin-top:10px">${notesblock(d,c)}</div></div>
              ${qrblock(d,c,54)}
            </div>
          </div>
        </div>
      </div>`;
    }


  return baseStyle + html;
}
