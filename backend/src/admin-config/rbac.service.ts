import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AdminMenu, AdminRole, DEFAULT_MENUS, DEFAULT_ROLES } from './rbac.entity';

interface MenuTreeNode extends AdminMenu {
    children?: MenuTreeNode[];
}

@Injectable()
export class RbacService implements OnModuleInit {
    private menuCache: Map<string, AdminMenu> = new Map();
    private roleCache: Map<string, AdminRole> = new Map();

    constructor(
        @InjectRepository(AdminMenu)
        private menuRepo: Repository<AdminMenu>,
        @InjectRepository(AdminRole)
        private roleRepo: Repository<AdminRole>,
    ) { }

    async onModuleInit() {
        await this.ensureDefaults();
        await this.loadCache();
    }

    /**
     * 确保默认数据存在
     */
    private async ensureDefaults(): Promise<void> {
        // 初始化默认菜单
        for (const menu of DEFAULT_MENUS) {
            await this.ensureMenuExists(menu);
        }

        // 初始化默认角色
        for (const role of DEFAULT_ROLES) {
            const existing = await this.roleRepo.findOne({ where: { code: role.code } });
            if (!existing) {
                await this.roleRepo.save(this.roleRepo.create({
                    ...role,
                    isActive: true,
                }));
            }
        }
    }

    /**
     * 递归创建菜单
     */
    private async ensureMenuExists(
        menuData: Partial<AdminMenu> & { children?: Array<Partial<AdminMenu>> },
        parentId?: string,
    ): Promise<void> {
        let menu = await this.menuRepo.findOne({
            where: { name: menuData.name, parentId: parentId ?? IsNull() },
        });

        if (!menu) {
            menu = await this.menuRepo.save(this.menuRepo.create({
                ...menuData,
                parentId,
                isActive: true,
                children: undefined,
            }));
        }

        if (menuData.children) {
            for (const child of menuData.children) {
                await this.ensureMenuExists(child, menu.id);
            }
        }
    }

    /**
     * 加载缓存
     */
    private async loadCache(): Promise<void> {
        const menus = await this.menuRepo.find({ where: { isActive: true } });
        const roles = await this.roleRepo.find({ where: { isActive: true } });

        this.menuCache.clear();
        this.roleCache.clear();

        for (const menu of menus) {
            this.menuCache.set(menu.id, menu);
        }
        for (const role of roles) {
            this.roleCache.set(role.code, role);
        }
    }

    /**
     * 刷新缓存
     */
    async refreshCache(): Promise<void> {
        await this.loadCache();
    }

    // ============ 菜单管理 ============

    /**
     * 获取菜单树
     */
    async getMenuTree(includeHidden = false): Promise<MenuTreeNode[]> {
        const where: Record<string, unknown> = { isActive: true };
        if (!includeHidden) {
            where.isVisible = true;
        }

        const menus = await this.menuRepo.find({
            where,
            order: { sortOrder: 'ASC' },
        });

        return this.buildTree(menus);
    }

    /**
     * 构建菜单树
     */
    private buildTree(menus: AdminMenu[], parentId?: string): MenuTreeNode[] {
        const result: MenuTreeNode[] = [];

        for (const menu of menus) {
            if ((menu.parentId || undefined) === parentId) {
                const node: MenuTreeNode = { ...menu };
                const children = this.buildTree(menus, menu.id);
                if (children.length > 0) {
                    node.children = children;
                }
                result.push(node);
            }
        }

        return result;
    }

    /**
     * 获取所有菜单（平铺）
     */
    async findAllMenus(): Promise<AdminMenu[]> {
        return this.menuRepo.find({
            order: { sortOrder: 'ASC' },
        });
    }

    /**
     * 获取单个菜单
     */
    async findMenu(id: string): Promise<AdminMenu> {
        const menu = await this.menuRepo.findOne({ where: { id } });
        if (!menu) {
            throw new NotFoundException(`菜单 ${id} 不存在`);
        }
        return menu;
    }

    /**
     * 创建菜单
     */
    async createMenu(data: Partial<AdminMenu>): Promise<AdminMenu> {
        const menu = this.menuRepo.create(data);
        const saved = await this.menuRepo.save(menu);
        await this.refreshCache();
        return saved;
    }

    /**
     * 更新菜单
     */
    async updateMenu(id: string, data: Partial<AdminMenu>): Promise<AdminMenu> {
        const menu = await this.findMenu(id);
        Object.assign(menu, data);
        const saved = await this.menuRepo.save(menu);
        await this.refreshCache();
        return saved;
    }

