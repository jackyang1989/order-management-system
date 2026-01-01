import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull } from 'typeorm';
import { AdminMenu, CreateMenuDto, UpdateMenuDto, QueryMenuDto, MenuStatus } from './admin-menu.entity';

@Injectable()
export class AdminMenusService {
    constructor(
        @InjectRepository(AdminMenu)
        private readonly menuRepository: TreeRepository<AdminMenu>,
    ) {}

    /**
     * 创建菜单
     */
    async create(dto: CreateMenuDto): Promise<AdminMenu> {
        const menu = this.menuRepository.create(dto);

        if (dto.parentId) {
            const parent = await this.menuRepository.findOne({ where: { id: dto.parentId } });
            if (parent) {
                menu.parent = parent;
            }
        }

        return this.menuRepository.save(menu);
    }

    /**
     * 获取菜单树
     */
    async findTree(): Promise<AdminMenu[]> {
        return this.menuRepository.findTrees();
    }

    /**
     * 获取菜单列表（平铺）
     */
    async findAll(query: QueryMenuDto): Promise<AdminMenu[]> {
        const qb = this.menuRepository.createQueryBuilder('menu');

        if (query.name) {
            qb.andWhere('menu.name LIKE :name', { name: `%${query.name}%` });
        }

        if (query.status !== undefined) {
            qb.andWhere('menu.status = :status', { status: query.status });
        }

        if (query.type) {
            qb.andWhere('menu.type = :type', { type: query.type });
        }

        qb.orderBy('menu.sort', 'ASC');

        return qb.getMany();
    }

    /**
     * 获取单个菜单
     */
    async findOne(id: string): Promise<AdminMenu | null> {
        return this.menuRepository.findOne({
            where: { id },
            relations: ['parent', 'children'],
        });
    }

    /**
     * 更新菜单
     */
    async update(id: string, dto: UpdateMenuDto): Promise<AdminMenu | null> {
        const menu = await this.menuRepository.findOne({ where: { id } });
        if (!menu) {
            return null;
        }

        Object.assign(menu, dto);

        if (dto.parentId !== undefined) {
            if (dto.parentId) {
                const parent = await this.menuRepository.findOne({ where: { id: dto.parentId } });
                menu.parent = parent as AdminMenu;
            } else {
                menu.parent = null as any;
            }
        }

        return this.menuRepository.save(menu);
    }

    /**
     * 删除菜单
     */
    async remove(id: string): Promise<boolean> {
        const menu = await this.menuRepository.findOne({
            where: { id },
            relations: ['children'],
        });

        if (!menu) {
            return false;
        }

        // 如果有子菜单，不允许删除
        if (menu.children && menu.children.length > 0) {
            throw new Error('存在子菜单，无法删除');
        }

        await this.menuRepository.remove(menu);
        return true;
    }

    /**
     * 获取用户可访问的菜单
     */
    async findByPermissions(permissions: string[]): Promise<AdminMenu[]> {
        const allMenus = await this.findTree();

        const filterMenus = (menus: AdminMenu[]): AdminMenu[] => {
            return menus
                .filter(menu => {
                    // 如果没有权限要求，或者用户有该权限
                    return menu.status === MenuStatus.ACTIVE &&
                        menu.visible &&
                        (!menu.permission || permissions.includes(menu.permission));
                })
                .map(menu => ({
                    ...menu,
                    children: menu.children ? filterMenus(menu.children) : [],
                }));
        };

        return filterMenus(allMenus);
    }

    /**
     * 初始化默认菜单
     */
    async initDefaultMenus(): Promise<void> {
        const count = await this.menuRepository.count();
        if (count > 0) {
            return;
        }

        const defaultMenus = [
            { name: '首页', path: '/admin/dashboard', icon: 'home', sort: 0 },
            { name: '订单管理', path: '/admin/orders', icon: 'file-text', sort: 1 },
            { name: '任务管理', path: '/admin/tasks', icon: 'list', sort: 2 },
            { name: '用户管理', path: '/admin/users', icon: 'users', sort: 3 },
            { name: '商家管理', path: '/admin/merchants', icon: 'briefcase', sort: 4 },
            { name: '财务管理', path: '/admin/finance', icon: 'dollar-sign', sort: 5 },
            { name: '系统设置', path: '/admin/system', icon: 'settings', sort: 6 },
            { name: '权限管理', path: '/admin/permission', icon: 'shield', sort: 7 },
            { name: '运维工具', path: '/admin/tools', icon: 'tool', sort: 8 },
        ];

        for (const menuData of defaultMenus) {
            const menu = this.menuRepository.create(menuData);
            await this.menuRepository.save(menu);
        }
    }
}
