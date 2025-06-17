
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, BedDouble, Users, Cog, IndianRupee, CreditCard } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/rooms", label: "Rooms", icon: BedDouble },
  { href: "/dashboard/residents", label: "Residents", icon: Users },
  { href: "/dashboard/billing", label: "Billing Overview", icon: IndianRupee },
  { href: "/dashboard/payment-management", label: "Payment Management", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Cog },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="h-full">
      <nav className="flex flex-col p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </ScrollArea>
  );
}
