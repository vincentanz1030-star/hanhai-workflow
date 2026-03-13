'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Building, Package, Image, TrendingUp, BookOpen, Wrench, Users, 
  Star, Eye, Download, Search, Plus, ChevronRight, Upload, Link2, 
  Trash2, Pencil, X, ExternalLink
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
        <StatCard icon={<Building className="h-8 w-8 text-blue-500" />} title="供应商" value={stats?.overview.suppliers || 0} color="blue" />
        <StatCard icon={<Image className="h-8 w-8 text-purple-500" />} title="设计素材" value={stats?.overview.designs || 0} color="purple" />
        <StatCard icon={<TrendingUp className="h-8 w-8 text-green-500" />} title="营销案例" value={stats?.overview.cases || 0} color="green" />
        <StatCard icon={<BookOpen className="h-8 w-8 text-orange-500" />} title="知识文档" value={stats?.overview.knowledge || 0} color="orange" />
        <StatCard icon={<Wrench className="h-8 w-8 text-pink-500" />} title="工具模板" value={stats?.overview.tools || 0} color="pink" />
        <StatCard icon={<Users className="h-8 w-8 text-cyan-500" />} title="人才资源" value={stats?.overview.talents || 0} color="cyan" />
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
          <OverviewTab stats={stats} />
        </TabsContent>
        <TabsContent value="suppliers"><SupplierTab /></TabsContent>
        <TabsContent value="designs"><DesignTab /></TabsContent>
        <TabsContent value="marketing"><MarketingCaseTab /></TabsContent>
        <TabsContent value="knowledge"><KnowledgeTab /></TabsContent>
        <TabsContent value="tools"><ToolsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// 统计卡片组件
function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200', purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200', orange: 'bg-orange-50 border-orange-200',
    pink: 'bg-pink-50 border-pink-200', cyan: 'bg-cyan-50 border-cyan-200',
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

