import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerAccount, BuyerAccountStatus, BuyerAccountPlatform, CreateBuyerAccountDto, UpdateBuyerAccountDto } from './buyer-account.entity';

@Injectable()
export class BuyerAccountsService {
    constructor(
        @InjectRepository(BuyerAccount)
        private buyerAccountsRepository: Repository<BuyerAccount>,
    ) { }

    async findAllByUser(userId: string): Promise<BuyerAccount[]> {
        return this.buyerAccountsRepository.find({
            where: { userId, status: BuyerAccountStatus.APPROVED },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string, userId: string): Promise<BuyerAccount | null> {
        return this.buyerAccountsRepository.findOne({
            where: { id, userId }
        });
    }

    async create(userId: string, createDto: CreateBuyerAccountDto): Promise<BuyerAccount> {
        // 检查账号名是否已存在 (全局唯一性校验，防止重复绑定)
        const existing = await this.buyerAccountsRepository.findOne({
            where: {
                platform: createDto.platform || BuyerAccountPlatform.TAOBAO,
                accountName: createDto.accountName,
                status: BuyerAccountStatus.APPROVED // 只检查已审核通过的，防止误拦
            }
        });
        if (existing) {
            throw new BadRequestException('该买号已存在');
        }

        const buyerAccount = this.buyerAccountsRepository.create({
            userId,
            platform: createDto.platform || BuyerAccountPlatform.TAOBAO,
            accountName: createDto.accountName,
            province: createDto.province,
            city: createDto.city,
            district: createDto.district,
            receiverName: createDto.receiverName,
            receiverPhone: createDto.receiverPhone,
            fullAddress: createDto.fullAddress,
            alipayName: createDto.alipayName,
            status: BuyerAccountStatus.APPROVED,  // 暂时自动通过
            star: 2,
        });

        return this.buyerAccountsRepository.save(buyerAccount);
    }

    async update(id: string, userId: string, updateDto: UpdateBuyerAccountDto): Promise<BuyerAccount> {
        const account = await this.buyerAccountsRepository.findOne({
            where: { id, userId }
        });

        if (!account) {
            throw new NotFoundException('买号不存在');
        }

        Object.assign(account, updateDto);
        return this.buyerAccountsRepository.save(account);
    }

    async delete(id: string, userId: string): Promise<void> {
        const account = await this.buyerAccountsRepository.findOne({
            where: { id, userId }
        });

        if (!account) {
            throw new NotFoundException('买号不存在');
        }

        // 软删除
        account.status = BuyerAccountStatus.DELETED;
        await this.buyerAccountsRepository.save(account);
    }

    async getCount(userId: string): Promise<number> {
        return this.buyerAccountsRepository.count({
            where: { userId, status: BuyerAccountStatus.APPROVED }
        });
    }
}
