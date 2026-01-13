import { PlatformLabels, TerminalLabels, TaskStatusLabels, OrderStatusLabels } from './taskSpec';

export const formatPlatform = (type: number): string => PlatformLabels[type] || '未知';
export const formatTerminal = (type: number): string => TerminalLabels[type] || '未知';
export const formatTaskStatus = (status: number): string => TaskStatusLabels[status] || '未知';
export const formatOrderStatus = (status: string): string => OrderStatusLabels[status] || status;

export const formatMoney = (amount: number | string): string => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(val) ? '0.00' : val.toFixed(2);
};

export const formatDateTime = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
};
