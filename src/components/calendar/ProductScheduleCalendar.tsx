'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getBrandName, BRAND_CONFIG } from '@/lib/config';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CalendarProject {
  id: string;
  name: string;
  brand: string;
  sales_date: string;
  category: string;
  status: string;
}

interface CalendarData {
  year: number;
  month: number;
  daysInMonth: number;
  brandGroups: Record<string, CalendarProject[]>;
  totalProjects: number;
}

interface ProductScheduleCalendarProps {
  compact?: boolean;
}

export default function ProductScheduleCalendar({ compact = false }: ProductScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 编辑相关状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CalendarProject | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'product_development',
    description: '',
    sales_date: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar-schedule?year=${year}&month=${month}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取日历数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDateClick = (day: number, brand?: string) => {
    const dateStr = new Date(year, month - 1, day + 1).toISOString().split('T')[0];
    setSelectedDate(day);
    setSelectedBrand(brand || Object.keys(data?.brandGroups || {})[0] || '');
    setFormData({
      name: '',
      brand: brand || '',
      category: 'product_development',
      description: '',
      sales_date: dateStr,
    });
    setEditingProject(null);
    setIsEditDialogOpen(true);
  };

  const handleProjectEdit = (project: CalendarProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({
      name: project.name,
      brand: project.brand,
      category: project.category,
      description: '',
      sales_date: project.sales_date.split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleProjectDelete = (project: CalendarProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : '/api/projects';
      
      const method = editingProject ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          description: formData.description,
          salesDate: formData.sales_date,
          project_confirm_date: formData.sales_date,
          overall_completion_date: null,
          status: 'pending',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsEditDialogOpen(false);
        fetchData();
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      console.error('保存项目失败:', error);
      alert('保存失败');
    }
  };

  const handleDeleteProject = async () => {
    if (!editingProject) return;

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setIsDeleteDialogOpen(false);
        fetchData();
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除失败');
    }
  };

  const getDayOfWeek = (day: number) => {
    const date = new Date(year, month - 1, day);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getDayIndex = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() - 1;
  };

  const isWeekend = (day: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>新品排期日历</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { daysInMonth, brandGroups } = data;
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <>
      <Card className={`${compact ? '' : 'mb-6'}`}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {year}年{month}月 新品排期日历
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-24 text-center">
                {monthNames[month - 1]}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDateClick(1)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加排期
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 图例 */}
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>进行中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>待开始</span>
            </div>
            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
              <span>点击日期添加排期</span>
            </div>
          </div>

          {/* 日历网格 */}
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* 日期头 */}
              <div className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 border-b">
                <div className="p-2 text-xs font-medium bg-muted/50 sticky left-0 z-10">
                  品牌 / 产品
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  return (
                    <div
                      key={day}
                      className={`p-2 text-xs font-medium text-center border-l cursor-pointer hover:bg-blue-50 transition-colors ${
                        isWeekend(day) ? 'bg-muted/30' : 'bg-muted/50'
                      }`}
                      onClick={() => handleDateClick(day)}
                      title="点击添加排期"
                    >
                      <div className="font-bold">{day}</div>
                      <div className="text-muted-foreground">{getDayOfWeek(day)}</div>
                    </div>
                  );
                })}
              </div>

              {/* 品牌和产品行 */}
              {Object.entries(brandGroups).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  本月暂无排期，点击上方"添加排期"按钮或点击日期添加
                </div>
              ) : (
                Object.entries(brandGroups).map(([brand, projects]) => (
                  <div key={brand} className="border-b last:border-b-0">
                    {/* 品牌标题行 */}
                    <div className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 bg-muted/20">
                      <div className="p-2 text-sm font-semibold sticky left-0 z-10 bg-muted/20 flex items-center gap-2 overflow-hidden">
                        <Package className="h-4 w-4" />
                        <span className="truncate">{getBrandName(brand)}</span>
                        <Badge variant="outline" className="ml-auto">
                          {projects.length}
                        </Badge>
                      </div>
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <div
                          key={i}
                          className={`p-1 border-l text-center cursor-pointer hover:bg-blue-50 transition-colors ${
                            isWeekend(i + 1) ? 'bg-muted/10' : ''
                          }`}
                          onClick={() => handleDateClick(i + 1, brand)}
                          title={`点击添加${getBrandName(brand)}的排期`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* 产品行 */}
                    {projects.map((project) => {
                      const dayIndex = getDayIndex(project.sales_date);
                      return (
                        <div
                          key={project.id}
                          className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 hover:bg-muted/10"
                        >
                          <div className="p-2 text-xs border-l sticky left-0 z-10 bg-background flex items-center gap-2 overflow-hidden">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(project.status)}`}
                            />
                            <span className="truncate flex-1" title={project.name}>
                              {project.name}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                                onClick={(e) => handleProjectEdit(project, e)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0 text-red-500"
                                onClick={(e) => handleProjectDelete(project, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {Array.from({ length: daysInMonth }, (_, i) => (
                            <div
                              key={i}
                              className={`p-1 border-l text-center cursor-pointer hover:bg-blue-50 transition-colors ${
                                isWeekend(i + 1) ? 'bg-muted/10' : ''
                              } ${i === dayIndex ? 'bg-blue-50' : ''}`}
                              onClick={() => handleDateClick(i + 1, brand)}
                              title={`点击添加${getBrandName(brand)}的排期`}
                            >
                              {i === dayIndex && (
                                <div
                                  className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusColor(project.status)} text-white text-xs font-bold relative group`}
                                  title={`${project.name}\n日期: ${project.sales_date}\n状态: ${project.status}`}
                                >
                                  ✓
                                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>本月共 {data.totalProjects} 个新品排期</span>
            <span>共 {Object.keys(brandGroups).length} 个品牌</span>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? '编辑排期' : '添加排期'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? '修改项目信息' : '创建新的项目排期'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">产品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入产品名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">品牌 *</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => setFormData({ ...formData, brand: value })}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="选择品牌" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BRAND_CONFIG)
                    .filter(([key]) => key !== 'all')
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">项目类型 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择项目类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_development">产品开发</SelectItem>
                  <SelectItem value="operations_activity">运营活动</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sales_date">销售日期 *</Label>
              <Input
                id="sales_date"
                type="date"
                value={formData.sales_date}
                onChange={(e) => setFormData({ ...formData, sales_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入项目描述（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveProject}>
              {editingProject ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除项目"{editingProject?.name}"吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
