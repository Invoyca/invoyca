// Gerçek PDF üretimi endpoint'i.
// @react-pdf/renderer ile sunucu tarafında PDF üretir, dosya olarak döner.
// Oturum kontrolü yapar (sadece giriş yapmış kullanıcı PDF üretebilir).
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePDF, PdfParams } from "@/lib/pdf/InvoicePDF";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Güvenlik: yalnızca giriş yapmış kullanıcı
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

    const body = (await req.json()) as PdfParams & { filename?: string };
    if (!body?.data) return NextResponse.json({ error: "Fatura verisi eksik" }, { status: 400 });

    // PDF'i buffer olarak üret
    const element = React.createElement(InvoicePDF, {
      data: body.data,
      lang: body.lang || "EN",
      docType: body.docType || "invoice",
      taxMode: body.taxMode || "normal",
      themeColor: body.themeColor,
      qrImage: body.qrImage,
    });
    const buffer = await renderToBuffer(element as any);

    const filename = (body.filename || body.data.meta?.no || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_");

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
