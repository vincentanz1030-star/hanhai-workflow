'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  brand: string;
  isActive: boolean;
  roles: Array<{ role: string; is_primary: boolean }>;
  primaryRole: string | null;
  permissions: Array<{ resource: string; action: string; description: string }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      // 从localStorage获取token
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 如果返回401，说明未登录，清除用户状态和token
        setUser(null);
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '登录失败');
    }

    // 保存token到localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }

    // 重新获取用户信息
    await fetchUser();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
