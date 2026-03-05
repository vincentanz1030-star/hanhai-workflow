'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImagePreview } from '@/components/ui/image-preview';
import { 
  Plus, 
  Search, 
  Image as ImageIcon, 
  MoreVertical,
  Edit,
  Eye,
  Filter,
  LayoutGrid,
  Table,
  Package
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
  category_id?: string;
  created_at: string;
  product_prices?: {
    cost_price?: number;
    wholesale_price?: number;
    retail_price?: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.page, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/product-center/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination({
          ...pagination,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadProducts();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      active: 'bg-green-500',
      inactive: 'bg-red-500',
      out_of_stock: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      active: '上架',
      inactive: '下架',
      out_of_stock: '缺货',
    };
    return texts[status] || status;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-muted-foreground">管理所有商品信息</p>
        </div>
        <Button onClick={() => router.push('/product-center/products/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建商品
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索商品名称或SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="active">上架</option>
              <option value="inactive">下架</option>
              <option value="out_of_stock">缺货</option>
            </select>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>商品列表</CardTitle>
              <CardDescription>
                共 {pagination.total} 个商品
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">加载中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无商品</p>
              <Button
                onClick={() => router.push('/product-center/products/new')}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建第一个商品
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => router.push(`/product-center/products/${product.id}`)}
                    >
                      {/* 商品图片 */}
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        {product.main_image ? (
                          <ImagePreview
                            fileKey={product.main_image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : product.images && product.images.length > 0 ? (
                        <ImagePreview
                          fileKey={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    
                    {/* 悬停操作 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product-center/products/${product.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product-center/products/${product.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 状态标签 */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getStatusColor(product.status)} text-white`}>
                        {getStatusText(product.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-4 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-mono">
                        {product.sku_code}
                      </p>
                      <h3 className="font-medium line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{product.brand}</Badge>
                      {product.product_prices?.retail_price && (
                        <span className="font-semibold text-primary">
                          ¥{product.product_prices.retail_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">图片</th>
                        <th className="text-left p-4 font-medium">SKU</th>
                        <th className="text-left p-4 font-medium">商品名称</th>
                        <th className="text-left p-4 font-medium">品牌</th>
                        <th className="text-left p-4 font-medium">状态</th>
                        <th className="text-left p-4 font-medium">零售价</th>
                        <th className="text-left p-4 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/product-center/products/${product.id}`)}
                        >
                          <td className="p-4">
                            <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                              {product.main_image ? (
                                <ImagePreview
                                  fileKey={product.main_image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : product.images && product.images.length > 0 ? (
                                <ImagePreview
                                  fileKey={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-sm">{product.sku_code}</td>
                          <td className="p-4">
                            <div className="max-w-xs">
                              <p className="font-medium line-clamp-2">{product.name}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{product.brand}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getStatusColor(product.status)} text-white`}>
                              {getStatusText(product.status)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {product.product_prices?.retail_price ? (
                              <span className="font-semibold text-primary">
                                ¥{product.product_prices.retail_price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/product-center/products/${product.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/product-center/products/${product.id}/edit`);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                第 {pagination.page} / {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
