import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersAdminService } from './users-admin.service';
import { User } from './user.entity';
import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// ============ DTO 定义 ============

export class UserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  keyword?: string; // 搜索关键词（用户名、手机号）

  @IsOptional()
  @IsIn(['active', 'banned', 'all'])
  status?: 'active' | 'banned' | 'all';

  @IsOptional()
  @IsIn(['vip', 'normal', 'all'])
  vip?: 'vip' | 'normal' | 'all';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortField?: string; // 前端发送的字段名，作为 sortBy 的别名

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export class AdjustBalanceDto {
  @IsIn(['balance', 'silver'])
  type: 'balance' | 'silver';

  @IsIn(['add', 'deduct'])
  action: 'add' | 'deduct';

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchOperationDto {
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  @IsIn(['ban', 'unban', 'activate', 'deactivate', 'setVip', 'removeVip'])
  action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'setVip' | 'removeVip';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vipDays?: number;
}

export class UserDetailUpdateDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  wechat?: string;

  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsString()
  idCard?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  isBanned?: boolean;

  @IsOptional()
  @IsString()
  banReason?: string;

  @IsOptional()
  vip?: boolean;

  @IsOptional()
  vipExpireAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  silver?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mcTaskNum?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  invitedBy?: string;

  @IsOptional()
  canReferFriends?: boolean;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) { }

  /**
   * 获取用户列表（分页、筛选、搜索）
   */
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.usersAdminService.findAll(query);
    return { success: true, ...result };
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersAdminService.findOne(id);
    return { success: true, data: user };
  }

  /**
   * 获取用户统计信息
   */
  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const stats = await this.usersAdminService.getUserStats(id);
    return { success: true, data: stats };
  }

  /**
   * 更新用户信息
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UserDetailUpdateDto) {
    const user = await this.usersAdminService.updateUser(id, data);
    return { success: true, data: user };
  }

  /**
   * 调整用户余额（充值/扣除）
   */
  @Post(':id/balance')
  async adjustBalance(@Param('id') id: string, @Body() dto: AdjustBalanceDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('金额必须大于0');
    }
    const result = await this.usersAdminService.adjustBalance(id, dto);
    return { success: true, data: result };
  }

  /**
   * 封禁用户
   */
  @Post(':id/ban')
  async banUser(@Param('id') id: string, @Body() body: { reason: string }) {
    const user = await this.usersAdminService.banUser(id, body.reason);
    return { success: true, data: user, message: '用户已封禁' };
  }

  /**
   * 解封用户
   */
  @Post(':id/unban')
  async unbanUser(@Param('id') id: string) {
    const user = await this.usersAdminService.unbanUser(id);
    return { success: true, data: user, message: '用户已解封' };
  }

  /**
   * 重置用户密码
   */
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    await this.usersAdminService.resetPassword(id, body.newPassword);
    return { success: true, message: '密码已重置' };
  }

  /**
   * 修改用户密码 (PUT)
   */
  @Put(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    await this.usersAdminService.resetPassword(id, body.password);
    return { success: true, message: '密码已修改' };
  }

  /**
   * 更新用户资料 (编辑资料)
   */
  @Put(':id/profile')
  async updateProfile(@Param('id') id: string, @Body() data: UserDetailUpdateDto) {
    const user = await this.usersAdminService.updateUser(id, data);
    return { success: true, data: user, message: '资料已更新' };
  }

  /**
   * 更新用户备注
   */
  @Put(':id/note')
  async updateNote(@Param('id') id: string, @Body() body: { note: string }) {
    const user = await this.usersAdminService.updateUser(id, { note: body.note } as any);
    return { success: true, data: user, message: '备注已更新' };
  }

  /**
   * 获取用户消息列表
   */
  @Get(':id/messages')
  async getUserMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.usersAdminService.getUserMessages(
      id,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
    return { success: true, ...result };
  }

  /**
   * 发送消息给用户
   */
  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { title: string; content: string },
  ) {
    const message = await this.usersAdminService.sendMessage(id, body.title, body.content);
    return { success: true, data: message, message: '消息发送成功' };
  }

  /**
   * 重置用户支付密码
   */
  @Post(':id/reset-pay-password')
  async resetPayPassword(
    @Param('id') id: string,
    @Body() body: { newPayPassword: string },
  ) {
    await this.usersAdminService.resetPayPassword(id, body.newPayPassword);
    return { success: true, message: '支付密码已重置' };
  }

  /**
   * 获取用户余额变动记录
   */
  @Get(':id/balance-logs')
  async getBalanceLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.usersAdminService.getBalanceLogs(
      id,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      type,
    );
    return { success: true, ...result };
  }

  /**
   * 获取用户登录日志
   */
  @Get(':id/login-logs')
  async getLoginLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.usersAdminService.getLoginLogs(
      id,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
    return { success: true, ...result };
  }

  /**
   * 批量操作
   */
  @Post('batch')
  async batchOperation(@Body() dto: BatchOperationDto) {
    const result = await this.usersAdminService.batchOperation(dto);
    return { success: true, data: result };
  }

  /**
   * 导出用户数据
   */
  @Get('export')
  async exportUsers(@Query() query: UserQueryDto) {
    const result = await this.usersAdminService.exportUsers(query);
    return { success: true, data: result };
  }

  /**
   * 获取统计概览
   */
  @Get('stats/overview')
  async getOverviewStats() {
    const stats = await this.usersAdminService.getOverviewStats();
    return { success: true, data: stats };
  }
}
