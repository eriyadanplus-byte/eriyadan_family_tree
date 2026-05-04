"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Inline SVG icons - pass style as SVG attribute
const TreeIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    className={className}
  >
    <path d="M12 2L8 8h8L12 2z" />
    <path d="M8 8L4 14h8L8 8z" />
    <path d="M16 8l-4 6h8l-4-6z" />
    <line x1="12" y1="14" x2="12" y2="22" />
  </svg>
);
const MenuIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const LogOutIcon = ({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const LayoutDashboardIcon = ({
  size = 13,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

interface SessionUser {
  id: string;
  email: string;
  role: "super_admin" | "editor" | "contributor" | "viewer";
  memberId: string | null;
  name?: string;
}

export default function AppHeader({
  isAdminView = false,
  onMenuToggle,
}: {
  isAdminView?: boolean;
  onMenuToggle?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const lastY = useRef(0);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setSession(d.user))
      .catch(() => {});
  }, []);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setHidden(y > 60 && y > lastY.current);
    lastY.current = y;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const canAdmin =
    session?.role === "super_admin" || session?.role === "editor";

  const navLinks = [
    { href: "/tree", label: "Family Tree" },
    { href: "/search", label: "Search" },
    ...(session?.memberId ? [{ href: "/profile", label: "My Profile" }] : []),
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex h-14 md:h-16 items-center justify-between px-4 md:px-8 transition-transform duration-300 ${hidden ? "md:-translate-y-16" : ""}`}
      style={{
        background: "rgba(13,31,13,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {isAdminView && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <MenuIcon size={20} />
          </button>
        )}
        <Link href="/tree" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(76,175,114,0.18)" }}
          >
            <TreeIcon size={16} color="#81C784" />
          </div>
          <span className="font-display font-semibold text-white text-sm md:text-base tracking-wide hidden sm:block">
            {isAdminView ? "Admin Panel" : "Eriyadan's Legacy"}
          </span>
        </Link>
      </div>

      {/* Centre — desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {!isAdminView &&
          navLinks.map(({ href, label }) => {
            const active =
              pathname === href ||
              (href === "/tree" && pathname?.startsWith("/tree"));
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active ? "text-white bg-white/10" : "hover:text-white hover:bg-white/5"}`}
                style={{ color: active ? "#fff" : "rgba(232,245,233,0.55)" }}
              >
                {label}
              </Link>
            );
          })}
        {isAdminView && (
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: "rgba(232,245,233,0.55)" }}
          >
            Dashboard
          </Link>
        )}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2">
        {canAdmin && !isAdminView && (
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: "rgba(200,150,46,0.12)",
              color: "#E6B84A",
              border: "1px solid rgba(200,150,46,0.20)",
            }}
          >
            <LayoutDashboardIcon size={13} /> Admin
          </Link>
        )}
        {isAdminView && (
          <Link
            href="/tree"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: "rgba(76,175,114,0.10)",
              color: "#81C784",
              border: "1px solid rgba(76,175,114,0.20)",
            }}
          >
            <TreeIcon size={13} color="#81C784" /> Tree View
          </Link>
        )}

        {session ? (
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5">
              {session.memberId ? (
                <Link
                  href="/profile"
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase transition-colors"
                  style={{
                    background: "rgba(76,175,114,0.12)",
                    borderColor: "rgba(76,175,114,0.25)",
                    color: "#81C784",
                  }}
                  title={session.name || session.email}
                >
                  {(session.name || session.email).charAt(0)}
                </Link>
              ) : (
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase"
                  style={{
                    background: "rgba(200,150,46,0.12)",
                    borderColor: "rgba(200,150,46,0.25)",
                    color: "#E6B84A",
                  }}
                  title="Not linked to a family profile yet"
                >
                  {(session.name || session.email).charAt(0)}
                </div>
              )}
              <span className="text-[10px] text-white/50 leading-none">{session.name || session.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "rgba(76,175,114,0.15)",
              color: "#81C784",
              border: "1px solid rgba(76,175,114,0.22)",
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
