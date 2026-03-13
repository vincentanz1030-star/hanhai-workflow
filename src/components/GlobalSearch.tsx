'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, FileText, User as UserIcon, FolderOpen, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SearchResult {
  projects: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    status: string;
    sales_date: string;
    created_at: string;
  }>;
  tasks: Array<{
    id: string;
    project_id: string;
    task_name: string;
    role: string;
    status: string;
    progress: number;
    estimated_completion_date: string | null;
    created_at: string;
    projects: {
      name: string;
      brand: string;
    };
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
  }>;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    projects: [],
    tasks: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'tasks' | 'users'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦输入框
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // 搜索功能
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setLoading(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
          const data = await response.json();
          if (data.success) {
            setResults(data.results);
          }
        } catch (error) {
          console.error('搜索失败:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ projects: [], tasks: [], users: [] });
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, activeTab]);

  // 快捷键 Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const getBrandName = (brand: string) => {
    const brandMap: Record<string, string> = {
      he_zhe: '禾哲',
      baobao: 'BAOBAO',
      ai_he: '爱禾',
      bao_deng_yuan: '宝登源',
    };
    return brandMap[brand] || brand;
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      illustration: '插画',
      product_design: '产品',
      detail_design: '详情',
      copywriting: '文案',
      procurement: '采购',
      packaging_design: '包装',
      finance: '财务',
      customer_service: '客服',
      warehouse: '仓储',
      operations: '运营',
    };
    return roleMap[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待处理', variant: 'secondary' },
      in_progress: { label: '进行中', variant: 'default' },
      completed: { label: '已完成', variant: 'outline' },
      delayed: { label: '已延期', variant: 'destructive' },
    };
    const { label, variant } = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const totalResults = results.projects.length + results.tasks.length + results.users.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>全局搜索</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          {/* 搜索框 */}
          <div className="flex items-center border-b p-4 gap-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              placeholder="搜索项目、任务、用户... (Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <kbd className="flex-shrink-0 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          {/* Tab切换 */}
          {totalResults > 0 && (
            <div className="flex gap-2 px-4 py-2 border-b overflow-x-auto">
              {([
                { id: 'all', label: '全部', count: totalResults },
                { id: 'projects', label: '项目', count: results.projects.length },
                { id: 'tasks', label: '任务', count: results.tasks.length },
                { id: 'users', label: '用户', count: results.users.length },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 搜索结果 */}
          <div className="flex-1 overflow-y-auto max-h-[500px] p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && query.length < 1 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>输入关键词开始搜索</p>
                <p className="text-sm mt-1">支持搜索项目、任务、用户</p>
              </div>
            )}

            {!loading && query.length >= 1 && totalResults === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>未找到相关结果</p>
              </div>
            )}

            {!loading && totalResults > 0 && (
              <div className="space-y-4">
                {/* 项目结果 */}
                {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      项目 ({results.projects.length})
                    </h3>
                    <div className="space-y-2">
                      {results.projects.map((project) => (
                        <Link
                          key={project.id}
                          href="/"
                          onClick={() => onOpenChange(false)}
                          className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{project.name}</p>
                                {getStatusBadge(project.status)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{getBrandName(project.brand)}</span>
                                <span>•</span>
                                <span>{new Date(project.sales_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 任务结果 */}
                {(activeTab === 'all' || activeTab === 'tasks') && results.tasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      任务 ({results.tasks.length})
                    </h3>
                    <div className="space-y-2">
                      {results.tasks.map((task) => (
                        <Link
                          key={task.id}
                          href="/"
                          onClick={() => onOpenChange(false)}
                          className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{task.task_name}</p>
                                {getStatusBadge(task.status)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{task.projects.name}</span>
                                <span>•</span>
                                <span>{getRoleName(task.role)}</span>
                                {task.progress > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{task.progress}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 用户结果 */}
                {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      用户 ({results.users.length})
                    </h3>
                    <div className="space-y-2">
                      {results.users.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name?.[0] || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.name || '未设置名称'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="border-t p-3 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd>
                <span>导航</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd>
                <span>打开</span>
              </div>
            </div>
            <div>按 <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">ESC</kbd> 关闭</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
