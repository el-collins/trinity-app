'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'trinity_admin_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        const { expiry, user: storedUser } = JSON.parse(session);
        if (expiry > Date.now() && storedUser) {
          setIsAuthenticated(true);
          setUser(storedUser);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        const session = {
          authenticated: true,
          expiry: Date.now() + SESSION_DURATION,
          user: result.user,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
