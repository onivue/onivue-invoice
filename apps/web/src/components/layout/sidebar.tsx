import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  LayoutDashboard,
  LogOutIcon,
  MoreHorizontal,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Rechnungen", icon: FileText },
  { to: "/customers", label: "Kunden", icon: Users },
  { to: "/products", label: "Produkte", icon: Package },
  { to: "/settings", label: "Einstellungen", icon: Settings },
  { to: "/account", label: "Account", icon: UserCircle },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      className={cn(
        "hidden md:flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        sidebarOpen ? "w-52" : "w-12",
      )}
    >
      {/* logo + toggle */}
      <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-2">
        {sidebarOpen && (
          <span className="font-serif text-sm font-medium text-foreground tracking-wide px-1">
            oni-invoice
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && "mx-auto")}
          aria-label="sidebar umschalten"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </Button>
      </div>

      {/* nav items */}
      <nav className="flex flex-col gap-0.5 p-1.5 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-xs transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <>
                <Icon className="size-3.5 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </>
            </Link>
          );
        })}
      </nav>

      {/* sign out */}
      <div className="border-t border-sidebar-border p-1.5">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          title={!sidebarOpen ? "Abmelden" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            !sidebarOpen && "justify-center",
          )}
        >
          <LogOutIcon className="size-3.5 shrink-0" />
          {sidebarOpen && <span>Abmelden</span>}
        </button>
      </div>
    </aside>
  );
}

const mobileMainNav = navItems.filter(({ to }) => to !== "/settings" && to !== "/account");

export function MobileNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [moreOpen]);

  async function handleSignOut() {
    setMoreOpen(false);
    await authClient.signOut();
    window.location.href = "/login";
  }

  const isMoreActive = currentPath.startsWith("/settings") || currentPath.startsWith("/account");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border">
      <div className="flex">
        {mobileMainNav.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <>
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                <span>{label}</span>
              </>
            </Link>
          );
        })}

        {/* More: Settings + Sign out */}
        <div ref={moreRef} className="flex flex-1 flex-col items-center relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-1 w-full flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
              isMoreActive || moreOpen ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className={cn("size-5", (isMoreActive || moreOpen) && "stroke-[2.5]")} />
            <span>Mehr</span>
          </button>

          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-1 min-w-44 rounded-lg border border-border bg-sidebar shadow-lg overflow-hidden">
              <Link
                to="/settings"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-sidebar-accent",
                  currentPath.startsWith("/settings") ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                <Settings className="size-4 shrink-0" />
                Einstellungen
              </Link>
              <Link
                to="/account"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-sidebar-accent",
                  currentPath.startsWith("/account") ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                <UserCircle className="size-4 shrink-0" />
                Account
              </Link>
              <div className="h-px bg-border" />
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOutIcon className="size-4 shrink-0" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
