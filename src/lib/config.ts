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

// 角色配置
export const ROLE_CONFIG = {
  admin: { name: '管理员', key: 'admin' },
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
