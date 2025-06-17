
"use client";

import type { ReactNode } from 'react';
import { SiteHeader } from "@/components/site-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuth } from '@/context/auth-context';
// useRouter is no longer needed here as AuthProvider handles redirection
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  // const router = useRouter(); // Removed

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // The AuthProvider's useEffect hook will handle redirecting to /login.
    // Returning null here prevents rendering the layout for unauthenticated users
    // before the AuthProvider can redirect.
    return null; 
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="container mx-auto flex flex-1 overflow-hidden">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarNav />
          </Sidebar>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
