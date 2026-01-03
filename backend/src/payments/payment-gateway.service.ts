import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * 支付网关配置
 * 参考原版系统的优云宝支付配置
 */
export interface PaymentGatewayConfig {
    appId: string;          // 商户ID
    appKey: string;         // 商户密钥
    serverUrl: string;      // 支付网关地址
    returnUrl: string;      // 支付成功后跳转地址
    notifyUrl: string;      // 异步回调地址
    enableLocalQr: boolean; // 是否启用本地二维码生成
}

/**
 * 支付请求参数
 */
export interface PaymentRequest {
    orderNo: string;        // 订单号
    amount: number;         // 金额（元）
    payType: 'alipay' | 'wechat' | 'qqpay' | 'unionpay';  // 支付方式
    subject?: string;       // 商品标题
    body?: string;          // 商品描述
    clientIp?: string;      // 客户端IP
}

/**
 * 支付响应
 */
export interface PaymentResponse {
    success: boolean;
    orderNo: string;
    qrCode?: string;        // 二维码链接
    payUrl?: string;        // 支付链接
    expireTime?: number;    // 过期时间戳
    message?: string;
}

/**
 * 回调参数
 */
export interface CallbackParams {
    orderNo: string;        // 商户订单号
    tradeNo: string;        // 第三方交易号
    amount: number;         // 金额
    payType: number;        // 支付类型 1:支付宝 2:QQ钱包 3:微信
    payTime: string;        // 支付时间
    sign: string;           // 签名
}

@Injectable()
export class PaymentGatewayService {
    private readonly logger = new Logger(PaymentGatewayService.name);

    // 默认配置（可通过环境变量或数据库配置覆盖）
    private config: PaymentGatewayConfig = {
        appId: process.env.PAYMENT_APP_ID || '3146220668',
        appKey: process.env.PAYMENT_APP_KEY || '6e48af9cfe058e33e346941a4f83beef',
        serverUrl: process.env.PAYMENT_SERVER_URL || 'http://yunpay.waa.cn/',
        returnUrl: process.env.PAYMENT_RETURN_URL || '/merchant/wallet',
        notifyUrl: process.env.PAYMENT_NOTIFY_URL || '/api/payments/notify',
        enableLocalQr: process.env.PAYMENT_LOCAL_QR === 'true' || false,
    };

    /**
     * 更新配置（可从数据库加载）
     */
    updateConfig(config: Partial<PaymentGatewayConfig>) {
        this.config = { ...this.config, ...config };
    }

    /**
     * 创建支付订单
     * 参考原版 Pay.php 的 codepay() 方法
     */
    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        const payTypeMap: Record<string, number> = {
            alipay: 1,
            qqpay: 2,
            wechat: 3,
            unionpay: 4
        };

        const params = {
            appid: this.config.appId,
            data: request.orderNo,
            money: request.amount.toFixed(2),
            type: payTypeMap[request.payType] || 1,
            uip: request.clientIp || '127.0.0.1',
        };

        // 生成签名
        const token = this.generateToken(params);

        try {
            // 如果启用本地二维码且是支付宝
            if (this.config.enableLocalQr && request.payType === 'alipay') {
                const orderData = Buffer.from(`${request.orderNo},${request.amount}`).toString('base64');
                const qrCode = `${this.config.serverUrl}/alipayh5.php?data=${orderData}`;

                return {
                    success: true,
                    orderNo: request.orderNo,
                    qrCode,
                    payUrl: qrCode,
                    expireTime: Date.now() + 30 * 60 * 1000, // 30分钟过期
                };
            }

            // 调用远程支付网关
            // 实际项目中应该使用 HTTP 客户端发送请求
            // const response = await this.httpClient.post(this.config.serverUrl, { ...params, token });

            // 模拟响应（生产环境替换为真实API调用）
            const mockResponse = {
                state: 1,
                qrcode: `/pay/qrcode?order=${request.orderNo}&amount=${request.amount}`,
                money: request.amount.toFixed(2),
                times: Date.now() / 1000 + 30 * 60, // 30分钟后过期
            };

            if (mockResponse.state === 1) {
                return {
                    success: true,
                    orderNo: request.orderNo,
                    qrCode: mockResponse.qrcode,
                    payUrl: mockResponse.qrcode,
                    expireTime: mockResponse.times * 1000,
                };
            } else {
                return {
                    success: false,
                    orderNo: request.orderNo,
                    message: '支付网关请求失败',
                };
            }
        } catch (error) {
            this.logger.error('Payment gateway error:', error);
            return {
                success: false,
                orderNo: request.orderNo,
                message: error.message || '支付网关异常',
            };
        }
    }

    /**
     * 生成签名Token
     * 参考原版的签名规则
     */
    private generateToken(params: Record<string, any>): string {
        const tokenParams = {
            ...params,
            appkey: this.config.appKey,
        };

        // 按key排序拼接
        const sortedKeys = Object.keys(tokenParams).sort();
        const queryString = sortedKeys.map(key => `${key}=${tokenParams[key]}`).join('&');

        return crypto.createHash('md5').update(queryString).digest('hex');
    }

    /**
     * 验证回调签名
     * 参考原版 callback.php 的签名验证
     */
    verifyCallback(params: CallbackParams): boolean {
        // 验证 appkey
        if (!params.sign) {
            this.logger.warn('Callback missing signature');
            return false;
        }

        // 生成验证签名
        const signData = `ddh=${params.tradeNo}&name=${params.orderNo}&money=${params.amount}&key=${this.config.appKey}`;
        const expectedSign = crypto.createHash('md5').update(signData).digest('hex');

        const isValid = params.sign.toLowerCase() === expectedSign.toLowerCase();

        if (!isValid) {
            this.logger.warn(`Callback signature mismatch: expected ${expectedSign}, got ${params.sign}`);
        }

        return isValid;
    }

    /**
     * 验证支付宝免签回调签名
     * 参考原版 alipayNotify 的签名验证
     */
    verifyAlipayNotify(params: {
        tradeNo: string;
        money: string;
        title: string;
        memo?: string;
        sign: string;
        pid?: string;
        key?: string;
    }): boolean {
        const pid = params.pid || process.env.ALIPAY_PID || '37836';
        const key = params.key || process.env.ALIPAY_KEY || '8aa97d6925be8b0d2c8bb7a3293e7b32';

        const signData = `${pid}${key}${params.tradeNo}${params.money}${params.title}${params.memo || ''}`;
        const expectedSign = crypto.createHash('md5').update(signData).digest('hex').toUpperCase();

        return params.sign.toUpperCase() === expectedSign;
    }

    /**
     * 生成支付宝支付链接（免签H5）
     */
    generateAlipayH5Url(orderNo: string, amount: number): string {
        const orderData = Buffer.from(`${orderNo},${amount}`).toString('base64');
        return `${this.config.serverUrl}/alipayh5.php?data=${orderData}`;
    }

    /**
     * 获取支付方式名称
     */
    getPayTypeName(payType: number): string {
        const names: Record<number, string> = {
            1: '支付宝',
            2: 'QQ钱包',
            3: '微信支付',
            4: '云闪付',
        };
        return names[payType] || '未知';
    }

    /**
     * 获取当前配置（脱敏）
     */
    getConfig(): Omit<PaymentGatewayConfig, 'appKey'> {
        const { appKey, ...safeConfig } = this.config;
        return safeConfig;
    }
}
