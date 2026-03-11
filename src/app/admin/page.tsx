import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogsViewer } from '@/components/AuditLogsViewer';
import SystemConfigManager from '@/components/SystemConfigManager';
import BackupManager from '@/components/BackupManager';
import DataImportManager from '@/components/DataImportManager';
import PermissionManager from '@/components/PermissionManager';
import PermissionManagerV2 from '@/components/PermissionManagerV2';
import { LayoutDashboard, Shield, Settings, Activity, Database, Upload, UserCog } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统管理</h1>
        <p className="text-muted-foreground mt-2">
          管理系统配置、查看操作日志和系统状态
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              活跃用户: --
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日操作</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              比昨日: --%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统版本</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v2.0</div>
            <p className="text-xs text-muted-foreground">
              最新版本
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              总容量: --
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 内容 */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="logs" className="text-xs md:text-sm">操作日志</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs md:text-sm">系统设置</TabsTrigger>
          <TabsTrigger value="backups" className="text-xs md:text-sm">数据备份</TabsTrigger>
          <TabsTrigger value="import" className="text-xs md:text-sm">数据导入</TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs md:text-sm">权限管理</TabsTrigger>
          <TabsTrigger value="permissions-v2" className="text-xs md:text-sm">权限系统V2</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm">报表统计</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>操作审计日志</CardTitle>
              <CardDescription>
                查看系统所有操作的审计记录，包括用户操作、数据变更等
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemConfigManager />
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <BackupManager />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <DataImportManager />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionManager />
        </TabsContent>

        <TabsContent value="permissions-v2" className="space-y-4">
          <PermissionManagerV2 />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>报表统计</CardTitle>
              <CardDescription>
                查看系统统计报表和数据分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>报表统计功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
