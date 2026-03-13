/**
 * 客户反馈组件 - 客户反馈管理
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Plus, Edit, Trash2, Search, Filter, Image, X, 
  Calendar, Star, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BRANDS = [
  { value: 'he_zhe', label: '禾哲' },
  { value: 'baobao', label: 'BAOBAO' },
  { value: 'ai_he', label: '爱禾' },
  { value: 'bao_deng_yuan', label: '宝登源' },
];

const FEEDBACK_TYPES: Record<string, string> = {
  general: '一般反馈',
  complaint: '投诉',
  suggestion: '建议',
  praise: '表扬',
  inquiry: '咨询',
};

const STATUS_OPTIONS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
};

const PRIORITY_OPTIONS: Record<string, string> = {
  low: '低',
  normal: '中',
  high: '高',
  urgent: '紧急',
};

interface WeeklyFeedback {
  id: string;
  brand: string;
  weekStart: string | null;
  weekEnd: string | null;
  customerName: string | null;
  contactInfo: string | null;
  feedbackType: string;
  feedbackContent: string;
  rating: number;
  images: string[];
  status: string;
  priority: string;
  responseContent: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function CustomerFeedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 弹窗状态
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewFeedback, setPreviewFeedback] = useState<WeeklyFeedback | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<WeeklyFeedback | null>(null);
  
  // 打开预览
  const openPreview = (feedback: WeeklyFeedback) => {
    setPreviewFeedback(feedback);
    setShowPreviewDialog(true);
  };
  
  // 表单数据
  const [formData, setFormData] = useState({
    brand: 'he_zhe',
    weekStart: '',
    weekEnd: '',
    customerName: '',
    contactInfo: '',
    feedbackType: 'general',
    feedbackContent: '',
    rating: 5,
    priority: 'normal',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [selectedBrand, selectedStatus]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBrand !== 'all') params.append('brand', selectedBrand);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/weekly-feedbacks?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedbacks(data.data || []);
      }
    } catch (error) {
      console.error('加载反馈失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.feedbackContent) {
      alert('请填写反馈内容');
      return;
    }

    setSaving(true);
    try {
      const method = currentFeedback ? 'PATCH' : 'POST';
      const url = currentFeedback 
        ? `/api/weekly-feedbacks/${currentFeedback.id}` 
        : '/api/weekly-feedbacks';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowFormDialog(false);
        resetForm();
        loadFeedbacks();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFeedback) return;

    try {
      const response = await fetch(`/api/weekly-feedbacks/${currentFeedback.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setCurrentFeedback(null);
        loadFeedbacks();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const openEditDialog = (feedback: WeeklyFeedback) => {
    setCurrentFeedback(feedback);
    setFormData({
      brand: feedback.brand,
      weekStart: feedback.weekStart || '',
      weekEnd: feedback.weekEnd || '',
      customerName: feedback.customerName || '',
      contactInfo: feedback.contactInfo || '',
      feedbackType: feedback.feedbackType,
      feedbackContent: feedback.feedbackContent,
      rating: feedback.rating,
      priority: feedback.priority,
    });
    setShowFormDialog(true);
  };

  const resetForm = () => {
    setFormData({
      brand: 'he_zhe',
      weekStart: '',
      weekEnd: '',
      customerName: '',
      contactInfo: '',
      feedbackType: 'general',
      feedbackContent: '',
      rating: 5,
      priority: 'normal',
    });
    setCurrentFeedback(null);
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    !searchKeyword || 
    f.feedbackContent.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (f.customerName && f.customerName.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // 统计数据
  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    processing: feedbacks.filter(f => f.status === 'processing').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) 
      : '0',
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-base">客户反馈</h2>
            <p className="text-xs text-muted-foreground">收集和管理客户反馈信息</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowFormDialog(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          新增反馈
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">总反馈</p>
            <p className="text-xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">待处理</p>
            <p className="text-xl font-bold mt-1 text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">处理中</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">已解决</p>
            <p className="text-xl font-bold mt-1 text-green-600">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">平均评分</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{stats.avgRating}</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="品牌" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部品牌</SelectItem>
              {BRANDS.map(b => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(STATUS_OPTIONS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={loadFeedbacks} disabled={loading}>
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 反馈列表 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无反馈数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedbacks.map((feedback) => (
                <div 
                  key={feedback.id} 
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openPreview(feedback)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{BRANDS.find(b => b.value === feedback.brand)?.label || feedback.brand}</Badge>
                        <Badge className={STATUS_OPTIONS[feedback.status]?.color}>
                          {STATUS_OPTIONS[feedback.status]?.label || feedback.status}
                        </Badge>
                        <Badge variant="secondary">{FEEDBACK_TYPES[feedback.feedbackType] || feedback.feedbackType}</Badge>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs">{feedback.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">{feedback.feedbackContent}</p>
                      {feedback.customerName && (
                        <p className="text-xs text-muted-foreground mt-2">
                          客户: {feedback.customerName}
                          {feedback.contactInfo && ` (${feedback.contactInfo})`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(feedback)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive" 
                        onClick={() => { setCurrentFeedback(feedback); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentFeedback ? '编辑反馈' : '新增反馈'}</DialogTitle>
            <DialogDescription>记录客户反馈信息</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">品牌</Label>
                  <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">反馈类型</Label>
                  <Select value={formData.feedbackType} onValueChange={(v) => setFormData({ ...formData, feedbackType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">客户姓名</Label>
                  <Input 
                    placeholder="客户姓名" 
                    value={formData.customerName} 
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">联系方式</Label>
                  <Input 
                    placeholder="联系方式" 
                    value={formData.contactInfo} 
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">反馈内容 *</Label>
                <Textarea 
                  placeholder="请输入反馈内容" 
                  value={formData.feedbackContent}
                  onChange={(e) => setFormData({ ...formData, feedbackContent: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">评分</Label>
                  <Select value={formData.rating.toString()} onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(n => (
                        <SelectItem key={n} value={n.toString()}>
                          {'⭐'.repeat(n)} ({n}分)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">优先级</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowFormDialog(false)}>取消</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除此反馈记录吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base">反馈详情</DialogTitle>
                <DialogDescription>
                  {previewFeedback && new Date(previewFeedback.createdAt).toLocaleString('zh-CN')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {previewFeedback && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{BRANDS.find(b => b.value === previewFeedback.brand)?.label || previewFeedback.brand}</Badge>
                <Badge className={STATUS_OPTIONS[previewFeedback.status]?.color}>
                  {STATUS_OPTIONS[previewFeedback.status]?.label || previewFeedback.status}
                </Badge>
                <Badge variant="secondary">{FEEDBACK_TYPES[previewFeedback.feedbackType] || previewFeedback.feedbackType}</Badge>
                <Badge variant="outline" className="text-amber-600">
                  <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                  {previewFeedback.rating}分
                </Badge>
                <Badge variant="outline" className={previewFeedback.priority === 'urgent' ? 'text-red-600' : previewFeedback.priority === 'high' ? 'text-orange-600' : ''}>
                  {PRIORITY_OPTIONS[previewFeedback.priority] || previewFeedback.priority}
                </Badge>
              </div>

              {/* 客户信息 */}
              {(previewFeedback.customerName || previewFeedback.contactInfo) && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">客户信息</p>
                  {previewFeedback.customerName && (
                    <p className="text-sm">姓名: {previewFeedback.customerName}</p>
                  )}
                  {previewFeedback.contactInfo && (
                    <p className="text-sm text-muted-foreground">联系方式: {previewFeedback.contactInfo}</p>
                  )}
                </div>
              )}

              {/* 反馈内容 */}
              <div>
                <p className="text-sm font-medium mb-2">反馈内容</p>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{previewFeedback.feedbackContent}</p>
                </div>
              </div>

              {/* 回复内容 */}
              {previewFeedback.responseContent && (
                <div>
                  <p className="text-sm font-medium mb-2">回复内容</p>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm whitespace-pre-wrap">{previewFeedback.responseContent}</p>
                  </div>
                </div>
              )}

              {/* 时间范围 */}
              {(previewFeedback.weekStart || previewFeedback.weekEnd) && (
                <div className="text-xs text-muted-foreground">
                  反馈周期: {previewFeedback.weekStart || ''} ~ {previewFeedback.weekEnd || ''}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(false)}>关闭</Button>
            {previewFeedback && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowPreviewDialog(false);
                    openEditDialog(previewFeedback);
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  编辑
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    setShowPreviewDialog(false);
                    setCurrentFeedback(previewFeedback);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  删除
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
