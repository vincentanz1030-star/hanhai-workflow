'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import { getBrandName, BRAND_CONFIG } from '@/lib/config';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CalendarLaunch {
  id: string;
  brand: string;
  description: string;
  sales_date: string;
  status: string;
}

interface CalendarData {
  year: number;
  month: number;
  daysInMonth: number;
  brandGroups: Record<string, CalendarLaunch[]>;
  totalLaunches: number;
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
  const [editingLaunch, setEditingLaunch] = useState<CalendarLaunch | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const [formData, setFormData] = useState({
    brand: '',
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
      brand: brand || '',
      description: '',
      sales_date: dateStr,
    });
    setEditingLaunch(null);
    setIsEditDialogOpen(true);
  };

  const handleLaunchEdit = (launch: CalendarLaunch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLaunch(launch);
    setFormData({
      brand: launch.brand,
      description: launch.description || '',
      sales_date: launch.sales_date.split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleLaunchDelete = (launch: CalendarLaunch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLaunch(launch);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveLaunch = async () => {
    try {
      const url = editingLaunch
        ? `/api/new-product-launches/${editingLaunch.id}`
        : '/api/new-product-launches';
      
      const method = editingLaunch ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsEditDialogOpen(false);
        fetchData();
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      console.error('保存排期失败:', error);
      alert('保存失败');
    }
  };

  const handleDeleteLaunch = async () => {
    if (!editingLaunch) return;

    try {
      const response = await fetch(`/api/new-product-launches/${editingLaunch.id}`, {
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
      console.error('删除排期失败:', error);
      alert('删除失败');
    }
  };

  const getDayOfWeek = (day: number) => {
    const date = new Date(year, month - 1, day);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
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

  const { daysInMonth, brandGroups, totalLaunches } = data;
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
              <span className="font-bold">☑️</span>
              <span>有排期</span>
            </div>
            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
              <span>鼠标悬停查看描述</span>
            </div>
          </div>

          {/* 日历网格 - 左侧品牌列表，右侧日历 */}
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-[1500px]">
                {/* 日期头 */}
                <div className="grid grid-cols-[200px_repeat(31,minmax(45px,1fr))] gap-0 border-b">
                  <div className="p-2 text-xs font-medium bg-muted/50 sticky left-0 z-10">
                    品牌
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

                {/* 品牌行 */}
                {Object.entries(brandGroups).length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    本月暂无排期，点击上方"添加排期"按钮或点击日期添加
                  </div>
                ) : (
                  Object.entries(brandGroups).map(([brand, launches]) => (
                    <div key={brand} className="border-b last:border-b-0">
                      {/* 品牌信息行 */}
                      <div className="grid grid-cols-[200px_repeat(31,minmax(45px,1fr))] gap-0 bg-muted/20">
                        <div className="p-2 text-sm font-semibold sticky left-0 z-10 bg-muted/20 flex items-center gap-2 overflow-hidden">
                          <span className="truncate">{getBrandName(brand)}</span>
                          <Badge variant="outline" className="ml-auto">
                            {launches.length}
                          </Badge>
                        </div>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          // 找到该品牌在当天的排期
                          const launch = launches.find((l) => {
                            const launchDate = new Date(l.sales_date);
                            return launchDate.getDate() === day;
                          });

                          return (
                            <div
                              key={i}
                              className={`p-1 border-l text-center cursor-pointer hover:bg-blue-50 transition-colors ${
                                isWeekend(day) ? 'bg-muted/10' : ''
                              }`}
                              onClick={() => handleDateClick(day, brand)}
                              title={`点击添加${getBrandName(brand)}的排期`}
                            >
                              {launch ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center gap-1 h-8 bg-blue-50 rounded relative group">
                                      <span className="text-base">☑️</span>
                                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded transition-opacity"></div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLaunchEdit(launch, e);
                                        }}
                                      >
                                        <Edit2 className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-medium">{getBrandName(brand)}</p>
                                      <p className="text-sm text-muted-foreground">
                                        日期: {launch.sales_date.split('T')[0]}
                                      </p>
                                      <p className="text-sm">
                                        描述: {launch.description || '无描述'}
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TooltipProvider>

          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>本月共 {totalLaunches} 个新品排期</span>
            <span>共 {Object.keys(brandGroups).length} 个品牌</span>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLaunch ? '编辑排期' : '添加排期'}
            </DialogTitle>
            <DialogDescription>
              {editingLaunch ? '修改排期信息' : '创建新的新品排期'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="sales_date">销售日期 *</Label>
              <Input
                id="sales_date"
                type="date"
                value={formData.sales_date}
                onChange={(e) => setFormData({ ...formData, sales_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入描述（可选）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveLaunch}>
              {editingLaunch ? '保存' : '创建'}
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
              确定要删除此排期吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteLaunch}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
