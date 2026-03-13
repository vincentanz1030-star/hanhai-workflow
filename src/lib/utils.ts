import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 安全日志：仅在开发环境输出
 */
export function secureLog(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * 安全错误日志：始终输出，但不输出敏感数据
 */
export function secureError(message: string, error?: any) {
  if (error) {
    console.error(message, error.message || error);
  } else {
    console.error(message);
  }
}

/**
 * 将蛇形命名转换为驼峰命名
 * @param obj 要转换的对象
 * @returns 转换后的对象
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as T;
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 移除所有下划线，并将下划线后的字母大写
      const camelKey = key.split('_').reduce((result, word, index) => {
        if (index === 0) {
          return word;
        }
        return result + word.charAt(0).toUpperCase() + word.slice(1);
      }, '');
      newObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return newObj as T;
}
