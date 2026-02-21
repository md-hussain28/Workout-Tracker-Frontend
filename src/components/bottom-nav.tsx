"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Dumbbell, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workouts", label: "Workouts", icon: History },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/me", label: "Me", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const basePath = pathname?.split("/")[1] ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || basePath === href.split("/")[1];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-6 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
