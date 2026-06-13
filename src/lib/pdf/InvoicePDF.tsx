// Gerçek PDF üretimi — @react-pdf/renderer ile.
// Vercel serverless'te hızlı (<400ms) ve güvenilir çalışır; Chromium gerektirmez.
// Çok dilli (7 dil) ve çok para birimli. Reverse charge / muaf / normal vergi destekli.
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { InvoiceData } from "@/lib/templates/render";
import { TPL_LABELS } from "@/lib/templates/data";
import path from "path";

// Türkçe, Almanca, Fransızca vb. tüm karakterleri destekleyen font (Noto Sans).
// Helvetica çok dilli karakterleri (ş, ç, ı, ä, ö, é...) bozuk gösterdiği için şart.
// public/fonts altındaki ttf'ler sunucu tarafında okunur.
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  try {
    const base = path.join(process.cwd(), "public", "fonts");
    Font.register({
      family: "NotoSans",
      fonts: [
        { src: path.join(base, "NotoSans-Regular.ttf"), fontWeight: "normal" },
        { src: path.join(base, "NotoSans-Bold.ttf"), fontWeight: "bold" },
      ],
    });
    // Satır sonu kelime bölme uyarılarını azalt
    Font.registerHyphenationCallback((word) => [word]);
    fontsRegistered = true;
  } catch {
    // Font yüklenemezse React-PDF varsayılana düşer (bozuk karakter riski olsa da çökmez)
  }
}

// PDF'e gönderilecek parametreler
export type PdfParams = {
  data: InvoiceData;
  lang: string;
  docType: "invoice" | "quote" | "proforma" | "commercial";
  taxMode: "normal" | "reverse" | "exempt";
  themeColor?: string; // hex, ör. "#1D4ED8"
  qrImage?: string;    // kullanıcının yüklediği QR (base64 data URL)
  logoUrl?: string;    // kullanıcının yüklediği logo (base64 data URL)
};

// Tema renkleri (editördeki theme id → hex)
const THEME_HEX: Record<string, string> = {
  blue: "#1D4ED8", slate: "#0F172A", emerald: "#059669", violet: "#7C3AED", rose: "#E11D48",
};

