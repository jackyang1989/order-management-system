'use client';

import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Modal } from './modal';

export interface ColumnConfig {
    key: string;
    visible: boolean;
    width: number;
    order: number;
}

export interface ColumnMeta {
    key: string;
    title: string;
}

interface ColumnSettingsPanelProps {
    open: boolean;
    onClose: () => void;
    columns: ColumnMeta[];
    config: ColumnConfig[];
    onSave: (config: ColumnConfig[]) => void;
    onReset: () => void;
}

export function ColumnSettingsPanel({
    open,
    onClose,
    columns,
    config,
    onSave,
    onReset,
}: ColumnSettingsPanelProps) {
    const [localConfig, setLocalConfig] = useState<ColumnConfig[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // 初始化本地配置
    useState(() => {
        const sorted = [...config].sort((a, b) => a.order - b.order);
        setLocalConfig(sorted);
    });

    // 同步外部配置变化
    useState(() => {
        setLocalConfig([...config].sort((a, b) => a.order - b.order));
    });

    // 切换可见性
    const toggleVisibility = (key: string) => {
        setLocalConfig((prev) =>
            prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
        );
    };

    // 拖拽排序
    const handleDragStart = (idx: number) => {
        dragItem.current = idx;
    };

    const handleDragEnter = (idx: number) => {
        dragOverItem.current = idx;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        const fromIdx = dragItem.current;
        const toIdx = dragOverItem.current;

        setLocalConfig((prev) => {
            const copy = [...prev];
            const [removed] = copy.splice(fromIdx, 1);
            copy.splice(toIdx, 0, removed);
            // 重新计算 order
            return copy.map((c, i) => ({ ...c, order: i }));
        });

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    const handleReset = () => {
        onReset();
        onClose();
    };

    // 获取列标题
    const getColumnTitle = (key: string) => {
        const col = columns.find((c) => c.key === key);
        return col?.title || key;
    };

    return (
        <Modal title="列表设置" open={open} onClose={onClose} className="max-w-sm">
            <div className="mb-3 text-xs text-[#6b7280]">
                点击箭头或拖拽信息项，即可排列表格显示的先后顺序
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
                {localConfig.map((item, idx) => (
                    <div
                        key={item.key}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragEnter={() => handleDragEnter(idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={cn(
                            'flex items-center gap-2 rounded border border-[#e5e7eb] bg-white px-3 py-2 transition-colors',
                            'cursor-grab hover:border-primary-300 hover:bg-[#f9fafb]',
                            'active:cursor-grabbing'
                        )}
                    >
                        {/* 复选框 */}
                        <input
                            type="checkbox"
                            checked={item.visible}
                            onChange={() => toggleVisibility(item.key)}
                            className="h-4 w-4 rounded border-[#d1d5db] text-primary-500 focus:ring-primary-500/20"
                        />
                        {/* 列名 */}
                        <span className="flex-1 text-sm text-[#374151]">
                            {getColumnTitle(item.key)}
                        </span>
                        {/* 拖拽手柄 */}
                        <div className="flex flex-col gap-0.5 text-[#9ca3af]">
                            <span className="text-[8px] leading-none">≡</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset}>
                    恢复默认
                </Button>
                <Button size="sm" onClick={handleSave}>
                    保存
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    取消
                </Button>
            </div>
        </Modal>
    );
}

export default ColumnSettingsPanel;
