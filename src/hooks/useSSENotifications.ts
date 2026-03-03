import { useEffect, useState, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface SSEMessage {
  type: 'connected' | 'notification' | 'initial' | 'error';
  message?: string;
  data?: Notification | Notification[];
  unreadCount?: number;
}

export function useSSENotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!userId) {
      setError('用户ID为空');
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/sse/notifications?userId=${userId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (isMountedRef.current) {
        setIsConnected(true);
        setError(null);
        console.log('SSE连接成功');
      }
    };

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return;

      try {
        const message: SSEMessage = JSON.parse(event.data);
        console.log('收到SSE消息:', message);

        switch (message.type) {
          case 'connected':
            console.log(message.message);
            break;

          case 'notification':
            if (message.data) {
              const newNotification = message.data as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // 显示浏览器通知（如果权限允许）
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.content,
                  icon: '/icon-192.png',
                });
              }
            }
            break;

          case 'initial':
            if (message.data) {
              const initialNotifications = Array.isArray(message.data) ? message.data : [message.data];
              setNotifications(initialNotifications);
              setUnreadCount(message.unreadCount || initialNotifications.filter(n => !n.isRead).length);
            }
            break;

          case 'error':
            if (message.message) {
              setError(message.message);
            }
            break;
        }
      } catch (err) {
        console.error('解析SSE消息失败:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE错误:', err);
      if (isMountedRef.current) {
        setIsConnected(false);
        setError('连接中断，正在重连...');
        
        // 3秒后自动重连
        setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 3000);
      }
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (isMountedRef.current) {
      setIsConnected(false);
    }
  }, []);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log('通知权限:', permission);
      });
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (userId) {
      connect();
      requestNotificationPermission();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [userId, connect, disconnect, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
