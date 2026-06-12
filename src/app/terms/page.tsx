import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Şartları — Invoyca",
  description: "Invoyca kullanım şartları ve hizmet koşulları.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Invoyca</Link>
      <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">Kullanım Şartları</h1>
      <p className="text-sm text-slate-400 mb-8">Son güncelleme: Haziran 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed text-[15px]">
        <p>Invoyca'yı kullanarak aşağıdaki şartları kabul etmiş olursun. Lütfen dikkatlice oku.</p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Hizmet</h2>
          <p>Invoyca, uluslararası fatura oluşturmana yardımcı olan bir araçtır. Profesyonel PDF faturalar hazırlayabilir, çok dilli ve çok para birimli belgeler oluşturabilirsin. Invoyca bir muhasebe yazılımı veya resmi e-fatura/e-arşiv entegratörü değildir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Erken erişim</h2>
          <p>2026 yılı boyunca Invoyca erken erişim kapsamında ücretsizdir. Ücretli planlar 2027'de başlayacaktır ve değişiklikler önceden duyurulacaktır. Erken erişim sürecinde özellikler değişebilir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Sorumluluğun</h2>
          <p>Oluşturduğun faturaların içeriğinden, vergi hesaplamalarından ve yasal uygunluğundan sen sorumlusun. Vergi ve yasal konularda kendi muhasebecine veya danışmanına başvurmanı öneririz. Invoyca, üretilen belgelerin yasal geçerliliğini garanti etmez.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Kabul edilebilir kullanım</h2>
          <p>Hizmeti spam, dolandırıcılık veya yasa dışı amaçlarla kullanamazsın. E-posta gönderimi kötüye kullanımı önlemek için sınırlandırılmıştır. Kötüye kullanım tespit edilirse hesabın askıya alınabilir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Hizmetin sağlanması</h2>
          <p>Hizmeti olabildiğince kesintisiz sunmaya çalışırız ancak kesintisiz erişim garanti edemeyiz. Hizmeti önceden bildirimde bulunarak değiştirme veya durdurma hakkımızı saklı tutarız.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">İletişim</h2>
          <p>Sorular için: <a href="mailto:contact@invoyca.com" className="text-blue-600 hover:underline">contact@invoyca.com</a></p>
        </section>

        <hr className="border-slate-100" />
        <p className="text-sm text-slate-500">Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez.</p>
      </div>
    </main>
  );
}
