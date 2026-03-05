/**
 * 营销中台 - 活动复盘组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Plus, FileText, Eye, Calendar, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_gmv: number;
  status: string;
}

interface CampaignReview {
  id: string;
  campaign_id: string;
  campaign_name?: string;
  actual_gmv: number;
  actual_budget: number;
  actual_traffic: number;
  conversion_rate: number;
  roi: number;
  success_factors: string[];
  issues: string[];
  lessons: string[];
  improvement_suggestions: string[];
  overall_rating: number;
  reviewer_id: string;
  reviewer_name?: string;
  review_date: string;
  created_at: string;
}

export function CampaignReview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reviews, setReviews] = useState<CampaignReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<CampaignReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    campaign_id: '',
    actual_gmv: '',
    actual_budget: '',
    actual_traffic: '',
    conversion_rate: '',
    roi: '',
    success_factors: '',
    issues: '',
    lessons: '',
    improvement_suggestions: '',
    overall_rating: '3',
  });

  useEffect(() => {
    loadCampaigns();
    loadReviews();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/marketing/campaigns?page=1&limit=100&status=completed');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      // 模拟复盘数据，实际应该从 API 获取
      const mockReviews: CampaignReview[] = [];
      setReviews(mockReviews);
    } catch (error) {
      console.error('加载复盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!formData.campaign_id) {
      alert('请选择活动');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟创建复盘，实际应该调用 API
      const campaign = campaigns.find(c => c.id === formData.campaign_id);
      const newReview: CampaignReview = {
        id: Date.now().toString(),
        campaign_id: formData.campaign_id,
        campaign_name: campaign?.name,
        actual_gmv: parseFloat(formData.actual_gmv) || 0,
        actual_budget: parseFloat(formData.actual_budget) || 0,
        actual_traffic: parseFloat(formData.actual_traffic) || 0,
        conversion_rate: parseFloat(formData.conversion_rate) || 0,
        roi: parseFloat(formData.roi) || 0,
        success_factors: formData.success_factors.split('\n').filter(s => s.trim()),
        issues: formData.issues.split('\n').filter(s => s.trim()),
        lessons: formData.lessons.split('\n').filter(s => s.trim()),
        improvement_suggestions: formData.improvement_suggestions.split('\n').filter(s => s.trim()),
        overall_rating: parseInt(formData.overall_rating),
        reviewer_id: 'current-user',
        reviewer_name: '当前用户',
        review_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setReviews([...reviews, newReview]);
      setIsCreateDialogOpen(false);
      resetForm();
      alert('复盘创建成功！');
    } catch (error) {
      console.error('创建复盘失败:', error);
      alert('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailDialog = (review: CampaignReview) => {
    setCurrentReview(review);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      campaign_id: '',
      actual_gmv: '',
      actual_budget: '',
      actual_traffic: '',
      conversion_rate: '',
      roi: '',
      success_factors: '',
      issues: '',
      lessons: '',
      improvement_suggestions: '',
      overall_rating: '3',
    });
    setCurrentReview(null);
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) return <Badge className="bg-green-600">优秀</Badge>;
    if (rating >= 3) return <Badge className="bg-blue-600">良好</Badge>;
    if (rating >= 2) return <Badge className="bg-yellow-600">一般</Badge>;
    return <Badge className="bg-red-600">差</Badge>;
  };

  const getRoiBadge = (roi: number) => {
    if (roi >= 5) return <Badge variant="default" className="bg-green-600">优秀</Badge>;
    if (roi >= 3) return <Badge variant="default" className="bg-blue-600">良好</Badge>;
    if (roi >= 1) return <Badge variant="secondary">一般</Badge>;
    return <Badge variant="destructive">亏损</Badge>;
  };

  const calculateAchievementRate = (review: CampaignReview) => {
    const campaign = campaigns.find(c => c.id === review.campaign_id);
    if (!campaign || !campaign.target_gmv) return '0';
    return ((review.actual_gmv / campaign.target_gmv) * 100).toFixed(1);
  };

  const calculateBudgetUsage = (review: CampaignReview) => {
    const campaign = campaigns.find(c => c.id === review.campaign_id);
    if (!campaign || !campaign.budget) return '0';
    return ((review.actual_budget / campaign.budget) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">活动复盘列表</h3>
          <p className="text-sm text-muted-foreground">已完成活动的效果总结与经验沉淀</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建复盘
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建活动复盘</DialogTitle>
              <DialogDescription>填写活动效果总结和经验教训</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">选择活动 *</Label>
                <Select value={formData.campaign_id} onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择已完成的活动" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.filter(c => c.status === 'completed').map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({format(new Date(campaign.end_date), 'yyyy-MM-dd')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual_gmv">实际GMV</Label>
                  <Input
                    id="actual_gmv"
                    type="number"
                    value={formData.actual_gmv}
                    onChange={(e) => setFormData({ ...formData, actual_gmv: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_budget">实际预算</Label>
                  <Input
                    id="actual_budget"
                    type="number"
                    value={formData.actual_budget}
                    onChange={(e) => setFormData({ ...formData, actual_budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual_traffic">实际流量</Label>
                  <Input
                    id="actual_traffic"
                    type="number"
                    value={formData.actual_traffic}
                    onChange={(e) => setFormData({ ...formData, actual_traffic: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conversion_rate">转化率(%)</Label>
                  <Input
                    id="conversion_rate"
                    type="number"
                    step="0.01"
                    value={formData.conversion_rate}
                    onChange={(e) => setFormData({ ...formData, conversion_rate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roi">ROI (倍数)</Label>
                  <Input
                    id="roi"
                    type="number"
                    step="0.01"
                    value={formData.roi}
                    onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_factors">成功因素（每行一个）</Label>
                <Textarea
                  id="success_factors"
                  value={formData.success_factors}
                  onChange={(e) => setFormData({ ...formData, success_factors: e.target.value })}
                  rows={3}
                  placeholder="列出活动执行过程中的成功因素和亮点"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">遇到的问题（每行一个）</Label>
                <Textarea
                  id="issues"
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  rows={3}
                  placeholder="列出活动执行过程中遇到的问题和挑战"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessons">经验教训（每行一个）</Label>
                <Textarea
                  id="lessons"
                  value={formData.lessons}
                  onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                  rows={3}
                  placeholder="总结本次活动的经验教训"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvement_suggestions">改进建议（每行一个）</Label>
                <Textarea
                  id="improvement_suggestions"
                  value={formData.improvement_suggestions}
                  onChange={(e) => setFormData({ ...formData, improvement_suggestions: e.target.value })}
                  rows={3}
                  placeholder="对未来活动的改进建议"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall_rating">整体评价</Label>
                <Select value={formData.overall_rating} onValueChange={(v) => setFormData({ ...formData, overall_rating: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择评价等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 优秀</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 良好</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 一般</SelectItem>
                    <SelectItem value="2">⭐⭐ 较差</SelectItem>
                    <SelectItem value="1">⭐ 很差</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                取消
              </Button>
              <Button onClick={handleCreateReview} disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '提交复盘'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 复盘列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动复盘记录</CardTitle>
          <CardDescription>已完成活动的效果分析与经验沉淀</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无复盘记录</p>
              <p className="text-sm text-muted-foreground mt-2">已完成活动可以进行复盘总结</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动名称</TableHead>
                  <TableHead>实际GMV</TableHead>
                  <TableHead>达成率</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>评价</TableHead>
                  <TableHead>复盘人</TableHead>
                  <TableHead>复盘日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="font-medium">{review.campaign_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>¥{(review.actual_gmv / 10000).toFixed(2)}万</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{calculateAchievementRate(review)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoiBadge(review.roi)}</TableCell>
                    <TableCell>{getRatingBadge(review.overall_rating)}</TableCell>
                    <TableCell>{review.reviewer_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(review.review_date), 'yyyy-MM-dd')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(review)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 复盘详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>复盘详情</DialogTitle>
            <DialogDescription>活动效果分析与经验沉淀</DialogDescription>
          </DialogHeader>
          {currentReview && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground mb-1">活动名称</div>
                    <div className="font-semibold">{currentReview.campaign_name}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground mb-1">实际GMV</div>
                    <div className="font-semibold">¥{(currentReview.actual_gmv / 10000).toFixed(2)}万</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground mb-1">ROI</div>
                    <div className="font-semibold">{currentReview.roi}x</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground mb-1">评价</div>
                    <div>{getRatingBadge(currentReview.overall_rating)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 成功因素 */}
              {currentReview.success_factors && currentReview.success_factors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      成功因素
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReview.success_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 遇到的问题 */}
              {currentReview.issues && currentReview.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      遇到的问题
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReview.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">!</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 经验教训 */}
              {currentReview.lessons && currentReview.lessons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      经验教训
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReview.lessons.map((lesson, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">→</span>
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 改进建议 */}
              {currentReview.improvement_suggestions && currentReview.improvement_suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      改进建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReview.improvement_suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">★</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
