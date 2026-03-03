// 项目类型定义（从page.tsx中提取，供AI模块使用）

export interface Project {
  id: string;
  name: string;
  brand: 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all';
  category: 'product_development' | 'operations_activity';
  salesDate: string;
  projectConfirmDate: string;
  overallCompletionDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  role: 'illustration' | 'product_design' | 'detail_design' | 'copywriting' | 'procurement' | 'packaging_design' | 'finance' | 'customer_service' | 'warehouse' | 'operations';
  taskName: string;
  taskOrder: number;
  description: string | null;
  progress: number;
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  customProgressLabels: Record<string, string> | null;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  rating: number | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
