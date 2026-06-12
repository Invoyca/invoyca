// E-posta gönderimi — Resend ile. RESEND_API_KEY .env'de tanımlı olmalı.
import { Resend } from "resend";

export type SendInvoiceEmailInput = {
  to: string; clientName: string; invoiceNo: string;
  senderName: string; amount: string; lang: string;
  dueDate?: string;
  pdfBase64?: string;
  replyTo?: string;
};

const SUBJECTS: Record<string, (no: string, s: string) => string> = {
  TR: (no, s) => `${s} — Fatura ${no}`, EN: (no, s) => `${s} — Invoice ${no}`,
  DE: (no, s) => `${s} — Rechnung ${no}`, NL: (no, s) => `${s} — Factuur ${no}`,
  FR: (no, s) => `${s} — Facture ${no}`, ES: (no, s) => `${s} — Factura ${no}`,
  IT: (no, s) => `${s} — Fattura ${no}`,
};

// Profesyonel, çok dilli e-posta gövdesi (vade + ödeme notu)
type BodyArgs = { client: string; no: string; amount: string; due: string; sender: string };
const T: Record<string, { hello: string; amount: string; due: string; note: string; regards: string }> = {
  TR: { hello: "Merhaba", amount: "Tutar", due: "Vade tarihi", note: "Ödeme bilgileri faturada yer almaktadır.", regards: "İyi çalışmalar" },
  EN: { hello: "Hello", amount: "Amount", due: "Due date", note: "Payment details are included in the invoice.", regards: "Best regards" },
  DE: { hello: "Hallo", amount: "Betrag", due: "Fälligkeitsdatum", note: "Die Zahlungsdaten finden Sie in der Rechnung.", regards: "Mit freundlichen Grüßen" },
  NL: { hello: "Hallo", amount: "Bedrag", due: "Vervaldatum", note: "Betaalgegevens staan in de factuur.", regards: "Met vriendelijke groet" },
  FR: { hello: "Bonjour", amount: "Montant", due: "Échéance", note: "Les informations de paiement figurent sur la facture.", regards: "Cordialement" },
  ES: { hello: "Hola", amount: "Importe", due: "Vencimiento", note: "Los datos de pago están en la factura.", regards: "Un saludo" },
  IT: { hello: "Ciao", amount: "Importo", due: "Scadenza", note: "I dati di pagamento sono nella fattura.", regards: "Cordiali saluti" },
};
const INTRO_LINE: Record<string, (no: string) => string> = {
  TR: (no) => `${no} numaralı faturayı ekte bulabilirsin.`,
  EN: (no) => `Please find attached invoice ${no} for the services provided.`,
  DE: (no) => `Im Anhang finden Sie die Rechnung ${no}.`,
  NL: (no) => `In de bijlage vind je factuur ${no}.`,
  FR: (no) => `Veuillez trouver ci-jointe la facture ${no}.`,
  ES: (no) => `Adjuntamos la factura ${no} por los servicios prestados.`,
  IT: (no) => `In allegato trovi la fattura ${no} per i servizi forniti.`,
};

function buildBody(lang: string, a: BodyArgs): string {
  const t = T[lang] || T.EN;
  const introLine = (INTRO_LINE[lang] || INTRO_LINE.EN)(a.no);
  const dueRow = a.due ? `<tr><td style="padding:2px 24px 2px 0;color:#64748b">${t.due}</td><td style="padding:2px 0;font-weight:600">${a.due}</td></tr>` : "";
  return `<div style="font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;font-size:15px;line-height:1.6">
    <p>${t.hello} ${a.client},</p>
    <p>${introLine}</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:2px 24px 2px 0;color:#64748b">${t.amount}</td><td style="padding:2px 0;font-weight:700;font-size:16px">${a.amount}</td></tr>
      ${dueRow}
    </table>
    <p style="color:#475569;font-size:14px">${t.note}</p>
    <p style="margin-top:24px">${t.regards},<br><b>${a.sender}</b></p>
  </div>`;
}

export async function sendInvoiceEmail(input: SendInvoiceEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const lang = SUBJECTS[input.lang] ? input.lang : "EN";

  // XSS koruması: kullanıcı verisi e-posta HTML'ine girmeden önce escape edilir.
  const esc = (v: unknown) => String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clientName = esc(input.clientName);
  const invoiceNo = esc(input.invoiceNo);
  const senderName = esc(input.senderName);
  const amount = esc(input.amount);
  const dueDate = esc(input.dueDate || "");

  const attachments = input.pdfBase64
    ? [{ filename: `${invoiceNo}.pdf`, content: input.pdfBase64 }]
    : undefined;

  const from = process.env.INVOICE_FROM_EMAIL || "Invoyca <onboarding@resend.dev>";

  return await resend.emails.send({
    from,
    to: input.to,
    replyTo: input.replyTo || undefined,
    subject: SUBJECTS[lang](invoiceNo, senderName),
    html: buildBody(lang, { client: clientName, no: invoiceNo, amount, due: dueDate, sender: senderName }),
    attachments,
  });
}
