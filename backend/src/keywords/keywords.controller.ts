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
import { KeywordsService } from './keywords.service';
import {
  CreateGoodsKeyDto,
  UpdateGoodsKeyDto,
  CreateKeywordDetailDto,
  UpdateKeywordDetailDto,
} from './keyword.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('keywords')
@UseGuards(JwtAuthGuard)
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  // ============ 关键词方案 ============
  @Get('schemes')
  async findAllSchemes(@Request() req, @Query('shopId') shopId?: string) {
    const sellerId = req.user.merchantId;
    const schemes = await this.keywordsService.findAllSchemes(sellerId, shopId);
    return { success: true, data: schemes };
  }

  @Get('schemes/:id')
  async findSchemeById(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.merchantId;
    const scheme = await this.keywordsService.findSchemeById(id, sellerId);
    if (!scheme) {
      return { success: false, message: '关键词方案不存在' };
    }
    return { success: true, data: scheme };
  }

  @Post('schemes')
  async createScheme(@Request() req, @Body() dto: CreateGoodsKeyDto) {
    const sellerId = req.user.merchantId;
    const scheme = await this.keywordsService.createScheme(sellerId, dto);
    return { success: true, message: '关键词方案创建成功', data: scheme };
  }

  @Put('schemes/:id')
  async updateScheme(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateGoodsKeyDto,
  ) {
    const sellerId = req.user.merchantId;
    const scheme = await this.keywordsService.updateScheme(id, sellerId, dto);
    return { success: true, message: '关键词方案更新成功', data: scheme };
  }

  @Delete('schemes/:id')
  async deleteScheme(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.merchantId;
    await this.keywordsService.deleteScheme(id, sellerId);
    return { success: true, message: '关键词方案删除成功' };
  }

  // ============ 关键词详情 ============
  @Get('schemes/:schemeId/details')
  async findDetailsByScheme(@Param('schemeId') schemeId: string) {
    const details = await this.keywordsService.findDetailsByScheme(schemeId);
    return { success: true, data: details };
  }

  @Post('schemes/:schemeId/details')
  async addKeywordDetail(
    @Request() req,
    @Param('schemeId') schemeId: string,
    @Body() dto: CreateKeywordDetailDto,
  ) {
    const sellerId = req.user.merchantId;
    const detail = await this.keywordsService.addKeywordDetail(
      schemeId,
      sellerId,
      dto,
    );
    return { success: true, message: '关键词添加成功', data: detail };
  }

  @Put('details/:detailId')
  async updateKeywordDetail(
    @Request() req,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateKeywordDetailDto,
  ) {
    const sellerId = req.user.merchantId;
    const detail = await this.keywordsService.updateKeywordDetail(
      detailId,
      sellerId,
      dto,
    );
    return { success: true, message: '关键词更新成功', data: detail };
  }

  @Delete('details/:detailId')
  async deleteKeywordDetail(
    @Request() req,
    @Param('detailId') detailId: string,
  ) {
    const sellerId = req.user.merchantId;
    await this.keywordsService.deleteKeywordDetail(detailId, sellerId);
    return { success: true, message: '关键词删除成功' };
  }
}
