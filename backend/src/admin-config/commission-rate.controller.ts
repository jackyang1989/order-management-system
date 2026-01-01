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
import { CommissionRateService } from './commission-rate.service';
import { CommissionRate } from './commission-rate.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/commission-rates')
@UseGuards(JwtAuthGuard)
export class CommissionRateController {
    constructor(private readonly rateService: CommissionRateService) { }

    /**
     * 获取所有佣金比例
     */
    @Get()
    async findAll(@Query('platform') platform?: string) {
        const rates = await this.rateService.findAll(platform);
        return {
            success: true,
            data: rates,
        };
    }

    /**
     * 根据价格获取佣金
     */
    @Get('by-price')
    async getByPrice(
        @Query('price') price: string,
        @Query('platform') platform?: string,
    ) {
        const commission = await this.rateService.getCommissionByPrice(
            parseFloat(price),
            platform,
        );
        return {
            success: true,
            data: commission,
        };
    }

    /**
     * 创建佣金比例
     */
    @Post()
    async create(@Body() data: Partial<CommissionRate>) {
        const rate = await this.rateService.create(data);
        return {
            success: true,
            message: '佣金比例已创建',
            data: rate,
        };
    }

    /**
     * 批量更新佣金比例
     */
    @Put('batch')
    async batchUpdate(@Body('rates') rates: Partial<CommissionRate>[]) {
        const updated = await this.rateService.batchUpdate(rates);
        return {
            success: true,
            message: '佣金比例已更新',
            data: updated,
        };
    }

    /**
     * 更新佣金比例
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: Partial<CommissionRate>,
    ) {
        const rate = await this.rateService.update(id, data);
        return {
            success: true,
            message: '佣金比例已更新',
            data: rate,
        };
    }

    /**
     * 删除佣金比例
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.rateService.delete(id);
        return {
            success: true,
            message: '佣金比例已删除',
        };
    }

    /**
     * 初始化默认佣金比例
     */
    @Post('init')
    async initDefaults() {
        await this.rateService.initDefaultRates();
        return {
            success: true,
            message: '默认佣金比例已初始化',
        };
    }
}
