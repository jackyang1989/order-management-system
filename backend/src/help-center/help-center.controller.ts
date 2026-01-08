import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { HelpCenterService } from './help-center.service';
import {
  ArticleType,
  CreateHelpArticleDto,
  UpdateHelpArticleDto,
} from './help-article.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

/**
 * 帮助中心公开接口
 */
@Controller('help')
export class HelpCenterController {
  constructor(private readonly helpService: HelpCenterService) {}

  /**
   * 获取已发布文章列表（按类型分组）
   */
  @Get()
  async getPublishedArticles() {
    const data = await this.helpService.getPublishedArticles();
    return { success: true, data };
  }

  /**
   * 获取公告列表
   */
  @Get('announcements')
  async getAnnouncements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.helpService.getArticlesByType(
      ArticleType.ANNOUNCEMENT,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
    return { success: true, data };
  }

  /**
   * 获取常见问题列表
   */
  @Get('faqs')
  async getFaqs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.helpService.getArticlesByType(
      ArticleType.FAQ,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
    return { success: true, data };
  }

  /**
   * 获取使用指南列表
   */
  @Get('guides')
  async getGuides(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.helpService.getArticlesByType(
      ArticleType.GUIDE,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
    return { success: true, data };
  }

  /**
   * 搜索文章
   */
  @Get('search')
  async searchArticles(
    @Query('keyword') keyword: string,
    @Query('type') type?: ArticleType,
  ) {
    const data = await this.helpService.searchArticles(keyword, type);
    return { success: true, data };
  }

  /**
   * 获取文章详情
   */
  @Get(':id')
  async getArticle(@Param('id') id: string) {
    const data = await this.helpService.getArticle(id);
    if (!data) {
      return { success: false, message: '文章不存在' };
    }
    return { success: true, data };
  }
}

/**
 * 帮助中心管理接口
 */
@Controller('admin/help')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HelpCenterAdminController {
  constructor(private readonly helpService: HelpCenterService) {}

  /**
   * 获取所有文章
   */
  @Get()
  async getAllArticles(
    @Query('type') type?: ArticleType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.helpService.getAllArticles(
      type,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data };
  }

  /**
   * 创建文章
   */
  @Post()
  async createArticle(@Body() dto: CreateHelpArticleDto) {
    const data = await this.helpService.createArticle(dto);
    return { success: true, data, message: '创建成功' };
  }

  /**
   * 更新文章
   */
  @Put(':id')
  async updateArticle(
    @Param('id') id: string,
    @Body() dto: UpdateHelpArticleDto,
  ) {
    const data = await this.helpService.updateArticle(id, dto);
    if (!data) {
      return { success: false, message: '文章不存在' };
    }
    return { success: true, data, message: '更新成功' };
  }

  /**
   * 删除文章
   */
  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    const deleted = await this.helpService.deleteArticle(id);
    return {
      success: deleted,
      message: deleted ? '删除成功' : '删除失败',
    };
  }

  /**
   * 切换发布状态
   */
  @Put(':id/toggle-publish')
  async togglePublish(@Param('id') id: string) {
    const data = await this.helpService.togglePublish(id);
    if (!data) {
      return { success: false, message: '文章不存在' };
    }
    return {
      success: true,
      data,
      message: data.isPublished ? '已发布' : '已取消发布',
    };
  }
}
