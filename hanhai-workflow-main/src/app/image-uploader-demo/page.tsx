'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImageUploader, ImageUploadResult } from '@/components/ui/image-uploader';
import { Upload, Image as ImageIcon, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

export default function ImageUploaderDemoPage() {
  const [singleImage, setSingleImage] = useState<ImageUploadResult | null>(null);
  const [multipleImages, setMultipleImages] = useState<ImageUploadResult[]>([]);
  const [taskAttachment, setTaskAttachment] = useState<ImageUploadResult | null>(null);
  const [projectCover, setProjectCover] = useState<ImageUploadResult | null>(null);

  // 单张图片上传演示
  const handleSingleImageChange = (result: ImageUploadResult | null) => {
    setSingleImage(result);
  };

  // 多张图片上传演示
  const handleMultipleImageAdd = () => {
    const newImage: ImageUploadResult = { fileKey: '', imageUrl: '' };
    setMultipleImages([...multipleImages, newImage]);
  };

  const handleMultipleImageChange = (index: number, result: ImageUploadResult | null) => {
    const updated = [...multipleImages];
    if (result) {
      updated[index] = result;
    } else {
      updated.splice(index, 1);
    }
    setMultipleImages(updated);
  };

  const handleMultipleImageDelete = (index: number) => {
    const updated = [...multipleImages];
    updated.splice(index, 1);
    setMultipleImages(updated);
  };

  // 任务附件演示
  const handleTaskAttachmentChange = (result: ImageUploadResult | null) => {
    setTaskAttachment(result);
  };

  // 项目封面演示
  const handleProjectCoverChange = (result: ImageUploadResult | null) => {
    setProjectCover(result);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">图片上传组件演示</h1>
        <p className="text-muted-foreground">
          功能完整的图片上传组件，支持上传、预览、编辑（重新上传）和删除
        </p>
      </div>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能特性</CardTitle>
          <CardDescription>ImageUploader 组件提供的完整功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">上传功能</h3>
                <p className="text-sm text-muted-foreground">
                  支持点击上传和拖拽上传，自动验证文件类型和大小
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">预览功能</h3>
                <p className="text-sm text-muted-foreground">
                  上传前本地预览，上传后使用 URL 展示
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">编辑功能</h3>
                <p className="text-sm text-muted-foreground">
                  支持重新上传替换已有图片
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">删除功能</h3>
                <p className="text-sm text-muted-foreground">
                  一键删除已上传的图片，从对象存储移除
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用场景演示 */}
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">单张图片</TabsTrigger>
          <TabsTrigger value="multiple">多张图片</TabsTrigger>
          <TabsTrigger value="task">任务附件</TabsTrigger>
          <TabsTrigger value="project">项目封面</TabsTrigger>
        </TabsList>

        {/* 单张图片上传 */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>单张图片上传</CardTitle>
              <CardDescription>
                最基础的用法，适用于用户头像、单张图片场景
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                value={singleImage}
                onChange={handleSingleImageChange}
                maxSize={10}
              />

              {/* 显示上传结果 */}
              {singleImage && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">上传成功</span>
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div><strong>文件 Key:</strong> {singleImage.fileKey}</div>
                    <div><strong>访问 URL:</strong></div>
                    <code className="block bg-background p-2 rounded text-xs break-all">
                      {singleImage.imageUrl}
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 多张图片上传 */}
        <TabsContent value="multiple" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>多张图片上传</CardTitle>
                  <CardDescription>
                    适用于图集、产品相册等场景
                  </CardDescription>
                </div>
                <Button onClick={handleMultipleImageAdd} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  添加图片
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {multipleImages.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <ImageUploader
                      value={image}
                      onChange={(result) => handleMultipleImageChange(index, result)}
                      maxSize={5}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleMultipleImageDelete(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      移除此图片
                    </Button>
                  </div>
                ))}
                
                {multipleImages.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>还没有上传图片，点击上方"添加图片"开始</p>
                  </div>
                )}
              </div>

              {multipleImages.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{multipleImages.length} 张图片</Badge>
                    <span className="text-sm text-muted-foreground">
                      已上传 {multipleImages.filter(img => img.fileKey).length} 张
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 任务附件 */}
        <TabsContent value="task" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>任务附件</CardTitle>
              <CardDescription>
                适用于任务详情页，上传任务相关的截图、参考图等
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                value={taskAttachment}
                onChange={handleTaskAttachmentChange}
                maxSize={20}
                className="max-w-2xl"
              />

              {taskAttachment && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      任务附件已上传
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    此附件将关联到当前任务，可以在任务详情中查看和管理
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 项目封面 */}
        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>项目封面</CardTitle>
              <CardDescription>
                适用于项目创建和编辑页面，上传项目封面图
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                value={projectCover}
                onChange={handleProjectCoverChange}
                maxSize={5}
                accept="image/jpeg,image/png,image/webp"
              />

              {projectCover && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">
                        项目封面已设置
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      封面图将显示在项目列表和项目详情页
                    </p>
                  </div>

                  {/* 封面预览 */}
                  <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg border">
                    <img
                      src={projectCover.imageUrl}
                      alt="项目封面预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>如何在你的代码中使用 ImageUploader 组件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. 导入组件</h3>
              <code className="block bg-muted p-3 rounded text-sm">
                import &#123; ImageUploader, ImageUploadResult &#125; from '@/components/ui/image-uploader';
              </code>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. 使用组件</h3>
              <code className="block bg-muted p-3 rounded text-sm">
{`const [image, setImage] = useState<ImageUploadResult | null>(null);

<ImageUploader
  value={image}
  onChange={setImage}
  maxSize={10}  // 最大10MB
  accept="image/*"  // 接受所有图片格式
/>`}
              </code>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. 处理结果</h3>
              <code className="block bg-muted p-3 rounded text-sm">
{`// ImageUploadResult 接口
interface ImageUploadResult {
  fileKey: string;    // 文件在对象存储中的唯一标识
  imageUrl: string;   // 可访问的签名URL（有效期30天）
}

// 建议：将 fileKey 持久化到数据库
// 使用时：调用 GET /api/upload?key=xxx 获取新的访问URL`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
