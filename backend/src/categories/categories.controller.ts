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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './category.entity';

// 注意：Platform 相关接口已迁移到 admin-config 模块的 PlatformController

@Controller()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // ============ 分类接口 ============

  /**
   * 获取分类树
   */
  @Get('categories/tree')
  async getCategoryTree(@Query('type') type: string) {
    const categoryType =
      (parseInt(type, 10) as CategoryType) || CategoryType.GOODS;
    const tree = await this.categoriesService.getCategoryTree(categoryType);
    return { success: true, data: tree };
  }

  /**
   * 获取分类列表
   */
  @Get('categories')
  async getCategories(@Query('type') type: string) {
    const categoryType =
      (parseInt(type, 10) as CategoryType) || CategoryType.GOODS;
    const categories =
      await this.categoriesService.getAllCategories(categoryType);
    return { success: true, data: categories };
  }

  /**
   * 获取分类详情
   */
  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string) {
    const category = await this.categoriesService.getCategoryById(id);
    if (!category) {
      return { success: false, message: '分类不存在' };
    }
    return { success: true, data: category };
  }

  /**
   * 创建分类
   */
  @Post('admin/categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.createCategory(dto);
    return { success: true, message: '分类创建成功', data: category };
  }

  /**
   * 更新分类
   */
  @Put('admin/categories/:id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.updateCategory(id, dto);
    if (!category) {
      return { success: false, message: '分类不存在' };
    }
    return { success: true, message: '分类更新成功', data: category };
  }

  /**
   * 删除分类
   */
  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCategory(@Param('id') id: string) {
    const result = await this.categoriesService.deleteCategory(id);
    if (!result) {
      return { success: false, message: '删除失败' };
    }
    return { success: true, message: '分类已删除' };
  }

  /**
   * 移动分类
   */
  @Put('admin/categories/:id/move')
  @UseGuards(JwtAuthGuard)
  async moveCategory(
    @Param('id') id: string,
    @Body() body: { parentId: string | null },
  ) {
    const category = await this.categoriesService.moveCategory(
      id,
      body.parentId,
    );
    if (!category) {
      return { success: false, message: '分类不存在' };
    }
    return { success: true, message: '分类移动成功', data: category };
  }

  /**
   * 初始化默认商品分类
   */
  @Post('admin/categories/init-defaults')
  @UseGuards(JwtAuthGuard)
  async initDefaults() {
    await this.categoriesService.initDefaultGoodsCategories();
    return { success: true, message: '默认分类初始化成功' };
  }
}
