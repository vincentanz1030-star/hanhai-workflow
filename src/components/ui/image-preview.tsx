'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewProps {
  fileKey: string | null;
  alt?: string;
  className?: string;
  enableZoom?: boolean;
}

export function ImagePreview({ fileKey, alt = 'Image', className = '', enableZoom = true }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!fileKey) {
      setImageUrl('');
      setError(null);
      return;
    }

    // 获取有效的访问URL
    const fetchImageUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/upload?key=${fileKey}`);
        const data = await response.json();

        if (data.success) {
          setImageUrl(data.imageUrl);
        } else {
          setError(data.error || '加载图片失败');
        }
      } catch (err) {
        console.error('获取图片URL失败:', err);
        setError('加载图片失败');
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrl();
  }, [fileKey]);

  if (!fileKey) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{error || '无法加载图片'}</span>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative inline-block cursor-pointer group"
        onClick={enableZoom ? () => setIsZoomed(true) : undefined}
      >
        <img
          src={imageUrl}
          alt={alt}
          className={`${className} ${enableZoom ? 'group-hover:opacity-90 transition-opacity' : ''}`}
        />
        {enableZoom && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* 大图预览 Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0 shadow-none">
          <div className="relative">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
