import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Length,
  Matches,
} from 'class-validator';

// 验证码类型
export enum SmsCodeType {
  REGISTER = 'register', // 注册
  LOGIN = 'login', // 登录
  RESET_PASSWORD = 'reset_pwd', // 重置密码
  BIND_PHONE = 'bind_phone', // 绑定手机
  WITHDRAW = 'withdraw', // 提现验证
  CHANGE_PHONE = 'change_phone', // 更换手机
  IDENTITY = 'identity', // 身份验证
}

// 验证码状态
export enum SmsCodeStatus {
  PENDING = 0, // 待使用
  USED = 1, // 已使用
  EXPIRED = 2, // 已过期
}

@Entity('sms_codes')
@Index(['phone', 'type', 'status'])
export class SmsCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  @Index()
  phone: string; // 手机号

  @Column({ length: 6 })
  code: string; // 验证码

  @Column({ length: 20 })
  type: SmsCodeType; // 验证码类型

  @Column({ type: 'int', default: SmsCodeStatus.PENDING })
  status: SmsCodeStatus; // 状态

  @Column({ type: 'timestamp' })
  expireAt: Date; // 过期时间

  @Column({ length: 50, nullable: true })
  ip: string; // 请求IP

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date; // 使用时间

  @CreateDateColumn()
  createdAt: Date;
}

// 短信发送记录
@Entity('sms_logs')
export class SmsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  @Index()
  phone: string; // 手机号

  @Column({ length: 20 })
  type: SmsCodeType; // 类型

  @Column({ type: 'text' })
  content: string; // 发送内容

  @Column({ length: 50, nullable: true })
  provider: string; // 短信服务商

  @Column({ length: 100, nullable: true })
  msgId: string; // 服务商返回的消息ID

  @Column({ default: false })
  success: boolean; // 是否发送成功

  @Column({ type: 'text', nullable: true })
  errorMsg: string; // 错误信息

  @Column({ length: 50, nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class SendSmsCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsEnum(SmsCodeType)
  type: SmsCodeType;
}

export class VerifySmsCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '验证码必须为6位' })
  code: string;

  @IsEnum(SmsCodeType)
  type: SmsCodeType;
}
