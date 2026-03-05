/**
 * 营销中台 - 活动管理组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Calendar, Target, DollarSign, TrendingUp, CheckCircle, Clock, PlayCircle, Edit, Trash2, Eye, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Campaign {
  id: string;
  campaign_code: string;
  name: string;
  campaign_type: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  actual_cost: number;
  target_gmv: number;
  actual_gmv: number;
  status: string;
  priority: string;
  channels: string[];
  brands: string[];
  products: string[];
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    campaign_code: '',
    name: '',
    campaign_type: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: 0,
    target_gmv: 0,
    priority: 'medium',
    status: 'draft',
    channels: [] as string[],
    brands: [] as string[],
    products: [] as string[],
  });

  useEffect(() => {
    loadCampaigns();
  }, [selectedType, selectedStatus]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedType !== 'all' && { campaign_type: selectedType }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/marketing/campaigns?${params}`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.campaign_code || !formData.name || !formData.campaign_type || !formData.start_date || !formData.end_date) {
      alert('请填写必填项');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('活动创建成功！');
        setIsCreateDialogOpen(false);
        resetForm();
        loadCampaigns();
      } else {
        alert('创建失败：' + data.error);
      }
    } catch (error) {
      console.error('创建活动失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCampaign = async () => {
    if (!currentCampaign) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${currentCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('活动更新成功！');
        setIsEditDialogOpen(false);
        resetForm();
        loadCampaigns();
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      console.error('更新活动失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('确定要删除这个活动吗？')) return;

    try {
      const response = await fetch(`/api/marketing/campaigns/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('活动删除成功！');
        loadCampaigns();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      alert('网络错误，请稍后重试');
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setFormData({
      campaign_code: campaign.campaign_code,
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      description: campaign.description || '',
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget: campaign.budget || 0,
      target_gmv: campaign.target_gmv || 0,
      priority: campaign.priority,
      status: campaign.status,
      channels: campaign.channels || [],
      brands: campaign.brands || [],
      products: campaign.products || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      campaign_code: '',
      name: '',
      campaign_type: '',
      description: '',
      start_date: '',
      end_date: '',
      budget: 0,
      target_gmv: 0,
      priority: 'medium',
      status: 'draft',
      channels: [],
      brands: [],
      products: [],
    });
    setCurrentCampaign(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      draft: { label: '草稿', variant: 'secondary', icon: null },
      pending: { label: '待审批', variant: 'outline', icon: Clock },
      approved: { label: '已批准', variant: 'default', icon: CheckCircle },
      ongoing: { label: '进行中', variant: 'default', icon: PlayCircle },
      completed: { label: '已完成', variant: 'default', icon: CheckCircle },
      cancelled: { label: '已取消', variant: 'destructive', icon: null },
    };
    const config = statusMap[status] || { label: status, variant: 'outline', icon: null };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      low: { label: '低', color: 'text-blue-600' },
      medium: { label: '中', color: 'text-yellow-600' },
      high: { label: '高', color: 'text-red-600' },
    };
    const config = priorityMap[priority] || { label: priority, color: 'text-gray-600' };
    return <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.campaign_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateROI = (campaign: Campaign) => {
    if (!campaign.actual_cost || campaign.actual_cost === 0) return 0;
    return ((campaign.actual_gmv - campaign.actual_cost) / campaign.actual_cost * 100).toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索活动名称或编码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="活动类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="618">618大促</SelectItem>
            <SelectItem value="1111">双11大促</SelectItem>
            <SelectItem value="brand">品牌日</SelectItem>
            <SelectItem value="festival">节日活动</SelectItem>
            <SelectItem value="normal">常规活动</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="ongoing">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建活动
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建营销活动</DialogTitle>
              <DialogDescription>填写活动基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignCode">活动编码 *</Label>
                  <Input id="campaignCode" placeholder="例如：CAM-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignType">活动类型 *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="618">618大促</SelectItem>
                      <SelectItem value="1111">双11大促</SelectItem>
                      <SelectItem value="brand">品牌日</SelectItem>
                      <SelectItem value="festival">节日活动</SelectItem>
                      <SelectItem value="normal">常规活动</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignName">活动名称 *</Label>
                <Input id="campaignName" placeholder="输入活动名称" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">活动描述</Label>
                <Textarea id="description" placeholder="输入活动描述" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">开始日期 *</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">结束日期 *</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">预算 (元)</Label>
                  <Input id="budget" type="number" placeholder="输入预算" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetGmv">目标GMV (元)</Label>
                  <Input id="targetGmv" type="number" placeholder="输入目标GMV" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>创建活动</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 活动列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动列表</CardTitle>
          <CardDescription>共 {filteredCampaigns.length} 个活动</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无活动</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建活动"开始添加</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>活动时间</TableHead>
                  <TableHead>预算</TableHead>
                  <TableHead>目标GMV</TableHead>
                  <TableHead>实际GMV</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">{campaign.campaign_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{campaign.campaign_type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{campaign.start_date && format(new Date(campaign.start_date), 'yyyy-MM-dd', { locale: zhCN })}</div>
                        <div className="text-muted-foreground">
                          至 {campaign.end_date && format(new Date(campaign.end_date), 'yyyy-MM-dd', { locale: zhCN })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {campaign.budget?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        {campaign.target_gmv?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        {campaign.actual_gmv?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={Number(calculateROI(campaign)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateROI(campaign)}%
                      </span>
                    </TableCell>
                    <TableCell>{getPriorityBadge(campaign.priority)}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(campaign)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(campaign)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 编辑活动对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑营销活动</DialogTitle>
            <DialogDescription>修改活动信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-campaignCode">活动编码</Label>
                <Input
                  id="edit-campaignCode"
                  value={formData.campaign_code}
                  onChange={(e) => setFormData({ ...formData, campaign_code: e.target.value })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-campaignType">活动类型</Label>
                <Select value={formData.campaign_type} onValueChange={(v) => setFormData({ ...formData, campaign_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="618">618大促</SelectItem>
                    <SelectItem value="1111">双11大促</SelectItem>
                    <SelectItem value="brand">品牌日</SelectItem>
                    <SelectItem value="festival">节日活动</SelectItem>
                    <SelectItem value="normal">常规活动</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">活动名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">活动描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">开始日期</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">结束日期</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget">预算</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-target">目标GMV</Label>
                <Input
                  id="edit-target"
                  type="number"
                  value={formData.target_gmv}
                  onChange={(e) => setFormData({ ...formData, target_gmv: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="ongoing">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              取消
            </Button>
            <Button onClick={handleEditCampaign} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 活动详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>活动详情</DialogTitle>
                <DialogDescription>查看活动完整信息</DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDetailDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {currentCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">活动名称</Label>
                  <div className="text-lg font-semibold">{currentCampaign.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">活动编码</Label>
                  <div className="font-mono">{currentCampaign.campaign_code}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">活动类型</Label>
                  <div>{currentCampaign.campaign_type}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">优先级</Label>
                  <div>{getPriorityBadge(currentCampaign.priority)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">开始日期</Label>
                  <div>{currentCampaign.start_date}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">结束日期</Label>
                  <div>{currentCampaign.end_date}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">预算</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {currentCampaign.budget?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">目标GMV</Label>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    {currentCampaign.target_gmv?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">实际GMV</Label>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    {currentCampaign.actual_gmv?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">ROI</Label>
                  <span className={Number(calculateROI(currentCampaign)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateROI(currentCampaign)}%
                  </span>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div>{getStatusBadge(currentCampaign.status)}</div>
                </div>
              </div>
              {currentCampaign.description && (
                <div>
                  <Label>活动描述</Label>
                  <Card>
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap">{currentCampaign.description}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  关闭
                </Button>
                <Button onClick={() => { setIsDetailDialogOpen(false); openEditDialog(currentCampaign); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑活动
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
