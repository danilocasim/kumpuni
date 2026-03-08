"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Home, Briefcase, PlusCircle, User, HelpCircle, LogOut, ChevronDown, Menu, X } from "lucide-react";

type UserRole = "homeowner" | "worker" | "both" | null;

interface NavProps {
  userRole: UserRole;
  isAuthenticated: boolean;
}

function NavLink({
  href,
  active,
  children,
  className = "",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`min-h-touch flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? "text-kumpuni-blue border-t-2 border-action-orange pt-[10px] -mt-[2px]" : "text-text-tertiary"} ${className}`}
    >
      {children}
    </Link>
  );
}

function DesktopNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-bold tracking-wide transition-all rounded-md flex items-center gap-2 ${
        active
          ? "bg-white/10 text-white"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav({ userRole, isAuthenticated }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 flex h-16 lg:h-20 items-center justify-between border-b border-white/10 bg-kumpuni-blue px-4 lg:px-6 shadow-md backdrop-blur-md bg-opacity-95">
        <div className="max-w-screen-2xl mx-auto flex w-full justify-between items-center">
          <Link
            href="/"
            className="font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-action-orange to-orange-500 flex items-center justify-center shadow-inner">
              <span className="text-white text-lg font-black leading-none">K</span>
            </span>
            Kumpuni
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-sm font-bold text-gray-300 hover:text-white transition-colors hidden sm:block tracking-wide"
            >
              Paano Gumagana?
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 font-bold text-sm bg-action-orange text-white rounded-kumpuni-sm hover:bg-orange-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              LOG IN
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const showHomeowner = userRole === "homeowner" || userRole === "both";
  const showWorker = userRole === "worker" || userRole === "both";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 lg:h-20 items-center border-b border-white/10 bg-kumpuni-blue px-4 lg:px-6 shadow-lg shrink-0 backdrop-blur-md bg-opacity-95">
        <div className="max-w-screen-2xl mx-auto flex w-full justify-between items-center">
          <Link
            href={showHomeowner ? "/" : "/worker/dashboard"}
            className="font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-action-orange to-orange-500 flex items-center justify-center shadow-inner">
              <span className="text-white text-lg font-black leading-none">K</span>
            </span>
            <span className="hidden sm:inline-block">Kumpuni</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-2 text-sm font-medium" aria-label="Main navigation">
            <DesktopNavLink href="/" active={pathname === "/"}>
              <Home className="w-4 h-4" /> Home
            </DesktopNavLink>
            {showHomeowner && (
              <DesktopNavLink
                href="/dashboard"
                active={pathname === "/dashboard" || ((pathname?.startsWith("/jobs/") ?? false) && !(pathname?.startsWith("/jobs/new") ?? false))}
              >
                <Briefcase className="w-4 h-4" /> Mga Pinapagawa
              </DesktopNavLink>
            )}
            {showWorker && !showHomeowner && (
              <DesktopNavLink
                href="/worker/jobs"
                active={pathname?.startsWith("/worker/jobs") ?? false}
              >
                <Briefcase className="w-4 h-4" /> Trabahong Nakuha
              </DesktopNavLink>
            )}
            {showHomeowner && (
              <DesktopNavLink href="/jobs/new" active={pathname === "/jobs/new"}>
                <PlusCircle className="w-4 h-4" /> Mag-post
              </DesktopNavLink>
            )}
            
            <div className="h-6 w-px bg-white/20 mx-2" />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer text-white font-bold"
              >
                <div className="w-8 h-8 rounded-full bg-surface-light text-kumpuni-blue flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-action-orange transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <span>Account</span>
                <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-subtle overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 py-1">
                  <Link
                    href={showWorker ? "/worker/dashboard" : "/dashboard"}
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-surface-light hover:text-kumpuni-blue transition-colors font-medium border-b border-subtle"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Aking Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-danger-red hover:bg-danger-light transition-colors font-medium disabled:opacity-50 text-left"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2.5} />
                    {loggingOut ? "Nag-lologout..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </nav>
          
          {/* Mobile Right Edge Placeholder to balance out Kumpuni logo if needed, or put a compact user icon */}
          <div className="lg:hidden flex items-center">
            <Link href={showWorker ? "/worker/dashboard" : "/dashboard"} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20">
               <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom tab bar: only on mobile/tablet (< lg) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-[64px] bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-stretch max-w-[500px] mx-auto pb-[env(safe-area-inset-bottom)] border-t border-subtle"
        aria-label="Main navigation"
      >
        <NavLink href="/" active={pathname === "/"}>
          <Home className={`h-[22px] w-[22px] ${pathname === "/" ? "text-kumpuni-blue" : ""}`} strokeWidth={pathname === "/" ? 3 : 2} />
          <span className="mt-1">Home</span>
        </NavLink>
        {showHomeowner && (
          <NavLink
            href="/dashboard"
            active={
              pathname === "/dashboard" || ((pathname?.startsWith("/jobs/") ?? false) && !(pathname?.startsWith("/jobs/new") ?? false))
            }
          >
            <Briefcase className={`h-[22px] w-[22px] ${pathname === "/dashboard" || ((pathname?.startsWith("/jobs/") ?? false) && !(pathname?.startsWith("/jobs/new") ?? false)) ? "text-kumpuni-blue" : ""}`} strokeWidth={pathname === "/dashboard" || ((pathname?.startsWith("/jobs/") ?? false) && !(pathname?.startsWith("/jobs/new") ?? false)) ? 3 : 2} />
            <span className="mt-1">Trabaho</span>
          </NavLink>
        )}
        {showWorker && !showHomeowner && (
          <NavLink
            href="/worker/jobs"
            active={pathname?.startsWith("/worker/jobs") ?? false}
          >
            <Briefcase className={`h-[22px] w-[22px] ${pathname?.startsWith("/worker/jobs") ? "text-kumpuni-blue" : ""}`} strokeWidth={pathname?.startsWith("/worker/jobs") ? 3 : 2} />
            <span className="mt-1">Trabaho</span>
          </NavLink>
        )}
        {showHomeowner && (
          <NavLink href="/jobs/new" active={pathname === "/jobs/new"} className="relative">
            <div className={`absolute -top-5 w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-md ${pathname === "/jobs/new" ? "bg-action-orange text-white" : "bg-kumpuni-blue text-white"}`}>
              <PlusCircle className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="mt-6">Mag-post</span>
          </NavLink>
        )}
        <NavLink
          href={showWorker ? "/worker/dashboard" : "/dashboard"}
          active={
            showWorker ? pathname === "/worker/dashboard" : false
          }
        >
          <User className={`h-[22px] w-[22px] ${showWorker && pathname === "/worker/dashboard" ? "text-kumpuni-blue" : ""}`} strokeWidth={showWorker && pathname === "/worker/dashboard" ? 3 : 2} />
          <span className="mt-1">Profile</span>
        </NavLink>
      </nav>
    </>
  );
}
