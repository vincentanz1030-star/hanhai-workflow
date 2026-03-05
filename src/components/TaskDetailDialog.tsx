'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader, ImageUploadResult } from '@/components/ui/image-uploader';
import {
  Calendar,
  User,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
} from 'lucide-react';

interface TaskDetailDialogProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: any) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: TaskDetailDialogProps) {
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    progress: 0,
    estimated_completion_date: '',
  });
  const [images, setImages] = useState<ImageUploadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (task) {
      setFormData({
        task_name: task.task_name || '',
        description: task.description || '',
        progress: task.progress || 0,
        estimated_completion_date: task.estimated_completion_date
          ? task.estimated_completion_date.split('T')[0]
          : '',
      });

      // 加载现有图片
      const existingImages: ImageUploadResult[] = [];
      if (task.image_url) {
        existingImages.push({ fileKey: task.image_url, imageUrl: task.image_url });
      }
      if (task.image_url_2) {
        existingImages.push({ fileKey: task.image_url_2, imageUrl: task.image_url_2 });
      }
      if (task.image_url_3) {
        existingImages.push({ fileKey: task.image_url_3, imageUrl: task.image_url_3 });
      }
      setImages(existingImages);
    }
  }, [task]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        ...formData,
        image_url: images[0]?.fileKey || null,
        image_url_2: images[1]?.fileKey || null,
        image_url_3: images[2]?.fileKey || null,
      };
      await onSave(task.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageAdd = () => {
    if (images.length >= 3) return;
    setImages([...images, { fileKey: '', imageUrl: '' }]);
  };

  const handleImageChange = (index: number, result: ImageUploadResult | null) => {
    const updated = [...images];
    if (result) {
      updated[index] = result;
    } else {
      updated.splice(index, 1);
    }
    setImages(updated);
  };

  const handleImageDelete = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>任务详情</DialogTitle>
          <DialogDescription>
            查看和编辑任务信息，上传相关图片
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">基本信息</TabsTrigger>
            <TabsTrigger value="images">
              图片附件
              {images.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {images.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 基本信息 */}
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task_name">任务名称</Label>
              <Input
                id="task_name"
                value={formData.task_name}
                onChange={(e) =>
                  setFormData({ ...formData, task_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">任务描述</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">进度: {formData.progress}%</Label>
              <Progress value={formData.progress} className="h-2" />
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                className="w-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_completion_date">预计完成日期</Label>
              <Input
                id="estimated_completion_date"
                type="date"
                value={formData.estimated_completion_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_completion_date: e.target.value,
                  })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">任务信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>岗位: {task.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>状态: {task.status}</span>
                </div>
                {task.estimated_completion_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      截止:{' '}
                      {new Date(
                        task.estimated_completion_date
                      ).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 图片附件 */}
          <TabsContent value="images" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <span className="font-medium">任务图片</span>
                <Badge variant="outline">{images.length}/3</Badge>
              </div>
              {images.length < 3 && (
                <Button onClick={handleImageAdd} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加图片
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              可以上传最多3张图片，用于展示任务相关的设计稿、截图等
            </p>

            {images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>还没有上传图片</p>
                <Button onClick={handleImageAdd} variant="outline" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  开始上传
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>图片 {index + 1}</Label>
                      {images.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImageDelete(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <ImageUploader
                      value={image}
                      onChange={(result) => handleImageChange(index, result)}
                      maxSize={10}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
