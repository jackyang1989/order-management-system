import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserAddressDto, UpdateUserAddressDto } from './user-address.entity';

@Controller('user-addresses')
@UseGuards(JwtAuthGuard)
export class UserAddressesController {
    constructor(private addressesService: UserAddressesService) { }

    @Get()
    async findAll(@Request() req) {
        const addresses = await this.addressesService.findAllByUser(req.user.userId);
        return { success: true, data: addresses };
    }

    @Get('default')
    async getDefault(@Request() req) {
        const address = await this.addressesService.getDefaultAddress(req.user.userId);
        return { success: true, data: address };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const address = await this.addressesService.findOne(id, req.user.userId);
        if (!address) {
            return { success: false, message: '地址不存在' };
        }
        return { success: true, data: address };
    }

    @Post()
    async create(@Body() createDto: CreateUserAddressDto, @Request() req) {
        try {
            const address = await this.addressesService.create(req.user.userId, createDto);
            return {
                success: true,
                message: '地址添加成功',
                data: address
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateUserAddressDto,
        @Request() req
    ) {
        try {
            const address = await this.addressesService.update(id, req.user.userId, updateDto);
            return {
                success: true,
                message: '地址更新成功',
                data: address
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        try {
            await this.addressesService.delete(id, req.user.userId);
            return {
                success: true,
                message: '地址删除成功'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/set-default')
    async setDefault(@Param('id') id: string, @Request() req) {
        try {
            const address = await this.addressesService.setDefault(id, req.user.userId);
            return {
                success: true,
                message: '已设为默认地址',
                data: address
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}
