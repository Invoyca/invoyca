// @ts-nocheck
// Fatura şablon render motoru — galeri dosyalarından BİREBİR çıkarılmıştır.
// 25 varyant × tema × dil × QR modu × vergi modu. HTML string üretir.
// React'te dangerouslySetInnerHTML ile gösterilir (galeri ile aynı çıktı).

import { SAMPLE, TPL_LABELS, THEMES } from "./data";

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
  taxMode: string;
  data?: InvoiceData; // verilmezse SAMPLE kullanılır (önizleme için)
};

export function renderInvoiceHTML(opts: RenderOpts): string {
  const curVar = opts.variant;
  const qrMode = opts.qrMode;
  const taxMode = opts.taxMode;

  // Gerçek veri verilmişse onu, yoksa örnek veriyi kullan
  const D = opts.data || SAMPLE;
  const SENDER = D.sender;
  const CLIENT = D.client;
  const META = D.meta;
  const IBAN = D.bank.iban;
  const SWIFT = D.bank.swift;
  const BANKNAME = D.bank.name;

  const themeObj = THEMES.find((t) => t.id === opts.theme) || THEMES[0];
  const curTheme = { color: themeObj.color, light: themeObj.light };

  // Çeviri sözlüğü — galeri "d" objesi. Ek olarak dt ve items alanları.
  const base = TPL_LABELS[opts.lang] || TPL_LABELS.EN;
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

  // ---- Galeri yardımcı fonksiyonları (birebir) ----
function logo(c,size){ const r=size*0.18; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none"><rect x="1" y="1" width="${size-2}" height="${size-2}" rx="${r}" fill="${c}1a" stroke="${c}55" stroke-width="1.2" stroke-dasharray="4 3"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size*0.2}" font-family="sans-serif" font-weight="600" fill="${c}" letter-spacing="1">LOGO</text></svg>`; }


  function qr(c, size){
    const n=11, cell=size/n; let cells="";
    // sabit desen (deterministik) — gerçekçi QR görünümü
    const pat=[
      "11111110111","10000010001","10111010111","10111010011","10111010101",
      "10000010110","11111110101","00000000011","11011011001","01010100101","11101011111"];
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){ if(pat[y][x]==="1") cells+=`<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`; }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">${cells}</svg>`;
  }
function qr(c, size){
    const n=11, cell=size/n; let cells="";
    // sabit desen (deterministik) — gerçekçi QR görünümü
    const pat=[
      "11111110111","10000010001","10111010111","10111010011","10111010101",
      "10000010110","11111110101","00000000011","11011011001","01010100101","11101011111"];
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){ if(pat[y][x]==="1") cells+=`<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`; }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">${cells}</svg>`;
  }
