'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus } from 'lucide-react';

// 品牌名称映射
const BRAND_NAMES: Record<string, string> = {
  hezhe: '禾哲',
  baobao: 'BAOBAO',
  aihe: '爱禾',
  baodengyuan: '宝登源',
};

// 岗位列表
const POSITIONS = [
  '插画',
  '产品',
  '详情',
  '文案',
  '采购',
  '包装',
  '财务',
  '客服',
  '仓储',
  '运营',
];

interface CreateProjectSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
}

export function CreateProjectSimple({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectSimpleProps) {
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    description: '',
    positions: [] as string[],
    startDate: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.name || !formData.brand) {
      setError('请填写项目名称和品牌');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // 获取认证 Token
      const token = localStorage.getItem('auth_token') || '';

      const response = await fetch('/api/projects/create-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand: formData.brand,
          name: formData.name,
          description: formData.description,
          positions: formData.positions,
          startDate: formData.startDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建项目失败');
      }

      // 成功
      console.log('项目创建成功:', data.project);
      onSuccess(data.project);
      handleClose();
    } catch (err: any) {
      console.error('创建项目失败:', err);
      setError(err.message || '创建项目失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePositionChange = (position: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        positions: [...formData.positions, position],
      });
    } else {
      setFormData({
        ...formData,
        positions: formData.positions.filter((p) => p !== position),
      });
    }
  };

  const handleClose = () => {
    setFormData({
      brand: '',
      name: '',
      description: '',
      positions: [],
      startDate: '',
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            填写项目信息，选择参与岗位和时间
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* 品牌 */}
          <div className="space-y-2">
            <Label htmlFor="brand">品牌 *</Label>
            <select
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">请选择品牌...</option>
              {Object.entries(BRAND_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* 项目名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">项目名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：夏季新品推广"
            />
          </div>

          {/* 项目内容 */}
          <div className="space-y-2">
            <Label htmlFor="description">项目内容</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="简要描述项目内容和目标"
              rows={3}
            />
          </div>

          {/* 参与岗位 */}
          <div className="space-y-2">
            <Label>参与岗位（多选）</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POSITIONS.map((position) => (
                <div key={position} className="flex items-center space-x-2">
                  <Checkbox
                    id={`position-${position}`}
                    checked={formData.positions.includes(position)}
                    onCheckedChange={(checked) =>
                      handlePositionChange(position, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`position-${position}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {position}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 时间 */}
          <div className="space-y-2">
            <Label htmlFor="startDate">开始时间</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              '创建项目'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
