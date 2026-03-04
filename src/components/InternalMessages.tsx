/**
 * 企业协同平台 - 内部沟通组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, MessageCircle, Send, MoreVertical, Clock, Check, CheckCheck, Loader2, Users, FolderOpen, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  group_id: string;
  is_read: boolean;
  created_at: string;
}

interface MessageGroup {
  id: string;
  name: string;
  description: string;
  type: string;
  member_count: number;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function InternalMessages() {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MessageGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // 消息缓存
  const [messageCache, setMessageCache] = useState<Map<string, Message[]>>(new Map());

  // 新建群组表单状态
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    type: 'general',
  });

  // 编辑群组表单状态
  const [editGroupData, setEditGroupData] = useState({
    id: '',
    name: '',
    description: '',
    type: 'general',
  });

  // 岗位列表和选中状态
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    loadGroups();
    loadRoles();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collaboration/message-groups?page=1&limit=50');
      const data = await response.json();

      if (data.success) {
        setGroups(data.data);
        if (data.data.length > 0 && !selectedGroup) {
          setSelectedGroup(data.data[0]);
          loadMessages(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('加载消息群组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/users/roles');
      const data = await response.json();

      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('加载岗位失败:', error);
    }
  };

  const loadMessages = async (groupId: string, forceReload = false) => {
    try {
      // 如果缓存中有数据且不是强制刷新，直接使用缓存
      if (!forceReload && messageCache.has(groupId)) {
        setMessages(messageCache.get(groupId)!);
        return;
      }

      const response = await fetch(`/api/collaboration/messages?group_id=${groupId}&page=1&limit=100`);
      const data = await response.json();

      if (data.success) {
        const messages = data.data || [];
        setMessages(messages);
        // 更新缓存
        setMessageCache(prev => {
          const newCache = new Map(prev);
          newCache.set(groupId, messages);
          return newCache;
        });
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupFormData.name) {
      alert('请填写必填项：群组名称');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      const response = await fetch('/api/collaboration/message-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...groupFormData,
          members: selectedRoles,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('群组创建成功！');
        setIsCreateGroupDialogOpen(false);
        setGroupFormData({
          name: '',
          description: '',
          type: 'general',
        });
        setSelectedRoles([]);
        loadGroups(); // 刷新群组列表
      } else {
        alert(`创建失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建群组失败:', error);
      alert('创建失败，请稍后重试');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleEditGroup = (group: MessageGroup) => {
    setEditGroupData({
      id: group.id,
      name: group.name,
      description: group.description || '',
      type: group.type,
    });
    setIsEditGroupDialogOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editGroupData.name) {
      alert('请填写必填项：群组名称');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      const response = await fetch(`/api/collaboration/message-groups/${editGroupData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editGroupData.name,
          description: editGroupData.description,
          type: editGroupData.type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('群组更新成功！');
        setIsEditGroupDialogOpen(false);
        loadGroups(); // 刷新群组列表
      } else {
        alert(`更新失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新群组失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // 播放提醒声音
  const playNotificationSound = () => {
    if (!notificationEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('播放通知声音失败:', error);
    }
  };

  // 标记消息为已读
  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/collaboration/messages/${messageId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  // 切换消息提醒
  const toggleNotification = () => {
    setNotificationEnabled(!notificationEnabled);
    if (notificationEnabled) {
      alert('消息提醒已关闭');
    } else {
      alert('消息提醒已开启');
    }
  };

  // 删除群组
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`确定要删除群组"${groupName}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/collaboration/message-groups/${groupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('群组删除成功！');

        // 如果删除的是当前选中的群组，切换到第一个群组或清空选中
        if (selectedGroup?.id === groupId) {
          const remainingGroups = groups.filter(g => g.id !== groupId);
          if (remainingGroups.length > 0) {
            setSelectedGroup(remainingGroups[0]);
            loadMessages(remainingGroups[0].id);
          } else {
            setSelectedGroup(null);
            setMessages([]);
          }
        }

        loadGroups(); // 刷新群组列表
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除群组失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedGroup) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageInput,
      sender_id: 'current-user',
      sender_name: '当前用户',
      sender_avatar: '',
      group_id: selectedGroup.id,
      is_read: true,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessageInput('');

    // 更新缓存
    setMessageCache(prev => {
      const newCache = new Map(prev);
      newCache.set(selectedGroup!.id, updatedMessages);
      return newCache;
    });

    // 模拟其他人接收到消息（实际应该通过WebSocket）
    setTimeout(() => {
      const replyMessage: Message = {
        id: `msg-${Date.now()}`,
        content: '收到消息',
        sender_id: 'other-user',
        sender_name: '其他用户',
        sender_avatar: '',
        group_id: selectedGroup.id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, replyMessage];
        // 更新缓存
        setMessageCache(cache => {
          const newCache = new Map(cache);
          newCache.set(selectedGroup!.id, updated);
          return newCache;
        });
        return updated;
      });
      playNotificationSound();

      // 更新群组的最后消息和未读计数
      setGroups(prev => prev.map(g => {
        if (g.id === selectedGroup.id) {
          return {
            ...g,
            last_message: replyMessage.content,
            last_message_time: replyMessage.created_at,
            unread_count: g.unread_count + 1,
          };
        }
        return g;
      }));
    }, 1000);
  };

  const handleGroupSelect = (group: MessageGroup) => {
    setSelectedGroup(group);
    loadMessages(group.id);

    // 清除该群组的未读计数
    if (group.unread_count > 0) {
      setGroups(prev => prev.map(g => {
        if (g.id === group.id) {
          return { ...g, unread_count: 0 };
        }
        return g;
      }));

      // 标记该群组的所有消息为已读
      messages.forEach(msg => {
        if (!msg.is_read && msg.group_id === group.id) {
          markAsRead(msg.id);
        }
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      project: '项目讨论',
      department: '部门沟通',
      task: '任务讨论',
      general: '综合讨论',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* 群组列表 */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>内部沟通</CardTitle>
              <CardDescription>群组: {groups.length}</CardDescription>
            </div>
            <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新建群组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建群组</DialogTitle>
                  <DialogDescription>填写群组信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">群组名称 *</Label>
                    <Input
                      id="groupName"
                      placeholder="输入群组名称"
                      value={groupFormData.name}
                      onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupType">类型</Label>
                    <Select value={groupFormData.type} onValueChange={(value) => setGroupFormData({ ...groupFormData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">项目讨论</SelectItem>
                        <SelectItem value="department">部门沟通</SelectItem>
                        <SelectItem value="task">任务讨论</SelectItem>
                        <SelectItem value="general">综合讨论</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      placeholder="输入群组描述"
                      rows={3}
                      value={groupFormData.description}
                      onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>选择岗位</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      {roles.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-2">无可用岗位</div>
                      ) : (
                        <div className="space-y-2">
                          {roles.map((role) => (
                            <div key={role} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${role}`}
                                checked={selectedRoles.includes(role)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRoles([...selectedRoles, role]);
                                  } else {
                                    setSelectedRoles(selectedRoles.filter(r => r !== role));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`role-${role}`}
                                className="flex-1 cursor-pointer text-sm font-normal"
                              >
                                {role}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedRoles.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        已选择: {selectedRoles.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateGroupDialogOpen(false)}>取消</Button>
                  <Button onClick={handleCreateGroup} disabled={isSubmittingGroup}>
                    {isSubmittingGroup ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      '创建群组'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 编辑群组对话框 */}
            <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑群组</DialogTitle>
                  <DialogDescription>修改群组信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editGroupName">群组名称 *</Label>
                    <Input
                      id="editGroupName"
                      placeholder="输入群组名称"
                      value={editGroupData.name}
                      onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGroupType">类型</Label>
                    <Select value={editGroupData.type} onValueChange={(value) => setEditGroupData({ ...editGroupData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">项目讨论</SelectItem>
                        <SelectItem value="department">部门沟通</SelectItem>
                        <SelectItem value="task">任务讨论</SelectItem>
                        <SelectItem value="general">综合讨论</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">描述</Label>
                    <Textarea
                      id="editDescription"
                      placeholder="输入群组描述"
                      rows={3}
                      value={editGroupData.description}
                      onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>取消</Button>
                  <Button onClick={handleUpdateGroup} disabled={isSubmittingGroup}>
                    {isSubmittingGroup ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        更新中...
                      </>
                    ) : (
                      '更新群组'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex gap-4">
          {/* 左侧群组列表 */}
          <div className="w-1/3 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索群组..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无群组</p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{group.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getGroupTypeLabel(group.type)}
                          </Badge>
                          {group.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {group.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {group.last_message || '暂无消息'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          title="编辑群组"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id, group.name);
                          }}
                          title="删除群组"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {group.last_message_time && format(new Date(group.last_message_time), 'HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右侧聊天区域 */}
          <div className="flex-1 flex flex-col gap-2">
            {selectedGroup ? (
              <>
                {/* 聊天头部 */}
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedGroup.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedGroup.member_count} 成员
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleNotification}
                        title={notificationEnabled ? '关闭消息提醒' : '开启消息提醒'}
                      >
                        {notificationEnabled ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无消息</p>
                      <p className="text-sm mt-2">开始第一条消息吧</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.sender_id === 'current-user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.sender_name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[70%] space-y-1 ${
                            message.sender_id === 'current-user'
                              ? 'items-end'
                              : 'items-start'
                          } flex flex-col`}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{message.sender_name}</span>
                            <span>·</span>
                            <span>
                              {message.created_at &&
                                format(new Date(message.created_at), 'HH:mm', {
                                  locale: zhCN,
                                })}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-lg text-sm ${
                              message.sender_id === 'current-user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 消息输入 */}
                <div className="border-t pt-2 flex gap-2">
                  <Input
                    placeholder="输入消息..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>选择一个群组开始聊天</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
