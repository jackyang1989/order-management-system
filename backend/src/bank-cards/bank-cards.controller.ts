import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankCardsService } from './bank-cards.service';
import { CreateBankCardDto, UpdateBankCardDto } from './bank-card.entity';

@Controller('bank-cards')
@UseGuards(JwtAuthGuard)
export class BankCardsController {
    constructor(private bankCardsService: BankCardsService) { }

    @Get()
    async findAll(@Request() req) {
        const cards = await this.bankCardsService.findAllByUser(req.user.userId);
        return {
            success: true,
            data: cards
        };
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id') id: string) {
        const card = await this.bankCardsService.findOne(id, req.user.userId);
        if (!card) {
            return {
                success: false,
                message: '银行卡不存在'
            };
        }
        return {
            success: true,
            data: card
        };
    }

    @Post()
    async create(@Request() req, @Body() createDto: CreateBankCardDto) {
        const card = await this.bankCardsService.create(req.user.userId, createDto);
        return {
            success: true,
            message: '银行卡绑定成功',
            data: card
        };
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateBankCardDto) {
        const card = await this.bankCardsService.update(id, req.user.userId, updateDto);
        return {
            success: true,
            message: '银行卡更新成功',
            data: card
        };
    }

    @Put(':id/default')
    async setDefault(@Request() req, @Param('id') id: string) {
        const card = await this.bankCardsService.setDefault(id, req.user.userId);
        return {
            success: true,
            message: '已设为默认银行卡',
            data: card
        };
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        await this.bankCardsService.delete(id, req.user.userId);
        return {
            success: true,
            message: '银行卡解绑成功'
        };
    }
}
