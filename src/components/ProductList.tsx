/**
 * 商品中心 - 商品列表组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Eye, Package, X, Image as ImageIcon, Upload, Loader2, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

const BRANDS = [
  { value: 'he_zhe', label: '禾哲' },
  { value: 'baobao', label: 'BAOBAO' },
  { value: 'ai_he', label: '爱禾' },
  { value: 'bao_deng_yuan', label: '宝登源' },
];

interface Product {
  id: string;
  sku_code: string;
  name: string;
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
  suppliers?: { id: string; name: string };
  product_prices?: {
    cost_with_tax_shipping?: number;
    retail_price?: number;
  };
  product_inventory?: { quantity: number }[];
}

interface Supplier {
  id: string;
  name: string;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // 弹窗状态
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
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
    loadData();
  }, [brandFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (brandFilter !== 'all') params.append('brand', brandFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const [productsRes, suppliersRes] = await Promise.all([
        fetch(`/api/product-center/products?${params}`),
        fetch('/api/product-center/suppliers'),
      ]);

      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();

      if (productsData.success) setProducts(productsData.data || []);
      if (suppliersData.success) setSuppliers(suppliersData.data || []);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // 预览
  const handlePreview = (product: Product) => {
    setCurrentProduct(product);
    setShowDetailDialog(true);
  };

  // 编辑
  const handleEdit = (product: Product) => {
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
    setShowFormDialog(true);
  };

  // 新增
  const handleAdd = () => {
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
    setShowFormDialog(true);
  };

  // 保存
  const handleSave = async () => {
    if (!formData.sku_code || !formData.name || !formData.brand) {
      alert('请填写必填项：货品编号、货品名称、品牌');
      return;
    }

    setSaving(true);
    try {
      const url = currentProduct 
        ? `/api/product-center/products/${currentProduct.id}`
        : '/api/product-center/products';
      const method = currentProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowFormDialog(false);
        loadData();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!currentProduct) return;

    try {
      const res = await fetch(`/api/product-center/products/${currentProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setCurrentProduct(null);
        loadData();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) urls.push(data.imageUrl);
        }
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls],
        main_image: prev.main_image || urls[0] || '',
      }));
    } finally {
      setUploading(false);
    }
  };

  // 计算毛利率
  const calcMargin = (cost: number, retail: number) => {
    if (!retail) return '-';
    return ((retail - cost) / retail * 100).toFixed(1) + '%';
  };

  // 图片预览
  const openImagePreview = (images: string[], index: number = 0) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setShowImagePreview(true);
  };

  const prevImage = () => setPreviewIndex(i => (i > 0 ? i - 1 : previewImages.length - 1));
  const nextImage = () => setPreviewIndex(i => (i < previewImages.length - 1 ? i + 1 : 0));

  const getBrandLabel = (brand: string) => BRANDS.find(b => b.value === brand)?.label || brand;
  
  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return '-';
    return suppliers.find(s => s.id === supplierId)?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = { active: '上架', inactive: '下架', draft: '草稿' };
    return <span className={`px-2 py-1 rounded text-xs ${map[status] || map.draft}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-4">
      {/* 筛选 */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索货品名称或编号..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="品牌" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部品牌</SelectItem>
                {BRANDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">上架</SelectItem>
                <SelectItem value="inactive">下架</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm">筛选</Button>
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" />新增商品
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 列表 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">商品列表 <span className="text-muted-foreground font-normal">({products.length}个)</span></CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无商品</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2 font-medium whitespace-nowrap">图片</th>
                    <th className="p-2 font-medium whitespace-nowrap">货品编号</th>
                    <th className="p-2 font-medium whitespace-nowrap">货品名称</th>
                    <th className="p-2 font-medium whitespace-nowrap">设计师</th>
                    <th className="p-2 font-medium whitespace-nowrap">主供应商</th>
                    <th className="p-2 font-medium whitespace-nowrap">规格码</th>
                    <th className="p-2 font-medium whitespace-nowrap">颜色</th>
                    <th className="p-2 font-medium text-right whitespace-nowrap">数量</th>
                    <th className="p-2 font-medium text-right whitespace-nowrap">含税运成本</th>
                    <th className="p-2 font-medium text-right whitespace-nowrap">零售价</th>
                    <th className="p-2 font-medium text-right whitespace-nowrap">毛利率</th>
                    <th className="p-2 font-medium text-center whitespace-nowrap">货期</th>
                    <th className="p-2 font-medium text-center whitespace-nowrap">状态</th>
                    <th className="p-2 font-medium text-center whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const qty = p.product_inventory?.reduce((s, i) => s + i.quantity, 0) || 0;
                    const cost = p.product_prices?.cost_with_tax_shipping || 0;
                    const retail = p.product_prices?.retail_price || 0;
                    const margin = calcMargin(cost, retail);

                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          {p.main_image || p.images?.length ? (
                            <div 
                              className="relative group cursor-pointer" 
                              onClick={() => openImagePreview(p.images?.length ? p.images : [p.main_image!], 0)}
                            >
                              <img src={p.main_image || p.images![0]} alt="" className="w-10 h-10 object-cover rounded" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-2 font-mono">{p.sku_code}</td>
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2">{p.designer || '-'}</td>
                        <td className="p-2">{p.suppliers?.name || getSupplierName(p.supplier_id)}</td>
                        <td className="p-2 font-mono">{p.spec_code || '-'}</td>
                        <td className="p-2">{p.color || '-'}</td>
                        <td className="p-2 text-right">{qty}</td>
                        <td className="p-2 text-right">{cost ? `¥${cost.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-right">{retail ? `¥${retail.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-right">{margin}</td>
                        <td className="p-2 text-center">{p.delivery_days ? `${p.delivery_days}天` : '-'}</td>
                        <td className="p-2 text-center">{getStatusBadge(p.status)}</td>
                        <td className="p-2">
                          <div className="flex justify-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePreview(p)} title="预览">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(p)} title="编辑">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setCurrentProduct(p); setShowDeleteDialog(true); }} title="删除">
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
        </CardContent>
      </Card>

      {/* 预览弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>商品详情</DialogTitle></DialogHeader>
          {currentProduct && (
            <div className="space-y-3 text-sm">
              {currentProduct.main_image && (
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => openImagePreview(currentProduct.images?.length ? currentProduct.images : [currentProduct.main_image!], 0)}
                >
                  <img src={currentProduct.main_image} alt="" className="w-full max-h-48 object-contain rounded mx-auto" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">货品编号</Label><p className="font-mono">{currentProduct.sku_code}</p></div>
                <div><Label className="text-muted-foreground">货品名称</Label><p className="font-medium">{currentProduct.name}</p></div>
                <div><Label className="text-muted-foreground">设计师</Label><p>{currentProduct.designer || '-'}</p></div>
                <div><Label className="text-muted-foreground">主供应商</Label><p>{currentProduct.suppliers?.name || getSupplierName(currentProduct.supplier_id)}</p></div>
                <div><Label className="text-muted-foreground">规格码</Label><p className="font-mono">{currentProduct.spec_code || '-'}</p></div>
                <div><Label className="text-muted-foreground">颜色</Label><p>{currentProduct.color || '-'}</p></div>
                <div><Label className="text-muted-foreground">数量</Label><p>{currentProduct.product_inventory?.reduce((s, i) => s + i.quantity, 0) || 0}</p></div>
                <div><Label className="text-muted-foreground">含税运成本</Label><p className="font-medium">{currentProduct.product_prices?.cost_with_tax_shipping ? `¥${currentProduct.product_prices.cost_with_tax_shipping.toFixed(2)}` : '-'}</p></div>
                <div><Label className="text-muted-foreground">零售价</Label><p className="font-medium">{currentProduct.product_prices?.retail_price ? `¥${currentProduct.product_prices.retail_price.toFixed(2)}` : '-'}</p></div>
                <div><Label className="text-muted-foreground">毛利率</Label><p>{calcMargin(currentProduct.product_prices?.cost_with_tax_shipping || 0, currentProduct.product_prices?.retail_price || 0)}</p></div>
                <div><Label className="text-muted-foreground">货期</Label><p>{currentProduct.delivery_days ? `${currentProduct.delivery_days}天` : '-'}</p></div>
                <div><Label className="text-muted-foreground">状态</Label><p>{getStatusBadge(currentProduct.status)}</p></div>
              </div>
              {currentProduct.remarks && (
                <div><Label className="text-muted-foreground">备注</Label><p className="whitespace-pre-wrap bg-muted/50 p-2 rounded">{currentProduct.remarks}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            <Button size="sm" onClick={() => { setShowDetailDialog(false); handleEdit(currentProduct!); }}>编辑</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑/新增弹窗 */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProduct ? '编辑商品' : '新增商品'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>货品编号 <span className="text-red-500">*</span></Label>
                <Input value={formData.sku_code} onChange={e => setFormData(p => ({ ...p, sku_code: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>货品名称 <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>品牌 <span className="text-red-500">*</span></Label>
                <Select value={formData.brand} onValueChange={v => setFormData(p => ({ ...p, brand: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                  <SelectContent>
                    {BRANDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>设计师</Label>
                <Input value={formData.designer} onChange={e => setFormData(p => ({ ...p, designer: e.target.value }))} />
              </div>
              <div>
                <Label>主供应商</Label>
                <Select value={formData.supplier_id || 'none'} onValueChange={v => setFormData(p => ({ ...p, supplier_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>规格码</Label>
                <Input value={formData.spec_code} onChange={e => setFormData(p => ({ ...p, spec_code: e.target.value }))} />
              </div>
              <div>
                <Label>颜色</Label>
                <Input value={formData.color} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} />
              </div>
              <div>
                <Label>数量</Label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: +e.target.value || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>含税运成本</Label>
                <Input type="number" step="0.01" value={formData.cost_with_tax_shipping} onChange={e => setFormData(p => ({ ...p, cost_with_tax_shipping: +e.target.value || 0 }))} />
              </div>
              <div>
                <Label>零售价</Label>
                <Input type="number" step="0.01" value={formData.retail_price} onChange={e => setFormData(p => ({ ...p, retail_price: +e.target.value || 0 }))} />
              </div>
              <div>
                <Label>毛利率</Label>
                <p className="h-9 flex items-center text-muted-foreground">{calcMargin(formData.cost_with_tax_shipping, formData.retail_price)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>货期(天)</Label>
                <Input type="number" value={formData.delivery_days} onChange={e => setFormData(p => ({ ...p, delivery_days: +e.target.value || 0 }))} />
              </div>
              <div>
                <Label>状态</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea rows={2} value={formData.remarks} onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))} />
            </div>
            <div>
              <Label>图片</Label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="img-upload" disabled={uploading} />
              <label htmlFor="img-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded p-3 text-center hover:border-primary">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <>
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">点击上传</p>
                  </>}
                </div>
              </label>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={img} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded cursor-pointer hover:ring-2 hover:ring-primary" 
                        onClick={() => openImagePreview(formData.images, i)}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, images: p.images.filter((_, j) => j !== i) })); }} 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
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
            <Button variant="outline" size="sm" onClick={() => setShowFormDialog(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除商品「{currentProduct?.name}」吗？此操作无法撤销。</p>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 图片预览弹窗 */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/90 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          <button 
            onClick={() => setShowImagePreview(false)}
            className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          {previewImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          <div className="flex items-center justify-center min-h-[300px] max-h-[80vh] p-4">
            <img 
              src={previewImages[previewIndex]} 
              alt="" 
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
          
          {previewImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {previewImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === previewIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
          
          {previewImages.length > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {previewIndex + 1} / {previewImages.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
