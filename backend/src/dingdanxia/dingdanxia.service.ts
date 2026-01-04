import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../system-config/system-config.entity';

export interface TklQueryResult {
  success: boolean;
  numIid?: string; // 商品ID (taobaoId)
  title?: string; // 商品标题
  pictUrl?: string; // 商品图片
  shopName?: string; // 店铺名称
  price?: string; // 商品价格
  error?: string;
}

export interface GoodsInfoResult {
  success: boolean;
  numIid?: string;
  title?: string;
  pictUrl?: string;
  shopName?: string;
  price?: string;
  error?: string;
}

@Injectable()
export class DingdanxiaService {
  private readonly logger = new Logger(DingdanxiaService.name);
  private readonly API_BASE_URL = 'http://api.tbk.dingdanxia.com';

  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
  ) {}

  /**
   * 获取订单侠 API Key（从系统配置读取）
   */
  private async getApiKey(): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { key: 'dingdanxia_api_key' },
    });
    return config?.value || null;
  }

  /**
   * 检查 API 是否已配置
   */
  async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!apiKey;
  }

  /**
   * 发送 HTTP 请求到订单侠 API
   */
  private async httpRequest(
    endpoint: string,
    data: Record<string, string>,
  ): Promise<any> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new HttpException(
        '订单侠 API Key 未配置',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const postData = {
      ...data,
      apikey: apiKey,
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      this.logger.error(`订单侠 API 请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析淘口令，获取商品信息
   * API: /tkl/query
   */
  async parseTkl(tkl: string): Promise<TklQueryResult> {
    try {
      const result = await this.httpRequest('/tkl/query', { tkl });

      if (result.code === 200 && result.data) {
        return {
          success: true,
          numIid: result.data.num_iid?.toString(),
          title: result.data.title,
          pictUrl: result.data.pict_url,
          shopName: result.data.shop_name,
          price: result.data.zk_final_price || result.data.reserve_price,
        };
      } else {
        return {
          success: false,
          error: result.msg || '解析失败',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 从链接中提取商品 ID
   * 支持多种淘宝/天猫链接格式
   */
  extractNumIidFromUrl(url: string): string | null {
    if (!url) return null;

    // 尝试从 URL 参数中提取 id
    const patterns = [
      /[?&]id=(\d+)/, // ?id=123456 or &id=123456
      /item\.taobao\.com\/item\.htm.*?id=(\d+)/, // taobao item link
      /detail\.tmall\.com\/item\.htm.*?id=(\d+)/, // tmall item link
      /\/i(\d+)\.htm/, // /i123456.htm
      /item\/(\d+)/, // /item/123456
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 验证商品链接/淘口令是否匹配指定的商品 ID
   * 用于买手接单时核对商品
   */
  async validateGoodsLink(
    linkOrTkl: string,
    expectedTaobaoId: string,
  ): Promise<{ valid: boolean; actualId?: string; error?: string }> {
    if (!linkOrTkl || !expectedTaobaoId) {
      return { valid: false, error: '参数不能为空' };
    }

    // 1. 先尝试从 URL 直接提取商品 ID
    const extractedId = this.extractNumIidFromUrl(linkOrTkl);
    if (extractedId) {
      const isValid = extractedId === expectedTaobaoId;
      return {
        valid: isValid,
        actualId: extractedId,
        error: isValid
          ? undefined
          : `商品ID不匹配，期望: ${expectedTaobaoId}，实际: ${extractedId}`,
      };
    }

    // 2. 如果无法从 URL 提取，则调用订单侠 API 解析淘口令
    const parseResult = await this.parseTkl(linkOrTkl);
    if (!parseResult.success) {
      return {
        valid: false,
        error: parseResult.error || '无法解析链接',
      };
    }

    const isValid = parseResult.numIid === expectedTaobaoId;
    return {
      valid: isValid,
      actualId: parseResult.numIid,
      error: isValid
        ? undefined
        : `商品ID不匹配，期望: ${expectedTaobaoId}，实际: ${parseResult.numIid}`,
    };
  }

  /**
   * 从链接/淘口令获取商品信息
   * 用于发布任务时自动填充商品信息
   */
  async getGoodsInfo(linkOrTkl: string): Promise<GoodsInfoResult> {
    if (!linkOrTkl) {
      return { success: false, error: '链接不能为空' };
    }

    // 1. 先尝试从 URL 直接提取商品 ID
    const extractedId = this.extractNumIidFromUrl(linkOrTkl);
    if (extractedId) {
      // 如果只需要 ID，直接返回
      // 如果需要更多信息，可以调用其他 API 获取商品详情
      return {
        success: true,
        numIid: extractedId,
      };
    }

    // 2. 调用订单侠 API 解析淘口令
    return this.parseTkl(linkOrTkl);
  }

  /**
   * 检查是否是淘口令（包含特殊字符标识）
   */
  isTkl(text: string): boolean {
    if (!text) return false;

    // 淘口令通常包含这些特殊符号
    const tklPatterns = [
      /[₳￥$]/, // 淘口令通常包含这些货币符号
      /m\.tb\.cn/, // 淘宝短链接
      /复制.*?转移.*?淘宝/, // 常见的淘口令提示语
    ];

    return tklPatterns.some((pattern) => pattern.test(text));
  }
}
