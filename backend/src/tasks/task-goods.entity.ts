import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

/**
 * 任务商品关联表 (对应原版 tfkz_task_goods)
 * 一个任务可以包含多个商品
 */
@Entity('task_goods')
export class TaskGoods {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    taskId: string;             // 任务ID

    @Column()
    goodsId: string;            // 商品ID (来自商品链接解析)

    @Column({ length: 200 })
    name: string;               // 商品名称 (冗余存储)

    @Column({ length: 500, nullable: true })
    pcImg: string;              // 商品图片 (冗余存储)

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    price: number;              // 商品单价

    @Column({ type: 'int', default: 1 })
    num: number;                // 购买数量

    @Column({ length: 200, nullable: true })
    goodsSpec: string;          // 商品规格

    @CreateDateColumn()
    createdAt: Date;
}

/**
 * 商品关键词表 (对应原版 tfkz_task_word)
 * 每个商品可以有多个搜索关键词
 */
@Entity('task_words')
export class TaskWord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    taskId: string;             // 任务ID

    @Column()
    @Index()
    goodsId: string;            // 商品ID

    @Column({ length: 100 })
    keyWord: string;            // 关键词

    @Column({ type: 'text', nullable: true })
    discount: string;           // 折扣服务 (逗号分隔)

    @Column({ length: 255, nullable: true })
    filter: string;             // 筛选分类 (逗号分隔)

    @Column({ length: 100, nullable: true })
    sort: string;               // 排序方式

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    maxPrice: number;           // 最大价格

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    minPrice: number;           // 最小价格

    @Column({ length: 50, nullable: true })
    province: string;           // 发货地（省）

    @Column({ type: 'int', default: 1 })
    num: number;                // 使用次数

    @Column({ type: 'int', default: 0 })
    ynum: number;               // 剩余次数

    @CreateDateColumn()
    createdAt: Date;
}

/**
 * 商家任务好评内容表 (对应原版 tfkz_seller_task_praise)
 * 每个商品可以有独立的好评内容要求
 */
@Entity('seller_task_praises')
export class SellerTaskPraise {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    sellerTaskId: string;       // 商家任务ID (tasks.id)

    @Column()
    @Index()
    goodsId: string;            // 商品ID

    @Column({ type: 'int', default: 1 })
    type: number;               // 类型: 1=文字好评, 2=图片好评, 3=视频好评

    @Column({ type: 'text', nullable: true })
    content: string;            // 内容 (文字/图片URL/视频URL)

    @Column({ type: 'int', default: 0 })
    state: number;              // 状态: 0=未使用, 1=已使用

    @CreateDateColumn()
    createdAt: Date;
}

// ============ DTOs ============

/**
 * 商品关键词DTO
 */
export class TaskWordDto {
    @IsString()
    keyWord: string;

    @IsOptional()
    @IsArray()
    discount?: string[];        // 折扣服务数组

    @IsOptional()
    @IsArray()
    filter?: string[];          // 筛选分类数组

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsNumber()
    maxPrice?: number;

    @IsOptional()
    @IsNumber()
    minPrice?: number;

    @IsOptional()
    @IsString()
    province?: string;

    @IsOptional()
    @IsNumber()
    num?: number;               // 使用次数
}

/**
 * 商品好评内容DTO
 */
export class GoodsPraiseDto {
    @IsOptional()
    @IsString()
    str?: string;               // 好评文字内容
}

/**
 * 任务商品DTO (用于创建任务时)
 */
export class TaskGoodsDto {
    @IsString()
    id: string;                 // 商品ID

    @IsString()
    name: string;               // 商品名称

    @IsOptional()
    @IsString()
    pcImg?: string;             // 商品图片

    @IsNumber()
    price: number;              // 商品单价

    @IsNumber()
    num: number;                // 购买数量

    @IsOptional()
    @IsString()
    goodsSpec?: string;         // 商品规格

    @IsOptional()
    @IsArray()
    keyWord?: TaskWordDto[];    // 关键词列表
}

/**
 * 商品好评内容设置DTO (按商品分组)
 */
export class GoodsPraiseSettingV2Dto {
    @IsString()
    goodsId: string;

    @IsOptional()
    @IsArray()
    praise?: GoodsPraiseDto[];  // 文字好评内容列表

    @IsOptional()
    @IsArray()
    images?: string[];          // 图片好评URL列表

    @IsOptional()
    @IsString()
    video?: string;             // 视频好评URL
}

/**
 * 创建多商品任务DTO (完整版)
 */
export class CreateTaskV2Dto {
    @IsNumber()
    taskType: number;           // 任务类型 1淘宝 2天猫 3京东

    @IsNumber()
    num: number;                // 任务单数

    @IsArray()
    goods: TaskGoodsDto[];      // 商品列表

    @IsOptional()
    @IsBoolean()
    isPraise?: boolean;         // 是否设置文字好评

    @IsOptional()
    @IsBoolean()
    isImgPraise?: boolean;      // 是否设置图片好评

    @IsOptional()
    @IsBoolean()
    isVideoPraise?: boolean;    // 是否设置视频好评

    @IsOptional()
    @IsNumber()
    terminal?: number;          // 结算方式 1本佣货返 2本立佣货

    @IsOptional()
    @IsNumber()
    shippingFee?: number;       // 运费

    @IsOptional()
    @IsBoolean()
    isPresale?: boolean;        // 是否预售

    @IsOptional()
    @IsNumber()
    yfPrice?: number;           // 预付款

    @IsOptional()
    @IsNumber()
    wkPrice?: number;           // 尾款

    @IsOptional()
    @IsBoolean()
    isTimingPublish?: boolean;  // 定时发布

    @IsOptional()
    @IsString()
    publishTime?: string;       // 发布时间

    @IsOptional()
    @IsNumber()
    addReward?: number;         // 加赏金额

    @IsOptional()
    @IsString()
    remark?: string;            // 备注
}

/**
 * 任务第二步提交DTO (好评内容)
 */
export class TaskStep2Dto {
    @IsString()
    taskId: string;             // 任务ID

    @IsOptional()
    @IsArray()
    praise?: GoodsPraiseDto[][]; // 好评内容 [单数索引][商品索引]

    @IsOptional()
    @IsArray()
    img?: string[][][];          // 图片好评 [单数索引][商品索引][图片URL列表]

    @IsOptional()
    @IsArray()
    video?: string[][];          // 视频好评 [单数索引][商品索引]

    @IsArray()
    goods: { id: string }[];     // 商品ID列表(用于关联)
}
