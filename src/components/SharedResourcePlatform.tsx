'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, Package, Image, TrendingUp, BookOpen, Wrench, Users, 
  Star, Eye, Download, Search, Plus, Filter, ChevronRight 
} from 'lucide-react';

interface SharedResourceStats {
  overview: {
    suppliers: number;
    designs: number;
    cases: number;
    knowledge: number;
    tools: number;
    talents: number;
  };
  hotResources: any[];
  topContributors: any[];
}

export function SharedResourcePlatform() {
  const [stats, setStats] = useState<SharedResourceStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/statistics', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">集团公司资源共享平台</h1>
          <p className="text-muted-foreground mt-2">
            资源共享、优势互补、降本增效、协同发展
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Building className="h-8 w-8 text-blue-500" />}
          title="供应商"
          value={stats?.overview.suppliers || 0}
          color="blue"
        />
        <StatCard
          icon={<Image className="h-8 w-8 text-purple-500" />}
          title="设计素材"
          value={stats?.overview.designs || 0}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="h-8 w-8 text-green-500" />}
          title="营销案例"
          value={stats?.overview.cases || 0}
          color="green"
        />
        <StatCard
          icon={<BookOpen className="h-8 w-8 text-orange-500" />}
          title="知识文档"
          value={stats?.overview.knowledge || 0}
          color="orange"
        />
        <StatCard
          icon={<Wrench className="h-8 w-8 text-pink-500" />}
          title="工具模板"
          value={stats?.overview.tools || 0}
          color="pink"
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-cyan-500" />}
          title="人才资源"
          value={stats?.overview.talents || 0}
          color="cyan"
        />
      </div>

      {/* 主要内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="suppliers">供应商</TabsTrigger>
          <TabsTrigger value="designs">设计素材</TabsTrigger>
          <TabsTrigger value="marketing">营销案例</TabsTrigger>
          <TabsTrigger value="knowledge">知识库</TabsTrigger>
          <TabsTrigger value="tools">工具模板</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 热门资源 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  热门资源
                </CardTitle>
                <CardDescription>最受关注的共享资源</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.hotResources.map((resource: any, index: number) => (
                    <div 
                      key={resource.resource_id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {resource.type === 'supplier' && '供应商'}
                            {resource.type === 'design' && '设计素材'}
                            {resource.type === 'marketing' && '营销案例'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {resource.view_count}
                        </span>
                        {resource.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {resource.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 贡献排行 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  贡献排行
                </CardTitle>
                <CardDescription>本月资源贡献最多的成员</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topContributors.map((contributor: any, index: number) => (
                    <div 
                      key={contributor.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? 'default' : 'outline'}>
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium">{contributor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contributor.brand}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {contributor.total_points}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          贡献积分
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierTab />
        </TabsContent>

        <TabsContent value="designs">
          <DesignTab />
        </TabsContent>

        <TabsContent value="marketing">
          <MarketingCaseTab />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeTab />
        </TabsContent>

        <TabsContent value="tools">
          <ToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 统计卡片组件
function StatCard({ icon, title, value, color }: { 
  icon: React.ReactNode; 
  title: string; 
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    pink: 'bg-pink-50 border-pink-200',
    cyan: 'bg-cyan-50 border-cyan-200',
  };

  return (
    <Card className={`${colorMap[color]} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {icon}
          <div className="text-right">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 供应商标签页
function SupplierTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('获取供应商失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">共享供应商库</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              分享供应商
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>分享优质供应商</DialogTitle>
            </DialogHeader>
            <SupplierForm onSuccess={() => {
              setDialogOpen(false);
              fetchSuppliers();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier: any) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{supplier.supplier_name}</CardTitle>
                  <CardDescription>{supplier.supplier_type}</CardDescription>
                </div>
                {supplier.verified && (
                  <Badge variant="default" className="bg-green-500">
                    已验证
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supplier.overall_score > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">综合评分:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{supplier.overall_score.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {supplier.cooperation_brands && supplier.cooperation_brands.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">合作品牌:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {supplier.cooperation_brands.map((brand: string) => (
                        <Badge key={brand} variant="outline" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {supplier.view_count || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 供应商表单组件
function SupplierForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_type: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    cooperation_brands: [] as string[],
    main_products: [] as string[],
    quality_score: 5,
    price_score: 5,
    delivery_score: 5,
    service_score: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          overall_score: (
            formData.quality_score +
            formData.price_score +
            formData.delivery_score +
            formData.service_score
          ) / 4,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>供应商名称 *</Label>
          <Input
            value={formData.supplier_name}
            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>供应商类型</Label>
          <Input
            value={formData.supplier_type}
            onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
            placeholder="如：生产、设计、物流"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>联系人</Label>
          <Input
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
        </div>
        <div>
          <Label>联系电话</Label>
          <Input
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>联系邮箱</Label>
        <Input
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        />
      </div>

      <div>
        <Label>评分（1-5分）</Label>
        <div className="grid grid-cols-4 gap-4 mt-2">
          {[
            { key: 'quality_score', label: '质量' },
            { key: 'price_score', label: '价格' },
            { key: 'delivery_score', label: '交期' },
            { key: 'service_score', label: '服务' },
          ].map((item) => (
            <div key={item.key}>
              <Label className="text-xs">{item.label}</Label>
              <Input
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={formData[item.key as keyof typeof formData] as number}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  [item.key]: parseFloat(e.target.value) 
                })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          取消
        </Button>
        <Button type="submit">提交</Button>
      </div>
    </form>
  );
}

// 其他标签页组件（简化版）
function DesignTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>设计素材库</CardTitle>
        <CardDescription>共享设计素材和模板资源</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          设计素材功能开发中...
        </div>
      </CardContent>
    </Card>
  );
}

function MarketingCaseTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>营销案例库</CardTitle>
        <CardDescription>成功营销案例和经验分享</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          营销案例功能开发中...
        </div>
      </CardContent>
    </Card>
  );
}

function KnowledgeTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>知识库</CardTitle>
        <CardDescription>培训课程、操作手册、最佳实践</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          知识库功能开发中...
        </div>
      </CardContent>
    </Card>
  );
}

function ToolsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>工具模板库</CardTitle>
        <CardDescription>常用工具、模板、流程图</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          工具模板功能开发中...
        </div>
      </CardContent>
    </Card>
  );
}
