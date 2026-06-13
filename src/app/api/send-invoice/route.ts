// Fatura e-postası gönderme API'si — GÜVENLİ sürüm.
// Frontend yalnızca { invoiceId } gönderir. Backend:
//  1) oturum kullanıcısını alır
//  2) kullanıcının şirketini bulur
//  3) faturanın o şirkete ait olduğunu DOĞRULAR (yatay yetki kontrolü)
//  4) fatura/müşteri/şirket bilgisini DB'den çeker (frontend'e güvenmez)
//  5) PDF'i sunucuda üretir ve e-postaya EK olarak gönderir
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { sendInvoiceEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { InvoicePDF } from "@/lib/pdf/InvoicePDF";
import { dbInvoiceToData, dbTaxMode, dbDocType } from "@/lib/pdf/db-to-data";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1) Oturum
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

    // Frontend SADECE invoiceId (ve istenirse alıcı override) gönderir
    const body = (await req.json()) as { invoiceId?: string; toOverride?: string; subject?: string; customMessage?: string };
    if (!body?.invoiceId) return NextResponse.json({ error: "invoiceId gerekli" }, { status: 400 });

    // 2) Kullanıcının şirketi
    const company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 403 });

    // 2b) ABUSE KORUMASI: e-posta gönderim limiti (EmailLog üzerinden)
    const now = Date.now();
    const lastHour = new Date(now - 60 * 60 * 1000);
    const lastDay = new Date(now - 24 * 60 * 60 * 1000);
    const [hourCount, dayCount] = await Promise.all([
      prisma.emailLog.count({ where: { companyId: company.id, status: "sent", createdAt: { gte: lastHour } } }),
      prisma.emailLog.count({ where: { companyId: company.id, status: "sent", createdAt: { gte: lastDay } } }),
    ]);
    const HOUR_LIMIT = 10, DAY_LIMIT = 30;
    if (hourCount >= HOUR_LIMIT) {
      return NextResponse.json({ error: "Saatlik e-posta gönderim limitine ulaştın. Lütfen biraz sonra tekrar dene." }, { status: 429 });
    }
    if (dayCount >= DAY_LIMIT) {
      return NextResponse.json({ error: "Günlük e-posta gönderim limitine ulaştın. Yarın tekrar deneyebilirsin." }, { status: 429 });
    }

    // 3) Fatura, SADECE bu şirkete aitse gelir (yetki kontrolü burada)
    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, companyId: company.id },
      include: { items: true, client: true, company: true },
    });
    if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı veya yetkiniz yok" }, { status: 404 });

    // 4) Alıcı e-posta: önce override (kullanıcı kendi girdiyse), yoksa müşterininki
    const to = (body.toOverride || invoice.client?.email || "").trim();
    if (!to) return NextResponse.json({ error: "Müşteri e-postası yok" }, { status: 400 });
    // Geçerli e-posta formatı kontrolü
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "Geçersiz alıcı e-posta adresi" }, { status: 400 });
    }

    // DB verisinden PDF/e-posta verisi
    const data = dbInvoiceToData(invoice);
    const lang = String(invoice.language || "TR");

    // 5) PDF üret
    const element = React.createElement(InvoicePDF, {
      data,
      lang,
      docType: dbDocType(invoice.type),
      taxMode: dbTaxMode(invoice.taxMode),
      themeColor: invoice.themeColor,
      qrImage: String((invoice.qrMode || "")).toUpperCase() !== "OFF"
        ? ((invoice as any).qrImage
            || (String((invoice.qrMode || "")).toUpperCase() === "VERIFY"
                ? (company as any).qrVerify
                : (company as any).qrImage)
            || undefined)
        : undefined,
    });
    const pdfBuffer = await renderToBuffer(element as any);
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // E-postayı gönder (PDF ekli)
    const result = await sendInvoiceEmail({
      to,
      clientName: invoice.client?.name || "",
      invoiceNo: invoice.number,
      senderName: company.name,
      amount: data.total,
      lang,
      dueDate: data.meta?.due || "",
      subject: body.subject?.trim() || undefined,
      customMessage: body.customMessage?.trim() || undefined,
      pdfBase64,
      replyTo: company.email || undefined,
    });

    // Gönderim kaydı (denetim + "gönderildi" bilgisi)
    try {
      await prisma.emailLog.create({
        data: {
          companyId: company.id,
          invoiceId: invoice.id,
          toEmail: to,
          subject: `${invoice.number}`,
          status: "sent",
          providerId: result.data?.id || null,
        },
      });
    } catch { /* log başarısız olsa da e-posta gitti, sessiz geç */ }

    // İşlem geçmişine de yaz (fatura detayındaki "Geçmiş" bölümü için)
    try {
      await (prisma as any).auditLog.create({
        data: { companyId: company.id, action: "invoice.emailed", entityId: invoice.id, detail: to },
      });
    } catch { /* sessiz geç */ }

    // Fatura durumunu DRAFT ise SENT yap (gönderildi)
    try {
      if (String(invoice.status).toUpperCase() === "DRAFT") {
        await prisma.invoice.updateMany({
          where: { id: invoice.id, companyId: company.id },
          data: { status: "SENT" as any },
        });
      }
    } catch { /* durum güncellenemese de e-posta gitti */ }

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "E-posta gönderilemedi" }, { status: 500 });
  }
}
