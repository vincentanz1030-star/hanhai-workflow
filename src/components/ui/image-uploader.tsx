'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImagePreview } from '@/components/ui/image-preview';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

export interface ImageUploadResult {
  fileKey: string;
  imageUrl: string;
}

interface ImageUploaderProps {
  value?: ImageUploadResult | null;
  onChange?: (result: ImageUploadResult | null) => void;
  disabled?: boolean;
  maxSize?: number; // 最大文件大小（MB）
  accept?: string; // 接受的文件类型
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  disabled = false,
  maxSize = 10,
  accept = 'image/*',
  className = '',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('只支持图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // 准备 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传文件
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        onChange?.({
          fileKey: data.fileKey,
          imageUrl: data.imageUrl,
        });
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
      console.error('上传错误:', err);
    } finally {
      setUploading(false);
    }
  };

  // 处理文件输入
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 清空 input 以允许重复选择同一文件
    e.target.value = '';
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!value?.fileKey || disabled) return;

    try {
      const response = await fetch(`/api/upload?key=${value.fileKey}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        onChange?.(null);
        setError(null);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败，请重试');
      console.error('删除错误:', err);
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 如果已有图片，显示预览
  if (value && value.fileKey) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        {/* 图片预览 */}
        <div className="relative aspect-video w-full">
          <ImagePreview
            fileKey={value.fileKey}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors">
            {/* 操作按钮组 */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFileSelect}
                disabled={disabled || uploading}
                className="bg-white/90 hover:bg-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新上传
              </Button>
              
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || uploading}
                className="bg-white/90 hover:bg-white text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>

          {/* 上传进度 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-2/3 max-w-md bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">上传中...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="absolute top-2 left-2 right-2">
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </Card>
    );
  }

  // 上传区域
  return (
    <Card className={`relative ${className}`}>
      <div
        className={`
          aspect-video w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
          ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? triggerFileSelect : undefined}
      >
        {/* 上传中状态 */}
        {uploading ? (
          <div className="text-center space-y-3">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
            <div className="w-48">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">上传中...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </div>
        ) : (
          /* 初始状态 */
          <div className="text-center space-y-3 p-6">
            <div className="flex items-center justify-center">
              <div className={`
                h-16 w-16 rounded-full flex items-center justify-center
                ${dragOver ? 'bg-primary/10' : 'bg-muted'}
              `}>
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">点击或拖拽上传图片</p>
              <p className="text-xs text-muted-foreground">
                支持 JPG、PNG、GIF 等格式，最大 {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 成功提示 */}
      {value && !uploading && !error && (
        <div className="mt-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>上传成功！</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </Card>
  );
}
