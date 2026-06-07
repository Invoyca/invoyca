"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { Logo } from "./Logo";
import {
  LayoutDashboard, FileText, FileCheck, Users, Package,
  RefreshCw, BarChart3, LayoutTemplate, Settings, Sparkles,
} from "lucide-react";

const NAV = [
  { key: "nav_dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { key: "nav_invoices", href: "/app/invoices", icon: FileText },
  { key: "nav_quotes", href: "/app/quotes", icon: FileCheck },
  { key: "nav_clients", href: "/app/clients", icon: Users },
  { key: "nav_products", href: "/app/products", icon: Package },
  { key: "nav_recurring", href: "/app/recurring", icon: RefreshCw },
  { key: "nav_reports", href: "/app/reports", icon: BarChart3 },
  { key: "nav_templates", href: "/app/templates", icon: LayoutTemplate },
  { key: "nav_settings", href: "/app/settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <>
      {/* Mobil arka plan karartması */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${open ? "" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
          <Logo size={36} />
          <span className="font-semibold tracking-tight text-[15px]">Invoyca</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm font-medium overflow-y-auto">
          {NAV.map(({ key, href, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={key}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold">{t("free_plan")}</p>
            </div>
            <p className="text-sm mt-1.5 leading-snug">{t("plan_usage")}</p>
            <p className="text-[11px] mt-2 opacity-80">{t("upgrade")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
