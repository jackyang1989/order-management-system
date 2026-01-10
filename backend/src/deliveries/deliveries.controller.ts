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
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateDeliveryDto } from './delivery.entity';

@Controller()
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  // Public endpoint for users to get active deliveries
  @Get('deliveries')
  async findAll() {
    const deliveries = await this.deliveriesService.findAll();
    return { success: true, data: deliveries };
  }

  @Get('deliveries/:id')
  async findOne(@Param('id') id: string) {
    const delivery = await this.deliveriesService.findOne(id);
    if (!delivery) {
      return { success: false, message: '快递公司不存在' };
    }
    return { success: true, data: delivery };
  }

  // Admin endpoints
  @Get('admin/deliveries')
  @UseGuards(AdminGuard)
  async findAllAdmin(@Query('includeInactive') includeInactive?: string) {
    const deliveries = await this.deliveriesService.findAllAdmin(
      includeInactive === 'true',
    );
    return { success: true, data: deliveries };
  }

  @Post('admin/deliveries')
  @UseGuards(AdminGuard)
  async create(@Body() createDto: CreateDeliveryDto) {
    const delivery = await this.deliveriesService.create(createDto);
    return { success: true, message: '快递公司添加成功', data: delivery };
  }

  @Put('admin/deliveries/:id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateDeliveryDto>,
  ) {
    const delivery = await this.deliveriesService.update(id, updateDto);
    if (!delivery) {
      return { success: false, message: '快递公司不存在' };
    }
    return { success: true, message: '快递公司更新成功', data: delivery };
  }

  @Post('admin/deliveries/:id/toggle')
  @UseGuards(AdminGuard)
  async toggle(@Param('id') id: string) {
    const delivery = await this.deliveriesService.toggle(id);
    if (!delivery) {
      return { success: false, message: '快递公司不存在' };
    }
    return { success: true, message: '状态已切换', data: delivery };
  }

  @Delete('admin/deliveries/:id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    await this.deliveriesService.delete(id);
    return { success: true, message: '快递公司删除成功' };
  }

  @Post('admin/deliveries/init')
  @UseGuards(AdminGuard)
  async initDefaults() {
    await this.deliveriesService.initDefaultDeliveries();
    return { success: true, message: '默认快递公司列表初始化成功' };
  }
}
