import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank, CreateBankDto } from './bank.entity';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(Bank)
    private bankRepository: Repository<Bank>,
  ) {}

  async findAll(): Promise<Bank[]> {
    return this.bankRepository.find({
      where: { isActive: true },
      order: { sort: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Bank | null> {
    return this.bankRepository.findOne({ where: { id } });
  }

  async create(createDto: CreateBankDto): Promise<Bank> {
    const bank = this.bankRepository.create(createDto);
    return this.bankRepository.save(bank);
  }

  async update(
    id: string,
    updateDto: Partial<CreateBankDto>,
  ): Promise<Bank | null> {
    const bank = await this.bankRepository.findOne({ where: { id } });
    if (!bank) return null;
    Object.assign(bank, updateDto);
    return this.bankRepository.save(bank);
  }

  async delete(id: string): Promise<void> {
    await this.bankRepository.delete(id);
  }

  async initDefaultBanks(): Promise<void> {
    const count = await this.bankRepository.count();
    if (count > 0) return;

    const defaultBanks = [
      { name: '农业银行', code: 'ABC', sort: 1 },
      { name: '工商银行', code: 'ICBC', sort: 2 },
      { name: '交通银行', code: 'BOCOM', sort: 3 },
      { name: '建设银行', code: 'CCB', sort: 4 },
      { name: '招商银行', code: 'CMB', sort: 5 },
      { name: '中国银行', code: 'BOC', sort: 6 },
      { name: '邮政储蓄银行', code: 'PSBC', sort: 7 },
      { name: '浦发银行', code: 'SPDB', sort: 8 },
      { name: '平安银行', code: 'PAB', sort: 9 },
      { name: '兴业银行', code: 'CIB', sort: 10 },
      { name: '光大银行', code: 'CEB', sort: 11 },
      { name: '民生银行', code: 'CMBC', sort: 12 },
      { name: '中信银行', code: 'CITIC', sort: 13 },
      { name: '华夏银行', code: 'HXB', sort: 14 },
      { name: '广发银行', code: 'GDB', sort: 15 },
    ];

    for (const bank of defaultBanks) {
      await this.bankRepository.save(this.bankRepository.create(bank));
    }
  }
}
