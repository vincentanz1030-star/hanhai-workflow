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
import { toast } from 'sonner';
import { 
  Building, Package, Image, TrendingUp, BookOpen, Wrench, Users, 
  Star, Eye, Download, Search, Plus, Filter, ChevronRight, Upload, Link2, Trash2 
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
        toast.success('供应商分享成功');
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

// 设计素材标签页
function DesignTab() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDesigns();
  }, [selectedType]);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/shared/designs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDesigns(data.data || []);
      }
    } catch (error) {
      console.error('获取设计素材失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const designTypes = [
    { value: 'all', label: '全部' },
    { value: 'image', label: '图片素材' },
    { value: 'icon', label: '图标资源' },
    { value: 'template', label: '设计模板' },
    { value: 'video', label: '视频素材' },
    { value: 'other', label: '其他' },
  ];

  // 下载处理函数
  const handleDownload = async (designId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/shared/designs?downloadId=${designId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.data.isExternal) {
          // 外部链接：直接在新窗口打开
          window.open(data.data.downloadUrl, '_blank');
          toast.success('已打开下载链接');
        } else {
          // 内部存储：使用 fetch + blob 模式下载
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
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败，请重试');
    }
  };

  // 文件大小格式化
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              上传素材
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>上传设计素材</DialogTitle>
            </DialogHeader>
            <DesignForm onSuccess={() => {
              setDialogOpen(false);
              fetchDesigns();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            {designTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索素材..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchDesigns}>
          搜索
        </Button>
      </div>

      {/* 素材网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {designs.map((design: any) => (
          <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow group relative">
            <div className="aspect-square bg-muted relative">
              {design.preview_url || design.thumbnail_url ? (
                <img 
                  src={design.preview_url || design.thumbnail_url} 
                  alt={design.name || design.asset_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleDownload(design.id)}>
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
              {/* 删除按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={async () => {
                  if (confirm('确定要删除此素材吗？')) {
                    try {
                      const token = localStorage.getItem('auth_token');
                      const res = await fetch(`/api/shared/designs/${design.id}`, {
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
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-white hover:text-red-400" />
              </Button>
            </div>
            <CardContent className="p-3">
              <div className="font-medium truncate">{design.name || design.asset_name}</div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {designTypes.find(t => t.value === design.asset_type)?.label || design.asset_type}
                  </Badge>
                  {design.is_external_link && (
                    <Badge variant="secondary" className="text-xs">
                      <Link2 className="h-3 w-3 mr-1" />
                      外链
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {design.download_count || 0}
                  </span>
                </div>
              </div>
              {design.file_size ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(design.file_size)}
                </div>
              ) : design.tool_url || design.external_link ? (
                <div className="text-xs text-blue-500 mt-1 truncate">
                  {(design.tool_url || design.external_link).substring(0, 40)}...
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {designs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          暂无设计素材，快来上传第一个吧！
        </div>
      )}
    </div>
  );
}

// 设计素材表单
function DesignForm({ onSuccess }: { onSuccess: () => void }) {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'image',
    description: '',
    tags: [] as string[],
    is_public: true,
    file_key: '',
    file_name: '',
    file_size: 0,
    thumbnail_key: '',
    download_url: '', // 外部下载链接
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{
    fileKey: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<{
    fileKey: string;
    fileName: string;
  } | null>(null);

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（主文件100MB，缩略图5MB）
    const maxSize = isThumbnail ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isThumbnail ? '缩略图大小不能超过5MB' : '文件大小不能超过100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(`正在上传 ${file.name}...`);

    try {
      const token = localStorage.getItem('auth_token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('category', isThumbnail ? 'thumbnails' : 'designs');

      const response = await fetch('/api/shared/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      // 检查响应是否有效
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || '上传失败');
      }

      const data = await response.json();
      if (data.success) {
        if (isThumbnail) {
          setThumbnailFile({
            fileKey: data.data.fileKey,
            fileName: data.data.fileName,
          });
          setFormData(prev => ({ ...prev, thumbnail_key: data.data.fileKey }));
          toast.success('缩略图上传成功');
        } else {
          setUploadedFile({
            fileKey: data.data.fileKey,
            fileName: data.data.fileName,
            fileSize: data.data.fileSize,
            fileType: data.data.fileType,
          });
          setFormData(prev => ({ 
            ...prev, 
            file_key: data.data.fileKey,
            file_name: data.data.fileName,
            file_size: data.data.fileSize,
          }));
          // 如果名称为空，自动填充文件名
          if (!formData.name) {
            const nameWithoutExt = data.data.fileName.replace(/\.[^/.]+$/, '');
            setFormData(prev => ({ ...prev, name: nameWithoutExt }));
          }
          toast.success('文件上传成功');
        }
      } else {
        toast.error(data.error || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      toast.error(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
      setUploadProgress('');
      // 清空input，允许重新选择同一文件
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证：文件模式需要上传文件，链接模式需要输入链接
    if (uploadMode === 'file' && !formData.file_key) {
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
      const response = await fetch('/api/shared/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('素材上传成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 上传模式切换 */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('file')}
        >
          <Upload className="h-4 w-4 mr-1" />
          上传文件
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'link' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('link')}
        >
          <Link2 className="h-4 w-4 mr-1" />
          外部链接
        </Button>
      </div>

      {/* 文件上传区域 */}
      {uploadMode === 'file' ? (
        <div className="space-y-3">
          <Label>素材文件（支持压缩包：ZIP/RAR/7Z/GZ）</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            {uploadedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-8 w-8 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">{uploadedFile.fileName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.fileSize)}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {uploadedFile.fileType === 'compressed' ? '压缩包' : 
                         uploadedFile.fileType === 'image' ? '图片' : 
                         uploadedFile.fileType === 'video' ? '视频' : '其他'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null);
                    setFormData(prev => ({ ...prev, file_key: '', file_name: '', file_size: 0 }));
                  }}
                >
                  重新上传
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">点击选择文件上传</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    支持 ZIP、RAR、7Z、GZ 压缩包，以及图片、视频格式
                  </p>
                  <p className="text-xs text-muted-foreground">最大 100MB</p>
                </div>
                <Input
                  type="file"
                  accept=".zip,.rar,.7z,.gz,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm"
                  onChange={(e) => handleFileUpload(e, false)}
                  disabled={uploading}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}
          </div>
          {uploadProgress && (
            <p className="text-sm text-muted-foreground text-center">{uploadProgress}</p>
          )}
        </div>
      ) : (
        /* 外部下载链接输入 */
        <div className="space-y-2">
          <Label>下载链接 *</Label>
          <Input
            value={formData.download_url}
            onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
            placeholder="输入网盘链接或其他下载地址"
            required
          />
          <p className="text-xs text-muted-foreground">
            支持：百度网盘、阿里云盘、蓝奏云、Google Drive 等分享链接
          </p>
          {formData.download_url && !formData.download_url.startsWith('http') && (
            <p className="text-xs text-yellow-600">建议输入完整的 URL（以 http:// 或 https:// 开头）</p>
          )}
        </div>
      )}

      {/* 缩略图上传 */}
      <div className="space-y-2">
        <Label>缩略图（可选，建议上传预览图）</Label>
        <div className="flex gap-3 items-start">
          {thumbnailFile ? (
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <Image className="h-5 w-5 text-blue-500" />
              <span className="text-sm">{thumbnailFile.fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setThumbnailFile(null);
                  setFormData(prev => ({ ...prev, thumbnail_key: '' }));
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, true)}
              disabled={uploading}
              className="max-w-xs"
            />
          )}
        </div>
      </div>

      <div>
        <Label>素材名称 *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="输入素材名称"
          required
        />
      </div>
      
      <div>
        <Label>素材类型</Label>
        <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">图片素材</SelectItem>
            <SelectItem value="icon">图标资源</SelectItem>
            <SelectItem value="template">设计模板</SelectItem>
            <SelectItem value="video">视频素材</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="描述素材内容、用途等..."
        />
      </div>

      <div>
        <Label>标签</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="输入标签"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => 
              setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
            }>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? '上传中...' : '提交'}
        </Button>
      </div>
    </form>
  );
}

