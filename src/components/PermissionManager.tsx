'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, UserCog, Settings, Save, RefreshCw } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 角色定义
const ROLES = [
  { id: 'admin', name: '管理员', description: '系统管理员，拥有所有权限' },
  { id: 'manager', name: '项目经理', description: '负责项目管理和协调' },
  { id: 'illustration', name: '插画师', description: '负责插画设计工作' },
  { id: 'product_design', name: '产品设计师', description: '负责产品设计工作' },
  { id: 'detail_design', name: '详情设计师', description: '负责详情页设计' },
  { id: 'copywriting', name: '文案师', description: '负责文案撰写' },
  { id: 'procurement', name: '采购专员', description: '负责采购工作' },
  { id: 'packaging_design', name: '包装设计师', description: '负责包装设计' },
  { id: 'finance', name: '财务', description: '负责财务管理' },
  { id: 'customer_service', name: '客服', description: '负责客户服务' },
  { id: 'warehouse', name: '仓储', description: '负责仓储管理' },
  { id: 'operations', name: '运营', description: '负责运营工作' },
];

// 权限定义
const PERMISSIONS = [
  // 项目管理
  { id: 'project_create', name: '创建项目', category: '项目管理' },
  { id: 'project_view', name: '查看项目', category: '项目管理' },
  { id: 'project_edit', name: '编辑项目', category: '项目管理' },
  { id: 'project_delete', name: '删除项目', category: '项目管理' },

  // 任务管理
  { id: 'task_create', name: '创建任务', category: '任务管理' },
  { id: 'task_view', name: '查看任务', category: '任务管理' },
  { id: 'task_edit', name: '编辑任务', category: '任务管理' },
  { id: 'task_delete', name: '删除任务', category: '任务管理' },
  { id: 'task_complete', name: '完成任务', category: '任务管理' },

  // 用户管理
  { id: 'user_create', name: '创建用户', category: '用户管理' },
  { id: 'user_view', name: '查看用户', category: '用户管理' },
  { id: 'user_edit', name: '编辑用户', category: '用户管理' },
  { id: 'user_delete', name: '删除用户', category: '用户管理' },
  { id: 'user_approve', name: '审核用户', category: '用户管理' },

  // 销售管理
  { id: 'sales_create', name: '创建销售目标', category: '销售管理' },
  { id: 'sales_view', name: '查看销售目标', category: '销售管理' },
  { id: 'sales_edit', name: '编辑销售目标', category: '销售管理' },
  { id: 'sales_delete', name: '删除销售目标', category: '销售管理' },

  // 品牌管理
  { id: 'brand_view', name: '查看品牌', category: '品牌管理' },
  { id: 'brand_edit', name: '编辑品牌', category: '品牌管理' },

  // 报表管理
  { id: 'report_view', name: '查看报表', category: '报表管理' },
  { id: 'report_export', name: '导出报表', category: '报表管理' },

  // 系统管理
  { id: 'system_config', name: '系统配置', category: '系统管理' },
  { id: 'system_backup', name: '数据备份', category: '系统管理' },
  { id: 'system_import', name: '数据导入', category: '系统管理' },

  // 通知管理
  { id: 'notification_view', name: '查看通知', category: '通知管理' },
  { id: 'notification_manage', name: '管理通知', category: '通知管理' },
];

export default function PermissionManager() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

      // 加载角色权限
      const { data: rpData } = await client.from('role_permissions').select('role, permission');
      const rpMap: Record<string, string[]> = {};
      rpData?.forEach((rp: any) => {
        if (!rpMap[rp.role]) {
          rpMap[rp.role] = [];
        }
        rpMap[rp.role].push(rp.permission);
      });
      setRolePermissions(rpMap);

      // 加载用户角色
      const { data: urData } = await client.from('user_roles').select('user_id, role, users!inner(email, name)');
      const urMap: Record<string, string[]> = {};
      const userList: any[] = [];

      urData?.forEach((ur: any) => {
        if (!urMap[ur.user_id]) {
          urMap[ur.user_id] = [];
          userList.push({
            id: ur.user_id,
            email: ur.users.email,
            name: ur.users.name || ur.users.email,
          });
        }
        urMap[ur.user_id].push(ur.role);
      });
      setUserRoles(urMap);
      setUsers(userList);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRolePermissionToggle = (role: string, permission: string) => {
    setRolePermissions((prev) => {
      const permissions = prev[role] || [];
      const hasPermission = permissions.includes(permission);

      if (hasPermission) {
        return {
          ...prev,
          [role]: permissions.filter((p) => p !== permission),
        };
      } else {
        return {
          ...prev,
          [role]: [...permissions, permission],
        };
      }
    });
  };

  const handleUserRoleToggle = (userId: string, role: string) => {
    setUserRoles((prev) => {
      const roles = prev[userId] || [];
      const hasRole = roles.includes(role);

      if (hasRole) {
        return {
          ...prev,
          [userId]: roles.filter((r) => r !== role),
        };
      } else {
        return {
          ...prev,
          [userId]: [...roles, role],
        };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

      // 保存角色权限
      for (const [role, permissions] of Object.entries(rolePermissions)) {
        // 先删除旧权限
        await client.from('role_permissions').delete().eq('role', role);

        // 再添加新权限
        for (const permission of permissions) {
          await client.from('role_permissions').insert({
            role,
            permission,
          });
        }
      }

      // 保存用户角色
      for (const [userId, roles] of Object.entries(userRoles)) {
        // 先删除旧角色
        await client.from('user_roles').delete().eq('user_id', userId);

        // 再添加新角色
        for (const role of roles) {
          await client.from('user_roles').insert({
            user_id: userId,
            role,
          });
        }
      }

      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categoryMap: Record<string, typeof PERMISSIONS> = {};
    PERMISSIONS.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = [];
      }
      categoryMap[p.category].push(p);
    });
    return categoryMap;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            权限管理
          </CardTitle>
          <CardDescription>
            管理角色权限和用户角色分配
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存更改'}
            </Button>
            <Button variant="outline" onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                角色权限
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                用户角色
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-6">
              <div className="space-y-6">
                {ROLES.map((role) => (
                  <Card key={role.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(getPermissionsByCategory()).map(([category, perms]) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {perms.map((perm) => (
                                <Badge
                                  key={perm.id}
                                  variant={
                                    rolePermissions[role.id]?.includes(perm.id)
                                      ? 'default'
                                      : 'outline'
                                  }
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleRolePermissionToggle(role.id, perm.id)
                                  }
                                >
                                  <Switch
                                    checked={
                                      rolePermissions[role.id]?.includes(perm.id) || false
                                    }
                                    className="mr-2"
                                    onClick={(e) => e.stopPropagation()}
                                    onCheckedChange={() =>
                                      handleRolePermissionToggle(role.id, perm.id)
                                    }
                                  />
                                  {perm.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Label>角色分配</Label>
                          <div className="flex flex-wrap gap-2">
                            {ROLES.map((role) => (
                              <Badge
                                key={role.id}
                                variant={
                                  userRoles[user.id]?.includes(role.id)
                                    ? 'default'
                                    : 'outline'
                                }
                                className="cursor-pointer"
                                onClick={() =>
                                  handleUserRoleToggle(user.id, role.id)
                                }
                              >
                                <Switch
                                  checked={
                                    userRoles[user.id]?.includes(role.id) || false
                                  }
                                  className="mr-2"
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={() =>
                                    handleUserRoleToggle(user.id, role.id)
                                  }
                                />
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
