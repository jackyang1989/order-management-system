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
import { MerchantsService } from './merchants.service';
import { Merchant, MerchantStatus } from './merchant.entity';
import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs for Admin
export class MerchantQueryDto {
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
    keyword?: string;

    @IsOptional()
    status?: MerchantStatus;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}

export class AdjustMerchantBalanceDto {
    @IsIn(['balance', 'silver'])
    type: 'balance' | 'silver';

    @IsIn(['add', 'deduct'])
    action: 'add' | 'deduct';

    @Type(() => Number)
    @IsNumber()
    amount: number;

    @IsString()
    reason: string;
}

@Controller('admin/merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class MerchantsAdminController {
    constructor(private readonly merchantsService: MerchantsService) { }

    @Get()
    async findAll(@Query() query: MerchantQueryDto) {
        const result = await this.merchantsService.findAll(query);
        return { success: true, ...result };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const merchant = await this.merchantsService.findOne(id);
        return { success: true, data: merchant };
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string) {
        const stats = await this.merchantsService.getStats(id);
        return { success: true, data: stats };
    }

    @Post(':id/balance')
    async adjustBalance(@Param('id') id: string, @Body() dto: AdjustMerchantBalanceDto) {
        if (dto.amount <= 0) {
            throw new BadRequestException('金额必须大于0');
        }
        const merchant = await this.merchantsService.adjustMerchantBalance(
            id,
            dto.type,
            dto.action,
            dto.amount,
            dto.reason
        );
        return { success: true, data: merchant, message: '余额已调整' };
    }

    @Post(':id/ban')
    async banMerchant(@Param('id') id: string, @Body() body: { reason: string }) {
        await this.merchantsService.banMerchant(id, body.reason);
        return { success: true, message: '商家已禁用' };
    }

    @Post(':id/unban')
    async unbanMerchant(@Param('id') id: string) {
        await this.merchantsService.unbanMerchant(id);
        return { success: true, message: '商家已启用' };
    }

    @Post(':id/vip')
    async setVip(@Param('id') id: string, @Body() body: { days: number }) {
        await this.merchantsService.setVip(id, body.days);
        return { success: true, message: 'VIP已设置' };
    }

    @Post(':id/remove-vip')
    async removeVip(@Param('id') id: string) {
        await this.merchantsService.removeVip(id);
        return { success: true, message: 'VIP已取消' };
    }
}
