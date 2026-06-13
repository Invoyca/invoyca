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
        logoUrl: (company as any).logoUrl || undefined,
      });
      filename = (invoice.number || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_");
    } else {
      // ---- ÖNİZLEME MODU: editör datası, geçici PDF ----
      if (!body?.data) return NextResponse.json({ error: "Fatura verisi eksik" }, { status: 400 });

      // Bellek/kötüye kullanım koruması: önizleme verisine sınırlar koy
      const d: any = body.data;
      if (Array.isArray(d.items) && d.items.length > 100) {
        return NextResponse.json({ error: "Çok fazla kalem (max 100)." }, { status: 400 });
      }
      // Serbest metin alanları aşırı uzun olmasın
      const tooLong = [d.subtitle, d.userNotes, d.userTerms].some((x: any) => typeof x === "string" && x.length > 5000);
      if (tooLong) {
        return NextResponse.json({ error: "Metin alanı çok uzun (max 5.000 karakter)." }, { status: 400 });
      }
      // Logo / QR data URL boyut sınırı (base64 ~ 1.37x; 2MB ≈ 2.9M karakter, 1MB ≈ 1.45M)
      if (typeof (body as any).logoUrl === "string" && (body as any).logoUrl.length > 2_900_000) {
        return NextResponse.json({ error: "Logo çok büyük (max 2 MB)." }, { status: 400 });
      }
      if (typeof body.qrImage === "string" && body.qrImage.length > 1_450_000) {
        return NextResponse.json({ error: "QR çok büyük (max 1 MB)." }, { status: 400 });
      }

      element = React.createElement(InvoicePDF, {
        data: body.data,
        lang: body.lang || "EN",
        docType: body.docType || "invoice",
        taxMode: body.taxMode || "normal",
        themeColor: body.themeColor,
        qrImage: body.qrImage,
        logoUrl: (body as any).logoUrl,
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
