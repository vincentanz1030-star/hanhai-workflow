'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, BarChart3, Users, Settings, LogOut, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface MobileMenuProps {
  currentPath?: string;
}

export function MobileMenu({ currentPath }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const menuItems = [
    {
      title: '首页',
      icon: Home,
      href: '/',
    },
    {
      title: '工作负载监控',
      icon: Activity,
      href: '#workload',
    },
    {
      title: '关键路径分析',
      icon: BarChart3,
      href: '#critical-path',
    },
    {
      title: '系统管理',
      icon: Shield,
      href: '/admin',
    },
    {
      title: '用户管理',
      icon: Users,
      href: '/admin/users',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          {/* 用户信息 */}
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">
                {user?.name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || '用户'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* 菜单项 */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* 底部操作 */}
          <div className="pt-6 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              退出登录
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
