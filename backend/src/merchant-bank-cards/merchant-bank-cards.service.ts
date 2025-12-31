import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    MerchantBankCard,
    MerchantBankCardStatus,
    CreateMerchantBankCardDto,
    UpdateMerchantBankCardDto
} from './merchant-bank-card.entity';

@Injectable()
export class MerchantBankCardsService {
    constructor(
        @InjectRepository(MerchantBankCard)
        private bankCardRepository: Repository<MerchantBankCard>,
    ) { }

    async findAllByMerchant(merchantId: string): Promise<MerchantBankCard[]> {
        return this.bankCardRepository.find({
            where: { merchantId, status: MerchantBankCardStatus.APPROVED },
            order: { isDefault: 'DESC', createdAt: 'DESC' }
        });
    }

    async findOne(id: string, merchantId: string): Promise<MerchantBankCard | null> {
        return this.bankCardRepository.findOne({
            where: { id, merchantId }
        });
    }

    async findById(id: string): Promise<MerchantBankCard | null> {
        return this.bankCardRepository.findOne({ where: { id } });
    }

    async create(merchantId: string, createDto: CreateMerchantBankCardDto): Promise<MerchantBankCard> {
        // 检查卡号是否已存在
        const existing = await this.bankCardRepository.findOne({
            where: {
                cardNumber: createDto.cardNumber,
                status: MerchantBankCardStatus.APPROVED
            }
        });
        if (existing) {
            throw new BadRequestException('该银行卡号已被绑定');
        }

        // 检查是否是第一张卡
        const count = await this.bankCardRepository.count({
            where: { merchantId, status: MerchantBankCardStatus.APPROVED }
        });

        const bankCard = this.bankCardRepository.create({
            merchantId,
            ...createDto,
            isDefault: count === 0,  // 第一张卡自动设为默认
            status: MerchantBankCardStatus.PENDING
        });

        return this.bankCardRepository.save(bankCard);
    }

    async update(id: string, merchantId: string, updateDto: UpdateMerchantBankCardDto): Promise<MerchantBankCard> {
        const card = await this.bankCardRepository.findOne({
            where: { id, merchantId }
        });

        if (!card) {
            throw new NotFoundException('银行卡不存在');
        }

        Object.assign(card, updateDto);
        return this.bankCardRepository.save(card);
    }

    async delete(id: string, merchantId: string): Promise<void> {
        const card = await this.bankCardRepository.findOne({
            where: { id, merchantId }
        });

        if (!card) {
            throw new NotFoundException('银行卡不存在');
        }

        card.status = MerchantBankCardStatus.DELETED;
        await this.bankCardRepository.save(card);
    }

    async setDefault(id: string, merchantId: string): Promise<MerchantBankCard> {
        const card = await this.bankCardRepository.findOne({
            where: { id, merchantId, status: MerchantBankCardStatus.APPROVED }
        });

        if (!card) {
            throw new NotFoundException('银行卡不存在');
        }

        // 取消其他默认卡
        await this.bankCardRepository.update(
            { merchantId, isDefault: true },
            { isDefault: false }
        );

        // 设置新默认卡
        card.isDefault = true;
        return this.bankCardRepository.save(card);
    }

    async getDefaultCard(merchantId: string): Promise<MerchantBankCard | null> {
        return this.bankCardRepository.findOne({
            where: { merchantId, isDefault: true, status: MerchantBankCardStatus.APPROVED }
        });
    }

    // ============ 管理员操作 ============

    async getPendingCards(page: number = 1, limit: number = 20): Promise<{
        data: MerchantBankCard[];
        total: number;
        page: number;
        limit: number;
    }> {
        const [data, total] = await this.bankCardRepository.findAndCount({
            where: { status: MerchantBankCardStatus.PENDING },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit
        });

        return { data, total, page, limit };
    }

    async reviewCard(
        id: string,
        approved: boolean,
        rejectReason?: string
    ): Promise<MerchantBankCard> {
        const card = await this.bankCardRepository.findOne({ where: { id } });
        if (!card) {
            throw new NotFoundException('银行卡不存在');
        }

        if (card.status !== MerchantBankCardStatus.PENDING) {
            throw new BadRequestException('该银行卡已审核');
        }

        if (approved) {
            card.status = MerchantBankCardStatus.APPROVED;
            card.rejectReason = undefined;

            // 如果是第一张通过的卡，设为默认
            const approvedCount = await this.bankCardRepository.count({
                where: { merchantId: card.merchantId, status: MerchantBankCardStatus.APPROVED }
            });
            if (approvedCount === 0) {
                card.isDefault = true;
            }
        } else {
            card.status = MerchantBankCardStatus.REJECTED;
            card.rejectReason = rejectReason || '审核未通过';
        }

        return this.bankCardRepository.save(card);
    }

    async getAllCards(
        page: number = 1,
        limit: number = 20,
        filters?: { merchantId?: string; status?: MerchantBankCardStatus }
    ): Promise<{
        data: MerchantBankCard[];
        total: number;
        page: number;
        limit: number;
    }> {
        const where: any = {};
        if (filters?.merchantId) {
            where.merchantId = filters.merchantId;
        }
        if (filters?.status !== undefined) {
            where.status = filters.status;
        }

        const [data, total] = await this.bankCardRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });

        return { data, total, page, limit };
    }
}
