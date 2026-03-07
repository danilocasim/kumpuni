"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, PlusCircle, User, HelpCircle } from "lucide-react";

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
      className={`min-h-touch flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? "text-kumpuni-blue border-t-2 border-action-orange pt-2 -mt-0.5" : "text-muted-gray"} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Nav({ userRole, isAuthenticated }: NavProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-40 border-b border-warm-border-input bg-white px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-lg font-bold text-kumpuni-blue"
        >
          Kumpuni
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/how-it-works"
            className="min-h-touch min-w-touch inline-flex items-center justify-center gap-1 px-2 text-caption text-slate-text hover:text-kumpuni-blue"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Paano ito gumagana?</span>
          </Link>
          <Link
            href="/login?role=homeowner&next=/jobs/new"
            className="btn-primary min-h-[44px] px-4 py-2 text-sm"
          >
            MAG-LOG IN
          </Link>
        </div>
      </nav>
    );
  }

  const showHomeowner = userRole === "homeowner" || userRole === "both";
  const showWorker = userRole === "worker" || userRole === "both";

  return (
    <>
      {/* Top bar: logo only when authenticated (main nav is bottom) */}
      <header className="sticky top-0 z-40 border-b border-warm-border-input bg-white px-4 py-2 flex items-center justify-between md:justify-center">
        <Link
          href={showHomeowner ? "/" : "/worker/dashboard"}
          className="font-heading text-lg font-bold text-kumpuni-blue"
        >
          Kumpuni
        </Link>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-[60px] safe-area-bottom bg-white shadow-nav-top flex items-stretch max-w-[480px] mx-auto"
        aria-label="Main navigation"
      >
        <NavLink href="/" active={pathname === "/"}>
          <Home className="h-5 w-5" strokeWidth={2} />
          Bahay
        </NavLink>
        {showHomeowner && (
          <NavLink
            href="/dashboard"
            active={
              pathname === "/dashboard" || (pathname?.startsWith("/jobs/") ?? false)
            }
          >
            <Briefcase className="h-5 w-5" strokeWidth={2} />
            Mga Job ko
          </NavLink>
        )}
        {showWorker && !showHomeowner && (
          <NavLink
            href="/worker/jobs"
            active={pathname?.startsWith("/worker/jobs") ?? false}
          >
            <Briefcase className="h-5 w-5" strokeWidth={2} />
            Mga Job
          </NavLink>
        )}
        {showHomeowner && (
          <NavLink href="/jobs/new" active={pathname === "/jobs/new"}>
            <PlusCircle className="h-5 w-5" strokeWidth={2} />
            Mag-post
          </NavLink>
        )}
        <NavLink
          href={showWorker ? "/worker/dashboard" : "/dashboard"}
          active={
            pathname === "/worker/dashboard" ||
            pathname === "/dashboard"
          }
        >
          <User className="h-5 w-5" strokeWidth={2} />
          Profile ko
        </NavLink>
      </nav>
    </>
  );
}
