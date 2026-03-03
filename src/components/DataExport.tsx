'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet } from 'lucide-react';

interface DataExportProps {
  dataType: 'projects' | 'tasks' | 'sales_targets';
  brand?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DataExport({
  dataType,
  brand = 'all',
  buttonVariant = 'outline',
  buttonSize = 'sm',
}: DataExportProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brand: brand,
  });

  const dataTypeNames = {
    projects: '项目数据',
    tasks: '任务数据',
    sales_targets: '销售目标数据',
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          brand: filters.brand !== 'all' ? filters.brand : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      // 处理CSV文件下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataTypeNames[dataType]}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setOpen(false);
      alert('导出成功！');
    } catch (error: any) {
      console.error('导出失败:', error);
      alert(error.message || '导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            导出数据
          </DialogTitle>
          <DialogDescription>
            导出{dataTypeNames[dataType]}为CSV格式
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 品牌过滤 */}
          <div className="grid gap-2">
            <Label htmlFor="brand">品牌</Label>
            <Select
              value={filters.brand}
              onValueChange={(value) => setFilters({ ...filters, brand: value })}
            >
              <SelectTrigger id="brand">
                <SelectValue placeholder="选择品牌" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部品牌</SelectItem>
                <SelectItem value="he_zhe">禾哲</SelectItem>
                <SelectItem value="baobao">BAOBAO</SelectItem>
                <SelectItem value="ai_he">爱禾</SelectItem>
                <SelectItem value="bao_deng_yuan">宝登源</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 日期范围 */}
          <div className="grid gap-2">
            <Label htmlFor="startDate">开始日期（可选）</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">结束日期（可选）</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? '导出中...' : '开始导出'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
