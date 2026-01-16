/**
 * 前端类型定义统一导出
 *
 * 使用方式:
 * import { BankCard, Withdrawal, VipPackage } from '@/types';
 * 或
 * import { BankCard } from '@/types/bank-card';
 */

// 银行卡相关
export * from './bank-card';

// 提现相关
export * from './withdrawal';

// VIP相关
export * from './vip';

// 评价任务相关
export * from './review-task';

// 订单相关
export * from './order';

// 任务相关
export * from './task';

// 通用类型

/**
 * API响应基础结构
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    limit?: number;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * 通用统计数据结构
 */
export interface Stats {
    total: number;
    pending: number;
    completed: number;
    [key: string]: number;
}

/**
 * 商家基础信息
 */
export interface Merchant {
    id: string;
    username: string;
    phone: string;
    balance: number;
    frozenBalance: number;
    silver: number;
    vip: boolean;
    vipExpireAt?: string;
    status: number;
    createdAt: string;
}

/**
 * 用户基础信息
 */
export interface User {
    id: string;
    username: string;
    phone: string;
    balance: number;
    frozenBalance: number;
    silver: number;
    vip: boolean;
    vipExpireAt?: string;
    isActive: boolean;
    createdAt: string;
}
