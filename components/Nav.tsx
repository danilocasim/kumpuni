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
      className={`px-1 py-1 text-sm font-medium transition-colors ${
        active
          ? "text-white border-b-2 border-action-orange"
          : "text-gray-300 hover:text-white"
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
      <header className="sticky top-0 z-50 flex h-14 lg:h-16 items-center justify-between border-b border-white/10 bg-kumpuni-blue px-4 lg:px-6 shadow-md">
        <div className="max-w-screen-2xl mx-auto flex w-full justify-between items-center">
          <Link
            href="/"
            className="font-display text-xl lg:text-2xl font-bold tracking-tight text-white"
          >
            Kumpuni
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Paano Gumagana?
            </Link>
            <Link
              href="/login?role=homeowner&next=/jobs/new"
              className="px-5 py-2 font-bold text-sm bg-action-orange text-white rounded-md hover:bg-opacity-90 transition-colors shadow-sm"
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
      <header className="sticky top-0 z-50 flex h-14 lg:h-16 items-center border-b border-white/10 bg-kumpuni-blue px-4 lg:px-6 shadow-md shrink-0">
        <div className="max-w-screen-2xl mx-auto flex w-full justify-between items-center">
          <Link
            href={showHomeowner ? "/" : "/worker/dashboard"}
            className="font-display text-xl lg:text-2xl font-bold tracking-tight text-white"
          >
            Kumpuni
          </Link>

          <nav className="hidden lg:flex space-x-8 text-sm font-medium" aria-label="Main navigation">
            <DesktopNavLink href="/" active={pathname === "/"}>
              Home
            </DesktopNavLink>
            {showHomeowner && (
              <DesktopNavLink
                href="/dashboard"
                active={pathname === "/dashboard" || (pathname?.startsWith("/jobs/") && !pathname?.startsWith("/jobs/new"))}
              >
                Mga Pinapagawa
              </DesktopNavLink>
            )}
            {showWorker && !showHomeowner && (
              <DesktopNavLink
                href="/worker/jobs"
                active={pathname?.startsWith("/worker/jobs") ?? false}
              >
                Trabahong Nakuha
              </DesktopNavLink>
            )}
            {showHomeowner && (
              <DesktopNavLink href="/jobs/new" active={pathname === "/jobs/new"}>
                Mag-post
              </DesktopNavLink>
            )}
            <DesktopNavLink
              href={showWorker ? "/worker/dashboard" : "/dashboard"}
              active={showWorker ? pathname === "/worker/dashboard" : false}
            >
              Profile
            </DesktopNavLink>
          </nav>
        </div>
      </header>

      {/* Bottom tab bar: only on mobile/tablet (< lg) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-[60px] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.1)] flex items-stretch max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <NavLink href="/" active={pathname === "/"}>
          <Home className="h-5 w-5" strokeWidth={2.5} />
          Home
        </NavLink>
        {showHomeowner && (
          <NavLink
            href="/dashboard"
            active={
              pathname === "/dashboard" || (pathname?.startsWith("/jobs/") && !pathname?.startsWith("/jobs/new"))
            }
          >
            <Briefcase className="h-5 w-5" strokeWidth={2.5} />
            Trabaho
          </NavLink>
        )}
        {showWorker && !showHomeowner && (
          <NavLink
            href="/worker/jobs"
            active={pathname?.startsWith("/worker/jobs") ?? false}
          >
            <Briefcase className="h-5 w-5" strokeWidth={2.5} />
            Trabaho
          </NavLink>
        )}
        {showHomeowner && (
          <NavLink href="/jobs/new" active={pathname === "/jobs/new"}>
            <PlusCircle className="h-5 w-5" strokeWidth={2.5} />
            Mag-post
          </NavLink>
        )}
        <NavLink
          href={showWorker ? "/worker/dashboard" : "/dashboard"}
          active={
            showWorker ? pathname === "/worker/dashboard" : false
          }
        >
          <User className="h-5 w-5" strokeWidth={2.5} />
          Profile
        </NavLink>
      </nav>
    </>
  );
}
