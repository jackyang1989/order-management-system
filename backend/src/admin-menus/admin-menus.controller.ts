import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AdminMenusService } from './admin-menus.service';
import { CreateMenuDto, UpdateMenuDto, QueryMenuDto } from './admin-menu.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/menus')
@UseGuards(JwtAuthGuard)
export class AdminMenusController {
    constructor(private readonly adminMenusService: AdminMenusService) {}

    /**
     * 获取菜单树
     */
    @Get('tree')
    async getTree() {
        const tree = await this.adminMenusService.findTree();
        return {
            success: true,
            data: tree,
        };
    }

    /**
     * 获取菜单列表
     */
    @Get()
    async findAll(@Query() query: QueryMenuDto) {
        const list = await this.adminMenusService.findAll(query);
        return {
            success: true,
            data: list,
        };
    }

    /**
     * 获取单个菜单
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const menu = await this.adminMenusService.findOne(id);
        if (!menu) {
            return {
                success: false,
                message: '菜单不存在',
            };
        }
        return {
            success: true,
            data: menu,
        };
    }

    /**
     * 创建菜单
     */
    @Post()
    async create(@Body() dto: CreateMenuDto) {
        const menu = await this.adminMenusService.create(dto);
        return {
            success: true,
            message: '创建成功',
            data: menu,
        };
    }

    /**
     * 更新菜单
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
        const menu = await this.adminMenusService.update(id, dto);
        if (!menu) {
            return {
                success: false,
                message: '菜单不存在',
            };
        }
        return {
            success: true,
            message: '更新成功',
            data: menu,
        };
    }

    /**
     * 删除菜单
     */
    @Delete(':id')
    async remove(@Param('id') id: string) {
        try {
            const result = await this.adminMenusService.remove(id);
            if (!result) {
                return {
                    success: false,
                    message: '菜单不存在',
                };
            }
            return {
                success: true,
                message: '删除成功',
            };
        } catch (error) {
            throw new HttpException(error.message || '删除失败', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * 初始化默认菜单
     */
    @Post('init')
    async init() {
        await this.adminMenusService.initDefaultMenus();
        return {
            success: true,
            message: '初始化成功',
        };
    }
}
