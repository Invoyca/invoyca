"use client";

// Kendi tasarımımız olan onay penceresi (tarayıcının confirm() kutusu yerine).
// Kullanım: const confirm = useConfirm(); ... if (await confirm({ title, message })) { ... }

import { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean; // kırmızı (silme) mi yoksa normal (mavi) mi
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return useContext(Ctx);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const close = (val: boolean) => {
    if (resolver) resolver(val);
    setOpts(null);
    setResolver(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
            <button onClick={() => close(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${opts.danger ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{opts.title}</h2>
            {opts.message && <p className="text-sm text-slate-500 mb-6">{opts.message}</p>}
            <div className="flex gap-2">
              <button onClick={() => close(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {opts.cancelText || "İptal"}
              </button>
              <button onClick={() => close(true)} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white ${opts.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {opts.confirmText || "Tamam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
