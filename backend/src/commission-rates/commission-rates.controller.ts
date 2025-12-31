import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommissionRatesService } from './commission-rates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('commission-rates')
@UseGuards(JwtAuthGuard)
export class CommissionRatesController {
    constructor(private ratesService: CommissionRatesService) { }

    @Get()
    async getAll() {
        const data = await this.ratesService.findAll();
        return { success: true, data };
    }

    @Post()
    async create(@Body() body: any) {
        const rate = await this.ratesService.create(body);
        return { success: true, message: '添加成功', data: rate };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        const rate = await this.ratesService.update(parseInt(id), body);
        return { success: true, message: '更新成功', data: rate };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.ratesService.remove(parseInt(id));
        return { success: true, message: '删除成功' };
    }
}
