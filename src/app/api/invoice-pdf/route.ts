// Gerçek PDF üretimi endpoint'i.
// İki mod:
//   1) invoiceId verilirse: DB'den fatura çekilir (SAHİPLİK kontrollü) → güvenli gerçek PDF
//   2) data verilirse: editör önizlemesi → sadece giriş yapmış kullanıcı, geçici PDF
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePDF, PdfParams } from "@/lib/pdf/InvoicePDF";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { dbInvoiceToData, dbTaxMode, dbDocType } from "@/lib/pdf/db-to-data";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Güvenlik: yalnızca giriş yapmış kullanıcı
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

    const body = (await req.json()) as PdfParams & { filename?: string; invoiceId?: string };

    let element: React.ReactElement;
    let filename: string;

    if (body.invoiceId) {
      // ---- GÜVENLİ MOD: DB'den çek, sahipliği doğrula ----
      const company = await prisma.company.findUnique({ where: { userId: user.id } });
      if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 403 });

      const invoice = await prisma.invoice.findFirst({
        where: { id: body.invoiceId, companyId: company.id }, // <-- yatay yetki kontrolü
        include: { items: true, client: true, company: true },
      });
      if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });

      const data = dbInvoiceToData(invoice as any);
      const qrOn = String((invoice as any).qrMode || "").toUpperCase() !== "OFF";
      const verify = String((invoice as any).qrMode || "").toUpperCase() === "VERIFY";
      const qrImage = qrOn
        ? ((invoice as any).qrImage || (verify ? (company as any).qrVerify : (company as any).qrImage) || undefined)
        : undefined;

      element = React.createElement(InvoicePDF, {
        data,
        lang: String((invoice as any).language || "EN"),
        docType: dbDocType((invoice as any).type),
        taxMode: dbTaxMode((invoice as any).taxMode),
        themeColor: (invoice as any).themeColor,
        qrImage,
      });
      filename = (invoice.number || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_");
    } else {
      // ---- ÖNİZLEME MODU: editör datası, geçici PDF ----
      if (!body?.data) return NextResponse.json({ error: "Fatura verisi eksik" }, { status: 400 });
      element = React.createElement(InvoicePDF, {
        data: body.data,
        lang: body.lang || "EN",
        docType: body.docType || "invoice",
        taxMode: body.taxMode || "normal",
        themeColor: body.themeColor,
        qrImage: body.qrImage,
      });
      filename = (body.filename || body.data.meta?.no || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_");
    }

    const buffer = await renderToBuffer(element as any);
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "PDF üretilemedi" }, { status: 500 });
  }
}
