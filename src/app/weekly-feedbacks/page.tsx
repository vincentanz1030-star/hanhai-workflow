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
import { MessageSquare, Plus, Edit, Trash2, Search, Filter, Image, X, Calendar, Star, ChevronLeft, ChevronRight, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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

interface WeekGroup {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  feedbacks: WeeklyFeedback[];
  expanded: boolean;
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

const STATUS_OPTIONS: Array<{ value: string; label: string; color: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "error" }> = [
  { value: 'pending', label: '待处理', color: 'secondary' },
  { value: 'processing', label: '处理中', color: 'default' },
  { value: 'resolved', label: '已解决', color: 'success' },
  { value: 'closed', label: '已关闭', color: 'destructive' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

// 获取自然周标签
function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - oneJan.getTime()) / 86400000);
  const weekNumber = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}年第${weekNumber}周`;
}

// 生成所有周选项（当前年份前后各一年）
function generateWeekOptions(): { value: string; label: string; weekStart: string; weekEnd: string }[] {
  const options: { value: string; label: string; weekStart: string; weekEnd: string }[] = [];
  const currentYear = new Date().getFullYear();
  
  [currentYear - 1, currentYear, currentYear + 1].forEach(year => {
    // 计算该年有多少周
    const dec31 = new Date(year, 11, 31);
    const oneJan = new Date(year, 0, 1);
    const days = Math.floor((dec31.getTime() - oneJan.getTime()) / 86400000);
    const totalWeeks = Math.ceil((days + oneJan.getDay() + 1) / 7);
    
    for (let week = 1; week <= totalWeeks; week++) {
      // 计算该周的周一日期
      const jan1 = new Date(year, 0, 1);
      const jan1Day = jan1.getDay();
      const firstMonday = new Date(jan1);
      if (jan1Day !== 1) {
        firstMonday.setDate(jan1.getDate() + (jan1Day === 0 ? 1 : 8 - jan1Day));
      }
      
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      options.push({
        value: `${year}-${week}`,
        label: `${year}年第${week}周`,
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
      });
    }
  });
  
  return options.sort((a, b) => b.value.localeCompare(a.value)); // 按时间倒序
}

// 按周分组反馈
function groupFeedbacksByWeek(feedbacks: WeeklyFeedback[]): WeekGroup[] {
  const weekMap = new Map<string, WeekGroup>();
  
  // 按日期倒序排序
  const sortedFeedbacks = [...feedbacks].sort((a, b) => 
    new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
  );
  
  sortedFeedbacks.forEach(feedback => {
    const weekKey = `${feedback.week_start}_${feedback.week_end}`;
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekLabel: getWeekLabel(feedback.week_start),
        weekStart: feedback.week_start,
        weekEnd: feedback.week_end,
        feedbacks: [],
        expanded: true,
      });
    }
    
    weekMap.get(weekKey)!.feedbacks.push(feedback);
  });
  
  return Array.from(weekMap.values());
}

export default function WeeklyFeedbacksPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [weekOptions] = useState(generateWeekOptions);
  
  // 日期筛选
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 弹窗状态
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
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
  }, [selectedBrand, selectedStatus, startDate, endDate]);

  useEffect(() => {
    // 按周分组
    let filtered = feedbacks.filter(f => 
      !searchKeyword || 
      f.feedback_content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (f.customer_name && f.customer_name.toLowerCase().includes(searchKeyword.toLowerCase()))
    );
    
    // 按日期范围筛选
    if (startDate) {
      filtered = filtered.filter(f => f.week_start >= startDate || f.created_at >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(f => f.week_end <= endDate || f.created_at <= endDate + 'T23:59:59');
    }
    
    const groups = groupFeedbacksByWeek(filtered);
    setWeekGroups(groups);
  }, [feedbacks, searchKeyword, startDate, endDate]);

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
      // 默认本周日期（自然周：周一到周日）
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + mondayOffset);
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
          // 使用正确的字段名 imageUrl
          if (data.imageUrl) {
            uploadedUrls.push(data.imageUrl);
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

  const handleViewDetail = (feedback: WeeklyFeedback) => {
    setCurrentFeedback(feedback);
    setShowDetailDialog(true);
  };

  const toggleWeekGroup = (weekStart: string) => {
    setWeekGroups(groups => 
      groups.map(g => 
        g.weekStart === weekStart ? { ...g, expanded: !g.expanded } : g
      )
    );
  };

  const getBrandLabel = (brand: string) => {
    return BRANDS.find(b => b.value === brand)?.label || brand;
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>;
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

  // 计算统计数据
  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    processing: feedbacks.filter(f => f.status === 'processing').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

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

      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">总反馈数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">待处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-sm text-muted-foreground">处理中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">已解决</p>
          </CardContent>
        </Card>
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
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">日期：</span>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-36"
                placeholder="开始日期"
              />
              <span className="text-muted-foreground">至</span>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-36"
                placeholder="结束日期"
              />
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
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

      {/* 按自然周分组的反馈列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : weekGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>暂无反馈数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {weekGroups.map(group => (
            <Card key={group.weekStart}>
              <CardHeader className="pb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleWeekGroup(group.weekStart)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{group.weekLabel}</CardTitle>
                      <CardDescription>
                        {group.weekStart} 至 {group.weekEnd} · 共 {group.feedbacks.length} 条反馈
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    {group.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {group.expanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.feedbacks.map(feedback => (
                      <div 
                        key={feedback.id} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(feedback)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{getBrandLabel(feedback.brand)}</Badge>
                              {getStatusBadge(feedback.status)}
                              {getPriorityBadge(feedback.priority)}
                              <Badge variant="secondary">{getFeedbackTypeLabel(feedback.feedback_type)}</Badge>
                            </div>
                            
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePreviewImages(feedback.images, i);
                                        }}
                                      />
                                    ))}
                                    {feedback.images.length > 3 && (
                                      <span className="text-xs text-muted-foreground self-center">+{feedback.images.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
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
                <Label>周开始日期（周一）<span className="text-red-500">*</span></Label>
                <Input type="date" value={formData.weekStart} onChange={e => setFormData(prev => ({ ...prev, weekStart: e.target.value }))} />
              </div>
              <div>
                <Label>周结束日期（周日）<span className="text-red-500">*</span></Label>
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
                        type="button"
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

      {/* 详情预览弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
          </DialogHeader>
          
          {currentFeedback && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getBrandLabel(currentFeedback.brand)}</Badge>
                {getStatusBadge(currentFeedback.status)}
                {getPriorityBadge(currentFeedback.priority)}
                <Badge variant="secondary">{getFeedbackTypeLabel(currentFeedback.feedback_type)}</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                {getWeekLabel(currentFeedback.week_start)} ({currentFeedback.week_start} 至 {currentFeedback.week_end})
              </div>
              
              {currentFeedback.customer_name && (
                <div>
                  <Label className="text-muted-foreground">客户信息</Label>
                  <p className="mt-1">{currentFeedback.customer_name}
                    {currentFeedback.contact_info && <span className="text-muted-foreground ml-2">({currentFeedback.contact_info})</span>}
                  </p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground">反馈内容</Label>
                <p className="mt-1 whitespace-pre-wrap">{currentFeedback.feedback_content}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">满意度评分</Label>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(currentFeedback.rating)}
                  <span className="text-sm">{currentFeedback.rating} 分</span>
                </div>
              </div>
              
              {currentFeedback.images && currentFeedback.images.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">相关图片</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {currentFeedback.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => handlePreviewImages(currentFeedback.images, i)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {currentFeedback.response_content && (
                <div>
                  <Label className="text-muted-foreground">处理回复</Label>
                  <p className="mt-1 whitespace-pre-wrap">{currentFeedback.response_content}</p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground pt-4 border-t">
                创建时间：{new Date(currentFeedback.created_at).toLocaleString()}
                {currentFeedback.updated_at && currentFeedback.updated_at !== currentFeedback.created_at && (
                  <span className="ml-4">更新时间：{new Date(currentFeedback.updated_at).toLocaleString()}</span>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            <Button onClick={() => {
              setShowDetailDialog(false);
              handleOpenForm(currentFeedback!);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              编辑
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
