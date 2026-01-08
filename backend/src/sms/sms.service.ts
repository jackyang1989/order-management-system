import { Injectable, Logger } from '@nestjs/common';
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
import { AdminConfigService } from '../admin-config/admin-config.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
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
    private configService: AdminConfigService,
  ) { }

  /**
   * 生成6位随机验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 获取短信模板内容
   */
  private getSmsTemplate(type: SmsCodeType, code: string): string {
    const sign = this.configService.getValue('sms_sign') || '任务系统';
    let template: string;

    switch (type) {
      case SmsCodeType.LOGIN:
        template = this.configService.getValue('sms_template_login') || '您的登录验证码是{code}，5分钟内有效。';
        break;
      case SmsCodeType.REGISTER:
        template = this.configService.getValue('sms_template_register') || '您的注册验证码是{code}，5分钟内有效。';
        break;
      case SmsCodeType.CHANGE_PHONE:
        template = this.configService.getValue('sms_template_change_phone') || '您的手机号变更验证码是{code}，5分钟内有效。';
        break;
      case SmsCodeType.RESET_PASSWORD:
        template = this.configService.getValue('sms_template_change_password') || '您的密码重置验证码是{code}，5分钟内有效。';
        break;
      default:
        template = '您的验证码是{code}，5分钟内有效。';
    }

    return `【${sign}】${template.replace('{code}', code)}`;
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

    // 检查短信服务是否启用
    const smsEnabled = this.configService.getBooleanValue('sms_enabled', false);
    if (!smsEnabled) {
      // 短信未启用时，模拟发送成功
      this.logger.warn(`[SMS] 短信服务未启用，模拟发送验证码到 ${phone}`);
      const code = this.generateCode();
      const expireAt = new Date();
      expireAt.setMinutes(expireAt.getMinutes() + this.CODE_EXPIRE_MINUTES);

      await this.codeRepository.save(
        this.codeRepository.create({ phone, code, type, expireAt, ip }),
      );

      return { success: true, message: '验证码已发送(测试模式)', expireAt };
    }

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

    // 获取短信内容
    const content = this.getSmsTemplate(type, code);
    const sendResult = await this.doSendSms(phone, content, code, type);

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
        message: sendResult.errorMsg || '短信发送失败，请稍后重试',
      };
    }

    return {
      success: true,
      message: '验证码已发送',
      expireAt,
    };
  }

  /**
   * 实际发送短信
   * 支持短信宝和阿里云两种服务商
   */
  private async doSendSms(
    phone: string,
    content: string,
    code: string,
    type: SmsCodeType,
  ): Promise<{
    success: boolean;
    msgId?: string;
    errorMsg?: string;
  }> {
    const provider = this.configService.getValue('sms_provider') || 'smsbao';

    this.logger.log(`[SMS] 使用 ${provider} 发送短信到 ${phone}`);

    try {
      if (provider === 'aliyun') {
        return await this.sendViaAliyun(phone, code);
      } else {
        return await this.sendViaSmsbao(phone, content);
      }
    } catch (error) {
      this.logger.error(`[SMS] 发送失败: ${error.message}`);
      return {
        success: false,
        errorMsg: error.message || '短信发送异常',
      };
    }
  }

  /**
   * 通过短信宝发送短信
   */
  private async sendViaSmsbao(
    phone: string,
    content: string,
  ): Promise<{ success: boolean; msgId?: string; errorMsg?: string }> {
    const username = this.configService.getValue('smsbao_username');
    const password = this.configService.getValue('smsbao_password');

    if (!username || !password) {
      return { success: false, errorMsg: '短信宝配置不完整' };
    }

    try {
      // 短信宝 API: http://api.smsbao.com/sms?u=用户名&p=密码MD5&m=手机号&c=内容
      const url = `http://api.smsbao.com/sms?u=${encodeURIComponent(username)}&p=${password}&m=${phone}&c=${encodeURIComponent(content)}`;

      const response = await fetch(url);
      const result = await response.text();

      // 短信宝返回码: 0=成功, 其他=失败
      const statusCodes: Record<string, string> = {
        '0': '发送成功',
        '30': '密码错误',
        '40': '账号不存在',
        '41': 'IP禁止',
        '42': '账号过期',
        '43': '余额不足',
        '50': '内容含敏感词',
        '51': '手机号格式错误',
      };

      if (result === '0') {
        return { success: true, msgId: `SMSBAO_${Date.now()}` };
      }

      return {
        success: false,
        errorMsg: statusCodes[result] || `短信宝错误码: ${result}`,
      };
    } catch (error) {
      return { success: false, errorMsg: `短信宝请求失败: ${error.message}` };
    }
  }

  /**
   * 通过阿里云发送短信
   */
  private async sendViaAliyun(
    phone: string,
    code: string,
  ): Promise<{ success: boolean; msgId?: string; errorMsg?: string }> {
    const accessKeyId = this.configService.getValue('aliyun_sms_access_key');
    const accessKeySecret = this.configService.getValue('aliyun_sms_access_secret');
    const signName = this.configService.getValue('aliyun_sms_sign_name');
    const templateCode = this.configService.getValue('aliyun_sms_template_code');

    if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
      return { success: false, errorMsg: '阿里云短信配置不完整' };
    }

    try {
      // 阿里云短信 API 签名计算
      const params: Record<string, string> = {
        AccessKeyId: accessKeyId,
        Action: 'SendSms',
        Format: 'JSON',
        PhoneNumbers: phone,
        RegionId: 'cn-hangzhou',
        SignName: signName,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: Math.random().toString(36).substring(2),
        SignatureVersion: '1.0',
        TemplateCode: templateCode,
        TemplateParam: JSON.stringify({ code }),
        Timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
        Version: '2017-05-25',
      };

      // 按字母排序参数
      const sortedKeys = Object.keys(params).sort();
      const canonicalizedQueryString = sortedKeys
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      // 构造签名字符串
      const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;

      // HMAC-SHA1 签名
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha1', accessKeySecret + '&')
        .update(stringToSign)
        .digest('base64');

      params.Signature = signature;

      // 发起请求
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      const url = `https://dysmsapi.aliyuncs.com/?${queryString}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.Code === 'OK') {
        return { success: true, msgId: result.BizId };
      }

      return {
        success: false,
        errorMsg: result.Message || `阿里云错误: ${result.Code}`,
      };
    } catch (error) {
      return { success: false, errorMsg: `阿里云请求失败: ${error.message}` };
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(dto: VerifySmsCodeDto): Promise<{
    success: boolean;
    message: string;
  }> {
    const { phone, code, type } = dto;

    // Backdoor for testing (当短信未启用时)
    const smsEnabled = this.configService.getBooleanValue('sms_enabled', false);
    if (!smsEnabled && code === '123456') {
      return { success: true, message: '通过' };
    }

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
    // 测试模式下 123456 永远有效
    const smsEnabled = this.configService.getBooleanValue('sms_enabled', false);
    if (!smsEnabled && code === '123456') {
      return true;
    }

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
