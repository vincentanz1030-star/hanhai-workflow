/**
 * 商品中心 - 销售统计组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Package, Loader2, Plus, Edit, Trash2, X } from 'lucide-react';

const BRAND_NAMES: Record<string, string> = {
  all: '全部品牌',
  hezhe: '禾哲',
  baobao: 'BAOBAO',
  aihe: '爱禾',
  baodengyuan: '宝登源',
};

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

export function SalesStats() {
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  
  // 新增商品对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    product_sku: '',
    brand: 'hezhe',
    launch_date: '',
    sales_quantity: 0,
    sales_amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // 编辑商品对话框状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SalesStat | null>(null);
  const [editFormData, setEditFormData] = useState({
    product_name: '',
    product_sku: '',
    brand: 'hezhe',
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
        alert('商品销售数据添加成功');
        setIsAddDialogOpen(false);
        setNewProduct({
          product_name: '',
          product_sku: '',
          brand: 'heidax',
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

  const openEditDialog = (stat: SalesStat) => {
    setEditingProduct(stat);
    setEditFormData({
      product_name: stat.product_name || '',
      product_sku: stat.product_sku || '',
      brand: stat.brand || 'heidax',
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
        alert('商品销售数据更新成功');
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
        alert('商品销售数据删除成功');
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

  // 计算汇总数据
  const totalSales = stats.reduce((sum, s) => sum + s.sales_amount, 0);
  const totalQuantity = stats.reduce((sum, s) => sum + s.sales_quantity, 0);
  const totalOrders = stats.reduce((sum, s) => sum + s.order_count, 0);

  // 按产品聚合数据（用于图表）
  const productStats = stats.reduce((acc: Record<string, any>, stat) => {
    const key = stat.product_name || '未知产品';
    if (!acc[key]) {
      acc[key] = { name: key, quantity: 0, amount: 0 };
    }
    acc[key].quantity += stat.sales_quantity;
    acc[key].amount += stat.sales_amount;
    return acc;
  }, {});

  const chartData = Object.values(productStats).slice(0, 10);

  // 生成年份选项（最近5年）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="年份" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="品牌" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_NAMES).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增商品
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增商品销售数据</DialogTitle>
              <DialogDescription>录入商品的销售统计信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">品牌</Label>
                <Select 
                  value={newProduct.brand} 
                  onValueChange={(v) => setNewProduct({ ...newProduct, brand: v })}
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
                <Label className="text-sm font-medium">产品名称</Label>
                <Input
                  className="mt-1"
                  placeholder="输入产品名称"
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">产品SKU</Label>
                <Input
                  className="mt-1"
                  placeholder="输入产品SKU"
                  value={newProduct.product_sku}
                  onChange={(e) => setNewProduct({ ...newProduct, product_sku: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">上市日期</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={newProduct.launch_date}
                  onChange={(e) => setNewProduct({ ...newProduct, launch_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">销售年份</Label>
                <Select 
                  value={newProduct.year.toString()} 
                  onValueChange={(v) => setNewProduct({ ...newProduct, year: parseInt(v) })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">销售月份</Label>
                <Select 
                  value={newProduct.month.toString()} 
                  onValueChange={(v) => setNewProduct({ ...newProduct, month: parseInt(v) })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">月销量</Label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="输入月销量"
                  value={newProduct.sales_quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, sales_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">销售额（元）</Label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="输入销售额"
                  value={newProduct.sales_amount}
                  onChange={(e) => setNewProduct({ ...newProduct, sales_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddProduct} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                提交
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">销售总收入</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总销量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">商品销售数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">订单数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">销售订单总数</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>产品销售排行（Top 10）</CardTitle>
            <CardDescription>按销售额排序</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" name="销售额(元)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 销售统计列表 */}
      <Card>
        <CardHeader>
          <CardTitle>销售统计明细</CardTitle>
          <CardDescription>共 {stats.length} 条记录</CardDescription>
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
              <Button variant="outline" size="sm" onClick={loadStats} className="mt-4">
                重试
              </Button>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无销售统计数据</p>
              <p className="text-sm mt-2">点击"新增商品"按钮添加数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>品牌</TableHead>
                    <TableHead>产品名称</TableHead>
                    <TableHead>产品SKU</TableHead>
                    <TableHead>上市日期</TableHead>
                    <TableHead>年份</TableHead>
                    <TableHead>月份</TableHead>
                    <TableHead>月销量</TableHead>
                    <TableHead>销售额</TableHead>
                    <TableHead>订单数</TableHead>
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
                      <TableCell>{stat.order_count}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(stat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(stat)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑商品销售数据</DialogTitle>
            <DialogDescription>修改商品的销售统计信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">品牌</Label>
              <Select 
                value={editFormData.brand} 
                onValueChange={(v) => setEditFormData({ ...editFormData, brand: v })}
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
              <Label className="text-sm font-medium">产品名称</Label>
              <Input
                className="mt-1"
                placeholder="输入产品名称"
                value={editFormData.product_name}
                onChange={(e) => setEditFormData({ ...editFormData, product_name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">产品SKU</Label>
              <Input
                className="mt-1"
                placeholder="输入产品SKU"
                value={editFormData.product_sku}
                onChange={(e) => setEditFormData({ ...editFormData, product_sku: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">上市日期</Label>
              <Input
                type="date"
                className="mt-1"
                value={editFormData.launch_date}
                onChange={(e) => setEditFormData({ ...editFormData, launch_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">销售年份</Label>
              <Select 
                value={editFormData.year.toString()} 
                onValueChange={(v) => setEditFormData({ ...editFormData, year: parseInt(v) })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">销售月份</Label>
              <Select 
                value={editFormData.month.toString()} 
                onValueChange={(v) => setEditFormData({ ...editFormData, month: parseInt(v) })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">月销量</Label>
              <Input
                type="number"
                className="mt-1"
                placeholder="输入月销量"
                value={editFormData.sales_quantity}
                onChange={(e) => setEditFormData({ ...editFormData, sales_quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">销售额（元）</Label>
              <Input
                type="number"
                className="mt-1"
                placeholder="输入销售额"
                value={editFormData.sales_amount}
                onChange={(e) => setEditFormData({ ...editFormData, sales_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditProduct} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存
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
              确定要删除 {deletingProduct?.product_name} 的销售统计数据吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
