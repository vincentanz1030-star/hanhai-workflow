// AI助手配置类型
export interface AIAssistantConfig {
  botId?: string;
  botToken?: string;
  enabled: boolean;
  autoSuggestionEnabled: boolean;
  warningEnabled: boolean;
  reminderEnabled: boolean;
  // 预警配置
  warningDaysBefore: number; // 提前多少天预警
  reminderDaysBefore: number; // 提前多少天提醒
}

// 项目预警类型
export interface ProjectWarning {
  type: 'task_overdue' | 'project_delayed' | 'resource_conflict' | 'milestone_missed';
  severity: 'info' | 'warning' | 'error' | 'critical';
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  message: string;
  suggestion?: string;
  createdAt: string;
  dismissed: boolean;
}

// AI建议类型
export interface AISuggestion {
  type: 'optimization' | 'resource' | 'timing' | 'risk';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  projectName: string;
  message: string;
  actionable: boolean;
  actionLabel?: string;
  actionData?: any;
  createdAt: string;
  viewed: boolean;
}

// 聊天消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
  };
  timestamp: string;
}

// AI分析结果
export interface AIAnalysisResult {
  overallStatus: 'healthy' | 'attention' | 'critical';
  warnings: ProjectWarning[];
  suggestions: AISuggestion[];
  insights: string[];
  nextSteps: string[];
}
