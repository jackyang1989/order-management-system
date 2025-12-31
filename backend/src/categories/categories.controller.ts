import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    CategoryType,
    CreateCategoryDto,
    UpdateCategoryDto,
    CreatePlatformDto,
    UpdatePlatformDto,
} from './category.entity';

@Controller()
export class CategoriesController {
    constructor(private categoriesService: CategoriesService) { }

    // ============ 分类接口 ============

    /**
     * 获取分类树
     */
    @Get('categories/tree')
    async getCategoryTree(@Query('type') type: string) {
        const categoryType = parseInt(type, 10) as CategoryType || CategoryType.GOODS;
        const tree = await this.categoriesService.getCategoryTree(categoryType);
        return { success: true, data: tree };
    }

    /**
     * 获取分类列表
     */
    @Get('categories')
    async getCategories(@Query('type') type: string) {
        const categoryType = parseInt(type, 10) as CategoryType || CategoryType.GOODS;
        const categories = await this.categoriesService.getAllCategories(categoryType);
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
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
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
        @Body() body: { parentId: string | null }
    ) {
        const category = await this.categoriesService.moveCategory(id, body.parentId);
        if (!category) {
            return { success: false, message: '分类不存在' };
        }
        return { success: true, message: '分类移动成功', data: category };
    }

    // ============ 平台接口 ============

    /**
     * 获取所有平台
     */
    @Get('platforms')
    async getPlatforms() {
        const platforms = await this.categoriesService.getAllPlatforms();
        return { success: true, data: platforms };
    }

    /**
     * 根据代码获取平台
     */
    @Get('platforms/code/:code')
    async getPlatformByCode(@Param('code') code: string) {
        const platform = await this.categoriesService.getPlatformByCode(code);
        if (!platform) {
            return { success: false, message: '平台不存在' };
        }
        return { success: true, data: platform };
    }

    /**
     * 获取平台详情
     */
    @Get('platforms/:id')
    async getPlatformById(@Param('id') id: string) {
        const platform = await this.categoriesService.getPlatformById(id);
        if (!platform) {
            return { success: false, message: '平台不存在' };
        }
        return { success: true, data: platform };
    }

    /**
     * 创建平台
     */
    @Post('admin/platforms')
    @UseGuards(JwtAuthGuard)
    async createPlatform(@Body() dto: CreatePlatformDto) {
        const platform = await this.categoriesService.createPlatform(dto);
        return { success: true, message: '平台创建成功', data: platform };
    }

    /**
     * 更新平台
     */
    @Put('admin/platforms/:id')
    @UseGuards(JwtAuthGuard)
    async updatePlatform(@Param('id') id: string, @Body() dto: UpdatePlatformDto) {
        const platform = await this.categoriesService.updatePlatform(id, dto);
        if (!platform) {
            return { success: false, message: '平台不存在' };
        }
        return { success: true, message: '平台更新成功', data: platform };
    }

    /**
     * 删除平台
     */
    @Delete('admin/platforms/:id')
    @UseGuards(JwtAuthGuard)
    async deletePlatform(@Param('id') id: string) {
        const result = await this.categoriesService.deletePlatform(id);
        if (!result) {
            return { success: false, message: '删除失败' };
        }
        return { success: true, message: '平台已删除' };
    }

    /**
     * 初始化默认数据
     */
    @Post('admin/init-defaults')
    @UseGuards(JwtAuthGuard)
    async initDefaults() {
        await this.categoriesService.initDefaultPlatforms();
        await this.categoriesService.initDefaultGoodsCategories();
        return { success: true, message: '默认数据初始化成功' };
    }
}
