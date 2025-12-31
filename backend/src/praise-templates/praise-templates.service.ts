import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PraiseTemplate, PraiseTemplateType } from './praise-template.entity';

@Injectable()
export class PraiseTemplatesService {
    constructor(
        @InjectRepository(PraiseTemplate)
        private templateRepository: Repository<PraiseTemplate>,
    ) { }

    /**
     * 创建好评模板
     */
    async create(
        merchantId: string,
        data: {
            type: PraiseTemplateType;
            name?: string;
            content?: string;
            images?: string[];
            videoUrl?: string;
            videoCover?: string;
        },
    ): Promise<PraiseTemplate> {
        // 验证类型和内容匹配
        if (data.type === PraiseTemplateType.TEXT && !data.content) {
            throw new BadRequestException('文字好评模板需要提供好评内容');
        }
        if (data.type === PraiseTemplateType.IMAGE && (!data.images || data.images.length === 0)) {
            throw new BadRequestException('图片好评模板需要提供图片');
        }
        if (data.type === PraiseTemplateType.VIDEO && !data.videoUrl) {
            throw new BadRequestException('视频好评模板需要提供视频');
        }

        const template = this.templateRepository.create({
            merchantId,
            type: data.type,
            name: data.name,
            content: data.content,
            images: data.images ? JSON.stringify(data.images) : null,
            videoUrl: data.videoUrl,
            videoCover: data.videoCover,
        });

        return this.templateRepository.save(template);
    }

    /**
     * 获取商家的好评模板列表
     */
    async findAll(
        merchantId: string,
        type?: PraiseTemplateType,
    ): Promise<PraiseTemplate[]> {
        const query = this.templateRepository.createQueryBuilder('template')
            .where('template.merchantId = :merchantId', { merchantId })
            .andWhere('template.isActive = :isActive', { isActive: true });

        if (type) {
            query.andWhere('template.type = :type', { type });
        }

        query.orderBy('template.sortOrder', 'ASC')
            .addOrderBy('template.createdAt', 'DESC');

        return query.getMany();
    }

    /**
     * 获取单个模板
     */
    async findOne(id: string, merchantId: string): Promise<PraiseTemplate> {
        const template = await this.templateRepository.findOne({
            where: { id, merchantId },
        });
        if (!template) {
            throw new NotFoundException('模板不存在');
        }
        return template;
    }

    /**
     * 更新模板
     */
    async update(
        id: string,
        merchantId: string,
        data: Partial<{
            name: string;
            content: string;
            images: string[];
            videoUrl: string;
            videoCover: string;
            sortOrder: number;
        }>,
    ): Promise<PraiseTemplate> {
        const template = await this.findOne(id, merchantId);

        if (data.name !== undefined) template.name = data.name;
        if (data.content !== undefined) template.content = data.content;
        if (data.images !== undefined) template.images = JSON.stringify(data.images);
        if (data.videoUrl !== undefined) template.videoUrl = data.videoUrl;
        if (data.videoCover !== undefined) template.videoCover = data.videoCover;
        if (data.sortOrder !== undefined) template.sortOrder = data.sortOrder;

        return this.templateRepository.save(template);
    }

    /**
     * 删除模板（软删除）
     */
    async remove(id: string, merchantId: string): Promise<void> {
        const template = await this.findOne(id, merchantId);
        template.isActive = false;
        await this.templateRepository.save(template);
    }

    /**
     * 增加使用次数
     */
    async incrementUsage(id: string): Promise<void> {
        await this.templateRepository.increment({ id }, 'usageCount', 1);
    }

    /**
     * 随机获取一个模板
     */
    async getRandomTemplate(
        merchantId: string,
        type: PraiseTemplateType,
    ): Promise<PraiseTemplate | null> {
        const templates = await this.findAll(merchantId, type);
        if (templates.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * templates.length);
        return templates[randomIndex];
    }

    /**
     * 批量导入文字模板
     */
    async batchImportText(
        merchantId: string,
        contents: string[],
    ): Promise<number> {
        let count = 0;
        for (const content of contents) {
            if (content.trim()) {
                await this.create(merchantId, {
                    type: PraiseTemplateType.TEXT,
                    content: content.trim(),
                });
                count++;
            }
        }
        return count;
    }

    /**
     * 批量导入图片模板
     */
    async batchImportImages(
        merchantId: string,
        imageGroups: string[][],
    ): Promise<number> {
        let count = 0;
        for (const images of imageGroups) {
            if (images.length > 0) {
                await this.create(merchantId, {
                    type: PraiseTemplateType.IMAGE,
                    images,
                });
                count++;
            }
        }
        return count;
    }

    /**
     * 获取模板统计
     */
    async getStats(merchantId: string): Promise<{
        textCount: number;
        imageCount: number;
        videoCount: number;
        totalUsage: number;
    }> {
        const [textCount, imageCount, videoCount, totalUsage] = await Promise.all([
            this.templateRepository.count({
                where: { merchantId, type: PraiseTemplateType.TEXT, isActive: true },
            }),
            this.templateRepository.count({
                where: { merchantId, type: PraiseTemplateType.IMAGE, isActive: true },
            }),
            this.templateRepository.count({
                where: { merchantId, type: PraiseTemplateType.VIDEO, isActive: true },
            }),
            this.templateRepository
                .createQueryBuilder('template')
                .where('template.merchantId = :merchantId', { merchantId })
                .select('SUM(template.usageCount)', 'total')
                .getRawOne()
                .then(r => Number(r?.total || 0)),
        ]);

        return { textCount, imageCount, videoCount, totalUsage };
    }
}
