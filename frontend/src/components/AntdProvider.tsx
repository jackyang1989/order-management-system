'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// Ant Design theme configuration
const theme = {
    token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
    },
};

export function AntdProvider({ children }: { children: React.ReactNode }) {
    return (
        <AntdRegistry>
            <ConfigProvider locale={zhCN} theme={theme}>
                {children}
            </ConfigProvider>
        </AntdRegistry>
    );
}
