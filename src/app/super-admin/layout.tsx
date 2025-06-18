
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LogOut, Users, ShieldCheck } from "lucide-react";
import { SuperAuthProvider, useSuperAuth } from '@/context/super-auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Image from "next/image";
import { useEffect } from 'react';

// Component for the header, using the SuperAuth context
function SuperAdminHeaderInternal() {
  const { superAdminLogout, isSuperAdminAuthenticated } = useSuperAuth();
  const pathname = usePathname();

  // Don't show header if not authenticated or on the login page itself
  if (!isSuperAdminAuthenticated || pathname === '/super-admin/login') {
    return null;
  }

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

// Component that defines the main content structure, using the SuperAuth context
function SuperAdminPageContent({ children }: { children: ReactNode }) {
  const { isSuperAdminAuthenticated, isLoading } = useSuperAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isSuperAdminAuthenticated && pathname !== '/super-admin/login') {
        router.push('/super-admin/login');
      }
      // Redirect to user-management if authenticated and on login page
      if (isSuperAdminAuthenticated && pathname === '/super-admin/login') {
          router.push('/super-admin/user-management');
      }
    }
  }, [isSuperAdminAuthenticated, isLoading, router, pathname]);

  if (isLoading && pathname !== '/super-admin/login') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // If not authenticated and not on the login page, useEffect will redirect, return null to prevent flash of content
  if (!isSuperAdminAuthenticated && pathname !== '/super-admin/login') {
    return null; 
  }

  // If on the login page, just render children (the login form) without the main layout
  if (pathname === '/super-admin/login') {
    return <>{children}</>;
  }

  // Authenticated and not on login page, render the full layout
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SuperAdminHeaderInternal /> {/* Use the internal header component */}
      <main className="flex-1 p-6 container mx-auto">
        {children}
      </main>
    </div>
  );
}

// The default export for the layout, providing the context
export default function SuperAdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <SuperAuthProvider>
      <SuperAdminPageContent>{children}</SuperAdminPageContent>
    </SuperAuthProvider>
  );
}
