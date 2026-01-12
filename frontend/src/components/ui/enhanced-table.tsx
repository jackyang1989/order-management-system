'use client';

import { useState, useEffect, useRef, ReactNode, useCallback, useMemo, Fragment } from 'react';
import { cn } from '../../lib/utils';

// ===== Types =====
export interface ColumnConfig {
    key: string;
    visible: boolean;
    width: number;
    order: number;
}

export interface EnhancedColumn<T> {
    key: string;
    title: ReactNode;
    render?: (row: T, index: number) => ReactNode;
    defaultWidth?: number;
    minWidth?: number;
    sortable?: boolean;
    headerClassName?: string;
    cellClassName?: string;
}

export interface EnhancedTableProps<T> {
    columns: EnhancedColumn<T>[];
    data: T[];
    loading?: boolean;
    emptyText?: string;
    rowKey?: (row: T) => string | number;
    className?: string;
    // 列配置
    columnConfig?: ColumnConfig[];
    onColumnConfigChange?: (config: ColumnConfig[]) => void;
    // 排序
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (field: string, order: 'asc' | 'desc') => void;
    // 选择
    selectable?: boolean;
    selectedKeys?: Array<string | number>;
    onRowSelect?: (selectedKeys: Array<string | number>) => void;
    getRowDisabled?: (row: T) => boolean;
    // 列设置按钮
    onColumnSettingsClick?: () => void;
}

// ===== 列分隔线拖拽组件 =====
function ColumnResizer({
    onResize,
}: {
    onResize: (delta: number) => void;
}) {
    const startXRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        startXRef.current = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startXRef.current;
            if (delta !== 0) {
                onResize(delta);
                startXRef.current = moveEvent.clientX;
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className="absolute right-0 top-0 z-10 h-full w-[5px] cursor-col-resize select-none"
            onMouseDown={handleMouseDown}
        >
            {/* 短灰色竖线指示器 */}
            <div className="absolute right-[2px] top-1/2 h-4 w-px -translate-y-1/2 bg-[#d1d5db] hover:bg-primary-400" />
        </div>
    );
}

// ===== 排序图标 =====
function SortIcon({ direction }: { direction?: 'asc' | 'desc' }) {
    return (
        <span className="ml-1 inline-flex flex-col text-[10px] leading-none">
            <span className={cn('transition-colors', direction === 'asc' ? 'text-primary-500' : 'text-[#9ca3af]')}>▲</span>
            <span className={cn('-mt-0.5 transition-colors', direction === 'desc' ? 'text-primary-500' : 'text-[#9ca3af]')}>▼</span>
        </span>
    );
}

