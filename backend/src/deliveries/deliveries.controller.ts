import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeliveryDto } from './delivery.entity';

@Controller('deliveries')
export class DeliveriesController {
    constructor(private deliveriesService: DeliveriesService) { }

    @Get()
    async findAll() {
        const deliveries = await this.deliveriesService.findAll();
        return { success: true, data: deliveries };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const delivery = await this.deliveriesService.findOne(id);
        if (!delivery) {
            return { success: false, message: '快递公司不存在' };
        }
        return { success: true, data: delivery };
    }

    @Post('admin')
    @UseGuards(JwtAuthGuard)
    async create(@Body() createDto: CreateDeliveryDto) {
        const delivery = await this.deliveriesService.create(createDto);
        return { success: true, message: '快递公司添加成功', data: delivery };
    }

    @Put('admin/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateDto: Partial<CreateDeliveryDto>) {
        const delivery = await this.deliveriesService.update(id, updateDto);
        if (!delivery) {
            return { success: false, message: '快递公司不存在' };
        }
        return { success: true, message: '快递公司更新成功', data: delivery };
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string) {
        await this.deliveriesService.delete(id);
        return { success: true, message: '快递公司删除成功' };
    }

    @Post('admin/init')
    @UseGuards(JwtAuthGuard)
    async initDefaults() {
        await this.deliveriesService.initDefaultDeliveries();
        return { success: true, message: '默认快递公司列表初始化成功' };
    }
}
