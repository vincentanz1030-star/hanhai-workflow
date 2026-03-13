'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { GlobalSearch } from '@/components/GlobalSearch';
import { User, LogOut, Settings, Shield, Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧：Logo和导航 */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6" />
                <span className="font-semibold">Ai数据助手</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4 inline mr-1" />
                  首页
                </Link>
                <Link
                  href="/workspace"
                  className="text-sm text-foreground font-medium transition-colors"
                >
                  工作台
                </Link>
              </nav>
            </div>

            {/* 右侧：用户信息和操作 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGlobalSearchOpen(true)}
                title="搜索 (Ctrl+K)"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <NotificationBell />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="登出">
                <LogOut className="h-5 w-5" />
              </Button>
              {user.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin') && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon" title="系统管理">
                    <Shield className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* 全局搜索 */}
      <GlobalSearch open={isGlobalSearchOpen} onOpenChange={setIsGlobalSearchOpen} />
    </div>
  );
}
