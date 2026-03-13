/**
 * 系统设置 - 集成系统管理、用户管理、修改密码
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, Users, KeyRound, Shield, UserCheck, UserX, RefreshCw, 
  Edit, History, Loader2, Trash2, Check, X, Eye, EyeOff, CheckCircle,
  AlertTriangle, Info, Plus, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  he_zhe: '禾哲',
  baobao: 'BAOBAO',
  ai_he: '爱禾',
  bao_deng_yuan: '宝登源',
};

const ROLE_NAMES: Record<string, string> = {
  admin: '管理员',
  super_admin: '超级管理员',
  project_manager: '项目经理',
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待审核', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  active: { label: '已激活', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: '已拒绝', color: 'text-red-700', bgColor: 'bg-red-100' },
  suspended: { label: '已暂停', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

export function SystemSettings() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 权限检查
  const isAdmin = user?.roles?.some((r: any) => r.role === 'admin' || r.role === 'super_admin') || false;
  
  // 用户管理状态
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [auditReason, setAuditReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogsDialog, setShowAuditLogsDialog] = useState(false);

  // 修改密码状态
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 系统信息状态
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastUpdate: new Date().toLocaleDateString('zh-CN'),
    totalUsers: 0,
    activeUsers: 0,
  });

  // 加载用户列表
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [filterStatus, filterBrand, isAdmin]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBrand !== 'all') params.append('brand', filterBrand);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setSystemInfo(prev => ({
          ...prev,
          totalUsers: data.users.length,
          activeUsers: data.users.filter((u: any) => u.status === 'active').length,
        }));
      }
    } catch (error) {
      console.error('获取用户列表错误:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // 用户审核
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

  // 获取审核日志
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

  // 删除用户
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除用户错误:', error);
      alert('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有字段');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('新密码不能与旧密码相同');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '修改密码失败');
      }

      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '修改密码失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-base">系统设置</h2>
            <p className="text-xs text-muted-foreground">系统配置与用户管理</p>
          </div>
        </div>
      </div>

      {/* 设置选项卡 */}
      <Tabs defaultValue="password" className="space-y-4">
        <TabsList className="bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="password" className="rounded-lg text-sm">
            <KeyRound className="h-4 w-4 mr-2" />
            修改密码
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="users" className="rounded-lg text-sm">
                <Users className="h-4 w-4 mr-2" />
                用户管理
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg text-sm">
                <Shield className="h-4 w-4 mr-2" />
                系统信息
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* 修改密码 */}
        <TabsContent value="password" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">修改密码</CardTitle>
              <CardDescription>定期修改密码可以保护账户安全</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                      密码修改成功！
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="oldPassword">旧密码</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      placeholder="请输入旧密码"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      disabled={passwordLoading || passwordSuccess}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="请输入新密码（至少6位）"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordLoading || passwordSuccess}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="请再次输入新密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordLoading || passwordSuccess}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={passwordLoading || passwordSuccess}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      修改中...
                    </>
                  ) : (
                    '确认修改'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理 */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">用户管理</CardTitle>
                    <CardDescription>管理系统用户，审核新用户注册</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="pending">待审核</SelectItem>
                        <SelectItem value="active">已激活</SelectItem>
                        <SelectItem value="rejected">已拒绝</SelectItem>
                        <SelectItem value="suspended">已暂停</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterBrand} onValueChange={setFilterBrand}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="品牌筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部品牌</SelectItem>
                        {Object.entries(BRAND_NAMES).filter(([k]) => k !== 'all').map(([key, name]) => (
                          <SelectItem key={key} value={key}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchUsers} disabled={usersLoading}>
                      <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading && users.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无用户数据</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>用户</TableHead>
                          <TableHead>品牌</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>注册时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{u.name || u.email}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{BRAND_NAMES[u.brand] || u.brand}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {u.roles?.slice(0, 2).map((r: any) => (
                                  <Badge key={r.role} variant="secondary" className="text-xs">
                                    {ROLE_NAMES[r.role] || r.role}
                                  </Badge>
                                ))}
                                {u.roles?.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{u.roles.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_CONFIG[u.status]?.bgColor} ${STATUS_CONFIG[u.status]?.color}`}>
                                {STATUS_CONFIG[u.status]?.label || u.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString('zh-CN')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {u.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setShowAuditDialog(true);
                                      }}
                                      title="审核"
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    fetchAuditLogs(u.id);
                                    setShowAuditLogsDialog(true);
                                  }}
                                  title="审核日志"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowDeleteDialog(true);
                                  }}
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 系统信息 */}
        {isAdmin && (
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Info className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">系统版本</p>
                      <p className="text-xl font-bold">{systemInfo.version}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">用户总数</p>
                      <p className="text-xl font-bold">{systemInfo.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">活跃用户</p>
                      <p className="text-xl font-bold">{systemInfo.activeUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">系统公告</CardTitle>
                <CardDescription>管理系统公告和通知</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/admin/announcements')}
                  className="w-full"
                >
                  <Info className="h-4 w-4 mr-2" />
                  进入公告管理页面
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* 审核对话框 */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核用户</DialogTitle>
            <DialogDescription>
              审核用户 "{selectedUser?.name || selectedUser?.email}" 的注册申请
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>审核原因（可选）</Label>
              <Textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="请输入审核原因..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAuditDialog(false);
                setAuditReason('');
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAudit(selectedUser?.id, 'reject')}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              拒绝
            </Button>
            <Button
              onClick={() => handleAudit(selectedUser?.id, 'approve')}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审核日志对话框 */}
      <Dialog open={showAuditLogsDialog} onOpenChange={setShowAuditLogsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审核日志</DialogTitle>
            <DialogDescription>
              用户 "{selectedUser?.name || selectedUser?.email}" 的审核记录
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无审核记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>{log.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-sm text-muted-foreground">{log.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户 "{selectedUser?.name || selectedUser?.email}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
