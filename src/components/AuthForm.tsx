"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { Mail, Lock, Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/app/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // E-posta doğrulama kapalıysa oturum hemen açılır → dashboard'a git.
        if (data.session) {
          router.push("/app/dashboard");
          router.refresh();
        } else {
          setMessage("Kayıt başarılı! E-postanı kontrol et (doğrulama gerekebilir).");
        }
      }
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F1F4F9" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo size={40} />
          <span className="font-semibold text-lg tracking-tight">Invoyca</span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">
            {isLogin ? "Tekrar hoş geldin" : "Hesap oluştur"}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {isLogin ? "Hesabına giriş yap." : "Dünyaya fatura kesmeye başla."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">E-posta</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Şifre</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            {message && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{message}</p>}

            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold py-2.5 hover:bg-blue-700 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            {isLogin ? (
              <>Hesabın yok mu? <Link href="/signup" className="text-blue-600 font-medium hover:underline">Kayıt ol</Link></>
            ) : (
              <>Zaten hesabın var mı? <Link href="/login" className="text-blue-600 font-medium hover:underline">Giriş yap</Link></>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/" className="hover:text-slate-600">← Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  );
}
