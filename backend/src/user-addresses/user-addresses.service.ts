import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress, CreateUserAddressDto, UpdateUserAddressDto } from './user-address.entity';

@Injectable()
export class UserAddressesService {
    constructor(
        @InjectRepository(UserAddress)
        private addressRepository: Repository<UserAddress>,
    ) { }

    async findAllByUser(userId: string): Promise<UserAddress[]> {
        return this.addressRepository.find({
            where: { userId },
            order: { isDefault: 'DESC', createdAt: 'DESC' }
        });
    }

    async findOne(id: string, userId: string): Promise<UserAddress | null> {
        return this.addressRepository.findOne({
            where: { id, userId }
        });
    }

    async getDefaultAddress(userId: string): Promise<UserAddress | null> {
        return this.addressRepository.findOne({
            where: { userId, isDefault: true }
        });
    }

    async create(userId: string, createDto: CreateUserAddressDto): Promise<UserAddress> {
        // 如果是第一个地址或设置为默认，处理默认地址
        const count = await this.addressRepository.count({ where: { userId } });
        const shouldBeDefault = count === 0 || createDto.isDefault;

        if (shouldBeDefault) {
            // 取消其他默认地址
            await this.addressRepository.update(
                { userId, isDefault: true },
                { isDefault: false }
            );
        }

        const address = this.addressRepository.create({
            userId,
            ...createDto,
            isDefault: shouldBeDefault
        });

        return this.addressRepository.save(address);
    }

    async update(id: string, userId: string, updateDto: UpdateUserAddressDto): Promise<UserAddress> {
        const address = await this.addressRepository.findOne({
            where: { id, userId }
        });

        if (!address) {
            throw new NotFoundException('地址不存在');
        }

        Object.assign(address, updateDto);
        return this.addressRepository.save(address);
    }

    async delete(id: string, userId: string): Promise<void> {
        const address = await this.addressRepository.findOne({
            where: { id, userId }
        });

        if (!address) {
            throw new NotFoundException('地址不存在');
        }

        const wasDefault = address.isDefault;
        await this.addressRepository.remove(address);

        // 如果删除的是默认地址，设置第一个地址为默认
        if (wasDefault) {
            const firstAddress = await this.addressRepository.findOne({
                where: { userId },
                order: { createdAt: 'ASC' }
            });
            if (firstAddress) {
                firstAddress.isDefault = true;
                await this.addressRepository.save(firstAddress);
            }
        }
    }

    async setDefault(id: string, userId: string): Promise<UserAddress> {
        const address = await this.addressRepository.findOne({
            where: { id, userId }
        });

        if (!address) {
            throw new NotFoundException('地址不存在');
        }

        // 取消其他默认地址
        await this.addressRepository.update(
            { userId, isDefault: true },
            { isDefault: false }
        );

        // 设置新默认地址
        address.isDefault = true;
        return this.addressRepository.save(address);
    }

    async getCount(userId: string): Promise<number> {
        return this.addressRepository.count({ where: { userId } });
    }
}
