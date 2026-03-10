'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, Search, Edit, Trash2, Eye, Filter, Package, X, Image as ImageIcon, ChevronLeft, ChevronRight, Download, Upload
} from 'lucide-react';

interface Product {
  id: string;
  sku_code: string;
  name: string;
  description?: string;
  brand: string;
  status: string;
  main_image?: string;
  images?: string[];
  designer?: string;
  supplier_id?: string;
  spec_code?: string;
  color?: string;
  delivery_days?: number;
  remarks?: string;
  created_at: string;
  updated_at?: string;
  suppliers?: {
    id: string;
    name: string;
  };
  product_prices?: {
    cost_price?: number;
    cost_with_tax_shipping?: number;
    wholesale_price?: number;
    retail_price?: number;
  };
  product_inventory?: {
    quantity: number;
  }[];
}

interface Supplier {
  id: string;
  name: string;
  supplier_code: string;
}

const BRANDS = [
  { value: 'he_zhe', label: '禾哲' },
  { value: 'baobao', label: 'BAOBAO' },
  { value: 'ai_he', label: '爱禾' },
  { value: 'bao_deng_yuan', label: '宝登源' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '上架' },
  { value: 'inactive', label: '下架' },
  { value: 'draft', label: '草稿' },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 弹窗状态
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    sku_code: '',
    name: '',
    brand: '',
    designer: '',
    supplier_id: '',
    spec_code: '',
    color: '',
    quantity: 0,
    cost_with_tax_shipping: 0,
    retail_price: 0,
    delivery_days: 0,
    remarks: '',
    main_image: '',
    images: [] as string[],
    status: 'draft',
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, [pagination.page, statusFilter, brandFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (brandFilter !== 'all') params.append('brand', brandFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/product-center/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/product-center/suppliers');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProducts();
  };

  const handleViewDetail = (product: Product) => {
    setCurrentProduct(product);
    setShowDetailDialog(true);
  };

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        sku_code: product.sku_code || '',
        name: product.name || '',
        brand: product.brand || '',
        designer: product.designer || '',
        supplier_id: product.supplier_id || '',
        spec_code: product.spec_code || '',
        color: product.color || '',
        quantity: product.product_inventory?.[0]?.quantity || 0,
        cost_with_tax_shipping: product.product_prices?.cost_with_tax_shipping || 0,
        retail_price: product.product_prices?.retail_price || 0,
        delivery_days: product.delivery_days || 0,
        remarks: product.remarks || '',
        main_image: product.main_image || '',
        images: product.images || [],
        status: product.status || 'draft',
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        sku_code: '',
        name: '',
        brand: '',
        designer: '',
        supplier_id: '',
        spec_code: '',
        color: '',
        quantity: 0,
        cost_with_tax_shipping: 0,
        retail_price: 0,
        delivery_days: 0,
        remarks: '',
        main_image: '',
        images: [],
        status: 'draft',
      });
    }
    setShowFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.sku_code || !formData.name || !formData.brand) {
      alert('请填写必填项：货品编号、货品名称、品牌');
      return;
    }

    try {
      setSaving(true);
      const url = currentProduct 
        ? `/api/product-center/products/${currentProduct.id}`
        : '/api/product-center/products';
      const method = currentProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowFormDialog(false);
        loadProducts();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProduct) return;

    try {
      const response = await fetch(`/api/product-center/products/${currentProduct.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setCurrentProduct(null);
        loadProducts();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            uploadedUrls.push(data.imageUrl);
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
        main_image: prev.main_image || uploadedUrls[0] || '',
      }));
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        main_image: index === 0 ? (newImages[0] || '') : prev.main_image,
      };
    });
  };

  const handlePreviewImages = (images: string[], index: number = 0) => {
    setPreviewImages(images);
    setCurrentImageIndex(index);
    setShowImageDialog(true);
  };

  // 计算毛利率
  const calculateProfitMargin = (cost: number, retail: number) => {
    if (!retail || retail === 0) return '-';
    const margin = ((retail - cost) / retail) * 100;
    return margin.toFixed(1) + '%';
  };

  const getBrandLabel = (brand: string) => {
    return BRANDS.find(b => b.value === brand)?.label || brand;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: '上架', color: 'bg-green-100 text-green-700' },
      inactive: { label: '下架', color: 'bg-red-100 text-red-700' },
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
    };
    const { label, color } = statusMap[status] || { label: status, color: 'bg-gray-100' };
    return <span className={`px-2 py-1 rounded text-xs ${color}`}>{label}</span>;
  };

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return '-';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || '-';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-muted-foreground">管理所有商品信息</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          新建商品
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索货品名称或编号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="品牌" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部品牌</SelectItem>
                {BRANDS.map(brand => (
                  <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 商品列表 - 表格视图 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>共 {pagination.total} 个商品</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无商品</p>
              <Button onClick={() => handleOpenForm()} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个商品
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium">图片</th>
                    <th className="text-left p-3 text-sm font-medium">货品编号</th>
                    <th className="text-left p-3 text-sm font-medium">货品名称</th>
                    <th className="text-left p-3 text-sm font-medium">品牌</th>
                    <th className="text-left p-3 text-sm font-medium">设计师</th>
                    <th className="text-left p-3 text-sm font-medium">主供应商</th>
                    <th className="text-left p-3 text-sm font-medium">规格码</th>
                    <th className="text-left p-3 text-sm font-medium">颜色</th>
                    <th className="text-right p-3 text-sm font-medium">数量</th>
                    <th className="text-right p-3 text-sm font-medium">含税运成本</th>
                    <th className="text-right p-3 text-sm font-medium">零售价</th>
                    <th className="text-right p-3 text-sm font-medium">毛利率</th>
                    <th className="text-center p-3 text-sm font-medium">货期</th>
                    <th className="text-center p-3 text-sm font-medium">状态</th>
                    <th className="text-center p-3 text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const totalQuantity = product.product_inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
                    const cost = product.product_prices?.cost_with_tax_shipping || 0;
                    const retail = product.product_prices?.retail_price || 0;
                    const profitMargin = calculateProfitMargin(cost, retail);
                    
                    return (
                      <tr 
                        key={product.id} 
                        className="border-b hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleViewDetail(product)}
                      >
                        <td className="p-3">
                          {product.main_image || (product.images && product.images.length > 0) ? (
                            <img
                              src={product.main_image || product.images![0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewImages(product.images || [product.main_image!], 0);
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm font-mono">{product.sku_code}</td>
                        <td className="p-3 text-sm font-medium">{product.name}</td>
                        <td className="p-3 text-sm">{getBrandLabel(product.brand)}</td>
                        <td className="p-3 text-sm">{product.designer || '-'}</td>
                        <td className="p-3 text-sm">{getSupplierName(product.supplier_id)}</td>
                        <td className="p-3 text-sm font-mono">{product.spec_code || '-'}</td>
                        <td className="p-3 text-sm">{product.color || '-'}</td>
                        <td className="p-3 text-sm text-right">{totalQuantity}</td>
                        <td className="p-3 text-sm text-right">{cost ? `¥${cost.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-sm text-right">{retail ? `¥${retail.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-sm text-right">
                          <span className={profitMargin !== '-' && parseFloat(profitMargin) < 20 ? 'text-red-600' : ''}>
                            {profitMargin}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-center">{product.delivery_days ? `${product.delivery_days}天` : '-'}</td>
                        <td className="p-3 text-center">{getStatusBadge(product.status)}</td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(product)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenForm(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setCurrentProduct(product); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>商品详情</DialogTitle>
          </DialogHeader>
          
          {currentProduct && (
            <div className="space-y-4">
              {/* 图片 */}
              {(currentProduct.main_image || (currentProduct.images && currentProduct.images.length > 0)) && (
                <div>
                  <Label className="text-muted-foreground">商品图片</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[currentProduct.main_image, ...(currentProduct.images || [])].filter(Boolean).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => handlePreviewImages(
                          [currentProduct.main_image, ...(currentProduct.images || [])].filter(Boolean) as string[], 
                          i
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">货品编号</Label>
                  <p className="font-mono">{currentProduct.sku_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">货品名称</Label>
                  <p className="font-medium">{currentProduct.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">品牌</Label>
                  <p>{getBrandLabel(currentProduct.brand)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <p>{getStatusBadge(currentProduct.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">设计师</Label>
                  <p>{currentProduct.designer || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">主供应商</Label>
                  <p>{getSupplierName(currentProduct.supplier_id)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">规格码</Label>
                  <p className="font-mono">{currentProduct.spec_code || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">颜色</Label>
                  <p>{currentProduct.color || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">数量</Label>
                  <p>{currentProduct.product_inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">含税运成本</Label>
                  <p className="font-medium">
                    {currentProduct.product_prices?.cost_with_tax_shipping 
                      ? `¥${currentProduct.product_prices.cost_with_tax_shipping.toFixed(2)}` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">零售价</Label>
                  <p className="font-medium">
                    {currentProduct.product_prices?.retail_price 
                      ? `¥${currentProduct.product_prices.retail_price.toFixed(2)}` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">毛利率</Label>
                  <p className="font-medium">
                    {calculateProfitMargin(
                      currentProduct.product_prices?.cost_with_tax_shipping || 0,
                      currentProduct.product_prices?.retail_price || 0
                    )}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">货期</Label>
                  <p>{currentProduct.delivery_days ? `${currentProduct.delivery_days}天` : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <p className="text-sm">{new Date(currentProduct.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {currentProduct.remarks && (
                <div>
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="whitespace-pre-wrap">{currentProduct.remarks}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            <Button onClick={() => {
              setShowDetailDialog(false);
              handleOpenForm(currentProduct!);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增/编辑弹窗 */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProduct ? '编辑商品' : '新建商品'}</DialogTitle>
            <DialogDescription>填写商品信息</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>货品编号 <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="SKU编码" 
                  value={formData.sku_code} 
                  onChange={e => setFormData(prev => ({ ...prev, sku_code: e.target.value }))} 
                />
              </div>
              <div className="col-span-2">
                <Label>货品名称 <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="商品名称" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>品牌 <span className="text-red-500">*</span></Label>
                <Select value={formData.brand} onValueChange={v => setFormData(prev => ({ ...prev, brand: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择品牌" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map(brand => (
                      <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>设计师</Label>
                <Input 
                  placeholder="设计师名称" 
                  value={formData.designer} 
                  onChange={e => setFormData(prev => ({ ...prev, designer: e.target.value }))} 
                />
              </div>
              <div>
                <Label>主供应商</Label>
                <Select value={formData.supplier_id} onValueChange={v => setFormData(prev => ({ ...prev, supplier_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>规格码</Label>
                <Input 
                  placeholder="规格编码" 
                  value={formData.spec_code} 
                  onChange={e => setFormData(prev => ({ ...prev, spec_code: e.target.value }))} 
                />
              </div>
              <div>
                <Label>颜色</Label>
                <Input 
                  placeholder="颜色" 
                  value={formData.color} 
                  onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))} 
                />
              </div>
              <div>
                <Label>数量</Label>
                <Input 
                  type="number" 
                  placeholder="库存数量" 
                  value={formData.quantity} 
                  onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>含税运成本</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="成本价" 
                  value={formData.cost_with_tax_shipping} 
                  onChange={e => setFormData(prev => ({ ...prev, cost_with_tax_shipping: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
              <div>
                <Label>零售价</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="零售价" 
                  value={formData.retail_price} 
                  onChange={e => setFormData(prev => ({ ...prev, retail_price: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
              <div>
                <Label>毛利率</Label>
                <p className="h-10 flex items-center text-sm text-muted-foreground">
                  {calculateProfitMargin(formData.cost_with_tax_shipping, formData.retail_price)}
                  {formData.cost_with_tax_shipping > 0 && formData.retail_price > 0 && (
                    <span className="ml-2 text-xs">
                      (利润: ¥{((formData.retail_price - formData.cost_with_tax_shipping) || 0).toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>货期（天）</Label>
                <Input 
                  type="number" 
                  placeholder="交货天数" 
                  value={formData.delivery_days} 
                  onChange={e => setFormData(prev => ({ ...prev, delivery_days: parseInt(e.target.value) || 0 }))} 
                />
              </div>
              <div>
                <Label>状态</Label>
                <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="active">上架</SelectItem>
                    <SelectItem value="inactive">下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>备注</Label>
              <Textarea 
                placeholder="商品备注..." 
                rows={2}
                value={formData.remarks} 
                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))} 
              />
            </div>
            
            <div>
              <Label>商品图片</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="product-image-upload"
                  disabled={uploading}
                />
                <label htmlFor="product-image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">点击上传图片</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品"{currentProduct?.name}"吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 图片预览弹窗 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>图片预览 ({currentImageIndex + 1} / {previewImages.length})</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={previewImages[currentImageIndex]} alt="" className="w-full max-h-[70vh] object-contain" />
            {previewImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + previewImages.length) % previewImages.length)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % previewImages.length)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
