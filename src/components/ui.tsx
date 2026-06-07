"use client";

import { ReactNode } from "react";

// Sayfa başlığı + opsiyonel aksiyon butonu
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Durum etiketi (ödendi/bekliyor/taslak...)
export function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    sent: "bg-blue-50 text-blue-700",
    overdue: "bg-rose-50 text-rose-700",
    draft: "bg-slate-100 text-slate-600",
    active: "bg-emerald-50 text-emerald-700",
    paused: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
      {label}
    </span>
  );
}

// Kart sarmalayıcı
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>;
}

// Boş durum
export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">{icon}</div>
      <p className="font-medium text-slate-900">{title}</p>
      {desc && <p className="text-sm text-slate-500 mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
