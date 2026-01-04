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
import { MerchantBlacklistService } from './merchant-blacklist.service';
import {
  CreateBlacklistDto,
  UpdateBlacklistDto,
  BlacklistFilterDto,
} from './merchant-blacklist.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('merchant/blacklist')
@UseGuards(JwtAuthGuard)
export class MerchantBlacklistController {
  constructor(private readonly blacklistService: MerchantBlacklistService) {}

  @Get()
  async findAll(@Request() req, @Query() filter: BlacklistFilterDto) {
    const sellerId = req.user.sub;
    const result = await this.blacklistService.findAll(sellerId, filter);
    return { success: true, ...result };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateBlacklistDto) {
    const sellerId = req.user.sub;
    const blacklist = await this.blacklistService.create(sellerId, dto);
    return { success: true, message: '添加成功', data: blacklist };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateBlacklistDto,
  ) {
    const sellerId = req.user.sub;
    const blacklist = await this.blacklistService.update(id, sellerId, dto);
    return { success: true, message: '更新成功', data: blacklist };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.sub;
    await this.blacklistService.delete(id, sellerId);
    return { success: true, message: '删除成功' };
  }

  @Get('check/:accountName')
  async checkBlacklist(
    @Request() req,
    @Param('accountName') accountName: string,
  ) {
    const sellerId = req.user.sub;
    const isBlacklisted = await this.blacklistService.isBlacklisted(
      sellerId,
      accountName,
    );
    return { success: true, data: { isBlacklisted } };
  }
}
