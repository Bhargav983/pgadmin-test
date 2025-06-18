
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LogOut, Users, ShieldCheck } from "lucide-react";
import { SuperAuthProvider, useSuperAuth } from '@/context/super-auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Image from "next/image";

function SuperAdminHeader() {
  const { superAdminLogout, isSuperAdminAuthenticated } = useSuperAuth();
  const pathname = usePathname();

  if (!isSuperAdminAuthenticated) return null; // Don't show header if not auth (login page)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/super-admin/user-management" className="flex items-center space-x-2">
           <Image
                src="https://www.iiiqbets.com/wp-content/uploads/2021/04/png-1.png"
                alt="Logo"
                width={80} 
                height={40}
                className="h-full object-contain" 
            />
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-bold text-primary">Super Admin Portal</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button
            variant={pathname === "/super-admin/user-management" ? "secondary" : "ghost"}
            asChild
          >
            <Link href="/super-admin/user-management">
              <Users className="mr-2 h-5 w-5" />
              User Management
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={superAdminLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}


export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { isSuperAdminAuthenticated, isLoading } = useSuperAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isSuperAdminAuthenticated && pathname !== '/super-admin/login') {
      router.push('/super-admin/login');
    }
  }, [isSuperAdminAuthenticated, isLoading, router, pathname]);
  
  // This outer check is important for the initial load within the SuperAuthProvider
  if (isLoading && pathname !== '/super-admin/login') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // If not authenticated and not on login page, AuthProvider's effect will redirect.
  // Return null to prevent brief flash of layout for unauth users outside login.
  if (!isSuperAdminAuthenticated && pathname !== '/super-admin/login') {
    return null;
  }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SuperAdminHeader />
      <main className="flex-1 p-6 container mx-auto">
        {children}
      </main>
    </div>
  );
}

// Wrap the default export with the provider
export function Layout({ children }: { children: ReactNode }) {
  return (
    <SuperAuthProvider>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </SuperAuthProvider>
  );
}

// This change makes sure the provider is at the root of this specific layout tree.
// The default export from a layout file MUST be the component itself.
// We create a new component `Layout` that includes the provider and then renders `SuperAdminLayout`.
// For Next.js to correctly use this as a layout, the default export must be this wrapper.
export default Layout;
