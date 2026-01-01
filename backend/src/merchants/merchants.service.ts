import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant, CreateMerchantDto, UpdateMerchantDto, MerchantStatus } from './merchant.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { FinanceUserType, FinanceMoneyType } from '../finance-records/finance-record.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MerchantsService {
    constructor(
        @InjectRepository(Merchant)
        private merchantsRepository: Repository<Merchant>,
        private financeRecordsService: FinanceRecordsService,
    ) { }

    async findAll(): Promise<Merchant[]> {
        const merchants = await this.merchantsRepository.find();
        return merchants.map(m => this.sanitize(m));
    }

    async findOne(id: string): Promise<Merchant | null> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        return merchant ? this.sanitize(merchant) : null;
    }

    async findByUsername(username: string): Promise<Merchant | null> {
        return this.merchantsRepository.findOne({ where: { username } });
    }

    async findByPhone(phone: string): Promise<Merchant | null> {
        return this.merchantsRepository.findOne({ where: { phone } });
    }

    async create(dto: CreateMerchantDto): Promise<Merchant> {
        // 检查用户名是否已存在
        const existingUsername = await this.findByUsername(dto.username);
        if (existingUsername) {
            throw new ConflictException('用户名已存在');
        }

        // 检查手机号是否已存在
        const existingPhone = await this.findByPhone(dto.phone);
        if (existingPhone) {
            throw new ConflictException('手机号已被注册');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const merchant = this.merchantsRepository.create({
            username: dto.username,
            password: hashedPassword,
            phone: dto.phone,
            qq: dto.qq || '',
            companyName: dto.companyName || '',
            balance: 0,
            frozenBalance: 0,
            silver: 0,
            status: MerchantStatus.APPROVED, // 默认直接通过，实际可设为 PENDING
        });

        const saved = await this.merchantsRepository.save(merchant);
        return this.sanitize(saved);
    }

    async update(id: string, dto: UpdateMerchantDto): Promise<Merchant | null> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return null;

        Object.assign(merchant, dto);
        const updated = await this.merchantsRepository.save(merchant);
        return this.sanitize(updated);
    }

    async validatePassword(merchant: Merchant, password: string): Promise<boolean> {
        return bcrypt.compare(password, merchant.password);
    }

    // 余额操作
    async addBalance(id: string, amount: number, memo: string): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        merchant.balance = Number(merchant.balance) + amount;
        await this.merchantsRepository.save(merchant);

        // 记录财务流水
        await this.financeRecordsService.recordAdminOperation(
            id,
            FinanceUserType.MERCHANT,
            FinanceMoneyType.BALANCE,
            amount,
            Number(merchant.balance),
            memo,
            'system'
        );
        return true;
    }

    async deductBalance(id: string, amount: number, memo: string): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        if (Number(merchant.balance) < amount) {
            throw new BadRequestException('余额不足');
        }

        merchant.balance = Number(merchant.balance) - amount;
        await this.merchantsRepository.save(merchant);

        // 记录财务流水
        await this.financeRecordsService.recordAdminOperation(
            id,
            FinanceUserType.MERCHANT,
            FinanceMoneyType.BALANCE,
            -amount,
            Number(merchant.balance),
            memo,
            'system'
        );
        return true;
    }

    // 冻结余额（发布任务时预扣）
    async freezeBalance(id: string, amount: number): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        if (Number(merchant.balance) < amount) {
            throw new BadRequestException('余额不足，请先充值');
        }

        merchant.balance = Number(merchant.balance) - amount;
        merchant.frozenBalance = Number(merchant.frozenBalance) + amount;
        await this.merchantsRepository.save(merchant);
        return true;
    }

    // 解冻余额
    async unfreezeBalance(id: string, amount: number): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        merchant.frozenBalance = Number(merchant.frozenBalance) - amount;
        await this.merchantsRepository.save(merchant);
        return true;
    }

    // 银锭操作（用于佣金/服务费）
    async addSilver(id: string, amount: number, memo: string): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        merchant.silver = Number(merchant.silver) + amount;
        await this.merchantsRepository.save(merchant);

        // 记录财务流水
        await this.financeRecordsService.recordAdminOperation(
            id,
            FinanceUserType.MERCHANT,
            FinanceMoneyType.SILVER,
            amount,
            Number(merchant.silver),
            memo,
            'system'
        );
        return true;
    }

    async deductSilver(id: string, amount: number, memo: string): Promise<boolean> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) return false;

        if (Number(merchant.silver) < amount) {
            throw new BadRequestException('银锭不足，请先充值');
        }

        merchant.silver = Number(merchant.silver) - amount;
        await this.merchantsRepository.save(merchant);

        // 记录财务流水
        await this.financeRecordsService.recordAdminOperation(
            id,
            FinanceUserType.MERCHANT,
            FinanceMoneyType.SILVER,
            -amount,
            Number(merchant.silver),
            memo,
            'system'
        );
        return true;
    }

    // 统计数据
    async getStats(id: string): Promise<{
        balance: number;
        frozenBalance: number;
        silver: number;
        totalTasks: number;
        activeTasks: number;
        completedOrders: number;
    }> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) {
            return { balance: 0, frozenBalance: 0, silver: 0, totalTasks: 0, activeTasks: 0, completedOrders: 0 };
        }

        return {
            balance: Number(merchant.balance),
            frozenBalance: Number(merchant.frozenBalance),
            silver: Number(merchant.silver),
            totalTasks: 0,
            activeTasks: 0,
            completedOrders: 0
        };
    }

    private sanitize(merchant: Merchant): Merchant {
        const { password, payPassword, ...sanitized } = merchant;
        return { ...sanitized, password: '', payPassword: '' } as Merchant;
    }
}
