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
  Request,
} from '@nestjs/common';
import { GoodsService } from './goods.service';
import { CreateGoodsDto, UpdateGoodsDto, GoodsFilterDto } from './goods.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goods')
@UseGuards(JwtAuthGuard)
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  @Get()
  async findAll(@Request() req, @Query() filter: GoodsFilterDto) {
    const sellerId = req.user.sub;
    const result = await this.goodsService.findAll(sellerId, filter);
    return { success: true, ...result };
  }

  @Get('shop/:shopId')
  async findByShop(@Request() req, @Param('shopId') shopId: string) {
    const goods = await this.goodsService.findByShop(shopId);
    return { success: true, data: goods };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.sub;
    const goods = await this.goodsService.findOne(id, sellerId);
    if (!goods) {
      return { success: false, message: '商品不存在' };
    }
    return { success: true, data: goods };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateGoodsDto) {
    const sellerId = req.user.sub;
    const goods = await this.goodsService.create(sellerId, dto);
    return { success: true, message: '商品创建成功', data: goods };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateGoodsDto,
  ) {
    const sellerId = req.user.sub;
    const goods = await this.goodsService.update(id, sellerId, dto);
    return { success: true, message: '商品更新成功', data: goods };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.sub;
    await this.goodsService.delete(id, sellerId);
    return { success: true, message: '商品删除成功' };
  }
}