// 营销案例标签页
function MarketingCaseTab() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchCases();
  }, [selectedType]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await fetch(`/api/shared/marketing-cases${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCases(data.data || []);
      }
    } catch (error) {
      console.error('获取营销案例失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const caseTypes = [
    { value: 'all', label: '全部' },
    { value: 'promotion', label: '大促活动' },
    { value: 'launch', label: '新品上市' },
    { value: 'festival', label: '节日营销' },
    { value: 'brand', label: '品牌活动' },
    { value: 'daily', label: '日常促销' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">营销案例库</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              分享案例
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>分享营销案例</DialogTitle>
            </DialogHeader>
            <MarketingCaseForm onSuccess={() => {
              setDialogOpen(false);
              fetchCases();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-2">
        {caseTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type.value)}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* 案例列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((caseItem: any) => (
          <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{caseItem.case_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {caseItem.case_type} | {caseItem.brand}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={caseItem.case_type === 'promotion' ? 'default' : 'secondary'}>
                    {caseTypes.find(t => t.value === caseItem.case_type)?.label || caseItem.case_type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      if (confirm('确定要删除此案例吗？')) {
                        try {
                          const token = localStorage.getItem('auth_token');
                          const res = await fetch(`/api/shared/marketing-cases/${caseItem.id}`, {
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
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {caseItem.objective || caseItem.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4 text-muted-foreground">
                  {caseItem.gmv && (
                    <span>GMV: ¥{(caseItem.gmv / 10000).toFixed(1)}万</span>
                  )}
                  {caseItem.roi && (
                    <span>ROI: {caseItem.roi.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{caseItem.rating?.toFixed(1) || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cases.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          暂无营销案例，快来分享第一个成功案例吧！
        </div>
      )}
    </div>
  );
}

// 营销案例表单
function MarketingCaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    case_name: '',
    case_type: 'promotion',
    description: '',
    start_date: '',
    end_date: '',
    gmv: '',
    roi: '',
    key_points: '',
    lessons: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/marketing-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          gmv: formData.gmv ? parseFloat(formData.gmv) : null,
          roi: formData.roi ? parseFloat(formData.roi) : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('营销案例分享成功');
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
        <div>
          <Label>案例名称 *</Label>
          <Input
            value={formData.case_name}
            onChange={(e) => setFormData({ ...formData, case_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>案例类型</Label>
          <Select value={formData.case_type} onValueChange={(v) => setFormData({ ...formData, case_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

      <div>
        <Label>案例描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>开始日期</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label>结束日期</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>GMV（元）</Label>
          <Input
            type="number"
            value={formData.gmv}
            onChange={(e) => setFormData({ ...formData, gmv: e.target.value })}
            placeholder="输入销售额"
          />
        </div>
        <div>
          <Label>ROI</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.roi}
            onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
            placeholder="投入产出比"
          />
        </div>
      </div>

      <div>
        <Label>关键要点</Label>
        <Textarea
          value={formData.key_points}
          onChange={(e) => setFormData({ ...formData, key_points: e.target.value })}
          rows={2}
          placeholder="分享成功的关键因素..."
        />
      </div>

      <div>
        <Label>经验教训</Label>
        <Textarea
          value={formData.lessons}
          onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
          rows={2}
          placeholder="可以改进的地方..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">提交</Button>
      </div>
    </form>
  );
}

// 知识库标签页
function KnowledgeTab() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchKnowledge();
  }, [selectedCategory]);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`/api/shared/knowledge${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setKnowledge(data.data || []);
      }
    } catch (error) {
      console.error('获取知识文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'training', label: '培训课程' },
    { value: 'manual', label: '操作手册' },
    { value: 'best_practice', label: '最佳实践' },
    { value: 'troubleshooting', label: '问题解决' },
    { value: 'experience', label: '经验分享' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">知识库</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              分享知识
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>分享知识文档</DialogTitle>
            </DialogHeader>
            <KnowledgeForm onSuccess={() => {
              setDialogOpen(false);
              fetchKnowledge();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* 知识列表 */}
      <div className="space-y-3">
        {knowledge.map((item: any) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {categories.find(c => c.value === item.category)?.label || item.category}
                    </Badge>
                    {item.difficulty && (
                      <Badge variant={
                        item.difficulty === 'beginner' ? 'secondary' :
                        item.difficulty === 'intermediate' ? 'default' : 'destructive'
                      }>
                        {item.difficulty === 'beginner' ? '入门' :
                         item.difficulty === 'intermediate' ? '进阶' : '高级'}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-lg">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.summary || item.content?.substring(0, 150)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>作者: {item.author_name || '匿名'}</span>
                    <span>浏览: {item.view_count || 0}</span>
                    <span>点赞: {item.like_count || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      if (confirm('确定要删除此知识文档吗？')) {
                        try {
                          const token = localStorage.getItem('auth_token');
                          const res = await fetch(`/api/shared/knowledge/${item.id}`, {
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
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {knowledge.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          暂无知识文档，快来分享你的经验吧！
        </div>
      )}
    </div>
  );
}

// 知识库表单
function KnowledgeForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'best_practice',
    summary: '',
    content: '',
    tags: [] as string[],
    difficulty: 'beginner',
    target_roles: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('知识文档分享成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>标题 *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>分类</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

      <div>
        <Label>摘要</Label>
        <Textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          rows={2}
          placeholder="简要描述这篇文档的主要内容..."
        />
      </div>

      <div>
        <Label>内容 *</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={8}
          required
          placeholder="详细描述知识内容..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>难度等级</Label>
          <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">入门</SelectItem>
              <SelectItem value="intermediate">进阶</SelectItem>
              <SelectItem value="advanced">高级</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>标签</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="输入标签"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>添加</Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => 
                setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
              }>
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">提交</Button>
      </div>
    </form>
  );
}

// 工具库标签页
function ToolsTab() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchTools();
  }, [selectedType]);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await fetch(`/api/shared/tools${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTools(data.data || []);
      }
    } catch (error) {
      console.error('获取工具资源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toolTypes = [
    { value: 'all', label: '全部' },
    { value: 'software', label: '软件工具' },
    { value: 'template', label: '文档模板' },
    { value: 'checklist', label: '检查清单' },
    { value: 'workflow', label: '工作流程' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">工具模板库</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              分享工具
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>分享工具/模板</DialogTitle>
            </DialogHeader>
            <ToolForm onSuccess={() => {
              setDialogOpen(false);
              fetchTools();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2">
        {toolTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type.value)}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* 工具列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool: any) => (
          <Card key={tool.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{tool.tool_name || tool.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {toolTypes.find(t => t.value === tool.tool_type)?.label || tool.tool_type}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                  onClick={async () => {
                    if (confirm('确定要删除此工具吗？')) {
                      try {
                        const token = localStorage.getItem('auth_token');
                        const res = await fetch(`/api/shared/tools/${tool.id}`, {
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
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {tool.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    v{tool.version || '1.0'}
                  </Badge>
                </div>
                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="h-3 w-3 mr-1" />
                  下载
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tools.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          暂无工具模板，快来分享你的高效工具吧！
        </div>
      )}
    </div>
  );
}

// 工具表单
function ToolForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    tool_type: 'template',
    description: '',
    version: '1.0',
    usage_guide: '',
    download_url: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('工具模板分享成功');
        onSuccess();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>工具名称 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>类型</Label>
          <Select value={formData.tool_type} onValueChange={(v) => setFormData({ ...formData, tool_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

      <div>
        <Label>描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>版本号</Label>
          <Input
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="如: 1.0"
          />
        </div>
        <div>
          <Label>下载链接</Label>
          <Input
            value={formData.download_url}
            onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
            placeholder="网盘链接或文件URL"
          />
        </div>
      </div>

      <div>
        <Label>使用指南</Label>
        <Textarea
          value={formData.usage_guide}
          onChange={(e) => setFormData({ ...formData, usage_guide: e.target.value })}
          rows={3}
          placeholder="说明如何使用这个工具..."
        />
      </div>

      <div>
        <Label>标签</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="输入标签"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => 
              setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
            }>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>取消</Button>
        <Button type="submit">提交</Button>
      </div>
    </form>
  );
}
