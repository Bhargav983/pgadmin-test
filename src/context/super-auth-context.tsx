
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SuperAuthContextType {
  isSuperAdminAuthenticated: boolean;
  superAdminLogin: (token: string) => void;
  superAdminLogout: () => void;
  isLoading: boolean;
}

const SuperAuthContext = createContext<SuperAuthContextType | undefined>(undefined);

const SUPER_ADMIN_AUTH_TOKEN_KEY = 'pgSuperAdminAuthToken';

export function SuperAuthProvider({ children }: { children: ReactNode }) {
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem(SUPER_ADMIN_AUTH_TOKEN_KEY);
    if (token) {
      setIsSuperAdminAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isSuperAdminAuthenticated && pathname !== '/super-admin/login' && pathname.startsWith('/super-admin')) {
        router.push('/super-admin/login');
      }
      if (isSuperAdminAuthenticated && pathname === '/super-admin/login') {
        router.push('/super-admin/user-management');
      }
    }
  }, [isSuperAdminAuthenticated, isLoading, router, pathname]);

  const superAdminLogin = (token: string) => {
    localStorage.setItem(SUPER_ADMIN_AUTH_TOKEN_KEY, token);
    setIsSuperAdminAuthenticated(true);
    router.push('/super-admin/user-management');
  };

  const superAdminLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_AUTH_TOKEN_KEY);
    setIsSuperAdminAuthenticated(false);
    router.push('/super-admin/login');
  };

  const contextValue = {
    isSuperAdminAuthenticated,
    superAdminLogin,
    superAdminLogout,
    isLoading,
  };

  if (isLoading && pathname.startsWith('/super-admin') && pathname !== '/super-admin/login') {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      );
  }

  return (
    <SuperAuthContext.Provider value={contextValue}>
      {children}
    </SuperAuthContext.Provider>
  );
}

export function useSuperAuth() {
  const context = useContext(SuperAuthContext);
  if (context === undefined) {
    throw new Error('useSuperAuth must be used within a SuperAuthProvider');
  }
  return context;
}
