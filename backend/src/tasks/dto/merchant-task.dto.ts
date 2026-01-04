import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum TaskTerminal {
    BENYONG_HUOFAN = 1,   // 本佣货返
    BENLI_YONGHUO = 2,    // 本立佣货
}

export class MerchantTaskDto {
    @IsEnum(TaskTerminal)
    @IsOptional()
    terminal?: number = TaskTerminal.BENYONG_HUOFAN;

    @IsNumber()
    taskType: number; // 平台类型 (1:淘宝, 2:天猫, 3:京东, etc.)

    @IsString()
    shopId: string; // 关联店铺ID

    @IsString()
    shopName: string; // 店铺名称 (Redundant but kept for snapshot)

    @IsString()
    title: string; // 商品标题

    @IsString()
    url: string; // 商品链接

    @IsString()
    @IsOptional()
    mainImage?: string; // 主图

    @IsString()
    @IsOptional()
    keyword?: string; // 搜索关键词

    @IsString()
    @IsOptional()
    taoWord?: string; // 淘口令

    @IsNumber()
    @Min(0)
    goodsPrice: number; // 商品单价 (原 shang_principal / itemPrice)

    @IsNumber()
    @Min(1)
    count: number; // 任务数量

    @IsBoolean()
    @IsOptional()
    isFreeShipping?: boolean; // 是否包邮 (shang_is_free_shiping)

    // --- 增值服务 (Value Added Services) ---

    @IsBoolean()
    @IsOptional()
    isPraise?: boolean; // 文字好评

    @IsBoolean()
    @IsOptional()
    isImgPraise?: boolean; // 图片好评

    @IsBoolean()
    @IsOptional()
    isVideoPraise?: boolean; // 视频好评

    @IsNumber()
    @IsOptional()
    praiseFee?: number; // 好评费用 (Calculate in backend usually, but can be passed for verify)

    @IsBoolean()
    @IsOptional()
    isTimingPublish?: boolean; // 定时发布

    @IsString()
    @IsOptional()
    publishTime?: string; // 发布时间

    @IsBoolean()
    @IsOptional()
    isTimingPay?: boolean; // 定时支付 (Old feature?)

    @IsBoolean()
    @IsOptional()
    isCycleTime?: boolean; // 周期延长

    @IsNumber()
    @IsOptional()
    cycleTime?: number; // 延长天数

    @IsNumber()
    @IsOptional()
    extraCommission?: number; // 加赏佣金 (shang_add_reward)
}
