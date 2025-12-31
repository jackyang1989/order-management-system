import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BanksService } from './banks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBankDto } from './bank.entity';

@Controller('banks')
export class BanksController {
    constructor(private banksService: BanksService) { }

    @Get()
    async findAll() {
        const banks = await this.banksService.findAll();
        return { success: true, data: banks };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const bank = await this.banksService.findOne(id);
        if (!bank) {
            return { success: false, message: '银行不存在' };
        }
        return { success: true, data: bank };
    }

    // ============ 管理员接口 ============

    @Post('admin')
    @UseGuards(JwtAuthGuard)
    async create(@Body() createDto: CreateBankDto) {
        const bank = await this.banksService.create(createDto);
        return { success: true, message: '银行添加成功', data: bank };
    }

    @Put('admin/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateDto: Partial<CreateBankDto>) {
        const bank = await this.banksService.update(id, updateDto);
        if (!bank) {
            return { success: false, message: '银行不存在' };
        }
        return { success: true, message: '银行更新成功', data: bank };
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string) {
        await this.banksService.delete(id);
        return { success: true, message: '银行删除成功' };
    }

    @Post('admin/init')
    @UseGuards(JwtAuthGuard)
    async initDefaults() {
        await this.banksService.initDefaultBanks();
        return { success: true, message: '默认银行列表初始化成功' };
    }
}
