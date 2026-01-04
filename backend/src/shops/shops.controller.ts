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
    const user = req.user;
    const shops = await this.shopsService.getMyShops(user.id);
    return { success: true, data: shops };
  }

  @Post()
  async create(@Request() req: any, @Body() body: Partial<Shop>) {
    const shop = await this.shopsService.create(req.user.id, body);
    return { success: true, message: '申请提交成功，请等待审核', data: shop };
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<Shop>,
  ) {
    const shop = await this.shopsService.update(id, req.user.id, body);
    return { success: true, message: '修改成功，请等待审核', data: shop };
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.shopsService.delete(id, req.user.id);
    return { success: true, message: '删除成功' };
  }
}
