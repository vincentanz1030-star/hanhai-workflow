/**
 * 系统设置 - 集成系统管理、用户管理、修改密码、操作日志、数据备份、权限管理
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Users, KeyRound, Shield, UserCheck, UserX, RefreshCw, 
  Edit, History, Loader2, Trash2, Check, X, Eye, EyeOff, CheckCircle,
  AlertTriangle, Info, Plus, ChevronLeft, Database, FileText,
  Download, Upload, Search, Filter, Clock, Activity, Lock,
  Key, UserCog, Server, HardDrive
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

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: 'text-green-600' },
  update: { label: '更新', color: 'text-blue-600' },
  delete: { label: '删除', color: 'text-red-600' },
  login: { label: '登录', color: 'text-purple-600' },
  logout: { label: '登出', color: 'text-gray-600' },
  approve: { label: '审批', color: 'text-emerald-600' },
  reject: { label: '拒绝', color: 'text-orange-600' },
};

// 权限管理内容组件 - 必须在 SystemSettings 之前定义
function PermissionManagementContent({ 
  permissions, 
  permissionsGrouped, 
  users,
  onRefresh 
}: { 
  permissions: any[]; 
  permissionsGrouped: Record<string, any[]>; 
  users: any[];
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'positions' | 'roles' | 'users'>('positions');
  const [positions, setPositions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载岗位和角色列表
  useEffect(() => {
    fetchPositions();
    fetchRoles();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/admin/positions-v2');
      const data = await response.json();
      if (data.success) {
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error('获取岗位列表错误:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles-v2');
      const data = await response.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('获取角色列表错误:', error);
    }
  };

  // 加载选中项的权限
  const loadItemPermissions = async (item: any, type: 'position' | 'role' | 'user') => {
    setLoading(true);
    try {
      let url = '';
      if (type === 'position') {
        url = `/api/admin/positions-v2/${item.id}/permissions`;
      } else if (type === 'role') {
        url = `/api/admin/roles-v2/${item.id}/permissions`;
      } else {
        url = `/api/admin/users-v2/${item.id}/permissions`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        if (type === 'user') {
          // 用户权限是合并后的结果，包含 is_granted 和 is_denied
          const grantedIds = (data.data?.merged_permissions || [])
            .filter((p: any) => p.is_granted)
            .map((p: any) => p.id);
          setSelectedPermissions(new Set(grantedIds));
        } else {
          // 岗位/角色权限
          const permIds = data.data?.permission_ids || [];
          setSelectedPermissions(new Set(permIds));
        }
        setSelectedItem({ ...item, type });
      }
    } catch (error) {
      console.error('获取权限错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存权限
  const savePermissions = async () => {
    if (!selectedItem) return;
    
    setSaving(true);
    try {
      const type = selectedItem.type;
      let url = '';
      let body: any = { permission_ids: [...selectedPermissions] };
      
      if (type === 'position') {
        url = `/api/admin/positions-v2/${selectedItem.id}/permissions`;
      } else if (type === 'role') {
        url = `/api/admin/roles-v2/${selectedItem.id}/permissions`;
      } else {
        url = `/api/admin/users-v2/${selectedItem.id}/permissions`;
        body = { 
          grant: [...selectedPermissions],
          revoke: [] 
        };
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('权限保存成功');
        onRefresh();
        // 刷新列表
        if (type === 'position') fetchPositions();
        else if (type === 'role') fetchRoles();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存权限错误:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 切换权限
  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      return newSet;
    });
  };

  // 全选/取消全选模块权限
  const toggleModulePermissions = (modulePerms: any[], select: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      modulePerms.forEach(p => {
        if (select) {
          newSet.add(p.id);
        } else {
          newSet.delete(p.id);
        }
      });
      return newSet;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 左侧：选择列表 */}
      <div className="lg:col-span-1 border rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="bg-muted/30 border-b">
            <TabsList className="w-full bg-transparent p-1">
              <TabsTrigger value="positions" className="flex-1 text-xs">
                岗位 ({positions.length})
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex-1 text-xs">
                角色 ({roles.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 text-xs">
                用户 ({users.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            {/* 岗位列表 */}
            <TabsContent value="positions" className="m-0 p-0">
              {positions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">暂无岗位数据</div>
              ) : (
                <div className="divide-y">
                  {positions.map((pos) => (
                    <div 
                      key={pos.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedItem?.id === pos.id && selectedItem?.type === 'position' ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => loadItemPermissions(pos, 'position')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-6 w-6 rounded flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: pos.color || '#10b981' }}
                          >
                            {(pos.name || 'P')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{pos.name}</p>
                            {pos.department && (
                              <p className="text-xs text-muted-foreground">{pos.department}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pos.permission_count || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 角色列表 */}
            <TabsContent value="roles" className="m-0 p-0">
              {roles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">暂无角色数据</div>
              ) : (
                <div className="divide-y">
                  {roles.map((role) => (
                    <div 
                      key={role.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedItem?.id === role.id && selectedItem?.type === 'role' ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => loadItemPermissions(role, 'role')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-6 w-6 rounded flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: role.color || '#3b82f6' }}
                          >
                            {(role.name || 'R')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{role.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {role.permission_count || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 用户列表 */}
            <TabsContent value="users" className="m-0 p-0">
              {users.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">暂无用户数据</div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => (
                    <div 
                      key={user.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedItem?.id === user.id && selectedItem?.type === 'user' ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => loadItemPermissions(user, 'user')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                            {(user.name || user.email || 'U')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name || user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {BRAND_NAMES[user.brand] || user.brand}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* 右侧：权限列表 */}
      <div className="lg:col-span-2 border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedItem ? (
              <>
                <div 
                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: selectedItem.color || '#6b7280' }}
                >
                  {(selectedItem.name || 'S')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.type === 'position' ? '岗位权限' : 
                     selectedItem.type === 'role' ? '角色权限' : '用户权限'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">请从左侧选择岗位、角色或用户</p>
            )}
          </div>
          {selectedItem && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                已选 {selectedPermissions.size} / {permissions.length}
              </Badge>
              <Button size="sm" onClick={savePermissions} disabled={saving || loading}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    保存
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedItem ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Lock className="h-12 w-12 mb-4 opacity-50" />
            <p>请从左侧选择岗位、角色或用户来管理权限</p>
          </div>
        ) : Object.keys(permissionsGrouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Lock className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无权限数据</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {Object.entries(permissionsGrouped).map(([moduleCode, modulePerms]) => {
                const perms = modulePerms as any[];
                const selectedCount = perms.filter(p => selectedPermissions.has(p.id)).length;
                const allSelected = selectedCount === perms.length;
                const someSelected = selectedCount > 0 && selectedCount < perms.length;

                return (
                  <div key={moduleCode} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={(e) => toggleModulePermissions(perms, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <h4 className="font-medium text-sm">
                          {perms[0]?.module?.name || moduleCode}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          ({selectedCount}/{perms.length})
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <div 
                            key={perm.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedPermissions.has(perm.id) 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                            }`}
                            onClick={() => togglePermission(perm.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="h-4 w-4 rounded border-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{perm.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{perm.code}</p>
                            </div>
                            {perm.action && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] shrink-0"
                                style={{ color: perm.action.color || undefined }}
                              >
                                {perm.action.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

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

  // 操作日志状态
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [logsFilter, setLogsFilter] = useState({ action: 'all', resourceType: '' });

  // 数据备份状态
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDesc, setBackupDesc] = useState('');
  const [backupCreating, setBackupCreating] = useState(false);

  // 权限管理状态
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, any[]>>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionModules, setPermissionModules] = useState<any[]>([]);
  const [permissionActions, setPermissionActions] = useState<any[]>([]);

  // 系统信息状态
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastUpdate: new Date().toLocaleDateString('zh-CN'),
    totalUsers: 0,
    activeUsers: 0,
    totalBackups: 0,
    totalLogs: 0,
  });

  // 加载用户列表
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchLogs();
      fetchBackups();
      fetchPermissions();
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

  // 加载操作日志
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '50');
      params.append('offset', (logsPage * 50).toString());
      if (logsFilter.action && logsFilter.action !== 'all') params.append('action', logsFilter.action);
      if (logsFilter.resourceType) params.append('resourceType', logsFilter.resourceType);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
      setSystemInfo(prev => ({ ...prev, totalLogs: data.total || 0 }));
    } catch (error) {
      console.error('获取操作日志错误:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // 加载备份列表
  const fetchBackups = async () => {
    try {
      setBackupsLoading(true);
      const response = await fetch('/api/backups');
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups || []);
        setSystemInfo(prev => ({ ...prev, totalBackups: (data.backups || []).length }));
      }
    } catch (error) {
      console.error('获取备份列表错误:', error);
    } finally {
      setBackupsLoading(false);
    }
  };

  // 加载权限列表
  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await fetch('/api/admin/permissions-v2');
      const data = await response.json();
      if (data.success) {
        setPermissions(data.data || []);
        setPermissionsGrouped(data.grouped || {});
        // 获取模块和动作列表
        const modules = [...new Set((data.data || []).map((p: any) => p.module).filter(Boolean))];
        const actions = [...new Set((data.data || []).map((p: any) => p.action).filter(Boolean))];
        setPermissionModules(modules);
        setPermissionActions(actions);
      }
    } catch (error) {
      console.error('获取权限列表错误:', error);
    } finally {
      setPermissionsLoading(false);
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

  // 创建备份
  const handleCreateBackup = async () => {
    if (!backupName) {
      alert('请输入备份名称');
      return;
    }

    try {
      setBackupCreating(true);
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: backupName, description: backupDesc }),
      });

      const data = await response.json();
      if (data.success) {
        setShowBackupDialog(false);
        setBackupName('');
        setBackupDesc('');
        fetchBackups();
        alert(data.message || '备份创建成功');
      } else {
        alert(data.error || '备份创建失败');
      }
    } catch (error) {
      console.error('创建备份错误:', error);
      alert('创建备份失败');
    } finally {
      setBackupCreating(false);
    }
  };

  // 删除备份
  const handleDeleteBackup = async (id: string) => {
    if (!confirm('确定要删除此备份吗？')) return;

    try {
      const response = await fetch(`/api/backups?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchBackups();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除备份错误:', error);
      alert('删除失败');
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

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
        <div className="overflow-x-auto">
          <TabsList className="bg-muted/30 p-1 rounded-xl inline-flex w-auto min-w-full">
            <TabsTrigger value="password" className="rounded-lg text-sm whitespace-nowrap">
              <KeyRound className="h-4 w-4 mr-2" />
              修改密码
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="users" className="rounded-lg text-sm whitespace-nowrap">
                  <Users className="h-4 w-4 mr-2" />
                  用户管理
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="logs" className="rounded-lg text-sm whitespace-nowrap">
                  <History className="h-4 w-4 mr-2" />
                  操作日志
                </TabsTrigger>
                <TabsTrigger value="backups" className="rounded-lg text-sm whitespace-nowrap">
                  <Database className="h-4 w-4 mr-2" />
                  数据备份
                </TabsTrigger>
                <TabsTrigger value="permissions" className="rounded-lg text-sm whitespace-nowrap">
                  <Lock className="h-4 w-4 mr-2" />
                  权限管理
                </TabsTrigger>
                <TabsTrigger value="system" className="rounded-lg text-sm whitespace-nowrap">
                  <Server className="h-4 w-4 mr-2" />
                  系统信息
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

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
                <div className="flex items-center justify-between flex-wrap gap-4">
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

        {/* 操作日志 */}
        {isAdmin && (
          <TabsContent value="logs" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-base">操作日志</CardTitle>
                    <CardDescription>查看系统操作记录</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={logsFilter.action} onValueChange={(v) => { setLogsFilter(f => ({ ...f, action: v })); setLogsPage(0); }}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="操作类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部操作</SelectItem>
                        <SelectItem value="create">创建</SelectItem>
                        <SelectItem value="update">更新</SelectItem>
                        <SelectItem value="delete">删除</SelectItem>
                        <SelectItem value="login">登录</SelectItem>
                        <SelectItem value="approve">审批</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchLogs} disabled={logsLoading}>
                      <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading && logs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无操作日志</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>用户</TableHead>
                          <TableHead>操作</TableHead>
                          <TableHead>资源</TableHead>
                          <TableHead>详情</TableHead>
                          <TableHead>IP地址</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.user_name || '系统'}</p>
                                <p className="text-xs text-muted-foreground">{log.user_role || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={ACTION_CONFIG[log.action]?.color || ''}>
                                {ACTION_CONFIG[log.action]?.label || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{log.resource_type || '-'}</p>
                                {log.resource_id && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">{log.resource_id}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.details && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {JSON.stringify(log.details).substring(0, 50)}...
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono">{log.ip_address || '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {logsTotal > 50 && (
                      <div className="p-4 border-t text-center text-sm text-muted-foreground">
                        显示前 50 条，共 {logsTotal} 条记录
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 数据备份 */}
        {isAdmin && (
          <TabsContent value="backups" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">数据备份</CardTitle>
                    <CardDescription>创建和管理数据备份</CardDescription>
                  </div>
                  <Button onClick={() => setShowBackupDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建备份
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {backupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无备份记录</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>备份名称</TableHead>
                          <TableHead>大小</TableHead>
                          <TableHead>记录数</TableHead>
                          <TableHead>创建者</TableHead>
                          <TableHead>创建时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{backup.name}</p>
                                {backup.description && (
                                  <p className="text-xs text-muted-foreground">{backup.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatFileSize(backup.file_size)}</TableCell>
                            <TableCell className="text-sm">{backup.record_count} 条</TableCell>
                            <TableCell className="text-sm">{backup.created_by || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(backup.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDeleteBackup(backup.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        {/* 权限管理 */}
        {isAdmin && (
          <TabsContent value="permissions" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">权限管理</CardTitle>
                    <CardDescription>管理各岗位、角色、用户的权限配置</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <PermissionManagementContent
                    permissions={permissions}
                    permissionsGrouped={permissionsGrouped}
                    users={users}
                    onRefresh={fetchPermissions}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 系统信息 */}
        {isAdmin && (
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">备份数量</p>
                      <p className="text-xl font-bold">{systemInfo.totalBackups}</p>
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
                        {formatDate(log.created_at)}
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

      {/* 创建备份对话框 */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建数据备份</DialogTitle>
            <DialogDescription>备份当前系统的所有数据</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>备份名称 *</Label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="例如：日常备份_20240101"
              />
            </div>
            <div className="space-y-2">
              <Label>备份描述</Label>
              <Textarea
                value={backupDesc}
                onChange={(e) => setBackupDesc(e.target.value)}
                placeholder="可选：描述备份的原因或内容"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateBackup} disabled={backupCreating}>
              {backupCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  创建备份
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
