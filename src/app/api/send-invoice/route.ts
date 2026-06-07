// Fatura e-postası gönderme API'si (Resend ile).
// PDF eki: canlıda sunucu-tabanlı PDF servisi eklenebilir; şimdilik faturayı
// HTML gövde + (opsiyonel) müşteri portal linki ile gönderir.
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

    const body = await req.json() as {
      to: string; clientName: string; invoiceNo: string; senderName: string; amount: string; lang: string;
      pdfBase64?: string; replyTo?: string;
    };

    const result = await sendInvoiceEmail({
      to: body.to, clientName: body.clientName, invoiceNo: body.invoiceNo,
      senderName: body.senderName, amount: body.amount, lang: body.lang,
      pdfBase64: body.pdfBase64, replyTo: body.replyTo,
    });

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "E-posta gönderilemedi" }, { status: 500 });
  }
}
