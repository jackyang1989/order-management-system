import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TablePreferencesService } from './table-preferences.service';
import { ColumnConfig } from './table-preferences.entity';

@Controller('admin/table-preferences')
@UseGuards(JwtAuthGuard)
export class TablePreferencesController {
    constructor(private readonly service: TablePreferencesService) { }

    /**
     * 获取表格列配置
     */
    @Get(':tableKey')
    async getPreferences(
        @Request() req: any,
        @Param('tableKey') tableKey: string,
    ) {
        const adminId = req.user?.adminId || req.user?.userId || req.user?.id || req.user?.sub || 'default';
        const columns = await this.service.getPreferences(adminId, tableKey);
        const defaultColumns = this.service.getDefaultColumns(tableKey);
        return {
            success: true,
            data: {
                columns,
                defaultColumns,
            },
        };
    }

    /**
     * 保存表格列配置
     */
    @Put(':tableKey')
    async savePreferences(
        @Request() req: any,
        @Param('tableKey') tableKey: string,
        @Body('columns') columns: ColumnConfig[],
    ) {
        const adminId = req.user?.adminId || req.user?.userId || req.user?.id || req.user?.sub || 'default';
        await this.service.savePreferences(adminId, tableKey, columns);
        return {
            success: true,
            message: '列配置已保存',
        };
    }

    /**
     * 重置为默认配置
     */
    @Post(':tableKey/reset')
    async resetPreferences(
        @Request() req: any,
        @Param('tableKey') tableKey: string,
    ) {
        const adminId = req.user?.adminId || req.user?.userId || req.user?.id || req.user?.sub || 'default';
        const columns = await this.service.resetPreferences(adminId, tableKey);
        return {
            success: true,
            message: '已恢复默认配置',
            data: { columns },
        };
    }
}
