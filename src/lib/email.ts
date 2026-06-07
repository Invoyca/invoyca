// E-posta gönderimi — Resend ile. RESEND_API_KEY .env'de tanımlı olmalı.
import { Resend } from "resend";

export type SendInvoiceEmailInput = {
  to: string; clientName: string; invoiceNo: string;
  senderName: string; amount: string; lang: string;
  pdfBase64?: string;
  replyTo?: string;
};

const SUBJECTS: Record<string, (no: string, s: string) => string> = {
  TR: (no, s) => `${s} — Fatura ${no}`, EN: (no, s) => `${s} — Invoice ${no}`,
  DE: (no, s) => `${s} — Rechnung ${no}`, NL: (no, s) => `${s} — Factuur ${no}`,
  FR: (no, s) => `${s} — Facture ${no}`, ES: (no, s) => `${s} — Factura ${no}`,
  IT: (no, s) => `${s} — Fattura ${no}`,
};
const BODIES: Record<string, (c: string, no: string, amt: string) => string> = {
  TR: (c, no, amt) => `Merhaba ${c},<br><br>${no} numaralı faturanız hazır. Tutar: <b>${amt}</b>.<br><br>Teşekkürler.`,
  EN: (c, no, amt) => `Hello ${c},<br><br>Invoice ${no} is ready. Amount: <b>${amt}</b>.<br><br>Thank you.`,
  DE: (c, no, amt) => `Hallo ${c},<br><br>Rechnung ${no} ist bereit. Betrag: <b>${amt}</b>.<br><br>Vielen Dank.`,
  NL: (c, no, amt) => `Hallo ${c},<br><br>Factuur ${no} is klaar. Bedrag: <b>${amt}</b>.<br><br>Bedankt.`,
  FR: (c, no, amt) => `Bonjour ${c},<br><br>La facture ${no} est prête. Montant : <b>${amt}</b>.<br><br>Merci.`,
  ES: (c, no, amt) => `Hola ${c},<br><br>La factura ${no} está lista. Importe: <b>${amt}</b>.<br><br>Gracias.`,
  IT: (c, no, amt) => `Ciao ${c},<br><br>La fattura ${no} è pronta. Importo: <b>${amt}</b>.<br><br>Grazie.`,
};

export async function sendInvoiceEmail(input: SendInvoiceEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const lang = SUBJECTS[input.lang] ? input.lang : "EN";
  const attachments = input.pdfBase64
    ? [{ filename: `${input.invoiceNo}.pdf`, content: input.pdfBase64 }]
    : undefined;

  // Gönderen adresi doğrulanmış domainden gelmeli. .env'de FROM tanımlı değilse
  // Resend'in test adresi kullanılır (sadece test için).
  const from = process.env.INVOICE_FROM_EMAIL || "Invoyca <onboarding@resend.dev>";

  return await resend.emails.send({
    from,
    to: input.to,
    replyTo: input.replyTo || undefined, // müşteri yanıtı kullanıcıya gitsin
    subject: SUBJECTS[lang](input.invoiceNo, input.senderName),
    html: BODIES[lang](input.clientName, input.invoiceNo, input.amount),
    attachments,
  });
}
