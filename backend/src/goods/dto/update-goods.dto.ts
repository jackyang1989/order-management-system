import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateGoodsDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsString()
    platformProductId?: string;

    @IsOptional()
    @IsString()
    verifyCode?: string;

    @IsOptional()
    @IsString()
    pcImg?: string;

    @IsOptional()
    @IsString()
    specName?: string;

    @IsOptional()
    @IsString()
    specValue?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    num?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    showPrice?: number;

    @IsOptional()
    @IsString()
    goodsKeyId?: string;
}
