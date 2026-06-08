"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, List, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses/new", label: "Add", icon: PlusCircle },
  { href: "/expenses", label: "Entries", icon: List },
  { href: "/receipts", label: "Receipts", icon: ImageIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white safe-bottom md:hidden">
      <div className="flex justify-around items-center h-16">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] text-xs font-medium transition-colors",
                active ? "text-teal-700" : "text-slate-500"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-teal-600")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
