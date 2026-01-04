import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
  AdminStatus,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  CreateAdminRoleDto,
} from './admin-user.entity';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(AdminRole)
    private adminRoleRepository: Repository<AdminRole>,
    @InjectRepository(AdminPermission)
    private adminPermissionRepository: Repository<AdminPermission>,
    @InjectRepository(AdminOperationLog)
    private adminLogRepository: Repository<AdminOperationLog>,
    private jwtService: JwtService,
  ) {}

  // ============ 管理员登录 ============

  async login(
    username: string,
    password: string,
    ip?: string,
  ): Promise<{
    token: string;
    admin: Partial<AdminUser>;
  }> {
    const admin = await this.adminUserRepository.findOne({
      where: { username },
    });

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (admin.status !== AdminStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    admin.lastLoginAt = new Date();
    admin.lastLoginIp = ip;
    await this.adminUserRepository.save(admin);

    // 记录登录日志
    await this.logOperation(
      admin.id,
      admin.username,
      '系统',
      '登录',
      `管理员登录 IP: ${ip}`,
    );

    // 获取角色权限
    let permissions: string[] = [];
    let isSuperAdmin = false;
    if (admin.roleId) {
      const role = await this.adminRoleRepository.findOne({
        where: { id: admin.roleId },
      });
      if (role) {
        permissions = role.permissions;
        isSuperAdmin = role.permissions.includes('*');
      }
    }

    // 生成 token
    const payload = {
      sub: admin.id,
      adminId: admin.id,
      username: admin.username,
      isAdmin: true,
      isSuperAdmin,
      roleId: admin.roleId,
      roleName: admin.roleName,
      permissions,
    };
    const token = this.jwtService.sign(payload);

    // 返回脱敏数据
    const { password: _, ...adminData } = admin;
    return { token, admin: adminData };
  }

  // ============ 管理员管理 ============

  async findAllAdmins(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.adminUserRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 脱敏
    const sanitized = data.map((a) => {
      const { password, ...rest } = a;
      return rest as AdminUser;
    });

    return { data: sanitized, total, page, limit };
  }

  async findAdminById(id: string): Promise<AdminUser | null> {
    const admin = await this.adminUserRepository.findOne({ where: { id } });
    if (admin) {
      const { password, ...rest } = admin;
      return rest as AdminUser;
    }
    return null;
  }

  async createAdmin(createDto: CreateAdminUserDto): Promise<AdminUser> {
    // 检查用户名是否已存在
    const existing = await this.adminUserRepository.findOne({
      where: { username: createDto.username },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // 获取角色名称
    let roleName = 'admin';
    if (createDto.roleId) {
      const role = await this.adminRoleRepository.findOne({
        where: { id: createDto.roleId },
      });
      if (role) {
        roleName = role.name;
      }
    }

    const admin = this.adminUserRepository.create({
      username: createDto.username,
      password: hashedPassword,
      realName: createDto.realName,
      phone: createDto.phone,
      email: createDto.email,
      roleId: createDto.roleId,
      roleName,
      status: AdminStatus.ACTIVE,
    });

    const saved = await this.adminUserRepository.save(admin);
    const { password, ...result } = saved;
    return result as AdminUser;
  }

  async updateAdmin(
    id: string,
    updateDto: UpdateAdminUserDto,
  ): Promise<AdminUser> {
    const admin = await this.adminUserRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    // 更新角色名称
    if (updateDto.roleId) {
      const role = await this.adminRoleRepository.findOne({
        where: { id: updateDto.roleId },
      });
      if (role) {
        admin.roleName = role.name;
      }
    }

    Object.assign(admin, updateDto);
    const saved = await this.adminUserRepository.save(admin);
    const { password, ...result } = saved;
    return result as AdminUser;
  }

  async updateAdminPassword(id: string, newPassword: string): Promise<void> {
    const admin = await this.adminUserRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminUserRepository.save(admin);
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.adminUserRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    await this.adminUserRepository.remove(admin);
  }

  // ============ 角色管理 ============

  async findAllRoles(): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findRoleById(id: string): Promise<AdminRole | null> {
    return this.adminRoleRepository.findOne({ where: { id } });
  }

  async createRole(createDto: CreateAdminRoleDto): Promise<AdminRole> {
    const existing = await this.adminRoleRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new BadRequestException('角色名称已存在');
    }

    const role = this.adminRoleRepository.create({
      name: createDto.name,
      description: createDto.description,
      permissions: createDto.permissions || [],
      status: AdminStatus.ACTIVE,
    });

    return this.adminRoleRepository.save(role);
  }

  async updateRole(
    id: string,
    updateDto: Partial<AdminRole>,
  ): Promise<AdminRole> {
    const role = await this.adminRoleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    Object.assign(role, updateDto);
    return this.adminRoleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.adminRoleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 检查是否有管理员使用此角色
    const adminCount = await this.adminUserRepository.count({
      where: { roleId: id },
    });
    if (adminCount > 0) {
      throw new BadRequestException(
        `该角色下有 ${adminCount} 个管理员，无法删除`,
      );
    }

    await this.adminRoleRepository.remove(role);
  }

  // ============ 权限管理 ============

  async findAllPermissions(): Promise<AdminPermission[]> {
    return this.adminPermissionRepository.find({
      order: { module: 'ASC', sort: 'ASC' },
    });
  }

  async initDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // 用户管理
      { code: 'user:list', name: '用户列表', module: '用户管理' },
      { code: 'user:detail', name: '用户详情', module: '用户管理' },
      { code: 'user:update', name: '修改用户', module: '用户管理' },
      { code: 'user:disable', name: '禁用用户', module: '用户管理' },
      // 商家管理
      { code: 'merchant:list', name: '商家列表', module: '商家管理' },
      { code: 'merchant:review', name: '商家审核', module: '商家管理' },
      { code: 'merchant:update', name: '修改商家', module: '商家管理' },
      // 任务管理
      { code: 'task:list', name: '任务列表', module: '任务管理' },
      { code: 'task:detail', name: '任务详情', module: '任务管理' },
      { code: 'task:update', name: '修改任务', module: '任务管理' },
      // 订单管理
      { code: 'order:list', name: '订单列表', module: '订单管理' },
      { code: 'order:detail', name: '订单详情', module: '订单管理' },
      { code: 'order:review', name: '订单审核', module: '订单管理' },
      // 买号管理
      { code: 'buyno:list', name: '买号列表', module: '买号管理' },
      { code: 'buyno:review', name: '买号审核', module: '买号管理' },
      { code: 'buyno:star', name: '设置星级', module: '买号管理' },
      // 财务管理
      { code: 'finance:list', name: '财务流水', module: '财务管理' },
      { code: 'finance:recharge', name: '充值管理', module: '财务管理' },
      { code: 'finance:withdraw', name: '提现审核', module: '财务管理' },
      // 系统管理
      { code: 'system:admin', name: '管理员管理', module: '系统管理' },
      { code: 'system:role', name: '角色管理', module: '系统管理' },
      { code: 'system:log', name: '操作日志', module: '系统管理' },
    ];

    for (const perm of defaultPermissions) {
      const existing = await this.adminPermissionRepository.findOne({
        where: { code: perm.code },
      });
      if (!existing) {
        await this.adminPermissionRepository.save(
          this.adminPermissionRepository.create(perm),
        );
      }
    }
  }

  // ============ 操作日志 ============

  async logOperation(
    adminId: string,
    adminUsername: string,
    module: string,
    action: string,
    content?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const log = this.adminLogRepository.create({
      adminId,
      adminUsername,
      module,
      action,
      content,
      ip,
      userAgent,
    });
    await this.adminLogRepository.save(log);
  }

  async findOperationLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      adminId?: string;
      module?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    data: AdminOperationLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.adminLogRepository.createQueryBuilder('log');

    if (filters?.adminId) {
      queryBuilder.andWhere('log.adminId = :adminId', {
        adminId: filters.adminId,
      });
    }
    if (filters?.module) {
      queryBuilder.andWhere('log.module = :module', { module: filters.module });
    }
    if (filters?.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  // ============ 权限检查 ============

  async checkPermission(
    adminId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminId },
    });
    if (!admin || !admin.roleId) {
      return false;
    }

    const role = await this.adminRoleRepository.findOne({
      where: { id: admin.roleId },
    });
    if (!role) {
      return false;
    }

    return (
      role.permissions.includes(permissionCode) ||
      role.permissions.includes('*')
    );
  }

  // ============ 初始化超级管理员 ============

  async initSuperAdmin(): Promise<void> {
    const existing = await this.adminUserRepository.findOne({
      where: { username: 'superadmin' },
    });

    if (!existing) {
      // 创建超级管理员角色
      let superRole = await this.adminRoleRepository.findOne({
        where: { name: '超级管理员' },
      });

      if (!superRole) {
        superRole = await this.adminRoleRepository.save(
          this.adminRoleRepository.create({
            name: '超级管理员',
            description: '拥有所有权限',
            permissions: ['*'],
            status: AdminStatus.ACTIVE,
          }),
        );
      }

      // 创建超级管理员账号
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      await this.adminUserRepository.save(
        this.adminUserRepository.create({
          username: 'superadmin',
          password: hashedPassword,
          realName: '超级管理员',
          roleId: superRole.id,
          roleName: superRole.name,
          status: AdminStatus.ACTIVE,
        }),
      );

      console.log('超级管理员账号已创建: superadmin / admin123456');
    }
  }
}
