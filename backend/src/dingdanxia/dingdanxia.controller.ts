import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  DingdanxiaService,
  TklQueryResult,
  GoodsInfoResult,
} from './dingdanxia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dingdanxia')
@UseGuards(JwtAuthGuard)
export class DingdanxiaController {
  constructor(private readonly dingdanxiaService: DingdanxiaService) {}

  /**
   * 检查 API 是否已配置
   */
  @Get('status')
  async getStatus(): Promise<{ configured: boolean }> {
    const configured = await this.dingdanxiaService.isConfigured();
    return { configured };
  }

  /**
   * 解析淘口令/商品链接，获取商品信息
   * 用于发布任务时自动填充商品信息
   */
  @Post('parse')
  async parseLink(@Body('link') link: string): Promise<GoodsInfoResult> {
    return this.dingdanxiaService.getGoodsInfo(link);
  }

  /**
   * 验证商品链接是否匹配
   * 用于买手接单时核对商品
   */
  @Post('validate')
  async validateLink(
    @Body() data: { link: string; expectedTaobaoId: string },
  ): Promise<{ valid: boolean; actualId?: string; error?: string }> {
    return this.dingdanxiaService.validateGoodsLink(
      data.link,
      data.expectedTaobaoId,
    );
  }

  /**
   * 解析淘口令，获取完整商品信息
   */
  @Post('tkl/query')
  async queryTkl(@Body('tkl') tkl: string): Promise<TklQueryResult> {
    return this.dingdanxiaService.parseTkl(tkl);
  }
}
