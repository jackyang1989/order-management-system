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
  Request,
  Response,
  Ip,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  AdminLoginDto,
  CreateAdminRoleDto,
  AdminStatus,
} from './admin-user.entity';

@Controller('admin-users')
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  // ============ 登录（无需认证） ============
  // P1-4: 使用 httpOnly cookie 存储 token

  @Post('login')
  async login(
    @Body() loginDto: AdminLoginDto,
    @Ip() ip: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    try {
      const result = await this.adminUsersService.login(
        loginDto.username,
        loginDto.password,
        ip,
      );

      // 设置 httpOnly cookie
      if (result.token) {
        res.cookie('accessToken', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
        });
      }

      // 不在响应体中返回 token
      const { token, ...data } = result;

      return {
        success: true,
        message: '登录成功',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 管理员管理（需要认证） ============

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.adminUsersService.findAllAdmins(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, ...result };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const admin = await this.adminUsersService.findAdminById(req.user.userId);
    if (!admin) {
      return { success: false, message: '管理员不存在' };
    }
    return { success: true, data: admin };
  }

  @Put('profile/password')
  @UseGuards(JwtAuthGuard)
  async changeMyPassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      await this.adminUsersService.changePassword(
        req.user.userId,
        body.oldPassword,
        body.newPassword,
      );
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '修改密码',
        '管理员修改自己的密码',
        ip,
      );
      return {
        success: true,
        message: '密码修改成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const admin = await this.adminUsersService.findAdminById(id);
    if (!admin) {
      return { success: false, message: '管理员不存在' };
    }
    return { success: true, data: admin };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createDto: CreateAdminUserDto,
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      const admin = await this.adminUsersService.createAdmin(createDto);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '创建管理员',
        `创建管理员: ${createDto.username}`,
        ip,
      );
      return {
        success: true,
        message: '管理员创建成功',
        data: admin,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdminUserDto,
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      const admin = await this.adminUsersService.updateAdmin(id, updateDto);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '更新管理员',
        `更新管理员: ${id}`,
        ip,
      );
      return {
        success: true,
        message: '管理员更新成功',
        data: admin,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Put(':id/password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      await this.adminUsersService.updateAdminPassword(id, body.newPassword);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '重置密码',
        `重置管理员密码: ${id}`,
        ip,
      );
      return {
        success: true,
        message: '密码重置成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req, @Ip() ip: string) {
    try {
      await this.adminUsersService.deleteAdmin(id);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '删除管理员',
        `删除管理员: ${id}`,
        ip,
      );
      return {
        success: true,
        message: '管理员删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 角色管理 ============

  @Get('roles/list')
  @UseGuards(JwtAuthGuard)
  async findAllRoles() {
    const roles = await this.adminUsersService.findAllRoles();
    return { success: true, data: roles };
  }

  @Get('roles/:id')
  @UseGuards(JwtAuthGuard)
  async findRole(@Param('id') id: string) {
    const role = await this.adminUsersService.findRoleById(id);
    if (!role) {
      return { success: false, message: '角色不存在' };
    }
    return { success: true, data: role };
  }

  @Post('roles')
  @UseGuards(JwtAuthGuard)
  async createRole(
    @Body() createDto: CreateAdminRoleDto,
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      const role = await this.adminUsersService.createRole(createDto);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '创建角色',
        `创建角色: ${createDto.name}`,
        ip,
      );
      return {
        success: true,
        message: '角色创建成功',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Put('roles/:id')
  @UseGuards(JwtAuthGuard)
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateAdminRoleDto>,
    @Request() req,
    @Ip() ip: string,
  ) {
    try {
      const role = await this.adminUsersService.updateRole(id, updateDto);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '更新角色',
        `更新角色: ${id}`,
        ip,
      );
      return {
        success: true,
        message: '角色更新成功',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete('roles/:id')
  @UseGuards(JwtAuthGuard)
  async deleteRole(@Param('id') id: string, @Request() req, @Ip() ip: string) {
    try {
      await this.adminUsersService.deleteRole(id);
      await this.adminUsersService.logOperation(
        req.user.userId,
        req.user.username,
        '系统管理',
        '删除角色',
        `删除角色: ${id}`,
        ip,
      );
      return {
        success: true,
        message: '角色删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 权限管理 ============

  @Get('permissions/list')
  @UseGuards(JwtAuthGuard)
  async findAllPermissions() {
    const permissions = await this.adminUsersService.findAllPermissions();
    return { success: true, data: permissions };
  }

  @Post('permissions/init')
  @UseGuards(JwtAuthGuard)
  async initPermissions(@Request() req, @Ip() ip: string) {
    await this.adminUsersService.initDefaultPermissions();
    await this.adminUsersService.logOperation(
      req.user.userId,
      req.user.username,
      '系统管理',
      '初始化权限',
      '初始化默认权限列表',
      ip,
    );
    return {
      success: true,
      message: '权限初始化成功',
    };
  }

  // ============ 操作日志 ============

  @Get('logs/list')
  @UseGuards(JwtAuthGuard)
  async findLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
    @Query('module') module?: string,
  ) {
    const result = await this.adminUsersService.findOperationLogs(
      parseInt(page || '1'),
      parseInt(limit || '50'),
      { adminId, module },
    );
    return { success: true, ...result };
  }
}
