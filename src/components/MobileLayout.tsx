'use client';

import { ReactNode } from 'react';
import { MobileMenu } from '@/components/MobileMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端顶部栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
        <div className="container flex h-14 items-center px-4">
          <MobileMenu currentPath={pathname} />
          <div className="flex-1 flex justify-center">
            <h1 className="text-lg font-semibold">瀚海云</h1>
          </div>
          {user && <NotificationBell />}
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container px-4 py-4 safe-bottom">
        {children}
      </main>

      {/* 移动端底部安全区域 */}
      <div className="h-4 safe-bottom" />
    </div>
  );
}
