"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, UserCog, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ledger", label: "Master Ledger", icon: BookOpen },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/users", label: "User Management", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 border-r border-slate-200 bg-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="font-bold text-teal-900">Admin Panel</h1>
        <p className="text-xs text-slate-500">Trip Expense Ledger</p>
      </div>
      <nav className="space-y-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-teal-50 text-teal-800"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 w-full"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </aside>
  );
}
