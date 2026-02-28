'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Shield, UserCheck, UserX, RefreshCw, Edit, History, Loader2 } from 'lucide-react';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  he_zhe: '禾哲',
  baobao: 'BAOBAO',
  ai_he: '爱禾',
  bao_deng_yuan: '宝登源',
};

const ROLE_NAMES: Record<string, string> = {
  admin: '管理员',
  operations: '运营',
  product: '产品',
  copywriting: '文案',
  illustration: '插画',
  detail: '详情',
  purchasing: '采购',
  packaging: '包装',
  finance: '财务',
  customer_service: '客服',
  warehouse: '仓储',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-yellow-500' },
  active: { label: '已激活', color: 'bg-green-500' },
  rejected: { label: '已拒绝', color: 'bg-red-500' },
  suspended: { label: '已暂停', color: 'bg-orange-500' },
};

export default function UserManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAuditLogsDialog, setShowAuditLogsDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditReason, setAuditReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 检查管理员权限
  useEffect(() => {
    if (!user || !user.roles.some((r: any) => r.role === 'admin')) {
      router.push('/');
    }
  }, [user, router]);

  // 加载用户列表
  useEffect(() => {
    fetchUsers();
  }, [filterStatus, filterBrand]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBrand !== 'all') params.append('brand', filterBrand);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        console.error('获取用户列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取用户列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (userId: string, action: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: auditReason }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAuditDialog(false);
        setAuditReason('');
        fetchUsers();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('审核用户错误:', error);
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoles = async (userId: string, roles: any[]) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });

      const data = await response.json();

      if (data.success) {
        setShowRoleDialog(false);
        fetchUsers();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('更新角色错误:', error);
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAuditLogs = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/audit-logs`);
      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('获取审核日志错误:', error);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>

        <div className="grid gap-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">待审核</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">已激活</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">已暂停</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {users.filter((u) => u.status === 'suspended').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选器 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>状态</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="pending">待审核</SelectItem>
                      <SelectItem value="active">已激活</SelectItem>
                      <SelectItem value="rejected">已拒绝</SelectItem>
                      <SelectItem value="suspended">已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label>品牌</Label>
                  <Select value={filterBrand} onValueChange={setFilterBrand}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BRAND_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="self-end"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterBrand('all');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>共 {users.length} 个用户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">{userItem.name}</h3>
                          <Badge
                            className={`${STATUS_CONFIG[userItem.status]?.color} text-white`}
                          >
                            {STATUS_CONFIG[userItem.status]?.label}
                          </Badge>
                          <Badge variant="outline">
                            {BRAND_NAMES[userItem.brand]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {userItem.email}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {userItem.user_roles?.map((role: any) => (
                            <Badge key={role.role} variant="secondary">
                              {ROLE_NAMES[role.role] || role.role}
                              {role.is_primary && ' (主)'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userItem.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedUser(userItem);
                                setShowAuditDialog(true);
                              }}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              批准
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedUser(userItem);
                                setShowAuditDialog(true);
                              }}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              拒绝
                            </Button>
                          </>
                        )}
                        {userItem.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setShowAuditDialog(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            暂停
                          </Button>
                        )}
                        {userItem.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setShowAuditDialog(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            激活
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setShowRoleDialog(true);
                          }}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          角色
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(userItem);
                            fetchAuditLogs(userItem.id);
                            setShowAuditLogsDialog(true);
                          }}
                        >
                          <History className="h-4 w-4 mr-1" />
                          日志
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到符合条件的用户
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 审核对话框 */}
        <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>审核用户</DialogTitle>
              <DialogDescription>
                {selectedUser?.name} - {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">审核原因（可选）</Label>
                <Input
                  id="reason"
                  placeholder="请输入审核原因"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
                取消
              </Button>
              {selectedUser?.status === 'pending' && (
                <>
                  <Button
                    variant="default"
                    onClick={() => handleAudit(selectedUser.id, 'approve')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Check className="h-4 w-4 mr-1" />
                    批准
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAudit(selectedUser.id, 'reject')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <X className="h-4 w-4 mr-1" />
                    拒绝
                  </Button>
                </>
              )}
              {selectedUser?.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => handleAudit(selectedUser.id, 'suspend')}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  暂停账号
                </Button>
              )}
              {selectedUser?.status === 'suspended' && (
                <Button
                  variant="default"
                  onClick={() => handleAudit(selectedUser.id, 'activate')}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  激活账号
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 角色管理对话框 */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>角色管理</DialogTitle>
              <DialogDescription>
                {selectedUser?.name} - {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <RoleManagementDialog
              user={selectedUser}
              onUpdate={handleUpdateRoles}
              loading={actionLoading}
            />
          </DialogContent>
        </Dialog>

        {/* 审核日志对话框 */}
        <Dialog open={showAuditLogsDialog} onOpenChange={setShowAuditLogsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>审核日志</DialogTitle>
              <DialogDescription>
                {selectedUser?.name} - {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm mb-2">
                    操作人：{log.admin?.name} ({log.admin?.email})
                  </p>
                  {log.reason && (
                    <p className="text-sm text-muted-foreground">
                      原因：{log.reason}
                    </p>
                  )}
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无审核日志
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// 角色管理子组件
function RoleManagementDialog({ user, onUpdate, loading }: any) {
  const [selectedRoles, setSelectedRoles] = useState<any[]>([]);

  useEffect(() => {
    if (user?.user_roles) {
      setSelectedRoles(user.user_roles);
    }
  }, [user]);

  const toggleRole = (role: string) => {
    const exists = selectedRoles.find((r: any) => r.role === role);
    if (exists) {
      // 如果是唯一角色，不能删除
      if (selectedRoles.length === 1) {
        alert('至少需要一个角色');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r: any) => r.role !== role));
    } else {
      setSelectedRoles([...selectedRoles, { role, is_primary: false }]);
    }
  };

  const setPrimaryRole = (role: string) => {
    setSelectedRoles(
      selectedRoles.map((r: any) => ({
        ...r,
        is_primary: r.role === role,
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(ROLE_NAMES).map(([key, name]) => {
          const hasRole = selectedRoles.find((r: any) => r.role === key);
          const isPrimary = selectedRoles.find((r: any) => r.role === key)?.is_primary;
          return (
            <div
              key={key}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                hasRole
                  ? 'bg-primary/10 border-primary'
                  : 'bg-slate-50 dark:bg-slate-800'
              }`}
              onClick={() => toggleRole(key)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border ${
                    hasRole
                      ? 'bg-primary border-primary'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                <span className="text-sm font-medium">{name}</span>
              </div>
              {hasRole && (
                <button
                  className={`text-xs mt-2 w-full py-1 rounded ${
                    isPrimary
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimaryRole(key);
                  }}
                >
                  {isPrimary ? '主角色' : '设为主角色'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Button
        className="w-full"
        onClick={() => onUpdate(user.id, selectedRoles)}
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        保存角色
      </Button>
    </div>
  );
}
