// Denetim kaydı yardımcısı. Önemli olayları sessizce kaydeder.
// Hata olursa ana işlemi BOZMAZ (try/catch ile yutulur).
import { prisma } from "@/lib/prisma";

export async function audit(
  companyId: string,
  action: string,
  entityId?: string | null,
  detail?: string | null
) {
  try {
    await (prisma as any).auditLog.create({
      data: { companyId, action, entityId: entityId || null, detail: detail || null },
    });
  } catch {
    // Denetim kaydı kritik değil — başarısız olsa da sessiz geç
  }
}
