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
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';
import { BannersService } from './banners.service';
import {
  BannerPosition,
  BannerStatus,
  CreateBannerDto,
  UpdateBannerDto,
} from './banner.entity';

@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  // ============ 公开接口 ============

  @Get()
  async findAll(
    @Query('position') position?: BannerPosition,
  ) {
    const banners = await this.bannersService.findAll({
      position,
      status: BannerStatus.ENABLED,
    });
    return { success: true, data: banners };
  }

  // ============ 管理员接口 ============

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async findAllForAdmin(@Query('position') position?: BannerPosition) {
    const banners = await this.bannersService.findAll({ position });
    return { success: true, data: banners };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async findOne(@Param('id') id: string) {
    const banner = await this.bannersService.findOne(id);
    if (!banner) {
      return { success: false, message: '轮播图不存在' };
    }
    return { success: true, data: banner };
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async create(@Body() createDto: CreateBannerDto) {
    const banner = await this.bannersService.create(createDto);
    return { success: true, message: '创建成功', data: banner };
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async update(@Param('id') id: string, @Body() updateDto: UpdateBannerDto) {
    const banner = await this.bannersService.update(id, updateDto);
    return { success: true, message: '更新成功', data: banner };
  }

  @Put('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async toggleStatus(@Param('id') id: string) {
    const banner = await this.bannersService.toggleStatus(id);
    return { success: true, message: '状态已更新', data: banner };
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('system:banner')
  async delete(@Param('id') id: string) {
    await this.bannersService.delete(id);
    return { success: true, message: '删除成功' };
  }
}
