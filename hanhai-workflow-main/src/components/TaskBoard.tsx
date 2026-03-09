'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskDetailDialog } from '@/components/TaskDetailDialog';
import { MoreVertical, Clock, User, Calendar, Image as ImageIcon } from 'lucide-react';

interface Task {
  id: string;
  task_name: string;
  role: string;
  status: string;
  progress: number;
  estimated_completion_date: string | null;
  assigned_to?: string | null;
  project_id: string;
  description?: string;
  image_url?: string;
  image_url_2?: string;
  image_url_3?: string;
}

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, newStatus: string) => void;
  onTaskSave?: (taskId: string, updates: any) => Promise<void>;
}

interface Column {
  id: string;
  title: string;
  status: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: '待处理', status: 'pending', color: 'bg-slate-500' },
  { id: 'in_progress', title: '进行中', status: 'in_progress', color: 'bg-blue-500' },
  { id: 'completed', title: '已完成', status: 'completed', color: 'bg-green-500' },
  { id: 'delayed', title: '已延期', status: 'delayed', color: 'bg-red-500' },
];

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    illustration: '插画',
    product_design: '产品',
    detail_design: '详情',
    copywriting: '文案',
    procurement: '采购',
    packaging_design: '包装',
    finance: '财务',
    customer_service: '客服',
    warehouse: '仓储',
    operations: '运营',
  };
  return roleMap[role] || role;
};

export function TaskBoard({ tasks, onTaskUpdate, onTaskSave }: TaskBoardProps) {
  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>(() => {
    const initial: Record<string, Task[]> = {};
    columns.forEach(col => {
      initial[col.id] = tasks.filter(task => task.status === col.status);
    });
    return initial;
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || source.droppableId === destination.droppableId) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    // 移动任务
    const newTasksByColumn = { ...tasksByColumn };
    const [movedTask] = newTasksByColumn[sourceColumn].splice(source.index, 1);

    if (movedTask) {
      // 更新任务状态
      const destColumnObj = columns.find(c => c.id === destColumn);
      if (destColumnObj) {
        movedTask.status = destColumnObj.status as any;
        newTasksByColumn[destColumn].splice(destination.index, 0, movedTask);

        // 调用父组件更新
        onTaskUpdate(draggableId, destColumnObj.status);
      }
    }

    setTasksByColumn(newTasksByColumn);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无截止日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getDaysUntilDeadline = (dateString: string | null) => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = tasksByColumn[column.id] || [];
          const taskCount = columnTasks.length;

          return (
            <Card key={column.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {taskCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg p-2' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const daysUntilDeadline = getDaysUntilDeadline(task.estimated_completion_date);
                        const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-card border rounded-lg cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                }`}
                              >
                                <div className="space-y-2 p-3">
                                  {/* 任务标题和图片预览 */}
                                  <div className="flex gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium line-clamp-2">
                                        {task.task_name}
                                      </p>
                                    </div>
                                    
                                    {/* 图片预览缩略图 */}
                                    {(task.image_url || task.image_url_2 || task.image_url_3) && (
                                      <div className="flex-shrink-0">
                                        <div className="relative w-12 h-12 rounded overflow-hidden border">
                                          <img
                                            src={task.image_url || task.image_url_2 || task.image_url_3}
                                            alt="预览"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center cursor-pointer transition-colors"
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 setSelectedTask(task);
                                                 setDetailDialogOpen(true);
                                               }}>
                                            <ImageIcon className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 岗位标签 */}
                                  <Badge variant="outline" className="text-xs">
                                    {getRoleName(task.role)}
                                  </Badge>

                                  {/* 进度条 */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>进度</span>
                                      <span>{task.progress}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-1.5" />
                                  </div>

                                  {/* 截止日期 */}
                                  {task.estimated_completion_date && (
                                    <div className={`flex items-center gap-1 text-xs ${
                                      isOverdue ? 'text-red-600' : 'text-muted-foreground'
                                    }`}>
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {formatDate(task.estimated_completion_date)}
                                        {isOverdue && ' (已逾期)'}
                                      </span>
                                    </div>
                                  )}

                                  {/* 操作按钮 */}
                                  <div className="flex justify-end pt-1">
                                    <button
                                      className="p-1 hover:bg-muted rounded"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTask(task);
                                        setDetailDialogOpen(true);
                                      }}
                                    >
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 任务详情对话框 */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onSave={onTaskSave || (() => Promise.resolve())}
        />
      )}
    </DragDropContext>
  );
}
