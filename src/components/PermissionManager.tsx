'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowRight } from 'lucide-react';

/**
 * 旧版权限管理组件 - 已弃用
 * 请使用 PermissionManagerV2 组件
 */
export default function PermissionManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          权限管理（旧版）
        </CardTitle>
        <CardDescription>
          此版本已弃用，请使用新版权限管理系统
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            请切换到"权限系统V2"标签页使用新版权限管理系统
            <ArrowRight className="w-4 h-4" />
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          新版权限系统支持：角色管理、岗位管理、模块化权限配置、权限继承等高级功能。
        </p>
      </CardContent>
    </Card>
  );
}
