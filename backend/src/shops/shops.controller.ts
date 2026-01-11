import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Shop } from './shop.entity';

@Controller('shops')
@UseGuards(JwtAuthGuard)
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  async getMyShops(@Request() req: any) {
    const sellerId = req.user.merchantId || req.user.userId;
    const shops = await this.shopsService.getMyShops(sellerId);
    return { success: true, data: shops };
  }

  @Post()
  async create(@Request() req: any, @Body() body: Partial<Shop>) {
    const sellerId = req.user.merchantId || req.user.userId;
    const shop = await this.shopsService.create(sellerId, body);
    return { success: true, message: '申请提交成功，请等待审核', data: shop };
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<Shop>,
  ) {
    const sellerId = req.user.merchantId || req.user.userId;
    const shop = await this.shopsService.update(id, sellerId, body);
    return { success: true, message: '修改成功，请等待审核', data: shop };
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const sellerId = req.user.merchantId || req.user.userId;
    await this.shopsService.delete(id, sellerId);
    return { success: true, message: '删除成功' };
  }
}
