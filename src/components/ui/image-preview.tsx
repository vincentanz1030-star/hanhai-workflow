'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ImagePreviewProps {
  fileKey: string | null;
  alt?: string;
  className?: string;
}

export function ImagePreview({ fileKey, alt = 'Image', className = '' }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <img
      src={imageUrl}
      alt={alt}
      className={className}
    />
  );
}
