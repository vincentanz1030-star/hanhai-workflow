'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, Plus, Edit, Trash2, Users, Briefcase, Key, Check, X, 
  Loader2, RefreshCw, Package, FolderOpen, Search, ChevronDown, ChevronRight,
  Palette, Building, Crown
} from 'lucide-react';

// 类型定义
interface PermissionModule {
  id: string;
  code: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  permission_count?: number;
}

interface PermissionAction {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  module_id: string;
  action_id: string;
  module?: PermissionModule;
  action?: PermissionAction;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  permission_count?: number;
}

interface Position {
  id: string;
  code: string;
  name: string;
  department: string;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  permission_count?: number;
}

const ACTION_COLORS: Record<string, string> = {
  view: 'bg-blue-100 text-blue-700',
  create: 'bg-green-100 text-green-700',
  edit: 'bg-orange-100 text-orange-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-purple-100 text-purple-700',
  export: 'bg-cyan-100 text-cyan-700',
  import: 'bg-teal-100 text-teal-700',
  manage: 'bg-gray-100 text-gray-700',
};

export default function PermissionManagerV2() {
  const [activeTab, setActiveTab] = useState('init');
  const [loading, setLoading] = useState(false);
  const [initStatus, setInitStatus] = useState<any>(null);

  // 数据
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [actions, setActions] = useState<PermissionAction[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // 弹窗
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showPermissionEditor, setShowPermissionEditor] = useState(false);

  // 编辑状态
  const [editingModule, setEditingModule] = useState<PermissionModule | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(new Set());
  const [positionPermissionIds, setPositionPermissionIds] = useState<Set<string>>(new Set());

  // 展开状态
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // 表单数据
  const [moduleForm, setModuleForm] = useState({ code: '', name: '', icon: 'Folder' });
  const [roleForm, setRoleForm] = useState({ code: '', name: '', description: '', color: 'blue', icon: 'User' });
  const [positionForm, setPositionForm] = useState({ code: '', name: '', department: '', color: 'green', icon: 'Briefcase' });
  const [permissionForm, setPermissionForm] = useState({ module_id: '', action_id: '', resource: '', name: '' });

  // 初始化
  useEffect(() => {
    checkInitStatus();
  }, []);

  useEffect(() => {
    if (initStatus?.initialized) {
      loadData();
    }
  }, [initStatus]);

  const checkInitStatus = async () => {
    try {
      const res = await fetch('/api/admin/permissions-v2/init');
      const data = await res.json();
      setInitStatus(data);
    } catch (e) {
      setInitStatus({ initialized: false });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesRes, actionsRes, permsRes, rolesRes, positionsRes] = await Promise.all([
        fetch('/api/admin/permission-modules'),
        fetch('/api/admin/permission-actions'),
        fetch('/api/admin/permissions-v2'),
        fetch('/api/admin/roles-v2'),
        fetch('/api/admin/positions-v2'),
      ]);

      const modulesData = await modulesRes.json();
      const actionsData = await actionsRes.json();
      const permsData = await permsRes.json();
      const rolesData = await rolesRes.json();
      const positionsData = await positionsRes.json();

      if (modulesData.success) setModules(modulesData.data || []);
      if (actionsData.success) setActions(actionsData.data || []);
      if (permsData.success) setPermissions(permsData.data || []);
      if (rolesData.success) setRoles(rolesData.data || []);
      if (positionsData.success) setPositions(positionsData.data || []);

    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permissions-v2/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitStatus({ initialized: true });
        await loadData();
      } else {
        alert(data.error || '初始化失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 角色权限编辑
  const openRolePermissionEditor = async (roleId: string) => {
    setSelectedRoleId(roleId);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles-v2/${roleId}/permissions`);
      const data = await res.json();
      if (data.success) {
        setRolePermissionIds(new Set(data.data.permission_ids || []));
        setShowPermissionEditor(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 岗位权限编辑
  const openPositionPermissionEditor = async (positionId: string) => {
    setSelectedPositionId(positionId);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/positions-v2/${positionId}/permissions`);
      const data = await res.json();
      if (data.success) {
        setPositionPermissionIds(new Set(data.data.permission_ids || []));
        setShowPermissionEditor(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 保存权限
  const savePermissions = async () => {
    if (!selectedRoleId && !selectedPositionId) return;

    setLoading(true);
    try {
      if (selectedRoleId) {
        const res = await fetch(`/api/admin/roles-v2/${selectedRoleId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission_ids: Array.from(rolePermissionIds) }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else if (selectedPositionId) {
        const res = await fetch(`/api/admin/positions-v2/${selectedPositionId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission_ids: Array.from(positionPermissionIds) }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }
      
      setShowPermissionEditor(false);
      setSelectedRoleId(null);
      setSelectedPositionId(null);
      loadData();
    } catch (e: any) {
      alert(e.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换权限
  const togglePermission = (permId: string) => {
    if (selectedRoleId) {
      const newSet = new Set(rolePermissionIds);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      setRolePermissionIds(newSet);
    } else if (selectedPositionId) {
      const newSet = new Set(positionPermissionIds);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      setPositionPermissionIds(newSet);
    }
  };

  // 按模块分组权限
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const moduleCode = perm.module?.code || 'other';
    if (!acc[moduleCode]) acc[moduleCode] = [];
    acc[moduleCode].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // 按资源分组
  const groupByResource = (perms: Permission[]) => {
    return perms.reduce((acc, perm) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">权限管理</h2>
          <p className="text-muted-foreground">高度自定义的角色、岗位、权限管理</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="init">
            <Key className="w-4 h-4 mr-2" />
            初始化
          </TabsTrigger>
          <TabsTrigger value="roles" disabled={!initStatus?.initialized}>
            <Shield className="w-4 h-4 mr-2" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="positions" disabled={!initStatus?.initialized}>
            <Briefcase className="w-4 h-4 mr-2" />
            岗位管理
          </TabsTrigger>
          <TabsTrigger value="permissions" disabled={!initStatus?.initialized}>
            <Package className="w-4 h-4 mr-2" />
            权限配置
          </TabsTrigger>
          <TabsTrigger value="modules" disabled={!initStatus?.initialized}>
            <FolderOpen className="w-4 h-4 mr-2" />
            模块管理
          </TabsTrigger>
        </TabsList>

        {/* 初始化 */}
        <TabsContent value="init" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>权限系统初始化</CardTitle>
              <CardDescription>
                初始化权限模块、操作类型、预设权限、角色和岗位
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initStatus?.initialized ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">权限系统已初始化</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{modules.length}</div>
                      <div className="text-sm text-muted-foreground">模块</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{actions.length}</div>
                      <div className="text-sm text-muted-foreground">操作</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{permissions.length}</div>
                      <div className="text-sm text-muted-foreground">权限</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{roles.length}</div>
                      <div className="text-sm text-muted-foreground">角色</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{positions.length}</div>
                      <div className="text-sm text-muted-foreground">岗位</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{permissions.filter(p => p.action?.code === 'view').length}</div>
                      <div className="text-sm text-muted-foreground">查看权限</div>
                    </div>
                  </div>
                  <Button onClick={handleInit} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    重新初始化
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-orange-600">
                    <X className="w-5 h-5" />
                    <span className="font-medium">权限系统未初始化</span>
                  </div>
                  <Button onClick={handleInit} disabled={loading} size="lg">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    初始化权限系统
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 角色管理 */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">角色列表</h3>
            <Button onClick={() => { setEditingRole(null); setRoleForm({ code: '', name: '', description: '', color: 'blue', icon: 'User' }); setShowRoleDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />新建角色
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <Card key={role.id} className={`${role.is_system ? 'border-primary/50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-${role.color}-100 flex items-center justify-center`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        <CardDescription className="text-xs">{role.code}</CardDescription>
                      </div>
                    </div>
                    {role.is_system && <Badge variant="secondary">系统</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{role.description || '无描述'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{role.permission_count || 0} 个权限</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openRolePermissionEditor(role.id)}>
                        <Key className="w-4 h-4 mr-1" />配置权限
                      </Button>
                      {!role.is_system && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingRole(role); setRoleForm({ code: role.code, name: role.name, description: role.description || '', color: role.color, icon: role.icon }); setShowRoleDialog(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 岗位管理 */}
        <TabsContent value="positions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">岗位列表</h3>
            <Button onClick={() => { setEditingPosition(null); setPositionForm({ code: '', name: '', department: '', color: 'green', icon: 'Briefcase' }); setShowPositionDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />新建岗位
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {positions.map(pos => (
              <Card key={pos.id} className={`${pos.is_system ? 'border-primary/50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-${pos.color}-100 flex items-center justify-center`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{pos.name}</CardTitle>
                        <CardDescription className="text-xs">{pos.department || pos.code}</CardDescription>
                      </div>
                    </div>
                    {pos.is_system && <Badge variant="secondary">系统</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{pos.permission_count || 0} 个权限</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openPositionPermissionEditor(pos.id)}>
                        <Key className="w-4 h-4 mr-1" />配置权限
                      </Button>
                      {!pos.is_system && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingPosition(pos); setPositionForm({ code: pos.code, name: pos.name, department: pos.department || '', color: pos.color, icon: pos.icon }); setShowPositionDialog(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 权限配置 */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>权限列表</CardTitle>
              <CardDescription>系统共 {permissions.length} 个权限项</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {Object.entries(groupedPermissions).map(([moduleCode, perms]) => (
                  <div key={moduleCode} className="mb-4">
                    <div 
                      className="flex items-center gap-2 p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => {
                        const newSet = new Set(expandedModules);
                        if (newSet.has(moduleCode)) {
                          newSet.delete(moduleCode);
                        } else {
                          newSet.add(moduleCode);
                        }
                        setExpandedModules(newSet);
                      }}
                    >
                      {expandedModules.has(moduleCode) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium">{perms[0]?.module?.name || moduleCode}</span>
                      <Badge variant="outline" className="ml-auto">{perms.length}</Badge>
                    </div>
                    {expandedModules.has(moduleCode) && (
                      <div className="pl-6 pt-2 space-y-2">
                        {Object.entries(groupByResource(perms)).map(([resource, resourcePerms]) => (
                          <div key={resource} className="flex items-center gap-2 py-1">
                            <span className="text-sm font-medium w-24">{resource}</span>
                            <div className="flex flex-wrap gap-1">
                              {resourcePerms.map(perm => (
                                <Badge 
                                  key={perm.id} 
                                  variant="outline" 
                                  className={`text-xs ${ACTION_COLORS[perm.action?.code || ''] || ''}`}
                                >
                                  {perm.action?.name || perm.code.split(':').pop()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模块管理 */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">权限模块</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modules.map(mod => (
              <Card key={mod.id} className={`${mod.is_system ? 'border-primary/50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {mod.name}
                    </CardTitle>
                    {mod.is_system && <Badge variant="secondary">系统</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{mod.permission_count || 0} 个权限</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 权限编辑器弹窗 */}
      <Dialog open={showPermissionEditor} onOpenChange={setShowPermissionEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              配置{selectedRoleId ? '角色' : '岗位'}权限
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {Object.entries(groupedPermissions).map(([moduleCode, perms]) => {
              const modulePermIds = perms.map(p => p.id);
              const selectedCount = perms.filter(p => 
                selectedRoleId ? rolePermissionIds.has(p.id) : positionPermissionIds.has(p.id)
              ).length;
              const isAllSelected = selectedCount === perms.length;
              
              return (
                <div key={moduleCode} className="mb-4">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => {
                        const currentIds = selectedRoleId ? rolePermissionIds : positionPermissionIds;
                        const newSet = new Set(currentIds);
                        if (checked) {
                          modulePermIds.forEach(id => newSet.add(id));
                        } else {
                          modulePermIds.forEach(id => newSet.delete(id));
                        }
                        if (selectedRoleId) {
                          setRolePermissionIds(newSet);
                        } else {
                          setPositionPermissionIds(newSet);
                        }
                      }}
                    />
                    <span className="font-medium">{perms[0]?.module?.name || moduleCode}</span>
                    <Badge variant="outline" className="ml-auto">{selectedCount}/{perms.length}</Badge>
                  </div>
                  <div className="pl-8 pt-2">
                    {Object.entries(groupByResource(perms)).map(([resource, resourcePerms]) => (
                      <div key={resource} className="flex items-center gap-3 py-2 border-b">
                        <span className="text-sm font-medium w-24">{resource}</span>
                        <div className="flex flex-wrap gap-2">
                          {resourcePerms.map(perm => (
                            <label key={perm.id} className="flex items-center gap-1 cursor-pointer">
                              <Checkbox
                                checked={selectedRoleId ? rolePermissionIds.has(perm.id) : positionPermissionIds.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${ACTION_COLORS[perm.action?.code || ''] || ''}`}
                              >
                                {perm.action?.name || perm.code.split(':').pop()}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionEditor(false)}>取消</Button>
            <Button onClick={savePermissions} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 角色编辑弹窗 */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新建角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>角色代码</Label>
              <Input 
                value={roleForm.code} 
                onChange={e => setRoleForm(f => ({ ...f, code: e.target.value }))}
                disabled={!!editingRole}
                placeholder="如: product_manager"
              />
            </div>
            <div className="grid gap-2">
              <Label>角色名称</Label>
              <Input 
                value={roleForm.name} 
                onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如: 商品经理"
              />
            </div>
            <div className="grid gap-2">
              <Label>描述</Label>
              <Textarea 
                value={roleForm.description} 
                onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                placeholder="角色职责描述"
              />
            </div>
            <div className="grid gap-2">
              <Label>颜色</Label>
              <Select value={roleForm.color} onValueChange={v => setRoleForm(f => ({ ...f, color: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">蓝色</SelectItem>
                  <SelectItem value="green">绿色</SelectItem>
                  <SelectItem value="orange">橙色</SelectItem>
                  <SelectItem value="purple">紫色</SelectItem>
                  <SelectItem value="red">红色</SelectItem>
                  <SelectItem value="gray">灰色</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>取消</Button>
            <Button onClick={async () => {
              setLoading(true);
              try {
                const url = '/api/admin/roles-v2';
                const method = editingRole ? 'PUT' : 'POST';
                const body = editingRole 
                  ? { id: editingRole.id, ...roleForm }
                  : roleForm;
                
                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                if (data.success) {
                  setShowRoleDialog(false);
                  loadData();
                } else {
                  alert(data.error);
                }
              } finally {
                setLoading(false);
              }
            }} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 岗位编辑弹窗 */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPosition ? '编辑岗位' : '新建岗位'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>岗位代码</Label>
              <Input 
                value={positionForm.code} 
                onChange={e => setPositionForm(f => ({ ...f, code: e.target.value }))}
                disabled={!!editingPosition}
                placeholder="如: illustration"
              />
            </div>
            <div className="grid gap-2">
              <Label>岗位名称</Label>
              <Input 
                value={positionForm.name} 
                onChange={e => setPositionForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如: 插画"
              />
            </div>
            <div className="grid gap-2">
              <Label>所属部门</Label>
              <Input 
                value={positionForm.department} 
                onChange={e => setPositionForm(f => ({ ...f, department: e.target.value }))}
                placeholder="如: 设计部"
              />
            </div>
            <div className="grid gap-2">
              <Label>颜色</Label>
              <Select value={positionForm.color} onValueChange={v => setPositionForm(f => ({ ...f, color: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">绿色</SelectItem>
                  <SelectItem value="blue">蓝色</SelectItem>
                  <SelectItem value="orange">橙色</SelectItem>
                  <SelectItem value="purple">紫色</SelectItem>
                  <SelectItem value="pink">粉色</SelectItem>
                  <SelectItem value="teal">青色</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPositionDialog(false)}>取消</Button>
            <Button onClick={async () => {
              setLoading(true);
              try {
                const url = '/api/admin/positions-v2';
                const method = editingPosition ? 'PUT' : 'POST';
                const body = editingPosition 
                  ? { id: editingPosition.id, ...positionForm }
                  : positionForm;
                
                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                if (data.success) {
                  setShowPositionDialog(false);
                  loadData();
                } else {
                  alert(data.error);
                }
              } finally {
                setLoading(false);
              }
            }} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