export function InvoicePDF({ data, lang, docType, taxMode, themeColor, qrImage, logoUrl }: PdfParams) {
  ensureFonts();
  const L = (TPL_LABELS as any)[lang] || (TPL_LABELS as any).EN;
  const accent = themeColor || THEME_HEX.blue;

  // Başlık (belge türü)
  const docTitle =
    docType === "quote" ? L.quote :
    docType === "proforma" ? L.proforma :
    docType === "commercial" ? L.commercial : L.invoice;

  const styles = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 50, paddingHorizontal: 40, fontSize: 9, color: "#334155", fontFamily: "NotoSans", lineHeight: 1.5 },
    // Üst başlık
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
    brand: { flexDirection: "row", alignItems: "center" },
    logoMark: { width: 26, height: 26, borderRadius: 6, backgroundColor: accent, marginRight: 8 },
    logoImg: { maxWidth: 90, maxHeight: 32, marginRight: 8, objectFit: "contain" },
    brandName: { fontSize: 15, fontFamily: "NotoSans", fontWeight: "bold", color: "#0F172A" },
    docTitle: { fontSize: 22, fontFamily: "NotoSans", fontWeight: "bold", color: accent, textAlign: "right", lineHeight: 1 },
    docSubtitle: { fontSize: 8.5, color: "#94A3B8", textAlign: "right", marginTop: 3, maxWidth: 220 },
    docNo: { fontSize: 9, color: "#64748B", textAlign: "right", marginTop: 6 },
    // Taraf blokları
    parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
    party: { width: "48%" },
    lbl: { fontSize: 7.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "NotoSans", fontWeight: "bold", marginBottom: 4 },
    partyName: { fontSize: 10, fontFamily: "NotoSans", fontWeight: "bold", color: "#0F172A", marginBottom: 2 },
    addrLine: { fontSize: 8.5, color: "#475569" },
    // Meta kutusu
    metaBox: { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 6, padding: 10, marginBottom: 20 },
    metaCol: { flex: 1 },
    metaLbl: { fontSize: 7, color: "#94A3B8", textTransform: "uppercase", fontFamily: "NotoSans", fontWeight: "bold" },
    metaVal: { fontSize: 9, color: "#0F172A", marginTop: 1 },
    // Tablo
    tHead: { flexDirection: "row", backgroundColor: accent, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
    tHeadCell: { color: "#FFFFFF", fontSize: 8, fontFamily: "NotoSans", fontWeight: "bold" },
    tRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
    cDesc: { width: "44%" },
    cUnit: { width: "12%", textAlign: "center" },
    cQty: { width: "10%", textAlign: "center" },
    cPrice: { width: "17%", textAlign: "right" },
    cAmount: { width: "17%", textAlign: "right" },
    cellTxt: { fontSize: 8.5, color: "#334155" },
    // Toplamlar
    totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
    totals: { width: "50%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLbl: { fontSize: 9, color: "#64748B" },
    totalVal: { fontSize: 9, color: "#334155" },
    grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 8, backgroundColor: "#F8FAFC", borderRadius: 4, marginTop: 4 },
    grandLbl: { fontSize: 10, fontFamily: "NotoSans", fontWeight: "bold", color: accent },
    grandVal: { fontSize: 11, fontFamily: "NotoSans", fontWeight: "bold", color: accent },
    // Notlar / vergi notu
    noteBox: { marginTop: 18, padding: 8, backgroundColor: "#FFFBEB", borderRadius: 4, borderLeftWidth: 2, borderLeftColor: "#F59E0B" },
    noteTxt: { fontSize: 8, color: "#92400E" },
    userNoteWrap: { marginTop: 14, flexDirection: "row", gap: 24 },
    userNoteBlock: { flex: 1 },
    userNoteLbl: { fontSize: 8, fontWeight: 600, color: "#64748B", marginBottom: 2 },
    userNoteTxt: { fontSize: 8.5, color: "#475569", lineHeight: 1.5 },
    // Banka / ödeme
    payBox: { marginTop: 18, flex: 1 },
    payRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 16 },
    qrBox: { marginTop: 18, alignItems: "center" },
    qrImg: { width: 72, height: 72, objectFit: "contain" },
    payTitle: { fontSize: 7.5, color: "#94A3B8", textTransform: "uppercase", fontFamily: "NotoSans", fontWeight: "bold", marginBottom: 4 },
    payTxt: { fontSize: 8.5, color: "#475569" },
    // Footer
    footer: { position: "absolute", bottom: 24, left: 40, right: 40, textAlign: "center", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 8 },
    footerTxt: { fontSize: 7.5, color: "#94A3B8" },
  });

  const isReverse = taxMode === "reverse";
  const isExempt = taxMode === "exempt";
  // total: normalde vergili toplam; reverse/exempt'te vergisiz toplam gösterilir
  const grandTotal = (isReverse || isExempt) ? data.totalReverse : data.total;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Üst başlık */}
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImg} />
            ) : (
              <View style={styles.logoMark} />
            )}
            <Text style={styles.brandName}>{data.sender.name || "Invoyca"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docTitle}>{docTitle}</Text>
            {(data as any).subtitle ? <Text style={styles.docSubtitle}>{(data as any).subtitle}</Text> : null}
            <Text style={styles.docNo}>{L.invno}: {data.meta.no}</Text>
          </View>
        </View>

        {/* Gönderen / Alıcı */}
        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.lbl}>{L.from}</Text>
            <Text style={styles.partyName}>{data.sender.name}</Text>
            {data.sender.addr.filter(Boolean).map((line, i) => <Text key={i} style={styles.addrLine}>{line}</Text>)}
            {data.sender.vat ? <Text style={styles.addrLine}>{L.vatid}: {data.sender.vat}</Text> : null}
            {data.sender.email ? <Text style={styles.addrLine}>{data.sender.email}</Text> : null}
          </View>
          <View style={styles.party}>
            <Text style={styles.lbl}>{L.billto}</Text>
            <Text style={styles.partyName}>{data.client.name}</Text>
            {data.client.addr.filter(Boolean).map((line, i) => <Text key={i} style={styles.addrLine}>{line}</Text>)}
            {data.client.vat ? <Text style={styles.addrLine}>{L.vatid}: {data.client.vat}</Text> : null}
            {data.client.email ? <Text style={styles.addrLine}>{data.client.email}</Text> : null}
          </View>
        </View>

        {/* Meta: tarih / vade / referans */}
        <View style={styles.metaBox}>
          <View style={styles.metaCol}><Text style={styles.metaLbl}>{L.issue}</Text><Text style={styles.metaVal}>{data.meta.issue || "-"}</Text></View>
          <View style={styles.metaCol}><Text style={styles.metaLbl}>{L.due}</Text><Text style={styles.metaVal}>{data.meta.due || "-"}</Text></View>
          {data.meta.ref ? <View style={styles.metaCol}><Text style={styles.metaLbl}>{L.ref}</Text><Text style={styles.metaVal}>{data.meta.ref}</Text></View> : null}
        </View>

        {/* Kalem tablosu */}
        <View>
          <View style={styles.tHead}>
            <Text style={[styles.tHeadCell, styles.cDesc]}>{L.desc}</Text>
            <Text style={[styles.tHeadCell, styles.cUnit]}>{L.unit}</Text>
            <Text style={[styles.tHeadCell, styles.cQty]}>{L.qty}</Text>
            <Text style={[styles.tHeadCell, styles.cPrice]}>{L.price}</Text>
            <Text style={[styles.tHeadCell, styles.cAmount]}>{L.amount}</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tRow} wrap={false}>
              <Text style={[styles.cellTxt, styles.cDesc]}>{it[0]}</Text>
              <Text style={[styles.cellTxt, styles.cUnit]}>{it[1]}</Text>
              <Text style={[styles.cellTxt, styles.cQty]}>{it[2]}</Text>
              <Text style={[styles.cellTxt, styles.cPrice]}>{it[3]}</Text>
              <Text style={[styles.cellTxt, styles.cAmount]}>{it[4]}</Text>
            </View>
          ))}
        </View>

        {/* Toplamlar */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}><Text style={styles.totalLbl}>{L.subtotal}</Text><Text style={styles.totalVal}>{data.subtotal}</Text></View>
            {!isReverse && !isExempt ? (
              <View style={styles.totalRow}><Text style={styles.totalLbl}>{L.vat}</Text><Text style={styles.totalVal}>{data.vat}</Text></View>
            ) : (
              <View style={styles.totalRow}><Text style={styles.totalLbl}>{isReverse ? L.reverse : L.exempt}</Text><Text style={styles.totalVal}>—</Text></View>
            )}
            <View style={styles.grandRow}><Text style={styles.grandLbl}>{L.total}</Text><Text style={styles.grandVal}>{grandTotal}</Text></View>
          </View>
        </View>

        {/* Vergi notu (reverse/exempt) */}
        {(isReverse || isExempt) ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteTxt}>{isReverse ? L.rc_note : L.ex_note}</Text>
          </View>
        ) : null}

        {/* Müşteri notu + ödeme şartları (kullanıcı girdiyse) */}
        {((data as any).userNotes || (data as any).userTerms) ? (
          <View style={styles.userNoteWrap}>
            {(data as any).userNotes ? (
              <View style={styles.userNoteBlock}>
                <Text style={styles.userNoteLbl}>{L.notes}</Text>
                <Text style={styles.userNoteTxt}>{(data as any).userNotes}</Text>
              </View>
            ) : null}
            {(data as any).userTerms ? (
              <View style={styles.userNoteBlock}>
                <Text style={styles.userNoteLbl}>{L.terms}</Text>
                <Text style={styles.userNoteTxt}>{(data as any).userTerms}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Ödeme / banka bilgileri + QR */}
        {(data.bank.iban || data.bank.name || qrImage) ? (
          <View style={styles.payRow}>
            {(data.bank.iban || data.bank.name) ? (
              <View style={styles.payBox}>
                <Text style={styles.payTitle}>{L.payinfo}</Text>
                {data.bank.name ? <Text style={styles.payTxt}>{L.bank}: {data.bank.name}</Text> : null}
                {data.bank.iban ? <Text style={styles.payTxt}>IBAN: {data.bank.iban}</Text> : null}
                {data.bank.swift ? <Text style={styles.payTxt}>SWIFT/BIC: {data.bank.swift}</Text> : null}
              </View>
            ) : <View style={styles.payBox} />}
            {qrImage ? (
              <View style={styles.qrBox}>
                <Image src={qrImage} style={styles.qrImg} />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTxt}>{L.thanks}  ·  {data.sender.name}  ·  Invoyca</Text>
        </View>
      </Page>
    </Document>
  );
}
