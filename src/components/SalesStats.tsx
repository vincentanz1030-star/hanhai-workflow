/**
 * 商品中心 - 销售统计组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Package, Loader2 } from 'lucide-react';

interface SalesStat {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
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
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    loadStats();
  }, [selectedYear, selectedMonth, selectedProduct]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth !== 'all' && { month: selectedMonth }),
        ...(selectedProduct && { product_id: selectedProduct }),
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

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
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
              <p className="text-sm mt-2">API接口已就绪：/api/product-center/sales-stats</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead>产品SKU</TableHead>
                    <TableHead>年份</TableHead>
                    <TableHead>月份</TableHead>
                    <TableHead>销量</TableHead>
                    <TableHead>销售额</TableHead>
                    <TableHead>订单数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.product_name || '-'}</TableCell>
                      <TableCell className="text-sm">{stat.product_sku || '-'}</TableCell>
                      <TableCell>{stat.year}</TableCell>
                      <TableCell>{stat.month}</TableCell>
                      <TableCell>{stat.sales_quantity.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">¥{stat.sales_amount.toLocaleString()}</TableCell>
                      <TableCell>{stat.order_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
