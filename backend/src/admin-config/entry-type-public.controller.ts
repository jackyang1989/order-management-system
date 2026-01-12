import { Controller, Get } from '@nestjs/common';
import { EntryTypeService } from './entry-type.service';

/**
 * 公开的入口类型API（无需认证）
 * 用于前端获取启用的入口类型列表
 */
@Controller('entry-types')
export class EntryTypePublicController {
    constructor(private readonly entryTypeService: EntryTypeService) { }

    /**
     * 获取所有启用的入口类型
     */
    @Get()
    async getActiveEntryTypes() {
        const entryTypes = await this.entryTypeService.findAll(true);
        return {
            success: true,
            data: entryTypes.map(e => ({
                id: e.id,
                code: e.code,
                name: e.name,
                icon: e.icon,
                color: e.color,
                value: e.value,
                sortOrder: e.sortOrder,
            })),
        };
    }
}
