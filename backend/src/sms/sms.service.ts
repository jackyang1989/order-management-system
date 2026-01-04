import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import {
  SmsCode,
  SmsLog,
  SmsCodeType,
  SmsCodeStatus,
  SendSmsCodeDto,
  VerifySmsCodeDto,
} from './sms.entity';

@Injectable()
export class SmsService {
  // 验证码有效期（分钟）
  private readonly CODE_EXPIRE_MINUTES = 5;
  // 同一手机号发送间隔（秒）
  private readonly SEND_INTERVAL_SECONDS = 60;
  // 同一手机号每日最大发送次数
  private readonly DAILY_MAX_SEND = 10;

  constructor(
    @InjectRepository(SmsCode)
    private codeRepository: Repository<SmsCode>,
    @InjectRepository(SmsLog)
    private logRepository: Repository<SmsLog>,
  ) {}

  /**
   * 生成6位随机验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码
   */
  async sendCode(
    dto: SendSmsCodeDto,
    ip?: string,
  ): Promise<{
    success: boolean;
    message: string;
    expireAt?: Date;
  }> {
    const { phone, type } = dto;

    // 检查发送频率
    const lastSend = await this.codeRepository.findOne({
      where: { phone, type },
      order: { createdAt: 'DESC' },
    });

    if (lastSend) {
      const elapsed = (Date.now() - lastSend.createdAt.getTime()) / 1000;
      if (elapsed < this.SEND_INTERVAL_SECONDS) {
        const wait = Math.ceil(this.SEND_INTERVAL_SECONDS - elapsed);
        return {
          success: false,
          message: `请${wait}秒后再试`,
        };
      }
    }

    // 检查每日发送限制
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.codeRepository.count({
      where: {
        phone,
        createdAt: MoreThan(today),
      },
    });

    if (todayCount >= this.DAILY_MAX_SEND) {
      return {
        success: false,
        message: '今日发送次数已达上限',
      };
    }

    // 生成验证码
    const code = this.generateCode();
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + this.CODE_EXPIRE_MINUTES);

    // 保存验证码
    const smsCode = this.codeRepository.create({
      phone,
      code,
      type,
      expireAt,
      ip,
    });
    await this.codeRepository.save(smsCode);

    // 调用短信服务发送（这里模拟发送）
    const content = `【订单管理系统】您的验证码是${code}，${this.CODE_EXPIRE_MINUTES}分钟内有效。`;
    const sendResult = await this.doSendSms(phone, content, type, ip);

    // 记录发送日志
    await this.logRepository.save(
      this.logRepository.create({
        phone,
        type,
        content,
        success: sendResult.success,
        errorMsg: sendResult.errorMsg,
        msgId: sendResult.msgId,
        ip,
      }),
    );

    if (!sendResult.success) {
      return {
        success: false,
        message: '短信发送失败，请稍后重试',
      };
    }

    return {
      success: true,
      message: '验证码已发送',
      expireAt,
    };
  }

  /**
   * 实际发送短信（模拟）
   * 实际项目中对接阿里云、腾讯云等短信服务
   */
  private async doSendSms(
    phone: string,
    content: string,
    type: string,
    ip?: string,
  ): Promise<{
    success: boolean;
    msgId?: string;
    errorMsg?: string;
  }> {
    // 模拟发送成功
    // 实际项目中替换为真实的短信API调用
    console.log(`[SMS] 发送短信到 ${phone}: ${content}`);

    // 模拟 95% 成功率
    const success = Math.random() > 0.05;

    return {
      success,
      msgId: success ? `MSG_${Date.now()}` : undefined,
      errorMsg: success ? undefined : '短信网关繁忙',
    };
  }

  /**
   * 验证验证码
   */
  async verifyCode(dto: VerifySmsCodeDto): Promise<{
    success: boolean;
    message: string;
  }> {
    const { phone, code, type } = dto;

    // 查找有效的验证码
    const smsCode = await this.codeRepository.findOne({
      where: {
        phone,
        type,
        code,
        status: SmsCodeStatus.PENDING,
        expireAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!smsCode) {
      return {
        success: false,
        message: '验证码错误或已过期',
      };
    }

    // 标记为已使用
    smsCode.status = SmsCodeStatus.USED;
    smsCode.usedAt = new Date();
    await this.codeRepository.save(smsCode);

    return {
      success: true,
      message: '验证成功',
    };
  }

  /**
   * 检查验证码是否有效（不消耗）
   */
  async checkCodeValid(
    phone: string,
    code: string,
    type: SmsCodeType,
  ): Promise<boolean> {
    const smsCode = await this.codeRepository.findOne({
      where: {
        phone,
        type,
        code,
        status: SmsCodeStatus.PENDING,
        expireAt: MoreThan(new Date()),
      },
    });
    return !!smsCode;
  }

  /**
   * 清理过期验证码
   */
  async cleanExpiredCodes(): Promise<number> {
    const result = await this.codeRepository.update(
      {
        status: SmsCodeStatus.PENDING,
        expireAt: LessThan(new Date()),
      },
      { status: SmsCodeStatus.EXPIRED },
    );
    return result.affected || 0;
  }

  /**
   * 获取发送日志（管理员）
   */
  async getLogs(
    phone?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: SmsLog[]; total: number }> {
    const queryBuilder = this.logRepository.createQueryBuilder('l');

    if (phone) {
      queryBuilder.where('l.phone = :phone', { phone });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * 获取发送统计（管理员）
   */
  async getStats(): Promise<{
    todayTotal: number;
    todaySuccess: number;
    todayFailed: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.logRepository
      .createQueryBuilder('l')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN l.success = true THEN 1 ELSE 0 END)', 'success')
      .addSelect('SUM(CASE WHEN l.success = false THEN 1 ELSE 0 END)', 'failed')
      .where('l.createdAt >= :today', { today })
      .getRawOne();

    return {
      todayTotal: parseInt(stats.total, 10),
      todaySuccess: parseInt(stats.success, 10),
      todayFailed: parseInt(stats.failed, 10),
    };
  }
}
