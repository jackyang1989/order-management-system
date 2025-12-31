import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MerchantBankCardsService } from './merchant-bank-cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMerchantBankCardDto, UpdateMerchantBankCardDto, MerchantBankCardStatus } from './merchant-bank-card.entity';

@Controller('merchant-bank-cards')
@UseGuards(JwtAuthGuard)
export class MerchantBankCardsController {
    constructor(private bankCardsService: MerchantBankCardsService) { }

    // ============ 商家端接口 ============

    @Get()
    async findAll(@Request() req) {
        const cards = await this.bankCardsService.findAllByMerchant(req.user.userId);
        return { success: true, data: cards };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const card = await this.bankCardsService.findOne(id, req.user.userId);
        if (!card) {
            return { success: false, message: '银行卡不存在' };
        }
        return { success: true, data: card };
    }

    @Post()
    async create(@Body() createDto: CreateMerchantBankCardDto, @Request() req) {
        try {
            const card = await this.bankCardsService.create(req.user.userId, createDto);
            return {
                success: true,
                message: '银行卡添加成功，等待审核',
                data: card
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateMerchantBankCardDto,
        @Request() req
    ) {
        try {
            const card = await this.bankCardsService.update(id, req.user.userId, updateDto);
            return {
                success: true,
                message: '银行卡更新成功',
                data: card
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        try {
            await this.bankCardsService.delete(id, req.user.userId);
            return {
                success: true,
                message: '银行卡删除成功'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/set-default')
    async setDefault(@Param('id') id: string, @Request() req) {
        try {
            const card = await this.bankCardsService.setDefault(id, req.user.userId);
            return {
                success: true,
                message: '已设为默认银行卡',
                data: card
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============ 管理员接口 ============

    @Get('admin/pending')
    async getPending(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const result = await this.bankCardsService.getPendingCards(
            parseInt(page || '1'),
            parseInt(limit || '20')
        );
        return { success: true, ...result };
    }

    @Get('admin/list')
    async getAllCards(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('merchantId') merchantId?: string,
        @Query('status') status?: string
    ) {
        const filters: any = {};
        if (merchantId) filters.merchantId = merchantId;
        if (status !== undefined) filters.status = parseInt(status) as MerchantBankCardStatus;

        const result = await this.bankCardsService.getAllCards(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            filters
        );
        return { success: true, ...result };
    }

    @Post('admin/:id/review')
    async review(
        @Param('id') id: string,
        @Body() body: { approved: boolean; rejectReason?: string }
    ) {
        try {
            const card = await this.bankCardsService.reviewCard(
                id,
                body.approved,
                body.rejectReason
            );
            return {
                success: true,
                message: body.approved ? '银行卡审核通过' : '银行卡审核拒绝',
                data: card
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}
