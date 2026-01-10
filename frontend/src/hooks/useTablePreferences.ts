'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BASE_URL } from '../../apiConfig';

export interface ColumnConfig {
    key: string;
    visible: boolean;
    width: number;
    order: number;
}

interface UseTablePreferencesOptions {
    tableKey: string;
    defaultColumns: ColumnConfig[];
}

interface UseTablePreferencesReturn {
    columnConfig: ColumnConfig[];
    isLoading: boolean;
    savePreferences: (config: ColumnConfig[]) => Promise<void>;
    resetPreferences: () => Promise<void>;
    updateLocalConfig: (config: ColumnConfig[]) => void;
}

export function useTablePreferences({
    tableKey,
    defaultColumns,
}: UseTablePreferencesOptions): UseTablePreferencesReturn {
    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(defaultColumns);
    const [isLoading, setIsLoading] = useState(true);
    const defaultColumnsRef = useRef(defaultColumns);

    // Keep ref updated
    useEffect(() => {
        defaultColumnsRef.current = defaultColumns;
    }, [defaultColumns]);

    // 加载配置
    useEffect(() => {
        const loadPreferences = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setColumnConfig(defaultColumnsRef.current);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`${BASE_URL}/admin/table-preferences/${tableKey}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.success && json.data?.columns?.length > 0) {
                    setColumnConfig(json.data.columns);
                } else {
                    setColumnConfig(defaultColumnsRef.current);
                }
            } catch (e) {
                console.error('Failed to load table preferences:', e);
                setColumnConfig(defaultColumnsRef.current);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [tableKey]);

    // 保存配置到后端
    const savePreferences = useCallback(async (config: ColumnConfig[]) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`${BASE_URL}/admin/table-preferences/${tableKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ columns: config }),
            });
            setColumnConfig(config);
        } catch (e) {
            console.error('Failed to save table preferences:', e);
        }
    }, [tableKey]);

    // 重置为默认配置
    const resetPreferences = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setColumnConfig(defaultColumnsRef.current);
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/admin/table-preferences/${tableKey}/reset`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success && json.data?.columns) {
                setColumnConfig(json.data.columns);
            } else {
                setColumnConfig(defaultColumnsRef.current);
            }
        } catch (e) {
            console.error('Failed to reset table preferences:', e);
            setColumnConfig(defaultColumnsRef.current);
        }
    }, [tableKey]);

    // 本地更新配置 (用于列宽调整)
    const updateLocalConfig = useCallback((config: ColumnConfig[]) => {
        setColumnConfig(config);
    }, []);

    return {
        columnConfig,
        isLoading,
        savePreferences,
        resetPreferences,
        updateLocalConfig,
    };
}

export default useTablePreferences;
