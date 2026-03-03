'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, MessageCircle, X, Send, AlertTriangle, Lightbulb, CheckCircle, Clock } from 'lucide-react';
import { ChatMessage } from '@/lib/ai/types';
import { chatWithAI } from '@/lib/ai/coze-service';

interface AIAssistantProps {
  context?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
  };
}

export function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'system',
          content: '你好！我是禾哲OpenClaw，瀚海集团的AI助理。我可以帮助你：\n\n• 分析项目状态，识别风险\n• 提供优化建议\n• 回答工作流程相关问题\n• 协助任务管理',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      context,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAI(input, context);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        context,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
        context,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 如果没有打开，显示悬浮按钮
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          size="icon"
        >
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount}
            </Badge>
          )}
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // 打开状态，显示聊天窗口
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-base">禾哲OpenClaw</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] flex flex-col">
            {/* 消息列表 */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.role === 'system'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">AI助理</span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="text-[10px] opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-xs text-slate-500">正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 输入框 */}
            <div className="border-t p-4">
              {context?.projectName && (
                <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  当前上下文：{context.projectName}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
