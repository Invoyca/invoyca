import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Invoyca",
  description: "Invoyca gizlilik politikası ve kişisel verilerin işlenmesi hakkında bilgi.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Invoyca</Link>
      <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">Gizlilik Politikası</h1>
      <p className="text-sm text-slate-400 mb-8">Son güncelleme: Haziran 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed text-[15px]">
        <p>Invoyca ("biz"), hizmetimizi kullanırken paylaştığın kişisel verilerin gizliliğine önem verir. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı ve haklarını açıklar.</p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Topladığımız veriler</h2>
          <p>Hesap bilgilerin (ad, e-posta), şirket bilgilerin, oluşturduğun faturalar, müşteri ve ürün kayıtların ile banka/ödeme bilgilerin hesabında saklanır. Bu verileri yalnızca hizmeti sana sunmak için kullanırız.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Verilerin kullanımı</h2>
          <p>Verilerini fatura oluşturma, PDF üretimi ve e-posta gönderimi gibi temel işlevler için kullanırız. Verilerini satmayız ve pazarlama amacıyla üçüncü taraflarla paylaşmayız.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Üçüncü taraf hizmetler</h2>
          <p>Altyapı için Supabase (veritabanı ve kimlik doğrulama) ve e-posta gönderimi için Resend gibi güvenilir hizmet sağlayıcıları kullanırız. Bu sağlayıcılar verilerini yalnızca hizmeti sağlamak için işler.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Haklarin</h2>
          <p>Verilerine erişme, düzeltme ve silinmesini isteme hakkına sahipsin. Hesabını sildiğinde ilişkili verilerin silinir. Talepler için bizimle iletişime geçebilirsin.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">İletişim</h2>
          <p>Gizlilikle ilgili sorular için: <a href="mailto:contact@invoyca.com" className="text-blue-600 hover:underline">contact@invoyca.com</a></p>
        </section>

        <hr className="border-slate-100" />
        <p className="text-sm text-slate-500">Bu politika bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez. Yasal yükümlülüklerin için bir uzmana danışmanı öneririz.</p>
      </div>
    </main>
  );
}
