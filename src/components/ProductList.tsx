/**
 * 商品中心 - 商品列表组件
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
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Package, TrendingUp, Eye, Trash2, Loader2, X } from 'lucide-react';

interface Product {
  id: string;
  sku_code: string;
  name: string;
  description: string;
  brand: string;
  status: string;
  lifecycle_stage: string;
  main_image: string;
  images: string[];
  supplier_id?: string;
  supplier_name?: string;
  created_at: string;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    sku_code: '',
    name: '',
    description: '',
    brand: '',
    supplier_id: '',
    status: 'active',
    lifecycle_stage: 'new',
    main_image: '',
  });

  // 加载商品列表和供应商列表
  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, [selectedBrand, selectedStatus, selectedSupplier]);

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

  const getSupplierName = (supplierId: string | undefined): string => {
    if (!supplierId) return '-';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : supplierId.substring(0, 8);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedBrand !== 'all' && { brand: selectedBrand }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedSupplier !== 'all' && { supplier_id: selectedSupplier }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/product-center/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!formData.sku_code || !formData.name || !formData.brand) {
      alert('请填写必填项：SKU编码、商品名称、品牌');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/product-center/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('商品创建成功！');
        setIsCreateDialogOpen(false);
        resetForm();
        loadProducts();
      } else {
        alert(`创建失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建商品失败:', error);
      alert('创建失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!formData.sku_code || !formData.name || !formData.brand) {
      alert('请填写必填项：SKU编码、商品名称、品牌');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/product-center/products/${currentProduct?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('商品更新成功！');
        setIsEditDialogOpen(false);
        resetForm();
        loadProducts();
      } else {
        alert(`更新失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新商品失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return;

    try {
      const response = await fetch(`/api/product-center/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('商品删除成功！');
        loadProducts();
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const openEditDialog = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      sku_code: product.sku_code || '',
      name: product.name || '',
      description: product.description || '',
      brand: product.brand || '',
      supplier_id: (product as any).supplier_id || '',
      status: product.status || 'active',
      lifecycle_stage: product.lifecycle_stage || 'new',
      main_image: product.main_image || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      sku_code: '',
      name: '',
      description: '',
      brand: '',
      supplier_id: '',
      status: 'active',
      lifecycle_stage: 'new',
      main_image: '',
    });
    setCurrentProduct(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      active: { label: '上架', variant: 'default' },
      inactive: { label: '下架', variant: 'secondary' },
      draft: { label: '草稿', variant: 'outline' },
      deleted: { label: '已删除', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getLifecycleBadge = (stage: string) => {
    const stageMap: Record<string, { label: string; color: string }> = {
      new: { label: '新品', color: 'text-blue-600' },
      hot: { label: '热卖', color: 'text-red-600' },
      clearance: { label: '清仓', color: 'text-orange-600' },
      discontinued: { label: '停产', color: 'text-gray-600' },
    };
    const config = stageMap[stage] || { label: stage, color: 'text-gray-600' };
    return <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索商品名称或SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            className="pl-10"
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="品牌" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部品牌</SelectItem>
            <SelectItem value="he_zhe">禾哲</SelectItem>
            <SelectItem value="baobao">BAOBAO</SelectItem>
            <SelectItem value="ai_he">爱禾</SelectItem>
            <SelectItem value="bao_deng_yuan">宝登远</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="供应商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部供应商</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">上架</SelectItem>
            <SelectItem value="inactive">下架</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建商品
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新商品</DialogTitle>
              <DialogDescription>填写商品基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU编码 *</Label>
                  <Input
                    id="sku"
                    placeholder="例如：HZ-001"
                    value={formData.sku_code || ''}
                    onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">品牌 *</Label>
                  <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择品牌" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="he_zhe">禾哲</SelectItem>
                      <SelectItem value="baobao">BAOBAO</SelectItem>
                      <SelectItem value="ai_he">爱禾</SelectItem>
                      <SelectItem value="bao_deng_yuan">宝登远</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">商品名称 *</Label>
                <Input
                  id="name"
                  placeholder="输入商品名称"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">供应商</Label>
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
              <div className="space-y-2">
                <Label htmlFor="description">商品描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入商品描述"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[120px] max-h-64 overflow-y-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">上架</SelectItem>
                      <SelectItem value="inactive">下架</SelectItem>
                      <SelectItem value="draft">草稿</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifecycle">生命周期</Label>
                  <Select value={formData.lifecycle_stage} onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择生命周期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">新品</SelectItem>
                      <SelectItem value="hot">热卖</SelectItem>
                      <SelectItem value="clearance">清仓</SelectItem>
                      <SelectItem value="discontinued">停产</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">主图URL</Label>
                <Input
                  id="image"
                  placeholder="输入图片URL"
                  value={formData.main_image || ''}
                  onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>取消</Button>
              <Button onClick={handleCreateProduct} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建商品'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>共 {products.length} 个商品</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无商品数据</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建商品"开始添加</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead>品牌</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>生命周期</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.sku_code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.main_image && (
                          <div className="h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                            <img src={product.main_image} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>
                      {getSupplierName(product.supplier_id)}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>{getLifecycleBadge(product.lifecycle_stage)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 编辑商品对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑商品</DialogTitle>
            <DialogDescription>修改商品信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU编码 *</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku_code || ''}
                  onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brand">品牌 *</Label>
                <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择品牌" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he_zhe">禾哲</SelectItem>
                    <SelectItem value="baobao">BAOBAO</SelectItem>
                    <SelectItem value="ai_he">爱禾</SelectItem>
                    <SelectItem value="bao_deng_yuan">宝登远</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">商品名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">供应商</Label>
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
            <div className="space-y-2">
              <Label htmlFor="edit-description">商品描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px] max-h-64 overflow-y-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">状态</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">上架</SelectItem>
                    <SelectItem value="inactive">下架</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lifecycle">生命周期</Label>
                <Select value={formData.lifecycle_stage} onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择生命周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">新品</SelectItem>
                    <SelectItem value="hot">热卖</SelectItem>
                    <SelectItem value="clearance">清仓</SelectItem>
                    <SelectItem value="discontinued">停产</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">主图URL</Label>
              <Input
                id="edit-image"
                value={formData.main_image || ''}
                onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '保存修改'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 商品详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>商品详情</DialogTitle>
                <DialogDescription>查看商品完整信息</DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDetailDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {currentProduct && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-6">
                {currentProduct.main_image && (
                  <div className="space-y-2">
                    <Label>商品图片</Label>
                    <div className="h-64 rounded-lg border overflow-hidden">
                      <img src={currentProduct.main_image} alt={currentProduct.name} className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">商品名称</Label>
                    <div className="text-lg font-semibold">{currentProduct.name}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SKU编码</Label>
                    <div className="font-mono">{currentProduct.sku_code}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">品牌</Label>
                    <div>{currentProduct.brand}</div>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <Label className="text-muted-foreground">状态</Label>
                      <div>{getStatusBadge(currentProduct.status)}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">生命周期</Label>
                      <div>{getLifecycleBadge(currentProduct.lifecycle_stage)}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">创建时间</Label>
                    <div className="text-sm">{new Date(currentProduct.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* 商品描述 */}
              <div className="space-y-2">
                <Label>商品描述</Label>
                <Card>
                  <CardContent className="p-4 max-h-64 overflow-y-auto">
                    <div className="whitespace-pre-wrap">{currentProduct.description || '暂无描述'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>关闭</Button>
                <Button onClick={() => { setIsDetailDialogOpen(false); openEditDialog(currentProduct); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑商品
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