// ===== 主表格组件 =====
export function EnhancedTable<T extends object>({
    columns,
    data,
    loading,
    emptyText = '暂无数据',
    rowKey,
    className,
    columnConfig,
    onColumnConfigChange,
    sortField,
    sortOrder,
    onSort,
    selectable,
    selectedKeys = [],
    onRowSelect,
    getRowDisabled,
    onColumnSettingsClick,
}: EnhancedTableProps<T>) {
    // 本地列宽状态
    const [localWidths, setLocalWidths] = useState<Record<string, number>>({});

    // 初始化列宽
    useEffect(() => {
        const widths: Record<string, number> = {};
        columns.forEach((col) => {
            const config = columnConfig?.find((c) => c.key === col.key);
            widths[col.key] = config?.width || col.defaultWidth || 120;
        });
        setLocalWidths(widths);
    }, [columns, columnConfig]);

    // 待同步到父组件的列宽变化
    const [pendingResize, setPendingResize] = useState<{ colKey: string; newWidth: number } | null>(null);

    // 处理列宽变化
    const handleResize = useCallback((colKey: string, delta: number) => {
        setLocalWidths((prev) => {
            const col = columns.find((c) => c.key === colKey);
            const minWidth = col?.minWidth || 60;
            const newWidth = Math.max(minWidth, (prev[colKey] || 120) + delta);
            // 标记需要同步到父组件
            setPendingResize({ colKey, newWidth });
            return { ...prev, [colKey]: newWidth };
        });
    }, [columns]);

    // 在状态更新后通知父组件
    useEffect(() => {
        if (pendingResize && onColumnConfigChange && columnConfig) {
            const newConfig = columnConfig.map((c) =>
                c.key === pendingResize.colKey ? { ...c, width: pendingResize.newWidth } : c
            );
            onColumnConfigChange(newConfig);
            setPendingResize(null);
        }
    }, [pendingResize, onColumnConfigChange, columnConfig]);

    // 处理排序点击
    const handleSortClick = (colKey: string) => {
        if (!onSort) return;
        const col = columns.find((c) => c.key === colKey);
        if (!col?.sortable) return;

        let newOrder: 'asc' | 'desc' = 'asc';
        if (sortField === colKey && sortOrder === 'asc') {
            newOrder = 'desc';
        }
        onSort(colKey, newOrder);
    };

    // 获取可见且排序后的列
    const visibleColumns = useMemo(() => {
        if (!columnConfig) return columns;
        return columnConfig
            .filter((c) => c.visible)
            .sort((a, b) => a.order - b.order)
            .map((c) => columns.find((col) => col.key === c.key))
            .filter(Boolean) as EnhancedColumn<T>[];
    }, [columns, columnConfig]);

    const getKey = (row: T, idx: number) => (rowKey ? rowKey(row) : idx);
    const selectedSet = new Set(selectedKeys);

    if (loading) {
        return (
            <div className={cn('flex items-center justify-center py-12 text-[#7c889a]', className)}>
                <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
                加载中...
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div className={cn('py-12 text-center text-[#7c889a]', className)}>{emptyText}</div>
        );
    }

    return (
        <div className={cn('overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]', className)}>
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full border-collapse text-[14px]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        {selectable && <col style={{ width: 40 }} />}
                        {visibleColumns.map((col) => (
                            <col
                                key={col.key}
                                style={{ width: localWidths[col.key] || col.defaultWidth || 120 }}
                            />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="bg-slate-50/80">
                            {selectable && (
                                <th className="px-3 py-4 align-middle text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <span className="sr-only">选择</span>
                                </th>
                            )}
                            {visibleColumns.map((col, idx) => {
                                const isLast = idx === visibleColumns.length - 1;
                                return (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            'relative px-4 py-4 align-middle text-left text-[11px] font-bold uppercase tracking-wider text-slate-400',
                                            col.sortable && 'cursor-pointer select-none hover:text-slate-600',
                                            col.headerClassName
                                        )}
                                        onClick={() => handleSortClick(col.key)}
                                    >
                                        <div className={cn('flex items-center justify-between', col.headerClassName?.includes('text-right') && 'justify-end')}>
                                            <div className="flex items-center gap-1">
                                                <span className="truncate">{col.title}</span>
                                                {col.sortable && (
                                                    <SortIcon
                                                        direction={sortField === col.key ? sortOrder : undefined}
                                                    />
                                                )}
                                            </div>
                                            {isLast && onColumnSettingsClick && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onColumnSettingsClick();
                                                    }}
                                                    className="ml-2 whitespace-nowrap text-[12px] text-primary-500 hover:text-primary-600"
                                                >
                                                    <span className="relative -top-[1px] inline-block mr-0.5">☰</span>
                                                </button>
                                            )}
                                        </div>
                                        {/* 可调宽度的分隔线 - 最后一列不显示 */}
                                        {idx < visibleColumns.length - 1 && (
                                            <ColumnResizer onResize={(delta) => handleResize(col.key, delta)} />
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => {
                            const key = getKey(row, idx);
                            const disabled = getRowDisabled?.(row) ?? false;
                            const checked = selectedSet.has(key);
                            return (
                                <tr
                                    key={key}
                                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50"
                                >
                                    {selectable && (
                                        <td className="px-3 py-3 align-middle">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-[#e5e7eb] text-primary-500 focus:ring-primary-500/20"
                                                disabled={disabled}
                                                checked={checked}
                                                onChange={(event) => {
                                                    if (!onRowSelect) return;
                                                    const next = new Set(selectedSet);
                                                    if (event.target.checked) {
                                                        next.add(key);
                                                    } else {
                                                        next.delete(key);
                                                    }
                                                    onRowSelect(Array.from(next));
                                                }}
                                            />
                                        </td>
                                    )}
                                    {visibleColumns.map((col, idx) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                "px-4 py-3 align-middle text-[#3b4559]",
                                                col.key !== 'actions' && 'overflow-hidden',
                                                col.cellClassName
                                            )}
                                        >
                                            <div className={cn(col.key !== 'actions' && 'break-words overflow-hidden')}>
                                                {col.render
                                                    ? col.render(row, idx)
                                                    : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EnhancedTable;
