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
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Loader2, Plus, X, Edit, Trash2, Image as ImageIcon, Upload } from 'lucide-react';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  hezhe: '禾哲',
  baobao: 'BAOBAO',
  aihe: '爱禾',
  baodengyuan: '宝登源',
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
  images?: string[];
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
    brand: 'hezhe',
    product_name: '',
    trial_date: new Date().toISOString().split('T')[0],
  });

  // 编辑试用对话框状态
  const [isEditTrialDialogOpen, setIsEditTrialDialogOpen] = useState(false);
  const [editingTrial, setEditingTrial] = useState<ProductTrial | null>(null);
  const [editTrialData, setEditTrialData] = useState({
    brand: 'hezhe',
    product_name: '',
    trial_date: new Date().toISOString().split('T')[0],
  });

  // 删除试用确认对话框状态
  const [isDeleteTrialDialogOpen, setIsDeleteTrialDialogOpen] = useState(false);
  const [deletingTrial, setDeletingTrial] = useState<ProductTrial | null>(null);
  const [deletingTrialState, setDeletingTrialState] = useState(false);

  // 添加反馈对话框状态
  const [isAddFeedbackDialogOpen, setIsAddFeedbackDialogOpen] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState({
    product_sku: '',
    rating: 5,
    comment: '',
    images: [] as string[],
  });

  // 编辑反馈对话框状态
  const [isEditFeedbackDialogOpen, setIsEditFeedbackDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editFeedbackData, setEditFeedbackData] = useState({
    product_sku: '',
    rating: 5,
    comment: '',
    images: [] as string[],
  });

  // 删除反馈确认对话框状态
  const [isDeleteFeedbackDialogOpen, setIsDeleteFeedbackDialogOpen] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);
  const [deletingFeedbackState, setDeletingFeedbackState] = useState(false);

  useEffect(() => {
    loadTrials();
  }, [selectedStatus]);

  const loadTrials = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/product-center/product-trials${params.toString() ? `?${params}` : ''}`, {
        credentials: 'include',
      });
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

  // 图片上传处理函数
  const handleImageUpload = async (feedbackIdOrTrialId: string, files: FileList): Promise<string[]> => {
    const uploadedKeys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert('只能上传图片文件');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('feedbackId', feedbackIdOrTrialId);

        console.log('[前端] 开始上传图片:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          feedbackId: feedbackIdOrTrialId,
        });

        const response = await fetch('/api/product-center/feedback-images', {
          method: 'POST',
          headers: {
            'credentials': 'include',
          },
          body: formData,
          credentials: 'include',
        });

        console.log('[前端] 上传响应状态:', response.status);

        const data = await response.json();
        console.log('[前端] 上传响应数据:', data);

        if (data.success) {
          uploadedKeys.push(data.fileKey);
          console.log('[前端] 上传成功，fileKey:', data.fileKey);
        } else {
          console.error('[前端] 上传失败:', data);
          const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
          alert('上传失败：' + errorMsg);
        }
      } catch (error) {
        console.error('[前端] 上传图片失败:', error);
        alert('上传图片失败，请稍后重试\n错误信息：' + (error as Error).message);
      }
    }

    return uploadedKeys;
  };

  // 图片删除处理函数
  const handleImageDelete = async (fileKey: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/product-center/feedback-images/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        alert('删除失败：' + data.error);
        return false;
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      alert('删除图片失败，请稍后重试');
      return false;
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
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('商品试用添加成功');
        setIsAddTrialDialogOpen(false);
        setNewTrial({
          brand: 'hezhe',
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
      // 如果有图片，先上传图片
      let imageKeys: string[] = [];
      if (newFeedback.images.length > 0) {
        // 图片已经在上传时处理了，这里直接使用
        imageKeys = newFeedback.images;
      }

      const response = await fetch('/api/product-center/product-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trial_id: selectedTrialId,
          product_sku: newFeedback.product_sku,
          rating: newFeedback.rating,
          comment: newFeedback.comment,
          is_positive: newFeedback.rating >= 4,
          images: imageKeys,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈添加成功');
        setIsAddFeedbackDialogOpen(false);
        setNewFeedback({ product_sku: '', rating: 5, comment: '', images: [] });
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

  const openEditTrialDialog = (trial: ProductTrial) => {
    setEditingTrial(trial);
    setEditTrialData({
      brand: trial.brand,
      product_name: trial.product_name,
      trial_date: trial.trial_date,
    });
    setIsEditTrialDialogOpen(true);
  };

  const handleEditTrial = async () => {
    if (!editingTrial || !editTrialData.product_name || !editTrialData.trial_date) {
      alert('请填写完整信息');
      return;
    }

    setSubmittingTrial(true);
    try {
      const response = await fetch(`/api/product-center/product-trials/${editingTrial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTrialData),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('商品试用更新成功');
        setIsEditTrialDialogOpen(false);
        setEditingTrial(null);
        await loadTrials();
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      console.error('更新商品试用失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmittingTrial(false);
    }
  };

  const openDeleteTrialDialog = (trial: ProductTrial) => {
    setDeletingTrial(trial);
    setIsDeleteTrialDialogOpen(true);
  };

  const handleDeleteTrial = async () => {
    if (!deletingTrial) return;

    setDeletingTrialState(true);
    try {
      const response = await fetch(`/api/product-center/product-trials/${deletingTrial.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('商品试用删除成功');
        setIsDeleteTrialDialogOpen(false);
        setDeletingTrial(null);
        await loadTrials();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除商品试用失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setDeletingTrialState(false);
    }
  };

  const openFeedbackDialog = (trialId: string) => {
    setSelectedTrialId(trialId);
    setIsAddFeedbackDialogOpen(true);
  };

  const openEditFeedbackDialog = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditFeedbackData({
      product_sku: feedback.product_sku || '',
      rating: feedback.rating,
      comment: feedback.comment || '',
      images: feedback.images || [],
    });
    setIsEditFeedbackDialogOpen(true);
  };

  const handleEditFeedback = async () => {
    if (!editingFeedback) return;

    setSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/product-center/product-feedback/${editingFeedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_sku: editFeedbackData.product_sku,
          rating: editFeedbackData.rating,
          comment: editFeedbackData.comment,
          images: editFeedbackData.images,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈更新成功');
        setIsEditFeedbackDialogOpen(false);
        setEditingFeedback(null);
        setEditFeedbackData({ product_sku: '', rating: 5, comment: '', images: [] });
        await loadTrials();
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      console.error('更新反馈失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openDeleteFeedbackDialog = (feedback: Feedback) => {
    setDeletingFeedback(feedback);
    setIsDeleteFeedbackDialogOpen(true);
  };

  const handleDeleteFeedback = async () => {
    if (!deletingFeedback) return;

    setDeletingFeedbackState(true);
    try {
      const response = await fetch(`/api/product-center/product-feedback/${deletingFeedback.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        alert('反馈删除成功');
        setIsDeleteFeedbackDialogOpen(false);
        setDeletingFeedback(null);
        await loadTrials();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除反馈失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setDeletingFeedbackState(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 图片预览组件
  const ImagePreview = ({ fileKey }: { fileKey: string }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const fetchImageUrl = async () => {
        try {
          const response = await fetch(`/api/product-center/feedback-images?key=${encodeURIComponent(fileKey)}`, {
            credentials: 'include',
          });
          const data = await response.json();
          if (data.success && data.imageUrl) {
            setImageUrl(data.imageUrl);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('获取图片URL失败:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchImageUrl();
    }, [fileKey]);

    if (loading) {
      return (
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
          加载失败
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt="反馈图片"
        className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => window.open(imageUrl, '_blank')}
      />
    );
  };

  const renderStars = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className={onChange ? 'focus:outline-none' : ''}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // 计算统计
  const totalFeedbacks = trials.reduce((sum, t) => sum + (t.feedbacks?.length || 0), 0);
  const positiveFeedbacks = trials.reduce((sum, t) => sum + (t.feedbacks?.filter(f => f.is_positive).length || 0), 0);
  const negativeFeedbacks = totalFeedbacks - positiveFeedbacks;
  const averageRating = totalFeedbacks > 0
    ? trials.reduce((sum, t) => sum + (t.feedbacks?.reduce((s, f) => s + f.rating, 0) || 0), 0) / totalFeedbacks
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => openFeedbackDialog(trial.id)}>
                      <Plus className="mr-1 h-4 w-4" />
                      添加反馈
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditTrialDialog(trial)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteTrialDialog(trial)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {trial.feedbacks?.length === 0 ? (
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
                          <div className="flex items-center gap-2">
                            <Badge variant={feedback.is_positive ? 'default' : 'destructive'}>
                              {feedback.is_positive ? '好评' : '差评'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditFeedbackDialog(feedback)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteFeedbackDialog(feedback)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                        {feedback.images && feedback.images.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {feedback.images.map((imageKey, index) => (
                              <ImagePreview key={index} fileKey={imageKey} />
                            ))}
                          </div>
                        )}
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
                {renderStars(newFeedback.rating, (rating) => setNewFeedback({ ...newFeedback, rating }))}
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
            <div>
              <label className="text-sm font-medium">上传图片</label>
              <div className="mt-2 space-y-2">
                {/* 图片上传区域 */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="image-upload-add"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0 && selectedTrialId) {
                        const uploadedKeys = await handleImageUpload(selectedTrialId, files);
                        setNewFeedback({ ...newFeedback, images: [...newFeedback.images, ...uploadedKeys] });
                        // 重置文件输入
                        e.target.value = '';
                      }
                    }}
                  />
                  <label htmlFor="image-upload-add" className="cursor-pointer block">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">点击或拖拽上传图片</p>
                    <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、GIF 格式，单张图片不超过 5MB</p>
                  </label>
                </div>

                {/* 已上传图片预览 */}
                {newFeedback.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {newFeedback.images.map((fileKey, index) => (
                      <div key={index} className="relative group">
                        <ImagePreview fileKey={fileKey} />
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await handleImageDelete(fileKey);
                            if (success) {
                              setNewFeedback({
                                ...newFeedback,
                                images: newFeedback.images.filter((_, i) => i !== index)
                              });
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* 编辑反馈对话框 */}
      <Dialog open={isEditFeedbackDialogOpen} onOpenChange={setIsEditFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑产品反馈</DialogTitle>
            <DialogDescription>修改产品评分和反馈</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">产品编号</label>
              <Input
                className="mt-1"
                placeholder="输入产品编号（SKU）"
                value={editFeedbackData.product_sku}
                onChange={(e) => setEditFeedbackData({ ...editFeedbackData, product_sku: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">评分</label>
              <div className="flex gap-1 mt-1">
                {renderStars(editFeedbackData.rating, (rating) => setEditFeedbackData({ ...editFeedbackData, rating }))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">反馈内容</label>
              <Textarea
                placeholder="请详细描述您的使用体验或建议..."
                className="mt-1"
                rows={4}
                value={editFeedbackData.comment}
                onChange={(e) => setEditFeedbackData({ ...editFeedbackData, comment: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">上传图片</label>
              <div className="mt-2 space-y-2">
                {/* 图片上传区域 */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="image-upload-edit"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0 && editingFeedback) {
                        const uploadedKeys = await handleImageUpload(editingFeedback.id, files);
                        setEditFeedbackData({ ...editFeedbackData, images: [...editFeedbackData.images, ...uploadedKeys] });
                        // 重置文件输入
                        e.target.value = '';
                      }
                    }}
                  />
                  <label htmlFor="image-upload-edit" className="cursor-pointer block">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">点击或拖拽上传图片</p>
                    <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、GIF 格式，单张图片不超过 5MB</p>
                  </label>
                </div>

                {/* 已上传图片预览 */}
                {editFeedbackData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editFeedbackData.images.map((fileKey, index) => (
                      <div key={index} className="relative group">
                        <ImagePreview fileKey={fileKey} />
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await handleImageDelete(fileKey);
                            if (success) {
                              setEditFeedbackData({
                                ...editFeedbackData,
                                images: editFeedbackData.images.filter((_, i) => i !== index)
                              });
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFeedbackDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditFeedback} disabled={submittingFeedback}>
              {submittingFeedback ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除反馈确认对话框 */}
      <Dialog open={isDeleteFeedbackDialogOpen} onOpenChange={setIsDeleteFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条反馈吗？删除后将无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteFeedbackDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteFeedback} disabled={deletingFeedbackState}>
              {deletingFeedbackState ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑商品试用对话框 */}
      <Dialog open={isEditTrialDialogOpen} onOpenChange={setIsEditTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑商品试用</DialogTitle>
            <DialogDescription>修改商品试用记录信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">品牌</label>
              <Select 
                value={editTrialData.brand} 
                onValueChange={(v) => setEditTrialData({ ...editTrialData, brand: v })}
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
                value={editTrialData.product_name}
                onChange={(e) => setEditTrialData({ ...editTrialData, product_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">试用日期</label>
              <Input
                type="date"
                className="mt-1"
                value={editTrialData.trial_date}
                onChange={(e) => setEditTrialData({ ...editTrialData, trial_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTrialDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditTrial} disabled={submittingTrial}>
              {submittingTrial ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除商品试用确认对话框 */}
      <Dialog open={isDeleteTrialDialogOpen} onOpenChange={setIsDeleteTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条商品试用记录吗？删除后将无法恢复，所有相关反馈也会被删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteTrialDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrial} disabled={deletingTrialState}>
              {deletingTrialState ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
