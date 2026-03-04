/**
 * 商品中心 - 商品反馈组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Loader2, Plus, X } from 'lucide-react';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  heidax: '海大牌',
  haichuan: '海川牌',
  haiyan: '海燕牌',
  haiding: '海鼎牌',
};

interface Feedback {
  id: string;
  trial_id?: string;
  user_id: string;
  user_name?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  brand?: string;
  rating: number;
  comment: string;
  is_positive: boolean;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface ProductTrial {
  id: string;
  brand: string;
  product_name: string;
  trial_date: string;
  feedbacks: Feedback[];
}

export function ProductFeedback() {
  const [trials, setTrials] = useState<ProductTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // 新增试用对话框状态
  const [isAddTrialDialogOpen, setIsAddTrialDialogOpen] = useState(false);
  const [submittingTrial, setSubmittingTrial] = useState(false);
  const [newTrial, setNewTrial] = useState({
    brand: 'heidax',
    product_name: '',
    trial_date: new Date().toISOString().split('T')[0],
  });

  // 添加反馈对话框状态
  const [isAddFeedbackDialogOpen, setIsAddFeedbackDialogOpen] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState({
    product_sku: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadTrials();
  }, [selectedStatus]);

  const loadTrials = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/product-center/product-trials${params.toString() ? `?${params}` : ''}`);
      const data = await response.json();

      if (data.success) {
        setTrials(data.data || []);
      } else {
        setError(data.error || '加载数据失败');
      }
    } catch (error) {
      console.error('加载商品试用失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrial = async () => {
    if (!newTrial.product_name || !newTrial.trial_date) {
      alert('请填写完整信息');
      return;
    }

    setSubmittingTrial(true);
    try {
      const response = await fetch('/api/product-center/product-trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrial),
      });

      const data = await response.json();
      if (data.success) {
        alert('商品试用添加成功');
        setIsAddTrialDialogOpen(false);
        setNewTrial({
          brand: 'heidax',
          product_name: '',
          trial_date: new Date().toISOString().split('T')[0],
        });
        await loadTrials();
      } else {
        alert('添加失败：' + data.error);
      }
    } catch (error) {
      console.error('添加商品试用失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmittingTrial(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedTrialId || !newFeedback.product_sku || !newFeedback.comment) {
      alert('请填写完整信息');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await fetch('/api/product-center/product-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trial_id: selectedTrialId,
          product_sku: newFeedback.product_sku,
          rating: newFeedback.rating,
          comment: newFeedback.comment,
          is_positive: newFeedback.rating >= 4,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈添加成功');
        setIsAddFeedbackDialogOpen(false);
        setNewFeedback({ product_sku: '', rating: 5, comment: '' });
        setSelectedTrialId(null);
        await loadTrials();
      } else {
        alert('添加失败：' + data.error);
      }
    } catch (error) {
      console.error('添加反馈失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openFeedbackDialog = (trialId: string) => {
    setSelectedTrialId(trialId);
    setIsAddFeedbackDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 计算统计
  const totalFeedbacks = trials.reduce((sum, t) => sum + t.feedbacks.length, 0);
  const positiveFeedbacks = trials.reduce((sum, t) => sum + t.feedbacks.filter(f => f.is_positive).length, 0);
  const negativeFeedbacks = totalFeedbacks - positiveFeedbacks;
  const averageRating = totalFeedbacks > 0
    ? trials.reduce((sum, t) => sum + t.feedbacks.reduce((s, f) => s + f.rating, 0), 0) / totalFeedbacks
    : 0;

  return (
    <div className="space-y-4">
      {/* 头部操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            全部
          </Button>
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('pending')}
          >
            待处理
          </Button>
          <Button
            variant={selectedStatus === 'reviewed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('reviewed')}
          >
            已审核
          </Button>
          <Button
            variant={selectedStatus === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('resolved')}
          >
            已解决
          </Button>
        </div>

        <Dialog open={isAddTrialDialogOpen} onOpenChange={setIsAddTrialDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增商品试用
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增商品试用</DialogTitle>
              <DialogDescription>创建商品试用记录，用于收集用户反馈</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">品牌</label>
                <Select 
                  value={newTrial.brand} 
                  onValueChange={(v) => setNewTrial({ ...newTrial, brand: v })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BRAND_NAMES).filter(([k]) => k !== 'all').map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">产品名称</label>
                <Input
                  className="mt-1"
                  placeholder="输入产品名称"
                  value={newTrial.product_name}
                  onChange={(e) => setNewTrial({ ...newTrial, product_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">试用日期</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={newTrial.trial_date}
                  onChange={(e) => setNewTrial({ ...newTrial, trial_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTrialDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddTrial} disabled={submittingTrial}>
                {submittingTrial ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                提交
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总反馈数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedbacks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">好评数</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{positiveFeedbacks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">差评数</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{negativeFeedbacks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 商品试用列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            加载中...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadTrials} className="mt-4">
              重试
            </Button>
          </div>
        ) : trials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无商品试用数据</p>
              <p className="text-sm mt-2">点击"新增商品试用"按钮开始收集用户反馈</p>
            </CardContent>
          </Card>
        ) : (
          trials.map((trial) => (
            <Card key={trial.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{trial.product_name}</CardTitle>
                      <Badge variant="secondary">{BRAND_NAMES[trial.brand] || trial.brand}</Badge>
                    </div>
                    <CardDescription>试用日期：{formatDate(trial.trial_date)}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => openFeedbackDialog(trial.id)}>
                    <Plus className="mr-1 h-4 w-4" />
                    添加反馈
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {trial.feedbacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无反馈，点击右上角按钮添加</p>
                ) : (
                  <div className="space-y-3">
                    {trial.feedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{feedback.product_sku}</Badge>
                            {renderStars(feedback.rating)}
                          </div>
                          <Badge variant={feedback.is_positive ? 'default' : 'destructive'}>
                            {feedback.is_positive ? '好评' : '差评'}
                          </Badge>
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDate(feedback.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 添加反馈对话框 */}
      <Dialog open={isAddFeedbackDialogOpen} onOpenChange={setIsAddFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加产品反馈</DialogTitle>
            <DialogDescription>为试用产品添加评分和反馈</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">产品编号</label>
              <Input
                className="mt-1"
                placeholder="输入产品编号（SKU）"
                value={newFeedback.product_sku}
                onChange={(e) => setNewFeedback({ ...newFeedback, product_sku: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">评分</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">反馈内容</label>
              <Textarea
                placeholder="请详细描述您的使用体验或建议..."
                className="mt-1"
                rows={4}
                value={newFeedback.comment}
                onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFeedbackDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddFeedback} disabled={submittingFeedback}>
              {submittingFeedback ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
