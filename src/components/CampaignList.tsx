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
import { Search, Plus, Calendar, Target, DollarSign, TrendingUp, CheckCircle, Clock, PlayCircle } from 'lucide-react';
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
