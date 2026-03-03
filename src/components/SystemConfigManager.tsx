'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface SystemConfig {
  key: string;
  value: string;
  category: 'general' | 'brand' | 'position' | 'notification' | 'workflow';
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updated_at: string;
  updated_by: string;
}

const categoryMap = {
  general: '通用配置',
  brand: '品牌配置',
  position: '岗位配置',
  notification: '通知配置',
  workflow: '工作流配置',
};

export default function SystemConfigManager() {
  const [configs, setConfigs] = useState<Record<string, SystemConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system-configs');
      const data = await response.json();
      if (data.success && data.configs) {
        const configMap: Record<string, SystemConfig> = {};
        data.configs.forEach((config: SystemConfig) => {
          configMap[config.key] = config;
        });
        setConfigs(configMap);
        setInitialized(true);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('加载系统配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system-configs', { method: 'PATCH' });
      const data = await response.json();
      if (data.success) {
        await loadConfigs();
        alert(data.message);
      }
    } catch (error) {
      console.error('初始化系统配置失败:', error);
      alert('初始化失败，请检查权限');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configsToUpdate = Object.entries(configs).map(([key, config]) => ({
        key,
        value: config.value,
      }));

      const response = await fetch('/api/system-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsToUpdate }),
      });

      const data = await response.json();
      if (data.success) {
        await loadConfigs();
        alert(`成功保存 ${data.updated} 条配置`);
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      console.error('保存系统配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const renderConfigInput = (config: SystemConfig) => {
    switch (config.type) {
      case 'boolean':
        return (
          <Switch
            checked={config.value === 'true'}
            onCheckedChange={(checked) => handleConfigChange(config.key, checked.toString())}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={config.value}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            className="h-8"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={config.value}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            className="h-8"
          />
        );
    }
  };

  const renderConfigsByCategory = (category: 'general' | 'brand' | 'position' | 'notification' | 'workflow') => {
    const categoryConfigs = Object.values(configs).filter(c => c.category === category);

    if (categoryConfigs.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground">
          暂无{categoryMap[category]}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {categoryConfigs.map(config => (
          <div key={config.key} className="flex items-start justify-between gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium">{config.description}</Label>
              <div className="text-xs text-muted-foreground mt-1">
                Key: {config.key} · Type: {config.type}
              </div>
            </div>
            <div className="w-48 flex-shrink-0">
              {renderConfigInput(config)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  if (!initialized) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">系统配置未初始化</h3>
            <p className="text-sm text-muted-foreground mt-2">
              首次使用需要初始化默认配置
            </p>
          </div>
          <Button onClick={initializeConfigs} disabled={loading}>
            {loading ? '初始化中...' : '初始化系统配置'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统配置管理
              </CardTitle>
              <CardDescription>管理系统参数、通知设置和工作流配置</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadConfigs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
          {hasChanges && (
            <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ 有未保存的更改，请点击"保存更改"按钮保存
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* 配置内容 */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">通用</TabsTrigger>
          <TabsTrigger value="brand">品牌</TabsTrigger>
          <TabsTrigger value="position">岗位</TabsTrigger>
          <TabsTrigger value="notification">通知</TabsTrigger>
          <TabsTrigger value="workflow">工作流</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{categoryMap.general}</Badge>
              <span className="text-xs text-muted-foreground">
                {Object.values(configs).filter(c => c.category === 'general').length} 个配置项
              </span>
            </div>
            {renderConfigsByCategory('general')}
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{categoryMap.brand}</Badge>
              <span className="text-xs text-muted-foreground">
                {Object.values(configs).filter(c => c.category === 'brand').length} 个配置项
              </span>
            </div>
            {renderConfigsByCategory('brand')}
          </Card>
        </TabsContent>

        <TabsContent value="position" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{categoryMap.position}</Badge>
              <span className="text-xs text-muted-foreground">
                {Object.values(configs).filter(c => c.category === 'position').length} 个配置项
              </span>
            </div>
            {renderConfigsByCategory('position')}
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{categoryMap.notification}</Badge>
              <span className="text-xs text-muted-foreground">
                {Object.values(configs).filter(c => c.category === 'notification').length} 个配置项
              </span>
            </div>
            {renderConfigsByCategory('notification')}
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{categoryMap.workflow}</Badge>
              <span className="text-xs text-muted-foreground">
                {Object.values(configs).filter(c => c.category === 'workflow').length} 个配置项
              </span>
            </div>
            {renderConfigsByCategory('workflow')}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
