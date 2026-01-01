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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RbacService } from './rbac.service';
import { AdminMenu, AdminRole } from './rbac.entity';

@Controller('admin/menus')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class MenuController {
    constructor(private readonly rbacService: RbacService) { }

    /**
     * 获取菜单树
     */
    @Get('tree')
    async getTree(
        @Query('includeHidden') includeHidden?: string,
    ) {
        const data = await this.rbacService.getMenuTree(includeHidden === 'true');
        return { success: true, data };
    }

    /**
     * 获取所有菜单（平铺）
     */
    @Get()
    async findAll() {
        const data = await this.rbacService.findAllMenus();
        return { success: true, data };
    }

    /**
     * 获取单个菜单
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rbacService.findMenu(id);
        return { success: true, data };
    }

    /**
     * 创建菜单
     */
    @Post()
    async create(@Body() data: Partial<AdminMenu>) {
        const result = await this.rbacService.createMenu(data);
        return { success: true, data: result };
    }

    /**
     * 更新菜单
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<AdminMenu>) {
        const result = await this.rbacService.updateMenu(id, data);
        return { success: true, data: result };
    }

    /**
     * 删除菜单
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.rbacService.deleteMenu(id);
        return { success: true };
    }
}

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RoleController {
    constructor(private readonly rbacService: RbacService) { }

    /**
     * 获取所有角色
     */
    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string) {
        const data = await this.rbacService.findAllRoles(includeInactive === 'true');
        return { success: true, data };
    }

    /**
     * 获取单个角色
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rbacService.findRole(id);
        return { success: true, data };
    }

    /**
     * 创建角色
     */
    @Post()
    async create(@Body() data: Partial<AdminRole>) {
        const result = await this.rbacService.createRole(data);
        return { success: true, data: result };
    }

    /**
     * 更新角色
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<AdminRole>) {
        const result = await this.rbacService.updateRole(id, data);
        return { success: true, data: result };
    }

    /**
     * 删除角色
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.rbacService.deleteRole(id);
        return { success: true };
    }

    /**
     * 更新角色权限
     */
    @Put(':id/permissions')
    async updatePermissions(
        @Param('id') id: string,
        @Body() body: { permissions: string[] },
    ) {
        const result = await this.rbacService.updateRolePermissions(id, body.permissions);
        return { success: true, data: result };
    }

    /**
     * 更新角色菜单
     */
    @Put(':id/menus')
    async updateMenus(
        @Param('id') id: string,
        @Body() body: { menuIds: string[] },
    ) {
        const result = await this.rbacService.updateRoleMenus(id, body.menuIds);
        return { success: true, data: result };
    }

    /**
     * 获取角色菜单树
     */
    @Get(':code/menu-tree')
    async getRoleMenuTree(@Param('code') code: string) {
        const data = await this.rbacService.getRoleMenuTree(code);
        return { success: true, data };
    }

    /**
     * 刷新缓存
     */
    @Post('refresh-cache')
    async refreshCache() {
        await this.rbacService.refreshCache();
        return { success: true, message: '缓存已刷新' };
    }
}
