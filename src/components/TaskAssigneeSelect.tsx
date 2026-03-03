'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface TaskAssignee {
  id: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  role?: string;
  brand?: string;
}

interface TaskAssigneeSelectProps {
  value?: string;
  onChange?: (userId: string) => void;
  brand?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TaskAssigneeSelect({
  value,
  onChange,
  brand,
  disabled = false,
  placeholder = '选择分配人',
}: TaskAssigneeSelectProps) {
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignees();
  }, [brand]);

  const loadAssignees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (brand && brand !== 'all') {
        params.append('brand', brand);
      }

      const response = await fetch(`/api/user-list?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAssignees(data.users || []);
      }
    } catch (error) {
      console.error('加载分配人列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssignee = assignees.find(a => a.id === value);

  return (
    <Select value={value || 'unassigned'} onValueChange={(v) => onChange?.(v === 'unassigned' ? '' : v)} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        {selectedAssignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {selectedAssignee.avatar ? (
                <AvatarImage src={selectedAssignee.avatar} />
              ) : (
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm">{selectedAssignee.displayName}</span>
          </div>
        ) : (
          <SelectValue placeholder={loading ? '加载中...' : placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">未分配</SelectItem>
        {assignees.map((assignee) => (
          <SelectItem key={assignee.id} value={assignee.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                {assignee.avatar ? (
                  <AvatarImage src={assignee.avatar} />
                ) : (
                  <AvatarFallback className="text-xs">
                    {assignee.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{assignee.displayName}</span>
                <span className="text-xs text-muted-foreground">{assignee.email}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
