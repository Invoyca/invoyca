"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");

    // Kayıt için ek doğrulamalar
    if (!isLogin) {
      if (name.trim().length < 2) { setError("Lütfen ad soyad girin."); return; }
      if (password.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
      if (password !== password2) { setError("Şifreler eşleşmiyor."); return; }
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/app/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } }, // ismi kullanıcı profiline yaz
        });
        if (error) throw error;
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

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) throw error;
      // Google'a yönlendirilir; geri dönüşte dashboard'a düşer.
    } catch (err: any) {
      setError(err.message || "Google ile giriş başarısız.");
      setGoogleLoading(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400";

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

          {/* Google ile giriş */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium py-2.5 hover:bg-slate-50 disabled:opacity-60 mb-4">
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google ile {isLogin ? "giriş yap" : "kayıt ol"}
          </button>

          {/* Ayraç */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">veya</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız" className={inputCls} />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-500">E-posta</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Şifre</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputCls} />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-slate-500">Şifre (Tekrar)</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="password" required minLength={6} value={password2} onChange={(e) => setPassword2(e.target.value)}
                    placeholder="••••••••" className={inputCls} />
                </div>
              </div>
            )}

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
