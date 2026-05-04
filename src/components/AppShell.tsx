"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import MobileBottomNav from "./MobileBottomNav";
import AdminSidebar from "./admin/AdminSidebar";
import { X } from "lucide-react";

import type { ReactNode } from "react";

const BANNER_DISMISS_KEY = "fam_banner_dismissed";

function InAppBanner() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/config/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const msg = d?.inAppMessage?.trim();
        if (!msg) return;
        const dismissed = sessionStorage.getItem(BANNER_DISMISS_KEY);
        if (dismissed === msg) return;
        setMessage(msg);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(BANNER_DISMISS_KEY, message);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium"
      style={{
        background: "rgba(200,150,46,0.12)",
        borderBottom: "1px solid rgba(200,150,46,0.25)",
        color: "#E6B84A",
      }}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Landing, auth pages — bare layout, no chrome
  const isLanding = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isLanding || isAuthPage) return <>{children}</>;

  const isAdmin = pathname?.startsWith("/admin");

  // Admin layout — sidebar + header
  if (isAdmin) {
    return (
      <div className="min-h-screen" style={{ background: "#0D1F0D" }}>
        <AppHeader isAdminView onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="flex pt-14 md:pt-16">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <AdminSidebar />
          </aside>
          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed left-0 top-14 z-40 w-64 h-[calc(100vh-3.5rem)] md:hidden overflow-y-auto overflow-x-hidden">
                <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
              </aside>
            </>
          )}
           <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Standard member pages — with in-app banner
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0D1F0D" }}>
      <AppHeader />
      <div className="pt-14 md:pt-16">
        <InAppBanner />
      </div>
       <main className="flex-1 pb-20 md:pb-6">{children}</main>
       <div className="md:hidden">
         <MobileBottomNav />
       </div>
     </div>
   );
 }
