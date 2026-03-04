/**
 * 企业协同平台 - 知识库文章组件
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
import { Search, Plus, BookOpen, Eye, Heart, Pin, Edit, Trash2, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string;
  tags: string[];
  status: string;
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export function KnowledgeArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

  // 知识分类映射
  const categories = [
    { id: '026ffb77-5045-417f-b3a1-f36b65d88e4b', name: '制度规范' },
    { id: '9f4f1f52-57a5-4fb2-8937-7787dc177e29', name: '操作手册' },
    { id: '382e8da3-63c9-4054-aecb-6d7a199d4847', name: '常见问题' },
    { id: '9f12c5d6-6b66-4f77-8900-941e6ab7a972', name: '培训资料' },
  ];

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    tags: '',
    status: 'published',
    is_pinned: false,
  });

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, selectedStatus]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedCategory !== 'all' && { category_id: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/collaboration/knowledge?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('加载知识文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写必填项：标题、内容');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      const response = await fetch('/api/collaboration/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('文章创建成功！');
        setIsCreateDialogOpen(false);
        setFormData({
          title: '',
          content: '',
          category_id: '',
          tags: '',
          status: 'published',
          is_pinned: false,
        });
        loadArticles(); // 刷新列表
      } else {
        alert(`创建失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建文章失败:', error);
      alert('创建失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditArticle = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写必填项：标题、内容');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      const response = await fetch(`/api/collaboration/knowledge/${currentArticle?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('文章更新成功！');
        setIsEditDialogOpen(false);
        setFormData({
          title: '',
          content: '',
          category_id: '',
          tags: '',
          status: 'published',
          is_pinned: false,
        });
        setCurrentArticle(null);
        loadArticles(); // 刷新列表
      } else {
        alert(`更新失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新文章失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const response = await fetch(`/api/collaboration/knowledge/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('文章删除成功！');
        loadArticles();
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const openViewDialog = (article: Article) => {
    setCurrentArticle(article);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (article: Article) => {
    setCurrentArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category_id: article.category_id,
      tags: article.tags.join(', '),
      status: article.status,
      is_pinned: article.is_pinned,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      draft: { label: '草稿', variant: 'secondary' },
      published: { label: '已发布', variant: 'default' },
      archived: { label: '已归档', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索文章标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建文章
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建知识文章</DialogTitle>
              <DialogDescription>填写文章信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="输入文章标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="输入文章内容"
                  rows={10}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">标签（用逗号分隔）</Label>
                <Input
                  id="tags"
                  placeholder="例如：规范,流程,指南"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
                      <SelectItem value="published">已发布</SelectItem>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="archived">已归档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="pinned" className="cursor-pointer">置顶文章</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreateArticle} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建文章'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 文章列表 */}
      <Card>
        <CardHeader>
          <CardTitle>知识文章</CardTitle>
          <CardDescription>共 {filteredArticles.length} 篇文章</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无文章</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建文章"开始添加</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openViewDialog(article)}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {article.is_pinned && (
                          <Pin className="h-4 w-4 text-blue-600 mb-1" />
                        )}
                        <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
                        {article.category_name && (
                          <Badge variant="outline" className="text-xs mt-2">
                            {article.category_name}
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(article.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.content}
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {article.like_count}
                        </span>
                      </div>
                      <span>
                        {article.updated_at && format(new Date(article.updated_at), 'yyyy-MM-dd', { locale: zhCN })}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); openEditDialog(article); }}>
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑文章对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑知识文章</DialogTitle>
            <DialogDescription>修改文章信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title">标题 *</Label>
              <Input
                id="edit-title"
                placeholder="输入文章标题"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">分类</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">内容 *</Label>
              <Textarea
                id="edit-content"
                placeholder="输入文章内容"
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">标签（用逗号分隔）</Label>
              <Input
                id="edit-tags"
                placeholder="例如：规范,流程,指南"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="edit-pinned"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-pinned" className="cursor-pointer">置顶文章</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEditArticle} disabled={isSubmitting}>
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

      {/* 文章预览对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>文章预览</DialogTitle>
                <DialogDescription>查看文章完整内容</DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {currentArticle && (
            <div className="space-y-6">
              <div>
                {currentArticle.is_pinned && (
                  <Pin className="h-4 w-4 text-blue-600 mb-2" />
                )}
                <h2 className="text-2xl font-bold">{currentArticle.title}</h2>
                {currentArticle.category_name && (
                  <Badge variant="outline" className="mt-2">
                    {currentArticle.category_name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{currentArticle.view_count} 次浏览</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{currentArticle.like_count} 次点赞</span>
                </div>
                <div>
                  {currentArticle.updated_at && format(new Date(currentArticle.updated_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>文章标签</Label>
                <div className="flex flex-wrap gap-2">
                  {currentArticle.tags && currentArticle.tags.length > 0 ? (
                    currentArticle.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">无标签</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>文章内容</Label>
                <Card>
                  <CardContent className="p-6">
                    <div className="whitespace-pre-wrap">{currentArticle.content}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>关闭</Button>
                <Button onClick={() => { setIsViewDialogOpen(false); openEditDialog(currentArticle); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑文章
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
