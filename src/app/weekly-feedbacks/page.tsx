'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Edit, Trash2, Search, Filter, Image, X, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface WeeklyFeedback {
  id: string;
  brand: string;
  week_start: string;
  week_end: string;
  customer_name: string | null;
  contact_info: string | null;
  feedback_type: string;
  feedback_content: string;
  rating: number;
  images: string[];
  status: string;
  priority: string;
  response_content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const BRANDS = [
  { value: 'he_zhe', label: '禾哲' },
  { value: 'baobao', label: 'BAOBAO' },
  { value: 'ai_he', label: '爱禾' },
  { value: 'bao_deng_yuan', label: '宝登源' },
];

const FEEDBACK_TYPES = [
  { value: 'general', label: '一般反馈' },
  { value: 'complaint', label: '投诉' },
  { value: 'suggestion', label: '建议' },
  { value: 'praise', label: '表扬' },
  { value: 'inquiry', label: '咨询' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理', color: 'secondary' },
  { value: 'processing', label: '处理中', color: 'default' },
  { value: 'resolved', label: '已解决', color: 'outline' },
  { value: 'closed', label: '已关闭', color: 'destructive' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

export default function WeeklyFeedbacksPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 弹窗状态
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<WeeklyFeedback | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 表单数据
  const [formData, setFormData] = useState({
    brand: '',
    weekStart: '',
    weekEnd: '',
    customerName: '',
    contactInfo: '',
    feedbackType: 'general',
    feedbackContent: '',
    rating: 5,
    images: [] as string[],
    priority: 'normal',
  });
  
  const [uploading, setUploading] = useState(false);
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
      
      const response = await fetch(`/api/weekly-feedbacks?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error('加载反馈失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (feedback?: WeeklyFeedback) => {
    if (feedback) {
      setCurrentFeedback(feedback);
      setFormData({
        brand: feedback.brand,
        weekStart: feedback.week_start,
        weekEnd: feedback.week_end,
        customerName: feedback.customer_name || '',
        contactInfo: feedback.contact_info || '',
        feedbackType: feedback.feedback_type,
        feedbackContent: feedback.feedback_content,
        rating: feedback.rating,
        images: feedback.images || [],
        priority: feedback.priority,
      });
    } else {
      setCurrentFeedback(null);
      // 默认本周日期
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      setFormData({
        brand: '',
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        customerName: '',
        contactInfo: '',
        feedbackType: 'general',
        feedbackContent: '',
        rating: 5,
        images: [],
        priority: 'normal',
      });
    }
    setShowFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.brand || !formData.weekStart || !formData.weekEnd || !formData.feedbackContent) {
      alert('请填写必填项：品牌、周开始日期、周结束日期、反馈内容');
      return;
    }
    
    try {
      setSaving(true);
      const url = currentFeedback 
        ? `/api/weekly-feedbacks/${currentFeedback.id}`
        : '/api/weekly-feedbacks';
      const method = currentFeedback ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.id,
        }),
      });
      
      if (response.ok) {
        setShowFormDialog(false);
        loadFeedbacks();
      } else {
        const data = await response.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
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
      
      if (response.ok) {
        setShowDeleteDialog(false);
        setCurrentFeedback(null);
        loadFeedbacks();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            uploadedUrls.push(data.url);
          }
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handlePreviewImages = (images: string[], index: number = 0) => {
    setPreviewImages(images);
    setCurrentImageIndex(index);
    setShowImageDialog(true);
  };

  const getBrandLabel = (brand: string) => {
    return BRANDS.find(b => b.value === brand)?.label || brand;
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    const label = PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority;
    return <span className={`px-2 py-1 rounded text-xs ${colors[priority] || colors.normal}`}>{label}</span>;
  };

  const getFeedbackTypeLabel = (type: string) => {
    return FEEDBACK_TYPES.find(t => t.value === type)?.label || type;
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && setFormData(prev => ({ ...prev, rating: star }))}
          />
        ))}
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    !searchKeyword || 
    f.feedback_content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (f.customer_name && f.customer_name.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">每周客户反馈</h1>
          <p className="text-muted-foreground mt-2">管理各品牌的每周客户反馈信息</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          新增反馈
        </Button>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="品牌" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品牌</SelectItem>
                  {BRANDS.map(brand => (
                    <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索反馈内容或客户名称..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 反馈列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>暂无反馈数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeedbacks.map(feedback => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getBrandLabel(feedback.brand)}</Badge>
                      {getStatusBadge(feedback.status)}
                      {getPriorityBadge(feedback.priority)}
                      <Badge variant="secondary">{getFeedbackTypeLabel(feedback.feedback_type)}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {feedback.week_start} 至 {feedback.week_end}
                    </p>
                    
                    {feedback.customer_name && (
                      <p className="text-sm mb-1">
                        <span className="text-muted-foreground">客户：</span>
                        {feedback.customer_name}
                        {feedback.contact_info && <span className="text-muted-foreground ml-2">({feedback.contact_info})</span>}
                      </p>
                    )}
                    
                    <p className="text-sm mt-2 line-clamp-2">{feedback.feedback_content}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">评分：</span>
                        {renderStars(feedback.rating)}
                      </div>
                      
                      {feedback.images && feedback.images.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {feedback.images.slice(0, 3).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => handlePreviewImages(feedback.images, i)}
                              />
                            ))}
                            {feedback.images.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{feedback.images.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(feedback)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setCurrentFeedback(feedback); setShowDeleteDialog(true); }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentFeedback ? '编辑反馈' : '新增反馈'}</DialogTitle>
            <DialogDescription>填写客户反馈信息</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>品牌 <span className="text-red-500">*</span></Label>
                <Select value={formData.brand} onValueChange={v => setFormData(prev => ({ ...prev, brand: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择品牌" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map(brand => (
                      <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>反馈类型</Label>
                <Select value={formData.feedbackType} onValueChange={v => setFormData(prev => ({ ...prev, feedbackType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>周开始日期 <span className="text-red-500">*</span></Label>
                <Input type="date" value={formData.weekStart} onChange={e => setFormData(prev => ({ ...prev, weekStart: e.target.value }))} />
              </div>
              <div>
                <Label>周结束日期 <span className="text-red-500">*</span></Label>
                <Input type="date" value={formData.weekEnd} onChange={e => setFormData(prev => ({ ...prev, weekEnd: e.target.value }))} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>客户名称</Label>
                <Input placeholder="客户名称" value={formData.customerName} onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))} />
              </div>
              <div>
                <Label>联系方式</Label>
                <Input placeholder="电话/微信" value={formData.contactInfo} onChange={e => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))} />
              </div>
            </div>
            
            <div>
              <Label>反馈内容 <span className="text-red-500">*</span></Label>
              <Textarea placeholder="详细描述客户反馈内容..." rows={4} value={formData.feedbackContent} onChange={e => setFormData(prev => ({ ...prev, feedbackContent: e.target.value }))} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>满意度评分</Label>
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(formData.rating, true)}
                  <span className="text-sm text-muted-foreground">{formData.rating} 分</span>
                </div>
              </div>
              <div>
                <Label>优先级</Label>
                <Select value={formData.priority} onValueChange={v => setFormData(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>上传图片</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      <>
                        <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">点击上传图片</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这条反馈记录吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 图片预览弹窗 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>图片预览 ({currentImageIndex + 1} / {previewImages.length})</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={previewImages[currentImageIndex]} alt="" className="w-full max-h-[70vh] object-contain" />
            {previewImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + previewImages.length) % previewImages.length)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % previewImages.length)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
