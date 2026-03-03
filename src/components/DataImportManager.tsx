'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export default function DataImportManager() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  // 上传文件
  const handleUpload = async (file: File, type: string) => {
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '导入失败');
      }

      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // 下载模板
  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/import?type=${type}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-template.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>数据导入</CardTitle>
        <CardDescription>
          从Excel文件批量导入项目、任务、销售目标等数据
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              导入完成！成功 {result.imported} 条，失败 {result.failed} 条
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">项目导入</TabsTrigger>
            <TabsTrigger value="tasks">任务导入</TabsTrigger>
            <TabsTrigger value="sales_targets">销售目标导入</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ImportSection
              type="projects"
              title="导入项目"
              description="批量导入项目信息"
              columns={['项目名称', '品牌', '类型', '销售日期', '确认日期', '预计完成日期', '描述']}
              onUpload={handleUpload}
              onDownload={downloadTemplate}
              uploading={uploading}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <ImportSection
              type="tasks"
              title="导入任务"
              description="批量导入任务信息"
              columns={['项目ID', '任务名称', '岗位', '顺序', '描述', '进度', '预计完成日期', '状态']}
              onUpload={handleUpload}
              onDownload={downloadTemplate}
              uploading={uploading}
            />
          </TabsContent>

          <TabsContent value="sales_targets">
            <ImportSection
              type="sales_targets"
              title="导入销售目标"
              description="批量导入月度销售目标"
              columns={['品牌', '年份', '月份', '月度目标', '实际完成', '描述']}
              onUpload={handleUpload}
              onDownload={downloadTemplate}
              uploading={uploading}
            />
          </TabsContent>
        </Tabs>

        {result && result.errors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">导入错误详情</h3>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">行号</th>
                    <th className="px-4 py-2 text-left font-medium">错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2 text-red-600 font-medium">{err.row}</td>
                      <td className="px-4 py-2">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ImportSectionProps {
  type: string;
  title: string;
  description: string;
  columns: string[];
  onUpload: (file: File, type: string) => void;
  onDownload: (type: string) => void;
  uploading: boolean;
}

function ImportSection({
  type,
  title,
  description,
  columns,
  onUpload,
  onDownload,
  uploading,
}: ImportSectionProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件类型
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(selectedFile.type)) {
        alert('请上传Excel文件');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadClick = () => {
    if (file) {
      onUpload(file, type);
    }
  };

  const handleDownloadClick = () => {
    onDownload(type);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleDownloadClick} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          下载模板
        </Button>
      </div>

      <div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
            file:cursor-pointer
          "
        />
      </div>

      {file && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{file.name}</Badge>
          <Button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? '导入中...' : '开始导入'}
          </Button>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-md">
        <h4 className="text-sm font-medium mb-2">文件格式说明</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Excel文件应包含以下列（第一行为表头）：
        </p>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <Badge key={col} variant="outline" className="text-xs">
              {col}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
