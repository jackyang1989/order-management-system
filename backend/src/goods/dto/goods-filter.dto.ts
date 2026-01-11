import { IsOptional, IsString, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GoodsFilterDto {
    @IsOptional()
    @IsString()
    shopId?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxPrice?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    limit?: number;
}
