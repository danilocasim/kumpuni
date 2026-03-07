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
      className={`px-3 py-2 text-sm font-body font-semibold text-white transition-colors hover:text-white/90 ${
        active ? "border-b-2 border-action-orange" : ""
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav({ userRole, isAuthenticated }: NavProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 flex h-14 lg:h-16 items-center justify-between border-b border-white/10 bg-kumpuni-blue px-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <Link
          href="/"
          className="font-display text-xl lg:text-2xl font-extrabold tracking-tight text-white"
          style={{ letterSpacing: "-0.5px" }}
        >
          Kumpuni
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/how-it-works"
            className="min-h-touch min-w-touch inline-flex items-center justify-center gap-1 px-2 text-[13px] text-white/80 hover:text-white"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">How it works</span>
          </Link>
          <Link
            href="/login?role=homeowner&next=/jobs/new"
            className="btn-primary min-h-[48px] px-6 text-[15px]"
          >
            LOG IN
          </Link>
        </div>
      </header>
    );
  }

  const showHomeowner = userRole === "homeowner" || userRole === "both";
  const showWorker = userRole === "worker" || userRole === "both";

  return (
    <>
      {/* Header: brand + desktop nav (lg+) */}
      <header className="sticky top-0 z-50 flex h-14 lg:h-16 items-center justify-between border-b border-white/10 bg-kumpuni-blue px-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <Link
            href={showHomeowner ? "/" : "/worker/dashboard"}
            className="font-display text-xl lg:text-2xl font-extrabold tracking-tight text-white"
            style={{ letterSpacing: "-0.5px" }}
          >
            Kumpuni
          </Link>
          <p className="text-[12px] text-white/60 lg:hidden">
            Find your fix
          </p>
        </div>

        {/* Desktop nav: only on lg+ */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          <DesktopNavLink href="/" active={pathname === "/"}>
            Home
          </DesktopNavLink>
          {showHomeowner && (
            <DesktopNavLink
              href="/dashboard"
              active={
                pathname === "/dashboard" || (pathname?.startsWith("/jobs/") ?? false)
              }
            >
              My Jobs
            </DesktopNavLink>
          )}
          {showWorker && !showHomeowner && (
            <DesktopNavLink
              href="/worker/jobs"
              active={pathname?.startsWith("/worker/jobs") ?? false}
            >
              My Jobs
            </DesktopNavLink>
          )}
          {showHomeowner && (
            <DesktopNavLink href="/jobs/new" active={pathname === "/jobs/new"}>
              Post a Job
            </DesktopNavLink>
          )}
          <DesktopNavLink
            href={showWorker ? "/worker/dashboard" : "/dashboard"}
            active={
              pathname === "/worker/dashboard" || pathname === "/dashboard"
            }
          >
            My Profile
          </DesktopNavLink>
        </nav>
      </header>

      {/* Bottom tab bar: only on mobile/tablet (< lg) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-[60px] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex items-stretch max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <NavLink href="/" active={pathname === "/"}>
          <Home className="h-5 w-5" strokeWidth={2} />
          Home
        </NavLink>
        {showHomeowner && (
          <NavLink
            href="/dashboard"
            active={
              pathname === "/dashboard" || (pathname?.startsWith("/jobs/") ?? false)
            }
          >
            <Briefcase className="h-5 w-5" strokeWidth={2} />
            My Jobs
          </NavLink>
        )}
        {showWorker && !showHomeowner && (
          <NavLink
            href="/worker/jobs"
            active={pathname?.startsWith("/worker/jobs") ?? false}
          >
            <Briefcase className="h-5 w-5" strokeWidth={2} />
            My Jobs
          </NavLink>
        )}
        {showHomeowner && (
          <NavLink href="/jobs/new" active={pathname === "/jobs/new"}>
            <PlusCircle className="h-5 w-5" strokeWidth={2} />
            Post Job
          </NavLink>
        )}
        <NavLink
          href={showWorker ? "/worker/dashboard" : "/dashboard"}
          active={
            pathname === "/worker/dashboard" || pathname === "/dashboard"
          }
        >
          <User className="h-5 w-5" strokeWidth={2} />
          Profile
        </NavLink>
      </nav>
    </>
  );
}
