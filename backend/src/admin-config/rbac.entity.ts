import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';

/**
 * 菜单表 - 后台菜单管理
 */
@Entity('admin_menus')
export class AdminMenu {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;  // 菜单名称

    @Column({ nullable: true })
    icon: string;  // 图标

    @Column({ nullable: true })
    path: string;  // 路由路径

    @Column({ nullable: true })
    component: string;  // 前端组件路径

    @Column({ nullable: true })
    redirect: string;  // 重定向

    @Column({ type: 'uuid', nullable: true })
    parentId: string;  // 父菜单ID

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @Column({ type: 'varchar', length: 20, default: 'menu' })
    type: 'directory' | 'menu' | 'button';  // 类型：目录、菜单、按钮

    @Column({ nullable: true })
    permission: string;  // 权限标识，如 "user:list", "user:create"

    @Column({ type: 'boolean', default: true })
    isVisible: boolean;  // 是否在菜单中显示

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isExternal: boolean;  // 是否外链

    @Column({ type: 'boolean', default: true })
    keepAlive: boolean;  // 是否缓存

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * 角色表
 */
@Entity('admin_roles')
export class AdminRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;  // 角色代码，如 "super_admin", "operator"

    @Column()
    name: string;  // 角色名称

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'json', nullable: true })
    menuIds: string[];  // 菜单ID列表

    @Column({ type: 'json', nullable: true })
    permissions: string[];  // 权限列表

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * 默认菜单结构
 */
