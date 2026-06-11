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
    const body = (await req.json()) as { invoiceId?: string; toOverride?: string };
    if (!body?.invoiceId) return NextResponse.json({ error: "invoiceId gerekli" }, { status: 400 });

    // 2) Kullanıcının şirketi
    const company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 403 });

    // 3) Fatura, SADECE bu şirkete aitse gelir (yetki kontrolü burada)
    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, companyId: company.id },
      include: { items: true, client: true, company: true },
    });
    if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı veya yetkiniz yok" }, { status: 404 });

    // 4) Alıcı e-posta: önce override (kullanıcı kendi girdiyse), yoksa müşterininki
    const to = (body.toOverride || invoice.client?.email || "").trim();
    if (!to) return NextResponse.json({ error: "Müşteri e-postası yok" }, { status: 400 });

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
      pdfBase64,
      replyTo: company.email || undefined,
    });

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "E-posta gönderilemedi" }, { status: 500 });
  }
}
