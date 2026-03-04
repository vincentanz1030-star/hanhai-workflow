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
import { Search, Plus, Edit, Package, TrendingUp, Eye, Trash2, Loader2 } from 'lucide-react';

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
  created_at: string;
}

interface ProductPrice {
  cost_price: number;
  wholesale_price: number;
  retail_price: number;
}

interface ProductInventory {
  warehouse: string;
  quantity: number;
  safety_stock: number;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    sku_code: '',
    name: '',
    description: '',
    brand: '',
    status: 'active',
    lifecycle_stage: 'new',
    main_image: '',
  });

  // 加载商品列表
  useEffect(() => {
    loadProducts();
  }, [selectedBrand, selectedStatus]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedBrand !== 'all' && { brand: selectedBrand }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
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
        setFormData({
          sku_code: '',
          name: '',
          description: '',
          brand: '',
          status: 'active',
          lifecycle_stage: 'new',
          main_image: '',
        });
        loadProducts(); // 刷新列表
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    value={formData.sku_code}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">商品描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入商品描述"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  value={formData.main_image}
                  onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
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
          <CardDescription>共 {filteredProducts.length} 个商品</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredProducts.length === 0 ? (
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
                  <TableHead>状态</TableHead>
                  <TableHead>生命周期</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
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
                          {product.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>{getLifecycleBadge(product.lifecycle_stage)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}
