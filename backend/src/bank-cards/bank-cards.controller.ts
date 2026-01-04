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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';
import { BankCardsService } from './bank-cards.service';
import {
  CreateBankCardDto,
  UpdateBankCardDto,
  BankCardStatus,
} from './bank-card.entity';

@Controller('bank-cards')
export class BankCardsController {
  constructor(private bankCardsService: BankCardsService) {}

  // ============ 管理员接口 ============

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('finance:bank')
  async findAllForAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.bankCardsService.findAllForAdmin({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      status:
        status !== undefined && status !== ''
          ? (parseInt(status) as BankCardStatus)
          : undefined,
      keyword,
    });
    return { success: true, ...result };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('finance:bank')
  async findOneAdmin(@Param('id') id: string) {
    const card = await this.bankCardsService.findOneForAdmin(id);
    if (!card) {
      return { success: false, message: '银行卡不存在' };
    }
    return { success: true, data: card };
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('finance:bank')
  async approve(@Param('id') id: string) {
    const card = await this.bankCardsService.approve(id);
    return { success: true, message: '审核通过', data: card };
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequirePermissions('finance:bank')
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    const card = await this.bankCardsService.reject(id, reason || '审核不通过');
    return { success: true, message: '已拒绝', data: card };
  }

  // ============ 用户接口 ============

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    const cards = await this.bankCardsService.findAllByUser(req.user.userId);
    return {
      success: true,
      data: cards,
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const card = await this.bankCardsService.findOne(id, req.user.userId);
    if (!card) {
      return {
        success: false,
        message: '银行卡不存在',
      };
    }
    return {
      success: true,
      data: card,
    };
  }

  @Post()
  async create(@Request() req, @Body() createDto: CreateBankCardDto) {
    const card = await this.bankCardsService.create(req.user.userId, createDto);
    return {
      success: true,
      message: '银行卡绑定成功',
      data: card,
    };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateBankCardDto,
  ) {
    const card = await this.bankCardsService.update(
      id,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: '银行卡更新成功',
      data: card,
    };
  }

  @Put(':id/default')
  async setDefault(@Request() req, @Param('id') id: string) {
    const card = await this.bankCardsService.setDefault(id, req.user.userId);
    return {
      success: true,
      message: '已设为默认银行卡',
      data: card,
    };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.bankCardsService.delete(id, req.user.userId);
    return {
      success: true,
      message: '银行卡解绑成功',
    };
  }
}