function manyItems(d){
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
function itemsTable(d,c,opts){
    const showUnit = opts.unit!==false;
    const data = opts.many ? manyItems(d) : d.items;
    const head = `<tr style="${opts.headStyle}">
      <th style="text-align:left;padding:${opts.hpad}">${d.desc}</th>
      ${showUnit?`<th style="text-align:center;padding:${opts.hpad};width:54px">${d.unit}</th>`:``}
      <th style="text-align:center;padding:${opts.hpad};width:42px">${d.qty}</th>
      <th style="text-align:right;padding:${opts.hpad};width:84px">${d.price}</th>
      <th style="text-align:right;padding:${opts.hpad};width:88px">${d.amount}</th></tr>`;
    const rows = data.map((it,i)=>`<tr style="${opts.rowStyle}${opts.zebra&&i%2===1?`;background:${opts.zebraColor||'#f8fafc'}`:''}">
      <td style="padding:${opts.rpad};color:#334155">${it[0]}</td>
      ${showUnit?`<td style="padding:${opts.rpad};text-align:center;color:#94a3b8">${it[1]}</td>`:``}
      <td style="padding:${opts.rpad};text-align:center;color:#64748b">${it[2]}</td>
      <td style="padding:${opts.rpad};text-align:right;color:#64748b">${it[3]}</td>
      <td style="padding:${opts.rpad};text-align:right;color:#0f172a;font-weight:500">${it[4]}</td></tr>`).join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:10.5px"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }
function totals(d,c){
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
function notesblock(d,c,style){
    return `<div style="${style||''}"><p class="lbl" style="color:${c};font-weight:600;margin-bottom:4px">${d.notes_lbl}</p>
      <p style="font-size:10px;color:#64748b;line-height:1.55">${d.notes_val}</p></div>`;
  }
function qrblock(d,c,size){
    if(qrMode==="off") return "";
    const s = size||56;
    let label, sub;
    if(qrMode==="verify"){ label=d.scan_verify; sub=`${d.gibno}: EXMP-2026-000042<br>${d.ettn}: 0a1b2c3d-0000-4e5f-demo`; }
    else { label=d.scan; sub=`IBAN: ${IBAN.slice(0,14)}…`; }
    return `<div style="display:flex;align-items:center;gap:10px">
      <div style="padding:5px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0">${qr(c,s)}</div>
      <div><p class="lbl" style="color:${c};font-weight:600;margin-bottom:2px">${label}</p><p style="font-size:8.5px;color:#cbd5e1;line-height:1.5">${sub}</p></div>
    </div>`;
  }
function payblock(d,c,style){
    return `<div style="${style||''}"><p class="lbl" style="color:${c};font-weight:600;margin-bottom:4px">${d.payinfo}</p>
      <p style="font-size:10px;color:#475569;line-height:1.6">${d.bank}: ${BANKNAME}<br>IBAN: ${IBAN}<br>SWIFT/BIC: ${SWIFT}</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:6px"><b style="color:#64748b">${d.terms}:</b> ${d.terms_val}</p></div>`;
  }
function partyBlock(d,label,party,extra){
    return `<div><p class="lbl" style="margin-bottom:4px">${label}</p>
      <p style="font-weight:600;color:#0f172a;font-size:12px">${party.name}</p>
      <p style="font-size:10px;color:#94a3b8;line-height:1.55">${party.addr.join("<br>")}</p>
      ${extra}</div>`;
  }

  // ---- renderPaper head ----
  const c = curTheme.color, lt = curTheme.light;
  const dt = d.dt[opts.docType];
  const senderTax = `<p style="font-size:10px;color:#94a3b8;margin-top:3px">${d.vkn}: ${SENDER.tax}${SENDER.vat?` \u00b7 ${d.vatid}: ${SENDER.vat}`:''}</p>`;
  const clientTax = `<p style="font-size:10px;color:#94a3b8;margin-top:3px">${d.vatid}: ${CLIENT.vat}</p>`;
  const metaRows = `<p>${d.invno}: <b style="color:#475569">${META.no}</b></p><p style="margin-top:2px">${d.issue}: <span style="color:#475569">${META.issue}</span></p><p style="margin-top:2px">${d.due}: <span style="color:#475569">${META.due}</span></p>`;

  let html="";


if(curVar==="standard"){
      html=`<div class="paper-inner" style="padding:42px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div>${logo(c,40)}<p style="font-weight:600;margin-top:8px;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:10px;color:#94a3b8;line-height:1.55">${SENDER.addr.join("<br>")}</p>${senderTax}</div>
          <div style="text-align:right"><p style="font-size:25px;font-weight:700;color:${c};letter-spacing:.5px">${dt}</p><div style="font-size:10px;color:#94a3b8;margin-top:8px">${metaRows}</div></div>
        </div>
        <div style="margin-bottom:24px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        ${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div>
        <div style="margin-top:26px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:14px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,60)}
        </div>
        <p style="margin-top:18px;font-size:10px;color:#cbd5e1;text-align:center">${d.thanks}</p>
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
      html=`<div class="paper-inner" style="padding:46px;text-align:center">
        <div style="margin-bottom:8px;display:flex;justify-content:center">${logo(c,44)}</div>
        <p style="font-weight:600;color:#0f172a;font-size:13px">${SENDER.name}</p>
        <p style="font-size:10px;color:#94a3b8">${SENDER.addr.join(" · ")}</p>
        <p style="font-size:9px;color:#cbd5e1;margin-top:2px">${d.vkn}: ${SENDER.tax}${SENDER.vat?` · ${d.vatid}: ${SENDER.vat}`:''}</p>
        <div style="margin:24px auto;width:60px;height:2px;background:${c}"></div>
        <p style="font-size:26px;font-weight:700;color:${c};letter-spacing:3px;text-transform:uppercase">${dt}</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:6px">${d.invno}: ${META.no} &nbsp;·&nbsp; ${d.issue}: ${META.issue} &nbsp;·&nbsp; ${d.due}: ${META.due}</p>
        <div style="text-align:left;margin:26px 0 18px;padding:14px 18px;background:${lt};border-radius:8px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        <div style="text-align:left">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}33;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 6px',rpad:'9px 6px'})}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px;text-align:left">${totals(d,c)}</div>
        <div style="text-align:left;margin-top:26px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,58)}
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
          ${qrMode!=="off"?`<div style="background:#fff;padding:4px;border-radius:6px;flex-shrink:0">${qr(c,50)}</div>`:''}
        </div>
      </div>`;
    }

    else if(curVar==="detailed"){
      html=`<div class="paper-inner" style="padding:36px 40px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
          <div>${logo(c,38)}<p style="font-weight:600;margin-top:7px;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p><p style="font-size:9px;color:#cbd5e1;margin-top:2px">${d.vkn}: ${SENDER.tax} · ${d.vatid}: ${SENDER.vat}</p></div>
          <div style="text-align:right"><p style="font-size:22px;font-weight:700;color:${c}">${dt}</p>
            <table style="margin-top:8px;font-size:9.5px;color:#94a3b8;margin-left:auto"><tr><td style="text-align:right;padding:1px 8px 1px 0">${d.invno}:</td><td style="text-align:right;color:#475569;font-weight:600">${META.no}</td></tr><tr><td style="text-align:right;padding:1px 8px 1px 0">${d.issue}:</td><td style="text-align:right;color:#475569">${META.issue}</td></tr><tr><td style="text-align:right;padding:1px 8px 1px 0">${d.due}:</td><td style="text-align:right;color:#475569">${META.due}</td></tr><tr><td style="text-align:right;padding:1px 8px 1px 0">${d.ref}:</td><td style="text-align:right;color:#475569">${META.ref}</td></tr></table>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:18px">
          <div style="flex:1;padding:12px 14px;background:${lt};border-radius:6px">${partyBlock(d,d.from,SENDER,`<p style="font-size:9px;color:#cbd5e1;margin-top:2px">${SENDER.email}</p>`)}</div>
          <div style="flex:1;padding:12px 14px;background:${lt};border-radius:6px">${partyBlock(d,d.billto,CLIENT,`${clientTax}<p style="font-size:9px;color:#cbd5e1;margin-top:1px">${CLIENT.email}</p>`)}</div>
        </div>
        ${itemsTable(d,c,{headStyle:`background:${c};color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:.4px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 8px',rpad:'8px 8px'})}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px">
          <div style="width:50%;padding-right:20px"><p class="lbl" style="margin-bottom:3px">${d.terms}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${d.terms_val}</p></div>
          ${totals(d,c)}
        </div>
        <div style="margin-top:20px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,58)}
        </div>
      </div>`;
    }
if(curVar==="band"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column">
        <div style="background:linear-gradient(135deg,${c},${c}cc);padding:34px 42px;color:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:11px"><div style="background:#fff;border-radius:9px;padding:5px">${logo(c,30)}</div><div><p style="font-weight:700;font-size:15px">${SENDER.name}</p><p style="font-size:9.5px;opacity:.8">${SENDER.addr.join(", ")}</p></div></div>
            <p style="font-size:28px;font-weight:800;letter-spacing:1px">${dt}</p>
          </div>
        </div>
        <div style="padding:30px 42px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;margin-bottom:24px">
            <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
            <div style="text-align:right;font-size:10px;color:#94a3b8">${metaRows}<p style="margin-top:2px">${d.vkn}: ${SENDER.tax}${SENDER.vat?` · ${d.vatid}: ${SENDER.vat}`:''}</p></div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`background:${lt};color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'11px 14px',rpad:'11px 14px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,58)}
          </div>
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
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><p style="font-size:26px;font-weight:800;color:${c};letter-spacing:.5px">${dt}</p></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:20px;gap:16px">
            <div style="flex:1">${partyBlock(d,d.from,SENDER,senderTax)}</div>
            <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
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
      html=`<div class="paper-inner" style="display:flex;flex-direction:column">
        <div style="background:${c};padding:32px 42px 60px;color:#fff;position:relative">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:center;gap:10px"><div style="background:#fff;border-radius:8px;padding:5px">${logo(c,26)}</div><span style="font-weight:700;font-size:14px">${SENDER.name}</span></div>
            <p style="font-size:26px;font-weight:800;letter-spacing:1px">${dt}</p>
          </div>
        </div>
        <div style="padding:0 42px;margin-top:-38px">
          <div style="display:flex;gap:14px">
            <div style="flex:1;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(15,23,42,.08);padding:16px 18px">${partyBlock(d,d.from,SENDER,senderTax)}</div>
            <div style="flex:1;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(15,23,42,.08);padding:16px 18px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          </div>
        </div>
        <div style="padding:26px 42px 30px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:flex-end;gap:18px;font-size:10px;color:#94a3b8;margin-bottom:14px"><span>${d.invno}: <b style="color:#475569">${META.no}</b></span><span>${d.issue}: ${META.issue}</span><span>${d.due}: ${META.due}</span></div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`background:${lt};color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'11px 14px',rpad:'11px 14px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
          <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,58)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="card"){
      html=`<div class="paper-inner" style="padding:32px;background:#f8fafc">
        <div style="background:#fff;border-radius:16px;padding:28px 32px;box-shadow:0 1px 3px rgba(15,23,42,.06);display:flex;flex-direction:column;height:100%;box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <div style="display:flex;align-items:center;gap:10px">${logo(c,38)}<div><p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:9px;color:#94a3b8">${SENDER.addr.join(", ")}</p></div></div>
            <div style="background:${c};color:#fff;padding:8px 16px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:.5px">${dt}</div>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:20px">
            <div style="flex:1;background:${lt};border-radius:12px;padding:13px 16px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
            <div style="width:40%;background:${lt};border-radius:12px;padding:13px 16px;font-size:10px;color:#64748b"><p style="margin-bottom:5px">${d.invno}: <b style="color:#0f172a">${META.no}</b></p><p style="margin-bottom:5px">${d.issue}: ${META.issue}</p><p>${d.due}: ${META.due}</p></div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{headStyle:`color:${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 4px',rpad:'10px 4px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:16px"><div style="background:${lt};border-radius:12px;padding:14px 18px">${totals(d,c)}</div></div></div>
          <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
            <div style="flex:1">${payblock(d,c)}<div style="margin-top:10px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,54)}
          </div>
        </div>
      </div>`;
    }

    else if(curVar==="accent"){
      html=`<div class="paper-inner" style="padding:44px 46px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-left:4px solid ${c};padding-left:16px;margin-bottom:30px">
          <div>${logo(c,38)}<p style="font-weight:700;margin-top:8px;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:10px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p>${senderTax}</div>
          <div style="text-align:right"><p style="font-size:27px;font-weight:800;color:${c};letter-spacing:.5px">${dt}</p><div style="font-size:10px;color:#94a3b8;margin-top:8px">${metaRows}</div></div>
        </div>
        <div style="border-left:4px solid ${c};padding-left:16px;margin-bottom:24px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:${c}`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'9px 6px',rpad:'10px 6px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div></div>
        <div style="margin-top:26px;border-left:4px solid ${c};padding-left:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,58)}
        </div>
      </div>`;
    }
if(curVar==="mono"){
      html=`<div class="paper-inner" style="padding:48px 50px;color:#475569">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
          <div style="display:flex;align-items:center;gap:10px">${logo("#475569",30)}<span style="font-weight:600;color:#334155;font-size:13px">${SENDER.name}</span></div>
          <p style="font-size:15px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#334155">${dt}</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:34px;font-size:10px">
          <div>${partyBlock(d,d.from,SENDER,senderTax)}</div>
          <div style="text-align:right">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:10px"><span>${d.invno}: ${META.no}</span><span>${d.issue}: ${META.issue}</span><span>${d.due}: ${META.due}</span></div>
        ${itemsTable(d,"#475569",{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#cbd5e1',rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'8px 4px',rpad:'10px 4px'})}
        <div style="display:flex;justify-content:flex-end;margin-top:20px">${totals(d,"#334155")}</div>
        <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,"#475569")}<div style="margin-top:12px">${notesblock(d,"#475569")}</div></div>
          ${qrblock(d,"#475569",54)}
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
      html=`<div class="paper-inner" style="padding:46px;color:#475569;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:auto">
          <div>${logo(c,34)}<p style="font-weight:600;margin-top:8px;color:#0f172a;font-size:12px">${SENDER.name}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p>${senderTax}</div>
          <div style="text-align:right"><p style="font-size:24px;font-weight:600;letter-spacing:1px;color:${c}">${dt}</p><p style="font-size:9.5px;color:#94a3b8;margin-top:6px;line-height:1.7">${d.invno} ${META.no}<br>${d.issue} ${META.issue}<br>${d.due} ${META.due}</p></div>
        </div>
        <div style="margin:28px 0">
          <div style="display:flex;justify-content:flex-end;margin-bottom:18px"><div style="text-align:right">${partyBlock(d,d.billto,CLIENT,clientTax)}</div></div>
          ${itemsTable(d,c,{headStyle:'font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#cbd5e1;border-bottom:1px solid #e2e8f0',rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'9px 4px',rpad:'10px 4px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:18px">${totals(d,c)}</div>
        </div>
        <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding-top:16px;border-top:1px solid #e2e8f0">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:10px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,54)}
        </div>
      </div>`;
    }

    else if(curVar==="serif"){
      html=`<div class="paper-inner" style="padding:50px 50px;color:#475569;font-family:Georgia,'Times New Roman',serif">
        <div style="text-align:center;margin-bottom:36px">
          <div style="display:flex;justify-content:center;margin-bottom:10px">${logo(c,38)}</div>
          <p style="font-weight:600;color:#0f172a;font-size:15px;letter-spacing:.5px">${SENDER.name}</p>
          <p style="font-size:10px;color:#94a3b8;font-family:sans-serif">${SENDER.addr.join(" · ")}</p>
          <p style="font-size:28px;font-weight:400;letter-spacing:4px;color:${c};margin-top:18px;text-transform:uppercase">${dt}</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:28px;font-family:sans-serif">
          <div>${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
          <div style="text-align:right;font-size:10px;color:#94a3b8;line-height:1.8">${d.invno}: ${META.no}<br>${d.issue}: ${META.issue}<br>${d.due}: ${META.due}</div>
        </div>
        <div style="font-family:sans-serif">${itemsTable(d,c,{headStyle:`font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'10px 4px',rpad:'11px 4px'})}
          <div style="display:flex;justify-content:flex-end;margin-top:20px">${totals(d,c)}</div></div>
        <div style="margin-top:34px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;font-family:sans-serif">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,54)}
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
      html=`<div class="paper-inner" style="display:flex;flex-direction:column;font-size:10px">
        <div style="background:${c};color:#fff;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:9px"><div style="background:#fff;border-radius:7px;padding:4px">${logo(c,22)}</div><div><p style="font-weight:700;font-size:13px">${SENDER.name}</p><p style="font-size:8.5px;opacity:.85">${dt} · ${META.no}</p></div></div>
          <div style="text-align:right"><p style="font-size:8.5px;opacity:.8">${d.total}</p><p style="font-size:20px;font-weight:800">${taxMode==="normal"?d._totalVal:d._totalNoVat}</p></div>
        </div>
        <div style="padding:18px 32px;flex:1;display:flex;flex-direction:column">
          <div style="display:flex;justify-content:space-between;gap:14px;margin-bottom:14px">
            <div style="flex:1">${partyBlock(d,d.from,SENDER,senderTax)}</div>
            <div style="flex:1">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
            <div style="font-size:9px;color:#94a3b8;text-align:right;line-height:1.7">${d.issue} ${META.issue}<br>${d.due} ${META.due}</div>
          </div>
          <div style="flex:1">${itemsTable(d,c,{many:true,headStyle:`border-bottom:2px solid ${c}33;font-size:8.5px;text-transform:uppercase;letter-spacing:.3px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f5f7fa',hpad:'6px 6px',rpad:'5px 6px'})}
            <div style="display:flex;justify-content:flex-end;margin-top:12px">${totals(d,c)}</div></div>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
            <div style="flex:1;font-size:9px">${payblock(d,c)}<div style="margin-top:7px">${notesblock(d,c)}</div></div>
            ${qrblock(d,c,48)}
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
        <div style="display:flex;gap:0;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px;font-size:9px">
          <div style="flex:1;padding:9px 12px;border-right:1px solid #e2e8f0"><span class="lbl">${d.from}</span> <b style="color:#0f172a">${SENDER.name}</b> · ${SENDER.addr.join(", ")} · ${d.vkn}: ${SENDER.tax}</div>
          <div style="flex:1;padding:9px 12px;border-right:1px solid #e2e8f0"><span class="lbl">${d.billto}</span> <b style="color:#0f172a">${CLIENT.name}</b> · ${CLIENT.addr.join(", ")} · ${d.vatid}: ${CLIENT.vat}</div>
          <div style="padding:9px 12px;white-space:nowrap;color:#94a3b8">${META.no}<br>${META.issue} → ${META.due}</div>
        </div>
        ${itemsTable(d,c,{many:true,headStyle:`background:${lt};color:${c};font-size:8.5px;text-transform:uppercase;letter-spacing:.3px`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'6px 9px',rpad:'5px 9px'})}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px;gap:16px">
          <div style="flex:1;font-size:9px">${payblock(d,c)}<div style="margin-top:7px">${notesblock(d,c)}</div></div>
          <div style="width:230px">${totals(d,c)}</div>
        </div>
        ${qrMode!=="off"?`<div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">${qrblock(d,c,48)}</div>`:''}
      </div>`;
    }

    else if(curVar==="receipt"){
      html=`<div class="paper-inner" style="padding:30px 0;display:flex;justify-content:center">
        <div style="width:300px;font-size:10px">
          <div style="text-align:center;margin-bottom:14px">
            <div style="display:flex;justify-content:center;margin-bottom:6px">${logo(c,30)}</div>
            <p style="font-weight:700;color:#0f172a;font-size:13px">${SENDER.name}</p>
            <p style="font-size:8.5px;color:#94a3b8">${SENDER.addr.join(", ")}</p>
            <p style="font-size:8.5px;color:#cbd5e1">${d.vkn}: ${SENDER.tax}</p>
            <p style="font-size:15px;font-weight:700;letter-spacing:1px;color:${c};margin-top:8px">${dt}</p>
          </div>
          <div style="border-top:1px dashed #cbd5e1;border-bottom:1px dashed #cbd5e1;padding:8px 0;font-size:9px;color:#64748b;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between"><span>${d.invno}</span><span style="color:#475569">${META.no}</span></div>
            <div style="display:flex;justify-content:space-between"><span>${d.issue}</span><span>${META.issue}</span></div>
            <div style="display:flex;justify-content:space-between"><span>${d.billto}</span><span style="color:#475569">${CLIENT.name}</span></div>
          </div>
          ${itemsTable(d,c,{unit:false,headStyle:'font-size:8px;text-transform:uppercase;letter-spacing:.3px;color:#cbd5e1;border-bottom:1px solid #e2e8f0',rowStyle:'border-bottom:1px dotted #e2e8f0',hpad:'5px 2px',rpad:'6px 2px'})}
          <div style="margin-top:10px;border-top:1px dashed #cbd5e1;padding-top:8px">${totals(d,c)}</div>
          <div style="margin-top:12px;text-align:center">${qrMode!=="off"?`<div style="display:inline-block;padding:5px;background:#fff;border:1px solid #e2e8f0;border-radius:8px">${qr(c,60)}</div><p class="lbl" style="color:${c};margin-top:4px">${qrMode==="verify"?d.scan_verify:d.scan}</p>`:''}</div>
          <div style="margin-top:10px;font-size:8.5px;color:#94a3b8;text-align:center;border-top:1px dashed #cbd5e1;padding-top:8px">${BANKNAME} · ${IBAN}<br>${d.notes_val}</div>
        </div>
      </div>`;
    }
if(curVar==="block"){
      html=`<div class="paper-inner" style="display:flex;flex-direction:column">
        <div style="background:${c};padding:40px 44px;color:#fff;position:relative;overflow:hidden">
          <div style="position:absolute;right:-50px;top:-50px;width:200px;height:200px;background:rgba(255,255,255,.08);border-radius:50%"></div>
          <div style="position:absolute;right:40px;bottom:-70px;width:130px;height:130px;background:rgba(255,255,255,.06);border-radius:50%"></div>
          <div style="position:relative">
            <div style="background:#fff;border-radius:11px;padding:7px;display:inline-block;margin-bottom:18px">${logo(c,32)}</div>
            <p style="font-size:40px;font-weight:800;letter-spacing:1px;line-height:.95">${dt}</p>
            <p style="opacity:.9;margin-top:8px;font-size:12px">${SENDER.name} · ${d.invno} ${META.no} · ${META.issue}</p>
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
      html=`<div class="paper-inner" style="background:#0f172a;color:#cbd5e1;padding:40px 44px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div><div style="background:${c};border-radius:9px;padding:6px;display:inline-block;margin-bottom:10px">${logo(c,28)}</div><p style="font-weight:700;color:#fff;font-size:14px">${SENDER.name}</p><p style="font-size:9.5px;color:#64748b;line-height:1.5">${SENDER.addr.join("<br>")}</p><p style="font-size:9px;color:#475569">${d.vkn}: ${SENDER.tax}${SENDER.vat?` · ${d.vatid}: ${SENDER.vat}`:''}</p></div>
          <div style="text-align:right"><p style="font-size:30px;font-weight:800;color:${c};letter-spacing:1px">${dt}</p><p style="font-size:9.5px;color:#64748b;margin-top:8px;line-height:1.7">${d.invno} <span style="color:#cbd5e1">${META.no}</span><br>${d.issue} <span style="color:#cbd5e1">${META.issue}</span><br>${d.due} <span style="color:#cbd5e1">${META.due}</span></p></div>
        </div>
        <div style="margin-bottom:22px"><p style="font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#475569;margin-bottom:4px">${d.billto}</p><p style="font-weight:600;color:#fff;font-size:13px">${CLIENT.name}</p><p style="font-size:9.5px;color:#64748b">${CLIENT.addr.join(", ")} · ${d.vatid}: ${CLIENT.vat}</p></div>
        <div style="flex:1">
          <table style="width:100%;border-collapse:collapse;font-size:10.5px"><thead><tr style="border-bottom:2px solid ${c};font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:${c}"><th style="text-align:left;padding:10px 6px">${d.desc}</th><th style="text-align:center;padding:10px 6px;width:54px">${d.unit}</th><th style="text-align:center;padding:10px 6px;width:42px">${d.qty}</th><th style="text-align:right;padding:10px 6px;width:84px">${d.price}</th><th style="text-align:right;padding:10px 6px;width:88px">${d.amount}</th></tr></thead>
          <tbody>${d.items.map(it=>`<tr style="border-bottom:1px solid #1e293b"><td style="padding:11px 6px;color:#e2e8f0">${it[0]}</td><td style="padding:11px 6px;text-align:center;color:#64748b">${it[1]}</td><td style="padding:11px 6px;text-align:center;color:#94a3b8">${it[2]}</td><td style="padding:11px 6px;text-align:right;color:#94a3b8">${it[3]}</td><td style="padding:11px 6px;text-align:right;color:#fff;font-weight:600">${it[4]}</td></tr>`).join("")}</tbody></table>
          <div style="display:flex;justify-content:flex-end;margin-top:18px"><div style="width:250px;font-size:11px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${d.subtotal}</span><span style="color:#cbd5e1">${d._subtotalVal}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b"><span>${taxMode==="reverse"?d.reverse_short:(taxMode==="exempt"?d.exempt_short:d.vat)}</span><span style="color:#cbd5e1">${taxMode==="normal"?d._vatVal:"€0,00"}</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px;border-top:2px solid ${c};font-weight:800;color:${c};font-size:15px"><span>${d.total}</span><span>${taxMode==="normal"?d._totalVal:d._totalNoVat}</span></div>
            ${(taxMode==="reverse"||taxMode==="exempt")?`<p style="font-size:8.5px;color:#64748b;margin-top:6px;line-height:1.45">${taxMode==="reverse"?d.rc_note:d.ex_note}</p>`:''}
          </div></div>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1"><p style="font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:${c};font-weight:600;margin-bottom:4px">${d.payinfo}</p><p style="font-size:9.5px;color:#94a3b8;line-height:1.6">${BANKNAME} · ${IBAN}<br>${SWIFT} · <span style="color:#64748b">${d.notes_val}</span></p></div>
          ${qrMode!=="off"?`<div style="display:flex;align-items:center;gap:10px"><div style="padding:5px;background:#fff;border-radius:8px">${qr(c,54)}</div><div><p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:${c};font-weight:600">${qrMode==="verify"?d.scan_verify:d.scan}</p></div></div>`:''}
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
          <div>${logo(c,40)}<p style="font-weight:700;margin-top:8px;color:#0f172a;font-size:13px">${SENDER.name}</p><p style="font-size:10px;color:#94a3b8;line-height:1.5">${SENDER.addr.join("<br>")}</p>${senderTax}</div>
          <div style="text-align:right"><p style="font-size:26px;font-weight:800;color:${c};letter-spacing:.5px">${dt}</p><div style="font-size:10px;color:#94a3b8;margin-top:6px">${metaRows}</div></div>
        </div>
        <div style="margin-bottom:22px">${partyBlock(d,d.billto,CLIENT,clientTax)}</div>
        <div style="flex:1">${itemsTable(d,c,{headStyle:`border-bottom:2px solid ${c}44;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8`,rowStyle:'border-bottom:1px solid #f1f5f9',hpad:'9px 6px',rpad:'10px 6px'})}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;gap:20px">
          <div style="flex:1;font-size:10px">
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b;max-width:200px"><span>${d.subtotal}</span><span>${d._subtotalVal}</span></div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#64748b;max-width:200px"><span>${taxMode==="reverse"?d.reverse_short:(taxMode==="exempt"?d.exempt_short:d.vat)}</span><span>${taxMode==="normal"?d._vatVal:"€0,00"}</span></div>
          </div>
          <div style="background:${c};color:#fff;border-radius:14px;padding:18px 28px;text-align:right;box-shadow:0 8px 20px ${c}55">
            <p style="font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:.85">${d.paid}</p>
            <p style="font-size:30px;font-weight:800;letter-spacing:.5px;line-height:1">${taxMode==="normal"?d._totalVal:d._totalNoVat}</p>
          </div>
        </div>
        ${(taxMode==="reverse"||taxMode==="exempt")?`<p style="font-size:8.5px;color:#94a3b8;margin-top:8px;text-align:right">${taxMode==="reverse"?d.rc_note:d.ex_note}</p>`:''}
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="flex:1">${payblock(d,c)}<div style="margin-top:12px">${notesblock(d,c)}</div></div>
          ${qrblock(d,c,58)}
        </div>
      </div>`;
    }

    else if(curVar==="frame"){
      html=`<div class="paper-inner" style="padding:18px">
        <div style="border:8px solid ${c};border-radius:4px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden">
          <div style="background:${c};color:#fff;padding:20px 30px;display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px"><div style="background:#fff;border-radius:8px;padding:5px">${logo(c,26)}</div><div><p style="font-weight:700;font-size:14px">${SENDER.name}</p><p style="font-size:9px;opacity:.85">${SENDER.addr.join(", ")}</p></div></div>
            <p style="font-size:26px;font-weight:800;letter-spacing:1px">${dt}</p>
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


  return html;
}
