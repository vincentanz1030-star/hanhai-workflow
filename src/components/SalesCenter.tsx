/**
 * 销售中心 - 销售统计与分析
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Package, Loader2, Plus, Edit, Trash2, Upload, Download, FileSpreadsheet, BarChart3, PieChart as PieChartIcon, X, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  he_zhe: '禾哲',
  baobao: 'BAOBAO',
  ai_he: '爱禾',
  bao_deng_yuan: '宝登源',
};

const BRAND_COLORS: Record<string, string> = {
  he_zhe: '#8b5cf6',
  baobao: '#3b82f6',
  ai_he: '#10b981',
  bao_deng_yuan: '#f59e0b',
};

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface SalesStat {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  brand?: string;
  launch_date?: string;
  year: number;
  month: number;
  sales_quantity: number;
  sales_amount: number;
  order_count: number;
}

export function SalesCenter() {
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'brand' | 'trend'>('overview');
  
  // 新增销售数据对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    product_sku: '',
    brand: 'he_zhe',
    launch_date: '',
    sales_quantity: 0,
    sales_amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // 编辑对话框状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SalesStat | null>(null);
  const [editFormData, setEditFormData] = useState({
    product_name: '',
    product_sku: '',
    brand: 'he_zhe',
    launch_date: '',
    sales_quantity: 0,
    sales_amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // 删除确认对话框状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<SalesStat | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 上传相关状态
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [uploadPreview, setUploadPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, [selectedYear, selectedMonth, selectedBrand]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth !== 'all' && { month: selectedMonth }),
        ...(selectedBrand !== 'all' && { brand: selectedBrand }),
      });

      const response = await fetch(`/api/product-center/sales-stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data || []);
      } else {
        setError(data.error || '加载数据失败');
      }
    } catch (error) {
      console.error('加载销售统计失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 手动添加销售数据
  const handleAddProduct = async () => {
    if (!newProduct.product_name || !newProduct.product_sku || !newProduct.launch_date) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/product-center/sales-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();
      if (data.success) {
        setIsAddDialogOpen(false);
        setNewProduct({
          product_name: '',
          product_sku: '',
          brand: 'he_zhe',
          launch_date: '',
          sales_quantity: 0,
          sales_amount: 0,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        });
        await loadStats();
      } else {
        alert('添加失败：' + data.error);
      }
    } catch (error) {
      console.error('添加商品销售数据失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 编辑销售数据
  const openEditDialog = (stat: SalesStat) => {
    setEditingProduct(stat);
    setEditFormData({
      product_name: stat.product_name || '',
      product_sku: stat.product_sku || '',
      brand: stat.brand || 'he_zhe',
      launch_date: stat.launch_date || '',
      sales_quantity: stat.sales_quantity,
      sales_amount: stat.sales_amount,
      year: stat.year,
      month: stat.month,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/product-center/sales-stats/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        await loadStats();
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      console.error('更新商品销售数据失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除销售数据
  const openDeleteDialog = (stat: SalesStat) => {
    setDeletingProduct(stat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/product-center/sales-stats/${deletingProduct.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        await loadStats();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除商品销售数据失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // 转换数据格式
          const parsedData = jsonData.map((row: any) => ({
            product_name: row['产品名称'] || row['product_name'] || '',
            product_sku: row['SKU'] || row['product_sku'] || '',
            brand: convertBrandName(row['品牌'] || row['brand'] || 'he_zhe'),
            launch_date: row['上市日期'] || row['launch_date'] || '',
            year: parseInt(row['年份'] || row['year']) || new Date().getFullYear(),
            month: parseInt(row['月份'] || row['month']) || new Date().getMonth() + 1,
            sales_quantity: parseInt(row['销量'] || row['sales_quantity']) || 0,
            sales_amount: parseFloat(row['销售额'] || row['sales_amount']) || 0,
          })).filter((item: any) => item.product_name && item.product_sku);

          setUploadData(parsedData);
          setUploadPreview(true);
        } catch (parseError) {
          console.error('解析Excel失败:', parseError);
          alert('解析Excel文件失败，请检查文件格式');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('读取文件失败:', error);
      alert('读取文件失败');
    } finally {
      setUploading(false);
    }
  };

  // 品牌名称转换
  const convertBrandName = (name: string): string => {
    const brandMap: Record<string, string> = {
      '禾哲': 'he_zhe',
      'BAOBAO': 'baobao',
      '爱禾': 'ai_he',
      '宝登源': 'bao_deng_yuan',
    };
    return brandMap[name] || name;
  };

  // 确认上传数据
  const confirmUpload = async () => {
    if (uploadData.length === 0) return;

    setUploading(true);
    try {
      const response = await fetch('/api/product-center/sales-stats/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: uploadData }),
      });

      const result = await response.json();
      if (result.success) {
        setIsUploadDialogOpen(false);
        setUploadData([]);
        setUploadPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadStats();
      } else {
        alert('批量导入失败：' + result.error);
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  // 下载模板
  const downloadTemplate = () => {
    const template = [
      {
        '产品名称': '示例产品',
        'SKU': 'SKU001',
        '品牌': '禾哲',
        '上市日期': '2024-01-01',
        '年份': 2024,
        '月份': 1,
        '销量': 100,
        '销售额': 10000,
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '销售数据模板');
    XLSX.writeFile(wb, '销售数据导入模板.xlsx');
  };

  // 计算汇总数据
  const totalSales = stats.reduce((sum, s) => sum + s.sales_amount, 0);
  const totalQuantity = stats.reduce((sum, s) => sum + s.sales_quantity, 0);
  const totalOrders = stats.reduce((sum, s) => sum + s.order_count, 0);

  // 按品牌汇总数据
  const brandStats = stats.reduce((acc: Record<string, { name: string; value: number; quantity: number }>, stat) => {
    const brand = stat.brand || 'unknown';
    if (!acc[brand]) {
      acc[brand] = { 
        name: BRAND_NAMES[brand] || brand, 
        value: 0, 
        quantity: 0 
      };
    }
    acc[brand].value += stat.sales_amount;
    acc[brand].quantity += stat.sales_quantity;
    return acc;
  }, {});

  // 按月份汇总趋势数据
  const monthlyTrend = stats.reduce((acc: Record<string, { month: string; amount: number; quantity: number }>, stat) => {
    const key = `${stat.month}月`;
    if (!acc[key]) {
      acc[key] = { month: key, amount: 0, quantity: 0 };
    }
    acc[key].amount += stat.sales_amount;
    acc[key].quantity += stat.sales_quantity;
    return acc;
  }, {});

  // 按产品汇总数据（用于图表）
  const productStats = stats.reduce((acc: Record<string, any>, stat) => {
    const key = stat.product_name || '未知产品';
    if (!acc[key]) {
      acc[key] = { name: key, quantity: 0, amount: 0 };
    }
    acc[key].quantity += stat.sales_quantity;
    acc[key].amount += stat.sales_amount;
    return acc;
  }, {});

  const chartData = Object.values(productStats)
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 10);

  const pieData = Object.values(brandStats);
  const trendData = Object.values(monthlyTrend).sort((a: any, b: any) => {
    const monthA = parseInt(a.month);
    const monthB = parseInt(b.month);
    return monthA - monthB;
  });

  // 生成年份选项（最近5年）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-base">销售中心</h2>
            <p className="text-xs text-muted-foreground">各品牌销售统计与分析</p>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="年份" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="月份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部月份</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="品牌" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_NAMES).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            下载模板
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            导入数据
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            新增数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">总销售额</p>
                <p className="text-xl font-bold mt-1">¥{formatNumber(totalSales)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">总销量</p>
                <p className="text-xl font-bold mt-1">{formatNumber(totalQuantity)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">订单数</p>
                <p className="text-xl font-bold mt-1">{formatNumber(totalOrders)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">产品数</p>
                <p className="text-xl font-bold mt-1">{stats.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 销售排行 */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">产品销售排行 (Top 10)</span>
            </div>
          </div>
          <CardContent className="p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 品牌分布 */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <PieChartIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">品牌销售分布</span>
            </div>
          </div>
          <CardContent className="p-4">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[Object.keys(brandStats)[index]] || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 销售明细表格 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm">销售明细</span>
              <span className="text-xs text-muted-foreground ml-2">共 {stats.length} 条记录</span>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadStats} className="mt-4">
                重试
              </Button>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无销售数据</p>
              <p className="text-sm mt-2">点击"新增数据"或"导入数据"添加</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>品牌</TableHead>
                    <TableHead>产品名称</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>上市日期</TableHead>
                    <TableHead>年份</TableHead>
                    <TableHead>月份</TableHead>
                    <TableHead>销量</TableHead>
                    <TableHead>销售额</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <Badge variant="secondary">{BRAND_NAMES[stat.brand || 'all'] || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{stat.product_name || '-'}</TableCell>
                      <TableCell className="text-sm">{stat.product_sku || '-'}</TableCell>
                      <TableCell>{formatDate(stat.launch_date || '')}</TableCell>
                      <TableCell>{stat.year}</TableCell>
                      <TableCell>{stat.month}月</TableCell>
                      <TableCell>{stat.sales_quantity.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">¥{stat.sales_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(stat)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => openDeleteDialog(stat)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增数据对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增销售数据</DialogTitle>
            <DialogDescription>录入商品的销售统计信息</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label className="text-sm">品牌</Label>
                <Select value={newProduct.brand} onValueChange={(v) => setNewProduct({ ...newProduct, brand: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BRAND_NAMES).filter(([k]) => k !== 'all').map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">产品名称</Label>
                <Input placeholder="输入产品名称" value={newProduct.product_name} onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">产品SKU</Label>
                <Input placeholder="输入产品SKU" value={newProduct.product_sku} onChange={(e) => setNewProduct({ ...newProduct, product_sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">上市日期</Label>
                <Input type="date" value={newProduct.launch_date} onChange={(e) => setNewProduct({ ...newProduct, launch_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">年份</Label>
                  <Select value={newProduct.year.toString()} onValueChange={(v) => setNewProduct({ ...newProduct, year: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">月份</Label>
                  <Select value={newProduct.month.toString()} onValueChange={(v) => setNewProduct({ ...newProduct, month: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">月销量</Label>
                  <Input type="number" placeholder="销量" value={newProduct.sales_quantity} onChange={(e) => setNewProduct({ ...newProduct, sales_quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">销售额（元）</Label>
                  <Input type="number" placeholder="销售额" value={newProduct.sales_amount} onChange={(e) => setNewProduct({ ...newProduct, sales_amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleAddProduct} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑销售数据</DialogTitle>
            <DialogDescription>修改商品的销售统计信息</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label className="text-sm">品牌</Label>
                <Select value={editFormData.brand} onValueChange={(v) => setEditFormData({ ...editFormData, brand: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BRAND_NAMES).filter(([k]) => k !== 'all').map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">产品名称</Label>
                <Input placeholder="输入产品名称" value={editFormData.product_name} onChange={(e) => setEditFormData({ ...editFormData, product_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">产品SKU</Label>
                <Input placeholder="输入产品SKU" value={editFormData.product_sku} onChange={(e) => setEditFormData({ ...editFormData, product_sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">上市日期</Label>
                <Input type="date" value={editFormData.launch_date} onChange={(e) => setEditFormData({ ...editFormData, launch_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">年份</Label>
                  <Select value={editFormData.year.toString()} onValueChange={(v) => setEditFormData({ ...editFormData, year: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">月份</Label>
                  <Select value={editFormData.month.toString()} onValueChange={(v) => setEditFormData({ ...editFormData, month: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">月销量</Label>
                  <Input type="number" placeholder="销量" value={editFormData.sales_quantity} onChange={(e) => setEditFormData({ ...editFormData, sales_quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">销售额（元）</Label>
                  <Input type="number" placeholder="销售额" value={editFormData.sales_amount} onChange={(e) => setEditFormData({ ...editFormData, sales_amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleEditProduct} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除「{deletingProduct?.product_name}」的销售数据吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteProduct} disabled={deleting}>
              {deleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传对话框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) {
          setUploadData([]);
          setUploadPreview(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入销售数据</DialogTitle>
            <DialogDescription>上传Excel文件批量导入销售数据</DialogDescription>
          </DialogHeader>
          
          {!uploadPreview ? (
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">支持 .xlsx, .xls 格式</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      选择文件
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">文件格式要求：</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 必须包含列：产品名称、SKU、品牌、上市日期、年份、月份、销量、销售额</li>
                  <li>• 品牌可选值：禾哲、BAOBAO、爱禾、宝登源</li>
                  <li>• 日期格式：YYYY-MM-DD（如：2024-01-01）</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">共解析到 <strong>{uploadData.length}</strong> 条数据</p>
                <Button variant="outline" size="sm" onClick={() => { setUploadData([]); setUploadPreview(false); }}>
                  重新选择
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>品牌</TableHead>
                      <TableHead>销量</TableHead>
                      <TableHead>销售额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadData.slice(0, 50).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell>{BRAND_NAMES[item.brand] || item.brand}</TableCell>
                        <TableCell>{item.sales_quantity}</TableCell>
                        <TableCell>¥{item.sales_amount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {uploadData.length > 50 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    仅显示前50条，共{uploadData.length}条
                  </p>
                )}
              </ScrollArea>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(false)}>取消</Button>
            {uploadPreview && (
              <Button size="sm" onClick={confirmUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    确认导入
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
