import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto, WithdrawalType } from './withdrawal.entity';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
    constructor(private withdrawalsService: WithdrawalsService) { }

    @Get()
    async findAll(@Request() req) {
        const withdrawals = await this.withdrawalsService.findAllByUser(req.user.userId);
        return {
            success: true,
            data: withdrawals
        };
    }

    @Get('stats')
    async getStats(@Request() req) {
        const stats = await this.withdrawalsService.getStats(req.user.userId);
        return {
            success: true,
            data: stats
        };
    }

    // 获取提现配置（供前端显示手续费规则）
    @Get('config')
    async getConfig() {
        const config = await this.withdrawalsService.getWithdrawalConfig();
        return {
            success: true,
            data: config
        };
    }

    // 计算手续费（用于前端预览）
    @Get('calculate-fee')
    async calculateFee(
        @Query('amount') amount: string,
        @Query('type') type: string
    ) {
        const amountNum = parseFloat(amount) || 0;
        const withdrawalType = type === 'SILVER' ? WithdrawalType.SILVER : WithdrawalType.BALANCE;
        const result = await this.withdrawalsService.calculateWithdrawalFee(amountNum, withdrawalType);
        return {
            success: true,
            data: result
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const withdrawal = await this.withdrawalsService.findOne(id);
        if (!withdrawal) {
            return {
                success: false,
                message: '提现记录不存在'
            };
        }
        return {
            success: true,
            data: withdrawal
        };
    }

    @Post()
    async create(@Request() req, @Body() createDto: CreateWithdrawalDto) {
        const withdrawal = await this.withdrawalsService.create(req.user.userId, createDto);
        return {
            success: true,
            message: '提现申请已提交',
            data: withdrawal
        };
    }
}
