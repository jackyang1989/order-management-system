import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  BankCard,
  BankCardStatus,
  BankCardOwnerType,
  CreateBankCardDto,
  UpdateBankCardDto,
} from './bank-card.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Injectable()
export class BankCardsService {
  constructor(
    @InjectRepository(BankCard)
    private bankCardsRepository: Repository<BankCard>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  async findAllByUser(userId: string): Promise<BankCard[]> {
    return this.bankCardsRepository.find({
      where: {
        userId,
        status: In([BankCardStatus.PENDING, BankCardStatus.APPROVED]),
      },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BankCard | null> {
    return this.bankCardsRepository.findOne({
      where: { id, userId },
    });
  }

  async findDefault(userId: string): Promise<BankCard | null> {
    return this.bankCardsRepository.findOne({
      where: { userId, isDefault: true, status: BankCardStatus.APPROVED },
    });
  }

  async create(
    userId: string,
    createDto: CreateBankCardDto,
  ): Promise<BankCard> {
    // 检查卡号是否已存在
    const existing = await this.bankCardsRepository.findOne({
      where: { cardNumber: createDto.cardNumber },
    });
    if (existing) {
      throw new BadRequestException('该银行卡已被绑定');
    }

    // 检查是否是第一张卡（设为默认）
    const count = await this.bankCardsRepository.count({
      where: { userId, status: BankCardStatus.APPROVED },
    });

    const bankCard = this.bankCardsRepository.create({
      userId,
      bankName: createDto.bankName,
      accountName: createDto.accountName,
      cardNumber: createDto.cardNumber,
      phone: createDto.phone,
      province: createDto.province,
      city: createDto.city,
      branchName: createDto.branchName,
      idCard: createDto.idCard,
      idCardFrontImage: createDto.idCardFrontImage,
      idCardBackImage: createDto.idCardBackImage,
      isDefault: count === 0, // 第一张卡设为默认
      status: BankCardStatus.PENDING, // 提交后待审核
    });

    return this.bankCardsRepository.save(bankCard);
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBankCardDto,
  ): Promise<BankCard> {
    const card = await this.bankCardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }

    Object.assign(card, updateDto);
    return this.bankCardsRepository.save(card);
  }

  async setDefault(id: string, userId: string): Promise<BankCard> {
    const card = await this.bankCardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }

    // 取消其他默认卡
    await this.bankCardsRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // 设置新的默认卡
    card.isDefault = true;
    return this.bankCardsRepository.save(card);
  }

  async delete(id: string, userId: string): Promise<void> {
    const card = await this.bankCardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }

    // 软删除
    card.status = BankCardStatus.DELETED;
    await this.bankCardsRepository.save(card);
  }

  // ============ 管理员接口 ============

  async findAllForAdmin(options: {
    page?: number;
    limit?: number;
    status?: BankCardStatus;
    keyword?: string;
  }): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, status, keyword } = options;

    const query = this.bankCardsRepository.createQueryBuilder('card');

    // 不显示已删除的
    query.andWhere('card.status != :deleted', {
      deleted: BankCardStatus.DELETED,
    });

    if (status !== undefined) {
      query.andWhere('card.status = :status', { status });
    }

    if (keyword) {
      query.andWhere(
        '(card.accountName LIKE :keyword OR card.cardNumber LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    query.orderBy('card.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [cards, total] = await query.getManyAndCount();

    // Enrich with username from User or Merchant based on ownerType
    const data = await Promise.all(
      cards.map(async (card) => {
        let username = '';
        let userType = 1; // 1=buyer, 2=merchant
        if (card.ownerType === BankCardOwnerType.MERCHANT) {
          const merchant = await this.merchantRepository.findOne({
            where: { id: card.ownerId || card.userId },
            select: ['username'],
          });
          username = merchant?.username || '';
          userType = 2;
        } else {
          const user = await this.userRepository.findOne({
            where: { id: card.ownerId || card.userId },
            select: ['username'],
          });
          username = user?.username || '';
          userType = 1;
        }
        return {
          ...card,
          username,
          userType,
        };
      }),
    );

    return { data, total };
  }

  async findOneForAdmin(id: string): Promise<BankCard | null> {
    return this.bankCardsRepository.findOne({ where: { id } });
  }

  async approve(id: string): Promise<BankCard> {
    const card = await this.bankCardsRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }
    card.status = BankCardStatus.APPROVED;
    card.rejectReason = undefined;
    return this.bankCardsRepository.save(card);
  }

  async reject(id: string, reason: string): Promise<BankCard> {
    const card = await this.bankCardsRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }
    card.status = BankCardStatus.REJECTED;
    card.rejectReason = reason;
    return this.bankCardsRepository.save(card);
  }

  async deleteByAdmin(id: string): Promise<void> {
    const card = await this.bankCardsRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException('银行卡不存在');
    }
    card.status = BankCardStatus.DELETED;
    await this.bankCardsRepository.save(card);
  }
}
