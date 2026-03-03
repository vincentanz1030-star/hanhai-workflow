'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Database, Download, Trash2, RefreshCw, AlertTriangle, HardDrive, Clock, FileText } from 'lucide-react';

interface BackupRecord {
  id: string;
  name: string;
  description: string | null;
  file_size: number;
  record_count: number;
  tables: string[];
  created_by: string;
  created_at: string;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 创建备份对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');

  // 恢复确认对话框状态
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert('备份名称不能为空');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: backupName,
          description: backupDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setCreateDialogOpen(false);
        setBackupName('');
        setBackupDescription('');
        await loadBackups();
      } else {
        alert('创建备份失败：' + data.error);
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      alert('创建备份失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    setRestoring(selectedBackup.id);
    try {
      const response = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          tables: selectedBackup.tables,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRestoreDialogOpen(false);
        await loadBackups();
      } else {
        alert('恢复备份失败：' + data.error);
      }
    } catch (error) {
      console.error('恢复备份失败:', error);
      alert('恢复备份失败，请重试');
    } finally {
      setRestoring(null);
      setSelectedBackup(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('确定要删除这个备份吗？此操作无法撤销。')) {
      return;
    }

    setDeleting(backupId);
    try {
      const response = await fetch(`/api/backups?id=${backupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('备份已删除');
        await loadBackups();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除备份失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据备份与恢复
              </CardTitle>
              <CardDescription>管理数据库备份，支持数据恢复</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    创建备份
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建新备份</DialogTitle>
                    <DialogDescription>
                      创建数据库备份，包含所有表的数据
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupName">备份名称 *</Label>
                      <Input
                        id="backupName"
                        placeholder="例如：2025-01-20 完整备份"
                        value={backupName}
                        onChange={(e) => setBackupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupDescription">描述</Label>
                      <Textarea
                        id="backupDescription"
                        placeholder="备份描述（可选）"
                        value={backupDescription}
                        onChange={(e) => setBackupDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateBackup} disabled={creating}>
                      {creating ? '创建中...' : '创建备份'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 备份列表 */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">暂无备份记录</p>
              <p className="text-xs mt-1">点击"创建备份"按钮创建第一个备份</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  {/* 备份头部 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{backup.name}</h3>
                      </div>
                      {backup.description && (
                        <p className="text-sm text-muted-foreground mt-1">{backup.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {backup.tables.length} 个表
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {backup.record_count} 条记录
                      </Badge>
                    </div>
                  </div>

                  {/* 备份详情 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>大小: {formatFileSize(backup.file_size)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(backup.created_at)}</span>
                    </div>
                  </div>

                  {/* 表列表 */}
                  <div className="flex flex-wrap gap-1">
                    {backup.tables.slice(0, 6).map((table) => (
                      <Badge key={table} variant="secondary" className="text-[10px]">
                        {table}
                      </Badge>
                    ))}
                    {backup.tables.length > 6 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{backup.tables.length - 6}
                      </Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={restoring === backup.id}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      {restoring === backup.id ? '恢复中...' : '恢复'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      disabled={deleting === backup.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {deleting === backup.id ? '删除中...' : '删除'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 恢复确认对话框 */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认恢复备份
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>您即将恢复备份：<strong>{selectedBackup?.name}</strong></p>
              <p className="text-destructive font-medium">
                ⚠️ 此操作将覆盖现有数据，请确保已创建当前数据的备份！
              </p>
              <p className="text-sm">
                备份包含 {selectedBackup?.tables.length} 个表，共 {selectedBackup?.record_count} 条记录
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRestore}
              disabled={restoring !== null}
            >
              {restoring ? '恢复中...' : '确认恢复'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
