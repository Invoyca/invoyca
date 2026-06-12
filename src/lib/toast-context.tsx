"use client";

// Şık toast bildirimleri (tarayıcının alert() kutusu yerine).
// Kullanım: const toast = useToast(); toast.success("Kaydedildi"); toast.error("Hata: ...");
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const Ctx = createContext<ToastApi>({ success: () => {}, error: () => {}, info: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems((list) => [...list, { id, kind, message }]);
    // Hata mesajları biraz daha uzun dursun
    const ms = kind === "error" ? 6000 : 3500;
    setTimeout(() => remove(id), ms);
  }, [remove]);

  const api: ToastApi = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Toast yığını — sağ üst */}
      <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {items.map((t) => {
          const cfg =
            t.kind === "success" ? { icon: CheckCircle2, ring: "border-emerald-200", bar: "bg-emerald-500", ic: "text-emerald-600" } :
            t.kind === "error" ? { icon: XCircle, ring: "border-rose-200", bar: "bg-rose-500", ic: "text-rose-600" } :
            { icon: Info, ring: "border-blue-200", bar: "bg-blue-500", ic: "text-blue-600" };
          const Icon = cfg.icon;
          return (
            <div key={t.id}
              className={`pointer-events-auto relative overflow-hidden bg-white rounded-xl shadow-lg border ${cfg.ring} pl-4 pr-9 py-3 flex items-start gap-3 animate-in`}
              style={{ animation: "invoycaToastIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.ic}`} />
              <p className="text-sm text-slate-700 leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
