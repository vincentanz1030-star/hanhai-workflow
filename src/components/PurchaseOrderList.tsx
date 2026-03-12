/**
 * 商品中心 - 采购订单管理组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ShoppingCart, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PurchaseOrder {
  id: string;
  order_code: string;
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_date: string;
  expected_date: string;
  actual_date: string | null;
  status: string;
}

export function PurchaseOrderList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<PurchaseOrder | null>(null);
  const [reviewData, setReviewData] = useState({
    reviewer_id: '',
    review_notes: '',
    action: 'approve' as 'approve' | 'reject',
  });
  const [formData, setFormData] = useState({
    order_code: '',
    supplier_id: '',
    product_id: '',
    quantity: '',
    order_date: '',
    expected_date: '',
  });

  useEffect(() => {
    loadOrders();
    loadSuppliers();
    loadProducts();
    loadUsers();
  }, [selectedStatus]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/product-center/suppliers?page=1&limit=100');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/product-center/products?page=1&limit=100');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/product-center/purchase-orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('加载采购订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.order_code || !formData.supplier_id || !formData.product_id ||
        !formData.quantity || !formData.order_date || !formData.expected_date) {
      alert('请填写所有必填字段');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/product-center/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_code: formData.order_code,
          supplier_id: formData.supplier_id,
          product_id: formData.product_id,
          quantity: parseInt(formData.quantity),
          order_date: formData.order_date,
          expected_date: formData.expected_date,
          status: 'pending',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateDialogOpen(false);
        setFormData({
          order_code: '',
          supplier_id: '',
          product_id: '',
          quantity: '',
          order_date: '',
          expected_date: '',
        });
        loadOrders();
        alert('采购订单创建成功');
      } else {
        alert(`创建失败: ${data.error}`);
      }
    } catch (error) {
      console.error('创建采购订单失败:', error);
      alert('创建采购订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "error";
    const statusMap: Record<string, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> | null }> = {
      pending: { label: '待审核', variant: 'secondary', icon: Clock },
      approved: { label: '已批准', variant: 'default', icon: CheckCircle },
      shipped: { label: '已发货', variant: 'info', icon: Truck },
      received: { label: '已收货', variant: 'success', icon: CheckCircle },
      cancelled: { label: '已取消', variant: 'destructive', icon: XCircle },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as BadgeVariant, icon: null };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order =>
    order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openReviewDialog = (order: PurchaseOrder) => {
    setReviewingOrder(order);
    setReviewData({
      reviewer_id: '',
      review_notes: '',
      action: 'approve',
    });
    setIsReviewDialogOpen(true);
  };

  const handleReview = async () => {
    if (!reviewingOrder || !reviewData.reviewer_id) {
      alert('请选择审核人');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/product-center/purchase-orders/${reviewingOrder.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();
      if (data.success) {
        setIsReviewDialogOpen(false);
        loadOrders();
        alert(reviewData.action === 'approve' ? '订单已批准' : '订单已拒绝');
      } else {
        alert(`审核失败: ${data.error}`);
      }
    } catch (error) {
      console.error('审核订单失败:', error);
      alert('审核订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索订单号、供应商或商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="shipped">已发货</SelectItem>
            <SelectItem value="received">已收货</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建订单
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建采购订单</DialogTitle>
              <DialogDescription>填写采购订单信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderCode">订单编号 *</Label>
                  <Input
                    id="orderCode"
                    placeholder="例如：PO-2024-001"
                    value={formData.order_code}
                    onChange={(e) => setFormData({ ...formData, order_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">供应商 *</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">商品 *</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">数量 *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="输入数量"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">采购日期 *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDate">预计到货日期 *</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : '创建订单'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 采购订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>采购订单</CardTitle>
          <CardDescription>共 {filteredOrders.length} 个订单</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无采购订单</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建订单"开始添加</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单编号</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>商品</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>采购日期</TableHead>
                  <TableHead>预计到货</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_code}</TableCell>
                    <TableCell>{order.supplier_name || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.product_name || '-'}</div>
                        {order.product_sku && (
                          <div className="text-xs text-muted-foreground">{order.product_sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.order_date && format(new Date(order.order_date), 'yyyy-MM-dd', { locale: zhCN })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.expected_date && format(new Date(order.expected_date), 'yyyy-MM-dd', { locale: zhCN })}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(order)}
                          >
                            审核
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审核对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审核采购订单</DialogTitle>
            <DialogDescription>审核订单并记录审核意见</DialogDescription>
          </DialogHeader>
          {reviewingOrder && (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">订单编号：</span>
                      <span className="font-mono">{reviewingOrder.order_code}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">供应商：</span>
                      <span>{reviewingOrder.supplier_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">商品：</span>
                      <span>{reviewingOrder.product_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">数量：</span>
                      <span>{reviewingOrder.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">采购日期：</span>
                      <span>{reviewingOrder.order_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">预计到货：</span>
                      <span>{reviewingOrder.expected_date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer">审核人 *</Label>
                  <Select
                    value={reviewData.reviewer_id}
                    onValueChange={(value) => setReviewData({ ...reviewData, reviewer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择审核人" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">审核意见</Label>
                  <Input
                    id="notes"
                    placeholder="请输入审核意见（可选）"
                    value={reviewData.review_notes}
                    onChange={(e) => setReviewData({ ...reviewData, review_notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => setReviewData({ ...reviewData, action: 'approve' })}
                    disabled={submitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    批准
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setReviewData({ ...reviewData, action: 'reject' })}
                    disabled={submitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    拒绝
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleReview} disabled={submitting}>
              {submitting ? '提交中...' : '确认审核'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
