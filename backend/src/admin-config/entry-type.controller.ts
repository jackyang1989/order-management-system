import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { EntryTypeService } from './entry-type.service';
import { EntryType } from './entry-type.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/entry-types')
@UseGuards(JwtAuthGuard)
export class EntryTypeController {
    constructor(private readonly entryTypeService: EntryTypeService) { }

    /**
     * 获取所有入口类型
     */
    @Get()
    async findAll(@Query('activeOnly') activeOnly?: string) {
        const entryTypes = await this.entryTypeService.findAll(activeOnly !== 'false');
        return {
            success: true,
            data: entryTypes,
        };
    }

    /**
     * 创建入口类型
     */
    @Post()
    async create(@Body() data: Partial<EntryType>) {
        const entryType = await this.entryTypeService.create(data);
        return {
            success: true,
            message: '入口类型已创建',
            data: entryType,
        };
    }

    /**
     * 更新入口类型
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: Partial<EntryType>,
    ) {
        const entryType = await this.entryTypeService.update(id, data);
        return {
            success: true,
            message: '入口类型已更新',
            data: entryType,
        };
    }

    /**
     * 启用/禁用入口类型
     */
    @Put(':id/toggle')
    async toggle(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        const entryType = await this.entryTypeService.toggleActive(id, isActive);
        return {
            success: true,
            message: isActive ? '入口类型已启用' : '入口类型已禁用',
            data: entryType,
        };
    }

    /**
     * 删除入口类型
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.entryTypeService.delete(id);
        return {
            success: true,
            message: '入口类型已删除',
        };
    }
}