    /**
     * 删除菜单
     */
    async deleteMenu(id: string): Promise<void> {
        // 先删除子菜单
        const children = await this.menuRepo.find({ where: { parentId: id } });
        for (const child of children) {
            await this.deleteMenu(child.id);
        }

        await this.menuRepo.delete(id);
        await this.refreshCache();
    }

    // ============ 角色管理 ============

    /**
     * 获取所有角色
     */
    async findAllRoles(includeInactive = false): Promise<AdminRole[]> {
        const where = includeInactive ? {} : { isActive: true };
        return this.roleRepo.find({
            where,
            order: { sortOrder: 'ASC' },
        });
    }

    /**
     * 获取单个角色
     */
    async findRole(id: string): Promise<AdminRole> {
        const role = await this.roleRepo.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`角色 ${id} 不存在`);
        }
        return role;
    }

    /**
     * 根据代码获取角色
     */
    async findRoleByCode(code: string): Promise<AdminRole | null> {
        return this.roleCache.get(code) || this.roleRepo.findOne({ where: { code } });
    }

    /**
     * 创建角色
     */
    async createRole(data: Partial<AdminRole>): Promise<AdminRole> {
        const role = this.roleRepo.create(data);
        const saved = await this.roleRepo.save(role);
        await this.refreshCache();
        return saved;
    }

    /**
     * 更新角色
     */
    async updateRole(id: string, data: Partial<AdminRole>): Promise<AdminRole> {
        const role = await this.findRole(id);
        Object.assign(role, data);
        const saved = await this.roleRepo.save(role);
        await this.refreshCache();
        return saved;
    }

    /**
     * 删除角色
     */
    async deleteRole(id: string): Promise<void> {
        const role = await this.findRole(id);
        if (role.code === 'super_admin') {
            throw new Error('不能删除超级管理员角色');
        }
        await this.roleRepo.delete(id);
        await this.refreshCache();
    }

    /**
     * 更新角色权限
     */
    async updateRolePermissions(id: string, permissions: string[]): Promise<AdminRole> {
        const role = await this.findRole(id);
        role.permissions = permissions;
        const saved = await this.roleRepo.save(role);
        await this.refreshCache();
        return saved;
    }

    /**
     * 更新角色菜单
     */
    async updateRoleMenus(id: string, menuIds: string[]): Promise<AdminRole> {
        const role = await this.findRole(id);
        role.menuIds = menuIds;
        const saved = await this.roleRepo.save(role);
        await this.refreshCache();
        return saved;
    }

    // ============ 权限检查 ============

    /**
     * 检查角色是否有权限
     */
    hasPermission(roleCode: string, permission: string): boolean {
        const role = this.roleCache.get(roleCode);
        if (!role) return false;

        // 超级管理员有所有权限
        if (role.permissions?.includes('*')) return true;

        // 检查具体权限
        return role.permissions?.includes(permission) || false;
    }

    /**
     * 获取角色的菜单树
     */
    async getRoleMenuTree(roleCode: string): Promise<MenuTreeNode[]> {
        const role = await this.findRoleByCode(roleCode);
        if (!role) return [];

        // 超级管理员返回所有菜单
        if (role.permissions?.includes('*')) {
            return this.getMenuTree();
        }

        // 获取角色绑定的菜单
        if (!role.menuIds || role.menuIds.length === 0) {
            return [];
        }

        const menus = await this.menuRepo.find({
            where: { isActive: true, isVisible: true },
            order: { sortOrder: 'ASC' },
        });

        const filteredMenus = menus.filter(m =>
            role.menuIds?.includes(m.id) || this.isParentOfIncluded(m.id, menus, role.menuIds || [])
        );

        return this.buildTree(filteredMenus);
    }

    /**
     * 检查菜单是否是被包含菜单的父级
     */
    private isParentOfIncluded(menuId: string, allMenus: AdminMenu[], includedIds: string[]): boolean {
        for (const id of includedIds) {
            let current = allMenus.find(m => m.id === id);
            while (current) {
                if (current.parentId === menuId) return true;
                current = allMenus.find(m => m.id === current?.parentId);
            }
        }
        return false;
    }

    /**
     * 获取角色的所有权限
     */
    getRolePermissions(roleCode: string): string[] {
        const role = this.roleCache.get(roleCode);
        if (!role) return [];
        return role.permissions || [];
    }
}
