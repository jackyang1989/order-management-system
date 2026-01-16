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
import { QuestionsService } from './questions.service';
import {
  CreateQuestionSchemeDto,
  UpdateQuestionSchemeDto,
  CreateQuestionDetailDto,
  UpdateQuestionDetailDto,
} from './question.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // ============ 问题模板方案 ============
  @Get('schemes')
  async findAllSchemes(@Request() req, @Query('shopId') shopId?: string) {
    const sellerId = req.user.merchantId;
    const schemes = await this.questionsService.findAllSchemes(sellerId, shopId);
    return { success: true, data: schemes };
  }

  @Get('schemes/:id')
  async findSchemeById(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.merchantId;
    const scheme = await this.questionsService.findSchemeById(id, sellerId);
    if (!scheme) {
      return { success: false, message: '问题模板方案不存在' };
    }
    return { success: true, data: scheme };
  }

  @Post('schemes')
  async createScheme(@Request() req, @Body() dto: CreateQuestionSchemeDto) {
    const sellerId = req.user.merchantId;
    const scheme = await this.questionsService.createScheme(sellerId, dto);
    return { success: true, message: '问题模板方案创建成功', data: scheme };
  }

  @Put('schemes/:id')
  async updateScheme(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionSchemeDto,
  ) {
    const sellerId = req.user.merchantId;
    const scheme = await this.questionsService.updateScheme(id, sellerId, dto);
    return { success: true, message: '问题模板方案更新成功', data: scheme };
  }

  @Delete('schemes/:id')
  async deleteScheme(@Request() req, @Param('id') id: string) {
    const sellerId = req.user.merchantId;
    await this.questionsService.deleteScheme(id, sellerId);
    return { success: true, message: '问题模板方案删除成功' };
  }

  // ============ 问题模板详情 ============
  @Get('schemes/:schemeId/details')
  async findDetailsByScheme(@Param('schemeId') schemeId: string) {
    const details = await this.questionsService.findDetailsByScheme(schemeId);
    return { success: true, data: details };
  }

  @Post('schemes/:schemeId/details')
  async addQuestionDetail(
    @Request() req,
    @Param('schemeId') schemeId: string,
    @Body() dto: CreateQuestionDetailDto,
  ) {
    const sellerId = req.user.merchantId;
    const detail = await this.questionsService.addQuestionDetail(
      schemeId,
      sellerId,
      dto,
    );
    return { success: true, message: '问题模板添加成功', data: detail };
  }

  @Put('details/:detailId')
  async updateQuestionDetail(
    @Request() req,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateQuestionDetailDto,
  ) {
    const sellerId = req.user.merchantId;
    const detail = await this.questionsService.updateQuestionDetail(
      detailId,
      sellerId,
      dto,
    );
    return { success: true, message: '问题模板更新成功', data: detail };
  }

  @Delete('details/:detailId')
  async deleteQuestionDetail(
    @Request() req,
    @Param('detailId') detailId: string,
  ) {
    const sellerId = req.user.merchantId;
    await this.questionsService.deleteQuestionDetail(detailId, sellerId);
    return { success: true, message: '问题模板删除成功' };
  }
}
