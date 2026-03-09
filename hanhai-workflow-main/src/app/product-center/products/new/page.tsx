'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageUploader, ImageUploadResult } from '@/components/ui/image-uploader';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';

interface ProductFormData {
  sku_code: string;
  name: string;
  description: string;
  brand: string;
  category_id: string;
  status: string;
  main_image?: string;
  images: string[];
  cost_price: string;
  wholesale_price: string;
  retail_price: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<ProductFormData>({
    sku_code: '',
    name: '',
    description: '',
    brand: '',
    category_id: '',
    status: 'draft',
    images: [],
    cost_price: '',
    wholesale_price: '',
    retail_price: '',
  });
  const [mainImage, setMainImage] = useState<ImageUploadResult | null>(null);
  const [productImages, setProductImages] = useState<ImageUploadResult[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMainImageChange = (result: ImageUploadResult | null) => {
    setMainImage(result);
  };

  const handleProductImageAdd = () => {
    if (productImages.length >= 8) return;
    setProductImages([...productImages, { fileKey: '', imageUrl: '' }]);
  };

  const handleProductImageChange = (index: number, result: ImageUploadResult | null) => {
    const updated = [...productImages];
    if (result) {
      updated[index] = result;
    } else {
      updated.splice(index, 1);
    }
    setProductImages(updated);
  };

  const handleProductImageDelete = (index: number) => {
    const updated = [...productImages];
    updated.splice(index, 1);
    setProductImages(updated);
  };

  const handleSave = async () => {
    // 验证
    if (!formData.sku_code || !formData.name || !formData.brand) {
      alert('请填写必填字段：SKU编码、商品名称、品牌');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        main_image: mainImage?.fileKey,
        images: productImages.map(img => img.fileKey).filter(Boolean),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
        retail_price: formData.retail_price ? parseFloat(formData.retail_price) : null,
      };

      const response = await fetch('/api/product-center/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert('商品创建成功');
        router.push('/product-center/products');
      } else {
        alert(`创建失败：${data.error}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新建商品</h1>
            <p className="text-muted-foreground">创建新的商品</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* 表单内容 */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="images">
                商品图片
                {(mainImage || productImages.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {productImages.length + (mainImage ? 1 : 0)}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing">价格信息</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku_code">
                    SKU编码 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sku_code"
                    name="sku_code"
                    value={formData.sku_code}
                    onChange={handleInputChange}
                    placeholder="例如：PRD-2024-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">
                    品牌 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="例如：Apple"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">
                    商品名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="请输入商品名称"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">商品分类</Label>
                  <Input
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    placeholder="选择商品分类"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">商品状态</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="draft">草稿</option>
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                    <option value="out_of_stock">缺货</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">商品描述</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="请输入商品详细描述"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 商品图片 */}
            <TabsContent value="images" className="space-y-6">
              {/* 主图 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <Label className="text-base font-medium">商品主图</Label>
                    <Badge variant="outline">必填</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  商品主图将显示在商品列表和详情页，建议尺寸 800x800 像素
                </p>
                <ImageUploader
                  value={mainImage}
                  onChange={handleMainImageChange}
                  maxSize={5}
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>

              <Separator />

              {/* 商品图库 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <Label className="text-base font-medium">商品图库</Label>
                    <Badge variant="outline">{productImages.length}/8</Badge>
                  </div>
                  {productImages.length < 8 && (
                    <Button onClick={handleProductImageAdd} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加图片
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  可以上传最多8张图片，用于展示商品不同角度和细节
                </p>

                {productImages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>还没有上传商品图片</p>
                    <Button
                      onClick={handleProductImageAdd}
                      variant="outline"
                      className="mt-4"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      开始上传
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productImages.map((image, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>图片 {index + 1}</Label>
                          {productImages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProductImageDelete(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <ImageUploader
                          value={image}
                          onChange={(result) => handleProductImageChange(index, result)}
                          maxSize={5}
                          accept="image/jpeg,image/png,image/webp"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 价格信息 */}
            <TabsContent value="pricing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">成本价</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ¥
                    </span>
                    <Input
                      id="cost_price"
                      name="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={handleInputChange}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholesale_price">批发价</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ¥
                    </span>
                    <Input
                      id="wholesale_price"
                      name="wholesale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.wholesale_price}
                      onChange={handleInputChange}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retail_price">零售价</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ¥
                    </span>
                    <Input
                      id="retail_price"
                      name="retail_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.retail_price}
                      onChange={handleInputChange}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">价格说明</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 成本价：商品的采购或生产成本</li>
                  <li>• 批发价：针对批发客户的销售价格</li>
                  <li>• 零售价：面向终端消费者的销售价格</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
