import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TablePreference, ColumnConfig } from './table-preferences.entity';

// 默认列配置
const DEFAULT_COLUMNS: Record<string, ColumnConfig[]> = {
    admin_users: [
        { key: 'username', visible: true, width: 100, order: 0 },
        { key: 'phone', visible: true, width: 120, order: 1 },
        { key: 'wechat', visible: true, width: 100, order: 2 },
        { key: 'verifyStatus', visible: true, width: 80, order: 3 },
        { key: 'balance', visible: true, width: 120, order: 4 },
        { key: 'frozen', visible: true, width: 90, order: 5 },
        { key: 'vip', visible: true, width: 90, order: 6 },
        { key: 'invitedBy', visible: true, width: 80, order: 7 },
        { key: 'monthlyTaskCount', visible: true, width: 70, order: 8 },
        { key: 'lastLoginAt', visible: true, width: 100, order: 9 },
        { key: 'createdAt', visible: true, width: 90, order: 10 },
        { key: 'note', visible: true, width: 100, order: 11 },
        { key: 'actions', visible: true, width: 450, order: 12 },
    ],
    admin_merchants: [
        { key: 'info', visible: true, width: 180, order: 0 },
        { key: 'phone', visible: true, width: 120, order: 1 },
        { key: 'wechat', visible: true, width: 100, order: 2 },
        { key: 'balance', visible: true, width: 120, order: 3 },
        { key: 'frozen', visible: true, width: 80, order: 4 },
        { key: 'vip', visible: true, width: 90, order: 5 },
        { key: 'status', visible: true, width: 80, order: 6 },
        { key: 'referrer', visible: true, width: 120, order: 7 },
        { key: 'note', visible: true, width: 100, order: 8 },
        { key: 'createdAt', visible: true, width: 100, order: 9 },
        { key: 'actions', visible: true, width: 480, order: 10 },
    ],
};

@Injectable()
export class TablePreferencesService {
    constructor(
        @InjectRepository(TablePreference)
        private readonly repo: Repository<TablePreference>,
    ) { }

    /**
     * 获取表格列配置
     */
    async getPreferences(adminId: string, tableKey: string): Promise<ColumnConfig[]> {
        const pref = await this.repo.findOne({
            where: { adminId, tableKey },
        });
        if (pref) {
            return pref.columns;
        }
        // 返回默认配置
        return DEFAULT_COLUMNS[tableKey] || [];
    }

    /**
     * 保存表格列配置
     */
    async savePreferences(adminId: string, tableKey: string, columns: ColumnConfig[]): Promise<TablePreference> {
        let pref = await this.repo.findOne({
            where: { adminId, tableKey },
        });
        if (pref) {
            pref.columns = columns;
        } else {
            pref = this.repo.create({
                adminId,
                tableKey,
                columns,
            });
        }
        return this.repo.save(pref);
    }

    /**
     * 重置为默认配置
     */
    async resetPreferences(adminId: string, tableKey: string): Promise<ColumnConfig[]> {
        await this.repo.delete({ adminId, tableKey });
        return DEFAULT_COLUMNS[tableKey] || [];
    }

    /**
     * 获取默认配置
     */
    getDefaultColumns(tableKey: string): ColumnConfig[] {
        return DEFAULT_COLUMNS[tableKey] || [];
    }
}