// 总览标签页
function OverviewTab({ stats }: { stats: SharedResourceStats | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />热门资源</CardTitle>
          <CardDescription>最受关注的共享资源</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.hotResources?.map((resource: any, index: number) => (
              <div key={resource.resource_id || index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{resource.name}</div>
                    <div className="text-sm text-muted-foreground">{resource.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{resource.view_count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" />贡献排行</CardTitle>
          <CardDescription>本月资源贡献最多的成员</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.topContributors?.map((contributor: any, index: number) => (
              <div key={contributor.user_id || index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'outline'}>{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{contributor.user_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{contributor.contribution_count || 0}</div>
                  <div className="text-xs text-muted-foreground">贡献</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 供应商模块 ====================
function SupplierTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setSuppliers(data.data || []);
    } catch (error) {
      console.error('获取供应商失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此供应商吗？')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shared/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchSuppliers();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">共享供应商库</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />分享供应商</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingItem ? '编辑供应商' : '分享优质供应商'}</DialogTitle></DialogHeader>
            <SupplierForm item={editingItem} onSuccess={() => { setDialogOpen(false); setEditingItem(null); fetchSuppliers(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{previewItem?.supplier_name}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">类型</Label><div>{previewItem.supplier_type || '-'}</div></div>
                <div><Label className="text-muted-foreground">状态</Label><div>{previewItem.status || '活跃'}</div></div>
                <div><Label className="text-muted-foreground">联系人</Label><div>{previewItem.contact_person || '-'}</div></div>
                <div><Label className="text-muted-foreground">联系电话</Label><div>{previewItem.contact_phone || '-'}</div></div>
                <div><Label className="text-muted-foreground">联系邮箱</Label><div>{previewItem.contact_email || '-'}</div></div>
                <div><Label className="text-muted-foreground">地址</Label><div>{previewItem.address || '-'}</div></div>
              </div>
              {previewItem.cooperation_brands?.length > 0 && (
                <div><Label className="text-muted-foreground">合作品牌</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewItem.cooperation_brands.map((b: string) => <Badge key={b} variant="outline">{b}</Badge>)}
                  </div>
                </div>
              )}
              {previewItem.main_products?.length > 0 && (
                <div><Label className="text-muted-foreground">主要产品</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewItem.main_products.map((p: string) => <Badge key={p} variant="secondary">{p}</Badge>)}
                  </div>
                </div>
              )}
              {previewItem.overall_score > 0 && (
                <div><Label className="text-muted-foreground">综合评分</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xl font-bold">{previewItem.overall_score.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier: any) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="cursor-pointer" onClick={() => setPreviewItem(supplier)}>
                  <CardTitle className="text-lg hover:text-primary">{supplier.supplier_name}</CardTitle>
                  <CardDescription>{supplier.supplier_type}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {supplier.verified && <Badge variant="default" className="bg-green-500">已验证</Badge>}
                </div>
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
                {supplier.cooperation_brands?.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">合作品牌:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {supplier.cooperation_brands.slice(0, 3).map((brand: string) => (
                        <Badge key={brand} variant="outline" className="text-xs">{brand}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />{supplier.view_count || 0}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewItem(supplier)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingItem(supplier); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(supplier.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {suppliers.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">暂无供应商，快来分享第一个优质供应商吧！</div>
      )}
    </div>
  );
}

function SupplierForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    supplier_name: item?.supplier_name || '',
    supplier_type: item?.supplier_type || '',
    contact_person: item?.contact_person || '',
    contact_phone: item?.contact_phone || '',
    contact_email: item?.contact_email || '',
    quality_score: item?.quality_score || 5,
    price_score: item?.price_score || 5,
    delivery_score: item?.delivery_score || 5,
    service_score: item?.service_score || 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = item ? `/api/shared/suppliers/${item.id}` : '/api/shared/suppliers';
      const method = item ? 'PUT' : 'POST';
      const overall_score = (formData.quality_score + formData.price_score + formData.delivery_score + formData.service_score) / 4;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, overall_score }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(item ? '供应商更新成功' : '供应商分享成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>供应商名称 *</Label><Input value={formData.supplier_name} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })} required /></div>
        <div><Label>供应商类型</Label><Input value={formData.supplier_type} onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })} placeholder="如：生产、设计、物流" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>联系人</Label><Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} /></div>
        <div><Label>联系电话</Label><Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} /></div>
      </div>
      <div><Label>联系邮箱</Label><Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} /></div>
      <div>
        <Label>评分（1-5分）</Label>
        <div className="grid grid-cols-4 gap-4 mt-2">
          {[{ key: 'quality_score', label: '质量' }, { key: 'price_score', label: '价格' }, { key: 'delivery_score', label: '交期' }, { key: 'service_score', label: '服务' }].map((item) => (
            <div key={item.key}>
              <Label className="text-xs">{item.label}</Label>
              <Input type="number" min={1} max={5} step={0.5} value={formData[item.key as keyof typeof formData] as number}
                onChange={(e) => setFormData({ ...formData, [item.key]: parseFloat(e.target.value) })} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">{item ? '更新' : '提交'}</Button>
      </div>
    </form>
  );
}

// ==================== 设计素材模块 ====================
function DesignTab() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => { fetchDesigns(); }, [selectedType]);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await fetch(`/api/shared/designs${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setDesigns(data.data || []);
    } catch (error) {
      console.error('获取设计素材失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此素材吗？')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shared/designs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchDesigns();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleDownload = async (designId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/shared/designs?downloadId=${designId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        if (data.data.isExternal) {
          window.open(data.data.downloadUrl, '_blank');
          toast.success('已打开下载链接');
        } else {
          const fileResponse = await fetch(data.data.downloadUrl);
          const blob = await fileResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = data.data.fileName;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
          toast.success('下载成功');
        }
      } else {
        toast.error(data.error || '下载失败');
      }
    } catch {
      toast.error('下载失败');
    }
  };

  const designTypes = [
    { value: 'all', label: '全部' }, { value: 'image', label: '图片素材' },
    { value: 'icon', label: '图标资源' }, { value: 'template', label: '设计模板' },
    { value: 'video', label: '视频素材' }, { value: 'other', label: '其他' },
  ];

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">设计素材库</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />上传素材</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingItem ? '编辑素材' : '上传设计素材'}</DialogTitle></DialogHeader>
            <DesignForm item={editingItem} onSuccess={() => { setDialogOpen(false); setEditingItem(null); fetchDesigns(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {designTypes.map((type) => (
          <Button key={type.value} variant={selectedType === type.value ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type.value)}>
            {type.label}
          </Button>
        ))}
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{previewItem?.asset_name || previewItem?.name}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              {previewItem.preview_url && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={previewItem.preview_url} alt={previewItem.asset_name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">类型</Label><div>{designTypes.find(t => t.value === previewItem.asset_type)?.label || previewItem.asset_type}</div></div>
                <div><Label className="text-muted-foreground">大小</Label><div>{formatFileSize(previewItem.file_size)}</div></div>
                <div><Label className="text-muted-foreground">下载次数</Label><div>{previewItem.download_count || 0}</div></div>
                <div><Label className="text-muted-foreground">分享时间</Label><div>{new Date(previewItem.created_at).toLocaleDateString()}</div></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownload(previewItem.id)}><Download className="h-4 w-4 mr-2" />下载</Button>
                {previewItem.external_link && (
                  <Button variant="outline" onClick={() => window.open(previewItem.external_link, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />打开外部链接
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {designs.map((design: any) => (
          <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => setPreviewItem(design)}>
              {design.preview_url ? (
                <img src={design.preview_url} alt={design.asset_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownload(design.id); }}>
                  <Download className="h-4 w-4 mr-1" />下载
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="font-medium truncate">{design.asset_name || design.name}</div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {designTypes.find(t => t.value === design.asset_type)?.label || design.asset_type}
                </Badge>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{design.download_count || 0}</span>
              </div>
              <div className="flex gap-1 mt-2 pt-2 border-t">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setPreviewItem(design)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setEditingItem(design); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(design.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {designs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">暂无设计素材，快来上传第一个吧！</div>
      )}
    </div>
  );
}

function DesignForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [formData, setFormData] = useState({
    name: item?.asset_name || item?.name || '',
    asset_type: item?.asset_type || 'image',
    download_url: item?.external_link || item?.file_url || '',
    file_key: item?.file_key || '',
    file_name: '',
    file_size: 0,
    thumbnail_key: item?.preview_key || '',
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  
  // 使用 ref 跟踪当前的预览 URL，用于清理
  const previewUrlRef = useRef<string | null>(null);
  const thumbnailPreviewUrlRef = useRef<string | null>(null);

  // 更新 ref
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);
  
  useEffect(() => {
    thumbnailPreviewUrlRef.current = thumbnailPreviewUrl;
  }, [thumbnailPreviewUrl]);

  // 创建本地预览URL（选择文件后立即预览）
  const createLocalPreview = (file: File, isThumbnail = false): string => {
    const url = URL.createObjectURL(file);
    if (isThumbnail) {
      setThumbnailPreviewUrl(url);
    } else {
      setPreviewUrl(url);
    }
    return url;
  };

  // 清理预览URL - 只在组件卸载时清理
  useEffect(() => {
    return () => {
      // 使用 ref 获取最新的 URL 值
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (thumbnailPreviewUrlRef.current && thumbnailPreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreviewUrlRef.current);
      }
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = isThumbnail ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isThumbnail ? '缩略图大小不能超过5MB' : '文件大小不能超过100MB');
      return;
    }

    // 如果是图片类型，立即创建本地预览
    if (file.type.startsWith('image/')) {
      createLocalPreview(file, isThumbnail);
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('category', isThumbnail ? 'thumbnails' : 'designs');
      const response = await fetch('/api/shared/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData,
      });
      const data = await response.json();
      if (data.success) {
        // 使用服务器返回的URL作为预览URL（覆盖本地blob URL）
        if (data.data.url && data.data.fileType === 'image') {
          if (isThumbnail) {
            setThumbnailPreviewUrl(data.data.url);
          } else {
            setPreviewUrl(data.data.url);
          }
        }
        
        if (isThumbnail) {
          setFormData(prev => ({ ...prev, thumbnail_key: data.data.fileKey }));
          toast.success('缩略图上传成功');
        } else {
          setFormData(prev => ({ ...prev, file_key: data.data.fileKey, file_name: data.data.fileName, file_size: data.data.fileSize, name: prev.name || data.data.fileName.replace(/\.[^/.]+$/, '') }));
          toast.success('文件上传成功');
        }
      } else {
        toast.error(data.error || '上传失败');
        // 上传失败时清除本地预览
        if (isThumbnail) {
          setThumbnailPreviewUrl(null);
        } else {
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      toast.error('上传失败，请重试');
      // 上传失败时清除本地预览
      if (isThumbnail) {
        setThumbnailPreviewUrl(null);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && !formData.file_key && !item) {
      toast.error('请先上传素材文件');
      return;
    }
    if (uploadMode === 'link' && !formData.download_url) {
      toast.error('请输入下载链接');
      return;
    }
    if (!formData.name) {
      toast.error('请输入素材名称');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const url = item ? `/api/shared/designs/${item.id}` : '/api/shared/designs';
      const method = item ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(item ? '素材更新成功' : '素材上传成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!item && (
        <div className="flex gap-2 mb-4">
          <Button type="button" variant={uploadMode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('file')}><Upload className="h-4 w-4 mr-1" />上传文件</Button>
          <Button type="button" variant={uploadMode === 'link' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('link')}><Link2 className="h-4 w-4 mr-1" />外部链接</Button>
        </div>
      )}
      {uploadMode === 'file' && !item && (
        <div className="space-y-2">
          <Label>素材文件</Label>
          <Input type="file" accept=".zip,.rar,.7z,.gz,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm" onChange={(e) => handleFileUpload(e, false)} disabled={uploading} />
          {formData.file_name && <div className="text-sm text-muted-foreground">已上传: {formData.file_name}</div>}
          {/* 图片预览 */}
          {previewUrl && (
            <div className="mt-2 relative">
              <div className="text-xs text-muted-foreground mb-1">预览:</div>
              <div className="relative inline-block">
                <img src={previewUrl} alt="预览" className="max-w-[200px] max-h-[200px] rounded border object-contain" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                    <div className="text-white text-sm">上传中...</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {uploadMode === 'link' && (
        <div><Label>下载链接 *</Label><Input value={formData.download_url} onChange={(e) => setFormData({ ...formData, download_url: e.target.value })} placeholder="输入网盘链接" required /></div>
      )}
      <div className="space-y-2">
        <Label>缩略图（可选）</Label>
        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} disabled={uploading} />
        {/* 缩略图预览 */}
        {thumbnailPreviewUrl && (
          <div className="mt-2 relative">
            <div className="text-xs text-muted-foreground mb-1">缩略图预览:</div>
            <div className="relative inline-block">
              <img src={thumbnailPreviewUrl} alt="缩略图预览" className="max-w-[150px] max-h-[150px] rounded border object-contain" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <div className="text-white text-sm">上传中...</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div><Label>素材名称 *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
      <div><Label>素材类型</Label>
        <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image">图片素材</SelectItem>
            <SelectItem value="icon">图标资源</SelectItem>
            <SelectItem value="template">设计模板</SelectItem>
            <SelectItem value="video">视频素材</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit" disabled={uploading}>{uploading ? '上传中...' : (item ? '更新' : '提交')}</Button>
      </div>
    </form>
  );
}

// ==================== 营销案例模块 ====================
function MarketingCaseTab() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => { fetchCases(); }, [selectedType]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await fetch(`/api/shared/marketing-cases${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setCases(data.data || []);
    } catch {
      console.error('获取营销案例失败:');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此案例吗？')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shared/marketing-cases/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchCases();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const caseTypes = [
    { value: 'all', label: '全部' }, { value: 'promotion', label: '大促活动' },
    { value: 'launch', label: '新品上市' }, { value: 'festival', label: '节日营销' },
    { value: 'brand', label: '品牌活动' }, { value: 'daily', label: '日常促销' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">营销案例库</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />分享案例</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{editingItem ? '编辑案例' : '分享营销案例'}</DialogTitle></DialogHeader>
            <MarketingCaseForm item={editingItem} onSuccess={() => { setDialogOpen(false); setEditingItem(null); fetchCases(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {caseTypes.map((type) => (
          <Button key={type.value} variant={selectedType === type.value ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type.value)}>
            {type.label}
          </Button>
        ))}
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{previewItem?.case_name}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">类型</Label><div>{caseTypes.find(t => t.value === previewItem.case_type)?.label || previewItem.case_type}</div></div>
                <div><Label className="text-muted-foreground">品牌</Label><div>{previewItem.brand || '-'}</div></div>
                <div><Label className="text-muted-foreground">开始日期</Label><div>{previewItem.start_date || '-'}</div></div>
                <div><Label className="text-muted-foreground">结束日期</Label><div>{previewItem.end_date || '-'}</div></div>
              </div>
              {previewItem.objective && <div><Label className="text-muted-foreground">活动目标</Label><div className="mt-1">{previewItem.objective}</div></div>}
              {previewItem.strategy && <div><Label className="text-muted-foreground">策略要点</Label><div className="mt-1">{previewItem.strategy}</div></div>}
              {previewItem.lessons && <div><Label className="text-muted-foreground">经验教训</Label><div className="mt-1">{previewItem.lessons}</div></div>}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {previewItem.gmv && <div><Label className="text-muted-foreground">GMV</Label><div className="text-xl font-bold">¥{(previewItem.gmv / 10000).toFixed(1)}万</div></div>}
                {previewItem.roi && <div><Label className="text-muted-foreground">ROI</Label><div className="text-xl font-bold">{previewItem.roi.toFixed(2)}</div></div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((caseItem: any) => (
          <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="cursor-pointer" onClick={() => setPreviewItem(caseItem)}>
                  <CardTitle className="text-lg hover:text-primary">{caseItem.case_name}</CardTitle>
                  <CardDescription className="mt-1">{caseTypes.find(t => t.value === caseItem.case_type)?.label || caseItem.case_type} | {caseItem.brand}</CardDescription>
                </div>
                <Badge variant={caseItem.case_type === 'promotion' ? 'default' : 'secondary'}>
                  {caseTypes.find(t => t.value === caseItem.case_type)?.label || caseItem.case_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{caseItem.objective}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4 text-muted-foreground">
                  {caseItem.gmv && <span>GMV: ¥{(caseItem.gmv / 10000).toFixed(1)}万</span>}
                  {caseItem.roi && <span>ROI: {caseItem.roi.toFixed(2)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{caseItem.rating?.toFixed(1) || '-'}</span>
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setPreviewItem(caseItem)}><Eye className="h-4 w-4 mr-1" />预览</Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setEditingItem(caseItem); setDialogOpen(true); }}><Pencil className="h-4 w-4 mr-1" />编辑</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(caseItem.id)}><Trash2 className="h-4 w-4 mr-1" />删除</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {cases.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">暂无营销案例，快来分享第一个成功案例吧！</div>
      )}
    </div>
  );
}

function MarketingCaseForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    case_name: item?.case_name || '',
    case_type: item?.case_type || 'promotion',
    description: item?.objective || '',
    start_date: item?.start_date || '',
    end_date: item?.end_date || '',
    gmv: item?.gmv || '',
    roi: item?.roi || '',
    key_points: item?.strategy || '',
    lessons: item?.lessons || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = item ? `/api/shared/marketing-cases/${item.id}` : '/api/shared/marketing-cases';
      const method = item ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          gmv: formData.gmv ? parseFloat(formData.gmv) : null,
          roi: formData.roi ? parseFloat(formData.roi) : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(item ? '案例更新成功' : '案例分享成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>案例名称 *</Label><Input value={formData.case_name} onChange={(e) => setFormData({ ...formData, case_name: e.target.value })} required /></div>
        <div><Label>案例类型</Label>
          <Select value={formData.case_type} onValueChange={(v) => setFormData({ ...formData, case_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="promotion">大促活动</SelectItem>
              <SelectItem value="launch">新品上市</SelectItem>
              <SelectItem value="festival">节日营销</SelectItem>
              <SelectItem value="brand">品牌活动</SelectItem>
              <SelectItem value="daily">日常促销</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>案例描述</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>开始日期</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div>
        <div><Label>结束日期</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>GMV（元）</Label><Input type="number" value={formData.gmv} onChange={(e) => setFormData({ ...formData, gmv: e.target.value })} /></div>
        <div><Label>ROI</Label><Input type="number" step="0.01" value={formData.roi} onChange={(e) => setFormData({ ...formData, roi: e.target.value })} /></div>
      </div>
      <div><Label>关键要点</Label><Textarea value={formData.key_points} onChange={(e) => setFormData({ ...formData, key_points: e.target.value })} rows={2} /></div>
      <div><Label>经验教训</Label><Textarea value={formData.lessons} onChange={(e) => setFormData({ ...formData, lessons: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">{item ? '更新' : '提交'}</Button>
      </div>
    </form>
  );
}

// ==================== 知识库模块 ====================
function KnowledgeTab() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { fetchKnowledge(); }, [selectedCategory]);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`/api/shared/knowledge${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setKnowledge(data.data || []);
    } catch {
      console.error('获取知识文档失败:');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此知识文档吗？')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shared/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchKnowledge();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const categories = [
    { value: 'all', label: '全部' }, { value: 'training', label: '培训课程' },
    { value: 'manual', label: '操作手册' }, { value: 'best_practice', label: '最佳实践' },
    { value: 'troubleshooting', label: '问题解决' }, { value: 'experience', label: '经验分享' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">知识库</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />分享知识</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{editingItem ? '编辑文档' : '分享知识文档'}</DialogTitle></DialogHeader>
            <KnowledgeForm item={editingItem} onSuccess={() => { setDialogOpen(false); setEditingItem(null); fetchKnowledge(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button key={cat.value} variant={selectedCategory === cat.value ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat.value)}>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewItem?.title}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{categories.find(c => c.value === previewItem.category)?.label || previewItem.category}</Badge>
                <span className="text-sm text-muted-foreground">作者: {previewItem.author_name || '匿名'}</span>
                <span className="text-sm text-muted-foreground">浏览: {previewItem.view_count || 0}</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans bg-muted p-4 rounded-lg">{previewItem.content}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {knowledge.map((item: any) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setPreviewItem(item)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{categories.find(c => c.value === item.category)?.label || item.category}</Badge>
                  </div>
                  <h4 className="font-medium text-lg hover:text-primary">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content?.substring(0, 150)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>作者: {item.author_name || '匿名'}</span>
                    <span>浏览: {item.view_count || 0}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => setPreviewItem(item)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {knowledge.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">暂无知识文档，快来分享你的经验吧！</div>
      )}
    </div>
  );
}

function KnowledgeForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    category: item?.category || 'best_practice',
    content: item?.content || '',
    tags: item?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = item ? `/api/shared/knowledge/${item.id}` : '/api/shared/knowledge';
      const method = item ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(item ? '文档更新成功' : '文档发布成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>标题 *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
        <div><Label>分类</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="training">培训课程</SelectItem>
              <SelectItem value="manual">操作手册</SelectItem>
              <SelectItem value="best_practice">最佳实践</SelectItem>
              <SelectItem value="troubleshooting">问题解决</SelectItem>
              <SelectItem value="experience">经验分享</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>内容 *</Label><Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} required /></div>
      <div><Label>标签</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="输入标签" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput && !formData.tags.includes(tagInput)) { setFormData({ ...formData, tags: [...formData.tags, tagInput] }); setTagInput(''); } } }} />
          <Button type="button" variant="outline" onClick={() => { if (tagInput && !formData.tags.includes(tagInput)) { setFormData({ ...formData, tags: [...formData.tags, tagInput] }); setTagInput(''); } }}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })}>{tag} ×</Badge>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">{item ? '更新' : '提交'}</Button>
      </div>
    </form>
  );
}

// ==================== 工具模板模块 ====================
function ToolsTab() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => { fetchTools(); }, [selectedType]);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await fetch(`/api/shared/tools${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setTools(data.data || []);
    } catch {
      console.error('获取工具资源失败:');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此工具吗？')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shared/tools/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchTools();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const toolTypes = [
    { value: 'all', label: '全部' }, { value: 'software', label: '软件工具' },
    { value: 'template', label: '文档模板' }, { value: 'checklist', label: '检查清单' },
    { value: 'workflow', label: '工作流程' }, { value: 'other', label: '其他' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">工具模板库</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />分享工具</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingItem ? '编辑工具' : '分享工具/模板'}</DialogTitle></DialogHeader>
            <ToolForm item={editingItem} onSuccess={() => { setDialogOpen(false); setEditingItem(null); fetchTools(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {toolTypes.map((type) => (
          <Button key={type.value} variant={selectedType === type.value ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type.value)}>
            {type.label}
          </Button>
        ))}
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{previewItem?.tool_name}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{toolTypes.find(t => t.value === previewItem.tool_type)?.label || previewItem.tool_type}</Badge>
                {previewItem.view_count > 0 && <span className="text-sm text-muted-foreground">浏览: {previewItem.view_count}</span>}
              </div>
              {previewItem.description && <div><Label className="text-muted-foreground">描述</Label><div className="mt-1">{previewItem.description}</div></div>}
              {previewItem.usage_guide && <div><Label className="text-muted-foreground">使用指南</Label><pre className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg text-sm">{previewItem.usage_guide}</pre></div>}
              {previewItem.tool_url && (
                <Button onClick={() => window.open(previewItem.tool_url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />打开下载链接
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool: any) => (
          <Card key={tool.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreviewItem(tool)}>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base hover:text-primary">{tool.tool_name}</CardTitle>
                    <CardDescription className="text-xs">{toolTypes.find(t => t.value === tool.tool_type)?.label || tool.tool_type}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tool.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">v{tool.version || '1.0'}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPreviewItem(tool)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingItem(tool); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tool.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {tools.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">暂无工具模板，快来分享你的高效工具吧！</div>
      )}
    </div>
  );
}

function ToolForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: item?.tool_name || '',
    tool_type: item?.tool_type || 'template',
    description: item?.description || '',
    usage_guide: item?.usage_guide || '',
    download_url: item?.tool_url || '',
    tags: item?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = item ? `/api/shared/tools/${item.id}` : '/api/shared/tools';
      const method = item ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(item ? '工具更新成功' : '工具分享成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>工具名称 *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
        <div><Label>类型</Label>
          <Select value={formData.tool_type} onValueChange={(v) => setFormData({ ...formData, tool_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="software">软件工具</SelectItem>
              <SelectItem value="template">文档模板</SelectItem>
              <SelectItem value="checklist">检查清单</SelectItem>
              <SelectItem value="workflow">工作流程</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>描述</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
      <div><Label>下载链接</Label><Input value={formData.download_url} onChange={(e) => setFormData({ ...formData, download_url: e.target.value })} placeholder="网盘链接或文件URL" /></div>
      <div><Label>使用指南</Label><Textarea value={formData.usage_guide} onChange={(e) => setFormData({ ...formData, usage_guide: e.target.value })} rows={3} /></div>
      <div><Label>标签</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="输入标签" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput && !formData.tags.includes(tagInput)) { setFormData({ ...formData, tags: [...formData.tags, tagInput] }); setTagInput(''); } } }} />
          <Button type="button" variant="outline" onClick={() => { if (tagInput && !formData.tags.includes(tagInput)) { setFormData({ ...formData, tags: [...formData.tags, tagInput] }); setTagInput(''); } }}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })}>{tag} ×</Badge>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">{item ? '更新' : '提交'}</Button>
      </div>
    </form>
  );
}
