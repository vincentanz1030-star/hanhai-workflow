/**
 * 商品中心 - 供应商管理组件
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Search, Plus, Building, Phone, Mail, MapPin } from 'lucide-react';

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  address: string;
  rating: number;
  rating_count: number;
  status: string;
  created_at: string;
}

export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [selectedStatus]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/product-center/suppliers?${params}`);
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      active: { label: '活跃', variant: 'default' },
      inactive: { label: '停用', variant: 'secondary' },
      blacklist: { label: '黑名单', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索供应商名称或编码..."
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
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
            <SelectItem value="blacklist">黑名单</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建供应商
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新供应商</DialogTitle>
              <DialogDescription>填写供应商基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierCode">供应商编码 *</Label>
                  <Input id="supplierCode" placeholder="例如：SUP-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierName">供应商名称 *</Label>
                  <Input id="supplierName" placeholder="输入供应商名称" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">联系人</Label>
                  <Input id="contactPerson" placeholder="输入联系人姓名" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">联系电话</Label>
                  <Input id="contactPhone" placeholder="输入联系电话" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱</Label>
                <Input id="contactEmail" type="email" placeholder="输入联系邮箱" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">供应商类别</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">原材料</SelectItem>
                    <SelectItem value="packaging">包装材料</SelectItem>
                    <SelectItem value="logistics">物流服务</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Textarea id="address" placeholder="输入供应商地址" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>创建供应商</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 供应商列表 */}
      <Card>
        <CardHeader>
          <CardTitle>供应商列表</CardTitle>
          <CardDescription>共 {filteredSuppliers.length} 个供应商</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无供应商数据</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建供应商"开始添加</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{supplier.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">
                          {supplier.supplier_code}
                        </CardDescription>
                      </div>
                      {getStatusBadge(supplier.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-1">
                      {getRatingStars(supplier.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({supplier.rating_count})
                      </span>
                    </div>
                    {supplier.contact_person && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.contact_person}</span>
                      </div>
                    )}
                    {supplier.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.contact_phone}</span>
                      </div>
                    )}
                    {supplier.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{supplier.contact_email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.category && (
                      <Badge variant="outline" className="w-fit">
                        {supplier.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
