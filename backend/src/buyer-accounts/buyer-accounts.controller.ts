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
import { BuyerAccountsService } from './buyer-accounts.service';
import {
  CreateBuyerAccountDto,
  UpdateBuyerAccountDto,
} from './buyer-account.entity';

@Controller('buyer-accounts')
@UseGuards(JwtAuthGuard)
export class BuyerAccountsController {
  constructor(private buyerAccountsService: BuyerAccountsService) {}

  @Get()
  async findAll(@Request() req, @Query('all') all: string) {
    // all=1 时返回所有状态的买号（包含待审核、已拒绝）
    const includeAll = all === '1' || all === 'true';
    const accounts = await this.buyerAccountsService.findAllByUser(
      req.user.userId,
      includeAll,
    );
    return {
      success: true,
      data: accounts,
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const account = await this.buyerAccountsService.findOne(
      id,
      req.user.userId,
    );
    if (!account) {
      return {
        success: false,
        message: '买号不存在',
      };
    }
    return {
      success: true,
      data: account,
    };
  }

  @Post()
  async create(@Request() req, @Body() createDto: CreateBuyerAccountDto) {
    const account = await this.buyerAccountsService.create(
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: '买号提交成功，请等待审核',
      data: account,
    };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateBuyerAccountDto,
  ) {
    const account = await this.buyerAccountsService.update(
      id,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: '买号更新成功',
      data: account,
    };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.buyerAccountsService.delete(id, req.user.userId);
    return {
      success: true,
      message: '买号删除成功',
    };
  }

  @Get(':id/capability')
  async getCapability(@Request() req, @Param('id') id: string) {
    const capability = await this.buyerAccountsService.getAccountCapability(
      id,
      req.user.userId,
    );
    if (!capability) {
      return {
        success: false,
        message: '买号不存在',
      };
    }
    return {
      success: true,
      data: capability,
    };
  }

  @Get(':id/check-eligibility')
  async checkEligibility(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { productPrice: number },
  ) {
    const result = await this.buyerAccountsService.validateTaskEligibility(
      id,
      req.user.userId,
      body.productPrice,
    );
    return {
      success: true,
      data: result,
    };
  }
}
