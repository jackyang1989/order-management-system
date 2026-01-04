import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, IsNull } from 'typeorm';
import {
  Category,
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './category.entity';

// Platform 管理已迁移到 admin-config/platform.service.ts

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: TreeRepository<Category>,
  ) {}

  // ============ 分类管理 ============

  /**
   * 创建分类
   */
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...dto,
      level: 0,
    });

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (parent) {
        category.parent = parent;
        category.level = parent.level + 1;
      }
    }

    return this.categoryRepository.save(category);
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(type: CategoryType): Promise<Category[]> {
    const roots = await this.categoryRepository.find({
      where: {
        type,
        parentId: IsNull(),
        isActive: true,
      },
      order: { sort: 'ASC' },
    });

    // 递归获取子分类
    for (const root of roots) {
      root.children = await this.getChildren(root.id, type);
    }

    return roots;
  }

  /**
   * 递归获取子分类
   */
  private async getChildren(
    parentId: string,
    type: CategoryType,
  ): Promise<Category[]> {
    const children = await this.categoryRepository.find({
      where: {
        type,
        parentId,
        isActive: true,
      },
      order: { sort: 'ASC' },
    });

    for (const child of children) {
      child.children = await this.getChildren(child.id, type);
    }

    return children;
  }

  /**
   * 获取所有分类（扁平列表）
   */
  async getAllCategories(
    type: CategoryType,
    onlyActive: boolean = true,
  ): Promise<Category[]> {
    const where: any = { type };
    if (onlyActive) {
      where.isActive = true;
    }
    return this.categoryRepository.find({
      where,
      order: { level: 'ASC', sort: 'ASC' },
    });
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
  }

  /**
   * 更新分类
   */
  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category | null> {
    const category = await this.getCategoryById(id);
    if (!category) {
      return null;
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  /**
   * 删除分类（软删除，设为不可用）
   */
  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.categoryRepository.update(id, {
      isActive: false,
    });
    return (result.affected || 0) > 0;
  }

  /**
   * 移动分类
   */
  async moveCategory(
    id: string,
    newParentId: string | null,
  ): Promise<Category | null> {
    const category = await this.getCategoryById(id);
    if (!category) {
      return null;
    }

    if (newParentId) {
      const newParent = await this.categoryRepository.findOne({
        where: { id: newParentId },
      });
      if (newParent) {
        category.parent = newParent;
        category.parentId = newParentId;
        category.level = newParent.level + 1;
      }
    } else {
      category.parent = null as any;
      category.parentId = null as any;
      category.level = 0;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * 初始化默认商品分类
   */
  async initDefaultGoodsCategories(): Promise<void> {
    const categories = [
      { name: '服装鞋帽', sort: 1 },
      { name: '美妆护肤', sort: 2 },
      { name: '数码电器', sort: 3 },
      { name: '食品生鲜', sort: 4 },
      { name: '家居家装', sort: 5 },
      { name: '母婴用品', sort: 6 },
      { name: '运动户外', sort: 7 },
      { name: '图书文具', sort: 8 },
      { name: '珠宝饰品', sort: 9 },
      { name: '其他', sort: 99 },
    ];

    for (const c of categories) {
      const exists = await this.categoryRepository.findOne({
        where: { type: CategoryType.GOODS, name: c.name },
      });
      if (!exists) {
        await this.categoryRepository.save(
          this.categoryRepository.create({
            type: CategoryType.GOODS,
            ...c,
          }),
        );
      }
    }
  }
}
