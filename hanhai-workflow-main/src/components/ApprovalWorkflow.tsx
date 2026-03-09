/**
 * 企业协同平台 - 审批流程组件
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, ClipboardCheck, Clock, CheckCircle2, XCircle, User, FileText, Eye, Edit, Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ApprovalInstance {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  workflow_code?: string;
  instance_code?: string;
  applicant_id?: string;
  applicant_name?: string;
  initiator?: string;
  initiator_name?: string;
  current_step: string | number;
  status: string;
  title: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  form_data?: Record<string, any>;
  comments?: Array<{
    step_no: number;
    approver_id: string;
    approver_name: string;
    action: string;
    comment: string;
    created_at: string;
  }>;
  approval_workflows?: {
    name: string;
    category: string;
    steps?: Array<{
      step_no: number;
      step_name: string;
      approvers: string[];
      approval_type: string;
    }>;
  };
}

export function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 用户和审批人状态
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [currentWorkflowSteps, setCurrentWorkflowSteps] = useState<any[]>([]);

  // 表单状态
  const [formData, setFormData] = useState({
    workflow_id: '',
    title: '',
    content: '',
    status: 'pending',
    initiator: '00000000-0000-0000-0000-000000000000',
  });

  // 审批操作状态
  const [isApprovalActionOpen, setIsApprovalActionOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalInstance | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    loadApprovals();
    loadUsers();
  }, [selectedStatus]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/collaboration/approvals?${params}`);
      const data = await response.json();

      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('加载审批失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const handleCreateApproval = async () => {
    if (!formData.workflow_id || !formData.title) {
      alert('请填写必填项：审批流程、标题');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/collaboration/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          approvers: selectedApprovers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('审批提交成功！');
        setIsCreateDialogOpen(false);
        setFormData({
          workflow_id: '',
          title: '',
          content: '',
          status: 'pending',
          initiator: '00000000-0000-0000-0000-000000000000',
        });
        setSelectedApprovers([]);
        loadApprovals(); // 刷新列表
      } else {
        alert(`提交失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('提交审批失败:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 打开审批操作对话框
  const openApprovalAction = (approvalId: string) => {
    setSelectedApprovalId(approvalId);
    setApprovalComment('');
    setIsApprovalActionOpen(true);
  };

  // 打开预览对话框
  const openPreviewDialog = (approval: ApprovalInstance) => {
    setSelectedApproval(approval);
    setIsPreviewDialogOpen(true);
  };

  // 执行审批操作
  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedApprovalId) return;

    setIsApproving(true);
    try {
      const response = await fetch(`/api/collaboration/approvals/${selectedApprovalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: approvalComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(action === 'approve' ? '已通过审批' : '已拒绝审批');
        setIsApprovalActionOpen(false);
        loadApprovals(); // 刷新列表
      } else {
        alert(`${action === 'approve' ? '通过' : '拒绝'}失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('审批操作失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      pending: { label: '待审批', variant: 'secondary' },
      approved: { label: '已通过', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      cancelled: { label: '已取消', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  // 获取当前步骤的审批人信息
  const getCurrentApprovers = (approval: ApprovalInstance) => {
    if (!approval.approval_workflows?.steps || approval.approval_workflows.steps.length === 0) {
      return '无';
    }

    const stepNo = typeof approval.current_step === 'number' 
      ? approval.current_step 
      : parseInt(approval.current_step as string) || 1;

    const currentStep = approval.approval_workflows.steps.find(s => s.step_no === stepNo);
    if (!currentStep || !currentStep.approvers || currentStep.approvers.length === 0) {
      return '无';
    }

    const approvalTypeMap: Record<string, string> = {
      any: '任一人',
      all: '所有人',
      sequential: '依次审批'
    };

    return `${currentStep.step_name}（${approvalTypeMap[currentStep.approval_type] || '审批'}）`;
  };

  const filteredApprovals = approvals.filter(approval =>
    (approval.workflow_name || approval.approval_workflows?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (approval.applicant_name || approval.initiator_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (approval.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索流程名称或申请人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              发起审批
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>发起审批</DialogTitle>
              <DialogDescription>填写审批信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow">审批流程 *</Label>
                <Select value={formData.workflow_id} onValueChange={(value) => setFormData({ ...formData, workflow_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择审批流程" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">请假申请</SelectItem>
                    <SelectItem value="expense">费用报销</SelectItem>
                    <SelectItem value="purchase">采购申请</SelectItem>
                    <SelectItem value="contract">合同审批</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="输入审批标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">审批内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="输入审批详情"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>选择审批人</Label>
                {users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">加载中...</div>
                ) : (
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={selectedApprovers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApprovers([...selectedApprovers, user.id]);
                              } else {
                                setSelectedApprovers(selectedApprovers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded"
                          />
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            {user.name || user.email}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApprovers.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    已选择 {selectedApprovers.length} 人
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">附件</Label>
                <Input id="attachments" type="file" multiple />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreateApproval} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交审批'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 审批统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审批</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">需要处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">审批通过</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">审批拒绝</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">通过率</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.length > 0
                ? Math.round((approvals.filter(a => a.status === 'approved').length / approvals.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">审批通过率</p>
          </CardContent>
        </Card>
      </div>

      {/* 审批列表 */}
      <Card>
        <CardHeader>
          <CardTitle>审批列表</CardTitle>
          <CardDescription>共 {filteredApprovals.length} 条审批记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无审批记录</p>
              <p className="text-sm text-muted-foreground mt-2">点击"发起审批"开始申请</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>流程名称</TableHead>
                    <TableHead>申请人</TableHead>
                    <TableHead>当前节点</TableHead>
                    <TableHead>审批人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                          <div>
                            <div className="font-medium">{approval.workflow_name || approval.title || approval.approval_workflows?.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {approval.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">{approval.applicant_name || approval.initiator_name || '未知'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{approval.current_step}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{getCurrentApprovers(approval)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(approval.status)}</TableCell>
                      <TableCell>
                        {(approval.created_at || approval.started_at) && format(
                          new Date(approval.created_at || approval.started_at!), 
                          'yyyy-MM-dd HH:mm', 
                          { locale: zhCN }
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreviewDialog(approval)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {approval.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => openApprovalAction(approval.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openApprovalAction(approval.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审批操作对话框 */}
      <Dialog open={isApprovalActionOpen} onOpenChange={setIsApprovalActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批操作</DialogTitle>
            <DialogDescription>请确认您的审批决定</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">审批意见</Label>
              <Textarea
                id="comment"
                placeholder="请输入审批意见（可选）"
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalActionOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => handleApprovalAction('reject')}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  拒绝
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApprovalAction('approve')}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  通过
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批预览对话框 */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审批详情</DialogTitle>
            <DialogDescription>查看审批申请的详细信息</DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">审批编号</Label>
                  <p className="font-medium">{selectedApproval.instance_code || selectedApproval.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">流程名称</Label>
                  <p className="font-medium">{selectedApproval.workflow_name || selectedApproval.approval_workflows?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">标题</Label>
                  <p className="font-medium">{selectedApproval.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请人</Label>
                  <p className="font-medium">{selectedApproval.applicant_name || selectedApproval.initiator_name || '未知'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">当前步骤</Label>
                  <p className="font-medium">{selectedApproval.current_step}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  {getStatusBadge(selectedApproval.status)}
                </div>
                <div>
                  <Label className="text-muted-foreground">申请时间</Label>
                  <p className="font-medium">
                    {(selectedApproval.created_at || selectedApproval.started_at) && format(
                      new Date(selectedApproval.created_at || selectedApproval.started_at!),
                      'yyyy-MM-dd HH:mm',
                      { locale: zhCN }
                    )}
                  </p>
                </div>
                {selectedApproval.completed_at && (
                  <div>
                    <Label className="text-muted-foreground">完成时间</Label>
                    <p className="font-medium">
                      {format(new Date(selectedApproval.completed_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                )}
              </div>
              {selectedApproval.form_data && (
                <div>
                  <Label className="text-muted-foreground">申请内容</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{typeof selectedApproval.form_data === 'string' ? selectedApproval.form_data : JSON.stringify(selectedApproval.form_data, null, 2)}</p>
                </div>
              )}
              {selectedApproval.comments && selectedApproval.comments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">审批记录</Label>
                  <div className="space-y-2 mt-1">
                    {selectedApproval.comments.map((comment, index) => (
                      <div key={index} className="text-sm p-2 bg-muted/30 rounded">
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>{comment.approver_name}</span>
                          <span>{new Date(comment.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                        <div className="font-medium mt-1">
                          {comment.action === 'approve' ? '通过' : comment.action === 'reject' ? '拒绝' : '待处理'}
                        </div>
                        {comment.comment && <div className="text-xs mt-1">{comment.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">当前节点审批人</Label>
                <p className="text-sm mt-1">{getCurrentApprovers(selectedApproval)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
