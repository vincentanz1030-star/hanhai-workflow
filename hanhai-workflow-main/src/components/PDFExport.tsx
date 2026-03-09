'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface PDFExportData {
  title: string;
  content: string;
  tables?: Array<{
    headers: string[];
    rows: string[][];
    title?: string;
  }>;
  metadata?: {
    author?: string;
    date?: string;
    version?: string;
  };
}

interface PDFExportProps {
  data: PDFExportData;
  filename?: string;
  onExport?: (format: 'pdf' | 'excel') => Promise<void>;
}

export function PDFExport({ data, filename = 'export', onExport }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 导出为PDF
  const exportToPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('idle');

    try {
      // 动态加载jspdf
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // 设置字体（支持中文）
      // 注意：jsPDF默认不支持中文，需要添加中文字体
      // 这里简化处理，实际使用时需要加载中文字体文件
      
      // 标题
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // 元数据
      if (data.metadata) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const metaLines = [
          data.metadata.date ? `日期: ${data.metadata.date}` : '',
          data.metadata.author ? `作者: ${data.metadata.author}` : '',
          data.metadata.version ? `版本: ${data.metadata.version}` : '',
        ].filter(Boolean);

        metaLines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // 分隔线
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // 内容文本
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitContent = doc.splitTextToSize(data.content, contentWidth);
      
      splitContent.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      // 表格
      if (data.tables && data.tables.length > 0) {
        data.tables.forEach((table, tableIndex) => {
          // 检查是否需要换页
          if (yPosition > pageHeight - margin - 50) {
            doc.addPage();
            yPosition = margin;
          }

          // 表格标题
          if (table.title) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(table.title, margin, yPosition);
            yPosition += 7;
          }

          // 表头
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const cellWidth = contentWidth / table.headers.length;
          
          table.headers.forEach((header, index) => {
            doc.text(
              header, 
              margin + index * cellWidth + 2, 
              yPosition
            );
          });

          // 表头分隔线
          yPosition += 3;
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;

          // 表格内容
          doc.setFont('helvetica', 'normal');
          table.rows.forEach((row, rowIndex) => {
            // 检查是否需要换页
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }

            row.forEach((cell, cellIndex) => {
              const splitCell = doc.splitTextToSize(cell, cellWidth - 4);
              splitCell.forEach((text: string, textIndex: number) => {
                doc.text(
                  text, 
                  margin + cellIndex * cellWidth + 2, 
                  yPosition
                );
                yPosition += 4;
              });
            });

            // 行分隔线
            doc.setLineWidth(0.1);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 2;
          });

          yPosition += 10;
        });
      }

      // 保存PDF
      doc.save(`${filename}.pdf`);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('PDF导出失败:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // 导出为Excel (CSV格式)
  const exportToExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('idle');

    try {
      // 收集所有表格数据
      const csvRows: string[][] = [];

      // 添加标题
      csvRows.push([data.title]);
      csvRows.push([]);

      // 添加元数据
      if (data.metadata) {
        if (data.metadata.date) csvRows.push(['日期', data.metadata.date]);
        if (data.metadata.author) csvRows.push(['作者', data.metadata.author]);
        if (data.metadata.version) csvRows.push(['版本', data.metadata.version]);
        csvRows.push([]);
      }

      // 添加内容
      csvRows.push(['内容']);
      csvRows.push([data.content]);
      csvRows.push([]);

      // 添加表格数据
      if (data.tables && data.tables.length > 0) {
        data.tables.forEach((table) => {
          if (table.title) {
            csvRows.push([table.title]);
            csvRows.push([]);
          }

          // 表头
          csvRows.push(table.headers);

          // 数据行
          table.rows.forEach(row => {
            // 处理包含逗号的字段
            const processedRow = row.map((cell: string) => 
              cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell
            );
            csvRows.push(processedRow);
          });

          csvRows.push([]);
        });
      }

      // 转换为CSV字符串
      const csvContent = csvRows
        .map((row: string[]) => row.map((cell: string) => 
          cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(','))
        .join('\n');

      // 添加BOM以支持Excel识别中文
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Excel导出失败:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          数据导出
        </CardTitle>
        <CardDescription>
          将当前数据导出为 PDF 或 Excel 格式
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* 导出预览 */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="font-medium">{data.title}</div>
            {data.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {data.content}
              </div>
            )}
            {data.tables && data.tables.length > 0 && (
              <div className="text-sm text-muted-foreground">
                包含 {data.tables.length} 个表格
              </div>
            )}
          </div>

          {/* 导出按钮组 */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              导出 PDF
              {isExporting && (
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              导出 Excel
              {isExporting && (
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </Button>
          </div>

          {/* 状态提示 */}
          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>导出成功！文件已开始下载</span>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <XCircle className="h-4 w-4" />
              <span>导出失败，请重试</span>
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-muted-foreground">
            <p>• PDF格式：适合打印和正式文档</p>
            <p>• Excel格式：适合数据分析和二次编辑</p>
            {isExporting && <p className="mt-2">正在生成文件，请稍候...</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 使用示例：
/*
const exportData: PDFExportData = {
  title: '项目周报',
  content: '本周项目进度概述...',
  metadata: {
    author: '张三',
    date: '2025-01-15',
    version: 'v1.0',
  },
  tables: [
    {
      title: '任务清单',
      headers: ['任务名称', '负责人', '状态', '进度'],
      rows: [
        ['任务A', '张三', '进行中', '80%'],
        ['任务B', '李四', '已完成', '100%'],
      ],
    },
  ],
};

<PDFExport 
  data={exportData} 
  filename="项目周报_2025-01-15"
/>
*/
