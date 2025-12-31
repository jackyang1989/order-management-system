import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskGoods, TaskKeyword, CreateTaskGoodsDto, CreateTaskKeywordDto } from './task-goods.entity';

@Injectable()
export class TaskGoodsService {
    constructor(
        @InjectRepository(TaskGoods)
        private taskGoodsRepository: Repository<TaskGoods>,
        @InjectRepository(TaskKeyword)
        private taskKeywordRepository: Repository<TaskKeyword>,
    ) { }

    // ============ 任务商品 ============
    async createTaskGoods(taskId: string, dto: CreateTaskGoodsDto): Promise<TaskGoods> {
        const totalPrice = dto.price * (dto.num || 1);
        const taskGoods = this.taskGoodsRepository.create({
            taskId,
            goodsId: dto.goodsId,
            name: dto.name,
            pcImg: dto.pcImg,
            link: dto.link,
            specName: dto.specName,
            specValue: dto.specValue,
            price: dto.price,
            num: dto.num || 1,
            totalPrice,
        });
        return this.taskGoodsRepository.save(taskGoods);
    }

    async createTaskGoodsBatch(taskId: string, items: CreateTaskGoodsDto[]): Promise<TaskGoods[]> {
        const taskGoodsList = items.map(dto => {
            const totalPrice = dto.price * (dto.num || 1);
            return this.taskGoodsRepository.create({
                taskId,
                goodsId: dto.goodsId,
                name: dto.name,
                pcImg: dto.pcImg,
                link: dto.link,
                specName: dto.specName,
                specValue: dto.specValue,
                price: dto.price,
                num: dto.num || 1,
                totalPrice,
            });
        });
        return this.taskGoodsRepository.save(taskGoodsList);
    }

    async findByTaskId(taskId: string): Promise<TaskGoods[]> {
        return this.taskGoodsRepository.find({
            where: { taskId },
            relations: ['goods'],
            order: { createdAt: 'ASC' }
        });
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        await this.taskGoodsRepository.delete({ taskId });
    }

    // 计算任务商品总价
    async calculateTotalPrice(taskId: string): Promise<number> {
        const result = await this.taskGoodsRepository
            .createQueryBuilder('tg')
            .select('SUM(tg.totalPrice)', 'sum')
            .where('tg.taskId = :taskId', { taskId })
            .getRawOne();
        return Number(result?.sum || 0);
    }

    // ============ 任务关键词 ============
    async createTaskKeyword(taskId: string, dto: CreateTaskKeywordDto): Promise<TaskKeyword> {
        const taskKeyword = this.taskKeywordRepository.create({
            taskId,
            ...dto
        });
        return this.taskKeywordRepository.save(taskKeyword);
    }

    async createTaskKeywordBatch(taskId: string, keywords: CreateTaskKeywordDto[]): Promise<TaskKeyword[]> {
        const taskKeywords = keywords.map(dto => this.taskKeywordRepository.create({
            taskId,
            ...dto
        }));
        return this.taskKeywordRepository.save(taskKeywords);
    }

    async findKeywordsByTaskId(taskId: string): Promise<TaskKeyword[]> {
        return this.taskKeywordRepository.find({
            where: { taskId },
            order: { createdAt: 'ASC' }
        });
    }

    async deleteKeywordsByTaskId(taskId: string): Promise<void> {
        await this.taskKeywordRepository.delete({ taskId });
    }
}
