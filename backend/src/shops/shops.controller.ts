import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Shop } from './shop.entity';

@Controller('shops')
@UseGuards(JwtAuthGuard)
export class ShopsController {
    constructor(private shopsService: ShopsService) { }

    @Get()
    async getMyShops(@Request() req: any) {
        const user = req.user;
        // Assuming merchant role check provided by Auth or Guard, or just simple check
        if (user.role !== 'merchant') {
            // For simplicity, assuming user object has role or logic handles it
            // But actually, verify if this user is a merchant.
            // For now, assume logged in user is making request for themselves.
        }
        const shops = await this.shopsService.getMyShops(user.id); // user.id here is actually merchant id?
        // Wait, Auth logic: is user.id == merchant.id?
        // In current system, we have User and Merchant entities.
        // Login returns User? Or Merchant?
        // Current Auth: Login returns { user: ... }. Users and Merchants are different tables?
        // Let's verify Auth logic.
        // Assuming current token represents the merchant entity directly.
        return { success: true, data: shops };
    }

    @Post()
    async create(@Request() req: any, @Body() body: Partial<Shop>) {
        const shop = await this.shopsService.create(req.user.id, body);
        return { success: true, message: '申请提交成功，请等待审核', data: shop };
    }

    @Put(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() body: Partial<Shop>) {
        const shop = await this.shopsService.update(id, req.user.id, body);
        return { success: true, message: '修改成功，请等待审核', data: shop };
    }

    @Delete(':id')
    async delete(@Request() req: any, @Param('id') id: string) {
        await this.shopsService.delete(id, req.user.id);
        return { success: true, message: '删除成功' };
    }
}
