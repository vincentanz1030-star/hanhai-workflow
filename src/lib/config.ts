// 品牌配置
export const BRAND_CONFIG = {
  all: { name: '全部品牌', key: 'all' },
  he_zhe: { name: '禾哲', key: 'he_zhe' },
  baobao: { name: 'BAOBAO', key: 'baobao' },
  ai_he: { name: '爱禾', key: 'ai_he' },
  bao_deng_yuan: { name: '宝登源', key: 'bao_deng_yuan' },
} as const;

export type BrandKey = keyof typeof BRAND_CONFIG;

// 获取品牌名称
export const getBrandName = (key: string): string => {
  return BRAND_CONFIG[key as BrandKey]?.name || key;
};

// 获取所有品牌列表
export const getAllBrands = () => {
  return Object.values(BRAND_CONFIG);
};

// 岗位配置（任务岗位）
export const POSITION_CONFIG = {
  super_admin: { name: '超级管理员', key: 'super_admin', order: -1 },
  admin: { name: '管理员', key: 'admin', order: 0 },
  manager: { name: '经理', key: 'manager', order: 0.5 },
  member: { name: '成员', key: 'member', order: 0.6 },
  user: { name: '普通用户', key: 'user', order: 0.7 },
  project_manager: { name: '项目经理', key: 'project_manager', order: 1 },
  illustration: { name: '插画', key: 'illustration', order: 2 },
  product_design: { name: '产品设计', key: 'product_design', order: 3 },
  detail_design: { name: '详情设计', key: 'detail_design', order: 4 },
  copywriting: { name: '文案撰写', key: 'copywriting', order: 5 },
  procurement: { name: '采购管理', key: 'procurement', order: 6 },
  packaging_design: { name: '包装设计', key: 'packaging_design', order: 7 },
  finance: { name: '财务管理', key: 'finance', order: 8 },
  customer_service: { name: '客服培训', key: 'customer_service', order: 9 },
  warehouse: { name: '仓储管理', key: 'warehouse', order: 10 },
  operations: { name: '运营管理', key: 'operations', order: 11 },
} as const;

export type PositionKey = keyof typeof POSITION_CONFIG;

// 获取岗位名称
export const getPositionName = (key: string): string => {
  return POSITION_CONFIG[key as PositionKey]?.name || key;
};

// 获取所有岗位列表
export const getAllPositions = () => {
  return Object.values(POSITION_CONFIG);
};

// 角色配置
export const ROLE_CONFIG = {
  super_admin: { name: '超级管理员', key: 'super_admin' },
  admin: { name: '管理员', key: 'admin' },
  manager: { name: '经理', key: 'manager' },
  member: { name: '成员', key: 'member' },
  user: { name: '普通用户', key: 'user' },
  project_manager: { name: '项目经理', key: 'project_manager' },
  operations: { name: '运营', key: 'operations' },
  product: { name: '产品', key: 'product' },
  copywriting: { name: '文案', key: 'copywriting' },
  illustration: { name: '插画', key: 'illustration' },
  detail: { name: '详情', key: 'detail' },
  purchasing: { name: '采购', key: 'purchasing' },
  packaging: { name: '包装', key: 'packaging' },
  finance: { name: '财务', key: 'finance' },
  customer_service: { name: '客服', key: 'customer_service' },
  warehouse: { name: '仓储', key: 'warehouse' },
} as const;

export type RoleKey = keyof typeof ROLE_CONFIG;

// 获取角色名称
export const getRoleName = (key: string): string => {
  return ROLE_CONFIG[key as RoleKey]?.name || key;
};

// 获取所有角色列表
export const getAllRoles = () => {
  return Object.values(ROLE_CONFIG);
};

// 用户状态配置
export const USER_STATUS_CONFIG = {
  pending: { label: '待审核', color: 'bg-yellow-500' },
  active: { label: '已激活', color: 'bg-green-500' },
  rejected: { label: '已拒绝', color: 'bg-red-500' },
  suspended: { label: '已暂停', color: 'bg-orange-500' },
} as const;

export type UserStatus = keyof typeof USER_STATUS_CONFIG;

// 任务状态配置
export const TASK_STATUS_CONFIG = {
  pending: { label: '待开始', color: 'bg-slate-500' },
  in_progress: { label: '进行中', color: 'bg-blue-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  delayed: { label: '已延期', color: 'bg-red-500' },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS_CONFIG;
