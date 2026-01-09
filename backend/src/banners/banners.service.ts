import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Banner,
  BannerPosition,
  BannerStatus,
  CreateBannerDto,
  UpdateBannerDto,
} from './banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
  ) {}

  async findAll(options?: {
    position?: BannerPosition;
    status?: BannerStatus;
  }): Promise<Banner[]> {
    const query = this.bannersRepository.createQueryBuilder('banner');

    if (options?.position) {
      query.andWhere('banner.position = :position', {
        position: options.position,
      });
    }

    if (options?.status !== undefined) {
      query.andWhere('banner.status = :status', { status: options.status });
    }

    query.orderBy('banner.sort', 'ASC').addOrderBy('banner.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Banner | null> {
    return this.bannersRepository.findOne({ where: { id } });
  }

  async create(createDto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannersRepository.create({
      title: createDto.title,
      imageUrl: createDto.imageUrl,
      linkUrl: createDto.linkUrl,
      position: createDto.position || BannerPosition.HOME,
      sort: createDto.sort || 0,
      status: createDto.status ?? BannerStatus.ENABLED,
    });
    return this.bannersRepository.save(banner);
  }

  async update(id: string, updateDto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    Object.assign(banner, updateDto);
    return this.bannersRepository.save(banner);
  }

  async delete(id: string): Promise<void> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }
    await this.bannersRepository.remove(banner);
  }

  async toggleStatus(id: string): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }
    banner.status =
      banner.status === BannerStatus.ENABLED
        ? BannerStatus.DISABLED
        : BannerStatus.ENABLED;
    return this.bannersRepository.save(banner);
  }
}
