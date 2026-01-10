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
import { MerchantBlacklistService } from './merchant-blacklist.service';
import { BlacklistFilterDto } from './merchant-blacklist.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/blacklist')
@UseGuards(AdminGuard)
export class AdminBlacklistController {
  constructor(private readonly blacklistService: MerchantBlacklistService) {}

  @Get()
  async findAll(@Query() filter: BlacklistFilterDto) {
    const result = await this.blacklistService.findAllAdmin(filter);
    return { success: true, ...result };
  }

  @Put(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { approved: boolean; adminRemark?: string },
  ) {
    const blacklist = await this.blacklistService.reviewBlacklist(
      id,
      body.approved,
      body.adminRemark,
    );
    return {
      success: true,
      message: body.approved ? '已通过' : '已拒绝',
      data: blacklist,
    };
  }

  @Post('batch-review')
  async batchReview(
    @Body() body: { ids: string[]; approved: boolean; adminRemark?: string },
  ) {
    const result = await this.blacklistService.batchReviewBlacklist(
      body.ids,
      body.approved,
      body.adminRemark,
    );
    return {
      success: true,
      message: `处理完成：成功${result.success}个，失败${result.failed}个`,
      data: result,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.blacklistService.adminDelete(id);
    return { success: true, message: '删除成功' };
  }
}
