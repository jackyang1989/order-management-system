import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, LessThan } from 'typeorm';
import {
  OperationLog,
  CreateOperationLogDto,
  QueryOperationLogDto,
  OperationType,
} from './operation-log.entity';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 记录操作日志
   */
  async create(dto: CreateOperationLogDto): Promise<OperationLog> {
    const log = this.operationLogRepository.create({
      module: dto.module,
      type: dto.type,
      action: dto.action,
      operatorId: dto.operatorId,
      operatorName: dto.operatorName,
      ip: dto.ip,
      userAgent: dto.userAgent,
      requestData: dto.requestData
        ? JSON.stringify(dto.requestData)
        : undefined,
      responseData: dto.responseData
        ? JSON.stringify(dto.responseData)
        : undefined,
      success: dto.success ?? true,
      errorMessage: dto.errorMessage,
      duration: dto.duration,
    });
    return this.operationLogRepository.save(log);
  }

  /**
   * 快速记录日志
   */
  async log(
    module: string,
    action: string,
    type: OperationType = OperationType.OTHER,
    extra?: Partial<CreateOperationLogDto>,
  ): Promise<OperationLog> {
    return this.create({
      module,
      action,
      type,
      ...extra,
    });
  }

  /**
   * 查询操作日志列表
   */
  async findAll(
    query: QueryOperationLogDto,
  ): Promise<{ list: OperationLog[]; total: number }> {
    const {
      module,
      type,
      operatorName,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const where: any = {};

    if (module) {
      where.module = module;
    }

    if (type) {
      where.type = type;
    }

    if (operatorName) {
      where.operatorName = Like(`%${operatorName}%`);
    }

    if (startDate && endDate) {
      where.createdAt = Between(
        new Date(startDate),
        new Date(endDate + ' 23:59:59'),
      );
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    const [list, total] = await this.operationLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  /**
   * 获取单条日志详情
   */
  async findOne(id: string): Promise<OperationLog | null> {
    return this.operationLogRepository.findOne({ where: { id } });
  }

  /**
   * 获取可用的模块列表
   */
  async getModules(): Promise<string[]> {
    const result = await this.operationLogRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.module', 'module')
      .getRawMany();
    return result.map((r) => r.module);
  }

  /**
   * 清理指定天数前的日志
   */
  async cleanup(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.operationLogRepository.delete({
      createdAt: LessThan(date),
    });

    return result.affected || 0;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<any> {
    const total = await this.operationLogRepository.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.operationLogRepository.count({
      where: {
        createdAt: Between(today, new Date()),
      },
    });

    const typeStats = await this.operationLogRepository
      .createQueryBuilder('log')
      .select('log.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.type')
      .getRawMany();

    const moduleStats = await this.operationLogRepository
      .createQueryBuilder('log')
      .select('log.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.module')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      todayCount,
      typeStats,
      moduleStats,
    };
  }
}