export const DEFAULT_MENUS: Array<Partial<AdminMenu> & { children?: Array<Partial<AdminMenu>> }> = [
    {
        name: '工作台',
        icon: 'dashboard',
        path: '/dashboard',
        type: 'menu',
        permission: 'dashboard:view',
        sortOrder: 1,
    },
    {
        name: '用户管理',
        icon: 'user',
        path: '/users',
        type: 'directory',
        sortOrder: 10,
        children: [
            { name: '用户列表', path: '/users/list', permission: 'user:list', type: 'menu', sortOrder: 1 },
            { name: '用户详情', path: '/users/detail/:id', permission: 'user:detail', type: 'menu', isVisible: false, sortOrder: 2 },
            { name: '添加用户', permission: 'user:create', type: 'button', sortOrder: 3 },
            { name: '编辑用户', permission: 'user:update', type: 'button', sortOrder: 4 },
            { name: '删除用户', permission: 'user:delete', type: 'button', sortOrder: 5 },
            { name: '充值/扣款', permission: 'user:balance', type: 'button', sortOrder: 6 },
        ],
    },
    {
        name: '商家管理',
        icon: 'shop',
        path: '/merchants',
        type: 'directory',
        sortOrder: 20,
        children: [
            { name: '商家列表', path: '/merchants/list', permission: 'merchant:list', type: 'menu', sortOrder: 1 },
            { name: '商家审核', path: '/merchants/audit', permission: 'merchant:audit', type: 'menu', sortOrder: 2 },
            { name: '店铺管理', path: '/merchants/shops', permission: 'shop:list', type: 'menu', sortOrder: 3 },
        ],
    },
    {
        name: '任务管理',
        icon: 'file-text',
        path: '/tasks',
        type: 'directory',
        sortOrder: 30,
        children: [
            { name: '任务列表', path: '/tasks/list', permission: 'task:list', type: 'menu', sortOrder: 1 },
            { name: '任务审核', path: '/tasks/audit', permission: 'task:audit', type: 'menu', sortOrder: 2 },
            { name: '任务商品', path: '/tasks/goods', permission: 'task:goods', type: 'menu', sortOrder: 3 },
        ],
    },
    {
        name: '订单管理',
        icon: 'shopping-cart',
        path: '/orders',
        type: 'directory',
        sortOrder: 40,
        children: [
            { name: '订单列表', path: '/orders/list', permission: 'order:list', type: 'menu', sortOrder: 1 },
            { name: '订单审核', path: '/orders/review', permission: 'order:review', type: 'menu', sortOrder: 2 },
            { name: '退款处理', path: '/orders/refund', permission: 'order:refund', type: 'menu', sortOrder: 3 },
        ],
    },
    {
        name: '财务管理',
        icon: 'wallet',
        path: '/finance',
        type: 'directory',
        sortOrder: 50,
        children: [
            { name: '财务流水', path: '/finance/records', permission: 'finance:list', type: 'menu', sortOrder: 1 },
            { name: '充值管理', path: '/finance/recharge', permission: 'recharge:list', type: 'menu', sortOrder: 2 },
            { name: '提现管理', path: '/finance/withdrawals', permission: 'withdrawal:list', type: 'menu', sortOrder: 3 },
            { name: '提现审核', permission: 'withdrawal:audit', type: 'button', sortOrder: 4 },
        ],
    },
    {
        name: '系统设置',
        icon: 'setting',
        path: '/settings',
        type: 'directory',
        sortOrder: 100,
        children: [
            { name: '系统配置', path: '/settings/config', permission: 'config:list', type: 'menu', sortOrder: 1 },
            { name: '费率配置', path: '/settings/commission', permission: 'commission:list', type: 'menu', sortOrder: 2 },
            { name: '平台管理', path: '/settings/platforms', permission: 'platform:list', type: 'menu', sortOrder: 3 },
            { name: '快递管理', path: '/settings/deliveries', permission: 'delivery:list', type: 'menu', sortOrder: 4 },
            { name: 'VIP配置', path: '/settings/vip', permission: 'vip:list', type: 'menu', sortOrder: 5 },
            { name: '敏感词管理', path: '/settings/sensitive-words', permission: 'sensitive:list', type: 'menu', sortOrder: 6 },
            { name: '公告管理', path: '/settings/notices', permission: 'notice:list', type: 'menu', sortOrder: 7 },
        ],
    },
    {
        name: '权限管理',
        icon: 'lock',
        path: '/permission',
        type: 'directory',
        sortOrder: 110,
        children: [
            { name: '菜单管理', path: '/permission/menus', permission: 'menu:list', type: 'menu', sortOrder: 1 },
            { name: '角色管理', path: '/permission/roles', permission: 'role:list', type: 'menu', sortOrder: 2 },
            { name: '管理员账号', path: '/permission/admins', permission: 'admin:list', type: 'menu', sortOrder: 3 },
        ],
    },
    {
        name: '系统工具',
        icon: 'tool',
        path: '/tools',
        type: 'directory',
        sortOrder: 120,
        children: [
            { name: '数据备份', path: '/tools/backup', permission: 'backup:list', type: 'menu', sortOrder: 1 },
            { name: '系统日志', path: '/tools/logs', permission: 'log:list', type: 'menu', sortOrder: 2 },
            { name: 'API配置', path: '/tools/api', permission: 'api:config', type: 'menu', sortOrder: 3 },
        ],
    },
];

/**
 * 默认角色
 */
export const DEFAULT_ROLES: Array<Partial<AdminRole>> = [
    {
        code: 'super_admin',
        name: '超级管理员',
        description: '拥有系统所有权限',
        permissions: ['*'],
        sortOrder: 1,
    },
    {
        code: 'operator',
        name: '运营人员',
        description: '负责日常运营管理',
        permissions: [
            'dashboard:view',
            'user:list', 'user:detail',
            'merchant:list', 'merchant:audit',
            'task:list', 'task:audit',
            'order:list', 'order:review',
            'notice:list', 'notice:create',
        ],
        sortOrder: 2,
    },
    {
        code: 'finance',
        name: '财务人员',
        description: '负责财务相关管理',
        permissions: [
            'dashboard:view',
            'finance:list',
            'recharge:list',
            'withdrawal:list', 'withdrawal:audit',
            'user:list', 'user:balance',
        ],
        sortOrder: 3,
    },
    {
        code: 'customer_service',
        name: '客服人员',
        description: '负责客户服务',
        permissions: [
            'dashboard:view',
            'user:list', 'user:detail',
            'order:list', 'order:review',
            'message:list', 'message:reply',
        ],
        sortOrder: 4,
    },
];
