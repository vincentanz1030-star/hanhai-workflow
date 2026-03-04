/**
 * 商品中心 - 商品反馈组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface Feedback {
  id: string;
  user_id: string;
  user_name?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  order_id?: string;
  rating: number;
  comment: string;
  images?: string[];
  is_positive: boolean;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export function ProductFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    rating: 5,
    comment: '',
  });
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadFeedbacks();
  }, [selectedStatus]);

  const loadFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/product-center/product-feedback${params.toString() ? `?${params}` : ''}`);
      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.data || []);
      } else {
        setError(data.error || '加载数据失败');
      }
    } catch (error) {
      console.error('加载商品反馈失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!formData.product_id || !formData.comment) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/product-center/product-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: formData.product_id,
          product_name: formData.product_name,
          rating: formData.rating,
          comment: formData.comment,
          is_positive: formData.rating >= 4,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈提交成功');
        setDialogOpen(false);
        setFormData({ product_id: '', product_name: '', rating: 5, comment: '' });
        await loadFeedbacks();
      } else {
        alert('提交失败：' + data.error);
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  const statusMap = {
    pending: { label: '待处理', variant: 'secondary' as const },
    reviewed: { label: '已审核', variant: 'default' as const },
    resolved: { label: '已解决', variant: 'outline' as const },
  };

  return (
    <div className="space-y-4">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              提交反馈
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>提交商品反馈</DialogTitle>
              <DialogDescription>分享您的使用体验，帮助我们改进产品</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">产品名称</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="输入产品名称"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">产品ID</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="输入产品ID"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">评分</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmitFeedback} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
            <div className="text-2xl font-bold">{feedbacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">好评数</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {feedbacks.filter(f => f.is_positive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">差评数</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {feedbacks.filter(f => !f.is_positive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {feedbacks.length > 0
                ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 反馈列表 */}
      <Card>
        <CardHeader>
          <CardTitle>商品反馈列表</CardTitle>
          <CardDescription>共 {feedbacks.length} 条反馈</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadFeedbacks} className="mt-4">
                重试
              </Button>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无商品反馈数据</p>
              <p className="text-sm mt-2">API接口已就绪：/api/product-center/product-feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feedback.product_name || '未知产品'}</span>
                          <Badge variant="secondary" className="text-xs">
                            {feedback.product_sku || '-'}
                          </Badge>
                          {renderStars(feedback.rating)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {feedback.user_name || '匿名用户'} · {formatDate(feedback.created_at)}
                        </div>
                      </div>
                      <Badge variant={statusMap[feedback.status].variant}>
                        {statusMap[feedback.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{feedback.comment}</p>
                    {feedback.is_positive ? (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        好评
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <ThumbsDown className="h-4 w-4" />
                        差评
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
