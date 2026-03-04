'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import { getBrandName, BRAND_CONFIG } from '@/lib/config';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CalendarLaunch {
  id: string;
  brand: string;
  description: string;
  salesDate: string;
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
      console.log('获取日历数据:', { year, month });
      const response = await fetch(`/api/calendar-schedule?year=${year}&month=${month}`);
      const result = await response.json();
      console.log('日历数据结果:', result);
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
      sales_date: launch.salesDate.split('T')[0],
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

      console.log('保存排期:', { url, method, formData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      console.log('保存结果:', result);
      
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

  // 只显示有排期的品牌
  const brandsWithLaunches = Object.keys(brandGroups).filter(brand => 
    brandGroups[brand] && brandGroups[brand].length > 0
  );

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
              <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-black"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>有排期（鼠标悬停查看详情）</span>
            </div>
            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
              <span>点击日期添加排期</span>
            </div>
          </div>

          {/* 日历网格 - 使用响应式布局 */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
                {/* 日期头 */}
                <div className="grid grid-cols-[120px_repeat(31,1fr)] gap-0.5 border-b-2 border-border mb-2">
                  <div className="p-2 text-xs font-bold bg-muted sticky left-0 z-20 border-r-2 border-border">
                    品牌
                  </div>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    return (
                      <div
                        key={day}
                        className={`p-1.5 text-xs text-center border-l cursor-pointer hover:bg-blue-50 transition-colors ${
                          isWeekend(day) ? 'bg-orange-50' : 'bg-muted/30'
                        }`}
                        onClick={() => handleDateClick(day)}
                        title="点击添加排期"
                      >
                        <div className="font-bold">{day}</div>
                        <div className="text-[10px] text-muted-foreground">{getDayOfWeek(day)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* 品牌行 */}
                {brandsWithLaunches.map((brand) => {
                  const launches = brandGroups[brand] || [];
                  return (
                    <div key={brand} className="grid grid-cols-[120px_repeat(31,1fr)] gap-0.5 border-b border-border last:border-b-0 hover:bg-muted/10">
                      {/* 左侧品牌列 */}
                      <div className="p-2 text-xs font-semibold sticky left-0 z-10 bg-background border-r border-border flex items-center">
                        {getBrandName(brand)}
                      </div>
                      
                      {/* 右侧日历网格 */}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        // 找到该品牌在当天的排期
                        const launch = launches.find((l) => {
                          const launchDate = new Date(l.salesDate + 'T00:00:00');
                          return launchDate.getDate() === day;
                        });

                        return (
                          <div
                            key={i}
                            className={`p-1 text-center border-l cursor-pointer hover:bg-blue-100 transition-colors ${
                              isWeekend(day) ? 'bg-orange-50' : 'bg-white'
                            }`}
                            onClick={() => handleDateClick(day, brand)}
                            title={`点击添加${getBrandName(brand)}的排期`}
                          >
                            {launch ? (
                              <div 
                                className="w-full h-8 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors relative group flex items-center justify-center"
                                title={launch.description || '无描述'}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="3" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  className="text-black"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                {/* 编辑按钮 - 鼠标悬停时显示 */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 p-0 absolute top-0 right-0 bg-white text-blue-600 opacity-0 group-hover:opacity-100 rounded-sm shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLaunchEdit(launch, e);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>本月共 {totalLaunches} 个新品排期</span>
            <span>共 {Object.keys(brandGroups).length} 个品牌有排期</span>
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
