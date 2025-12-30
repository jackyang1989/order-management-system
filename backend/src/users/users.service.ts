import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, CreateUserDto, UpdateUserDto } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        const users = await this.usersRepository.find();
        return users.map(u => this.sanitizeUser(u));
    }

    async findOne(id: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { id } });
        return user ? this.sanitizeUser(user) : null;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { username } });
    }

    async findByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { phone } });
    }

    async findByInvitationCode(code: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { invitationCode: code } });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // 生成唯一邀请码
        let newInvitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        while (await this.usersRepository.findOne({ where: { invitationCode: newInvitationCode } })) {
            newInvitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        // 查找邀请人
        let invitedBy: string | undefined;
        if (createUserDto.invitationCode) {
            const referrer = await this.findByInvitationCode(createUserDto.invitationCode);
            if (referrer) {
                invitedBy = referrer.id;
            }
        }

        const newUser = this.usersRepository.create({
            username: createUserDto.username,
            password: hashedPassword,
            phone: createUserDto.phone,
            qq: createUserDto.qq || '',
            vip: false,
            balance: 0,
            silver: 0,
            frozenSilver: 0,
            reward: 0,
            invitationCode: newInvitationCode,
            invitedBy: invitedBy,
        });

        const savedUser = await this.usersRepository.save(newUser);
        return this.sanitizeUser(savedUser);
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) return null;

        Object.assign(user, updateUserDto);
        const updatedUser = await this.usersRepository.save(user);
        return this.sanitizeUser(updatedUser);
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }

    async updatePassword(id: string, newPassword: string): Promise<boolean> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) return false;

        user.password = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.save(user);
        return true;
    }

    async updatePayPassword(id: string, newPayPassword: string): Promise<boolean> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) return false;

        user.payPassword = await bcrypt.hash(newPayPassword, 10);
        await this.usersRepository.save(user);
        return true;
    }

    // 获取邀请统计
    async getInviteStats(userId: string): Promise<{
        totalInvited: number;
        todayInvited: number;
        totalReward: number;
        todayReward: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 查询被该用户邀请的所有用户
        const allInvitees = await this.usersRepository.find({
            where: { invitedBy: userId }
        });

        // 查询今日邀请的用户
        const todayInvitees = allInvitees.filter(u =>
            u.createdAt && new Date(u.createdAt) >= today
        );

        // 计算奖励（简化：每邀请一人奖励1元，实际应该根据被邀请人完成的任务计算）
        const totalReward = allInvitees.length * 1;
        const todayReward = todayInvitees.length * 1;

        return {
            totalInvited: allInvitees.length,
            todayInvited: todayInvitees.length,
            totalReward,
            todayReward
        };
    }

    // 获取邀请记录
    async getInviteRecords(userId: string): Promise<Array<{
        id: string;
        username: string;
        registerTime: string;
        completedTasks: number;
        reward: number;
    }>> {
        const invitees = await this.usersRepository.find({
            where: { invitedBy: userId },
            order: { createdAt: 'DESC' }
        });

        return invitees.map(u => ({
            id: u.id,
            username: u.username,
            registerTime: u.createdAt?.toISOString() || '',
            completedTasks: 0, // TODO: 从订单表查询完成的任务数
            reward: 1 // 简化奖励计算
        }));
    }

    // 移除敏感信息
    private sanitizeUser(user: User): User {
        const { password, payPassword, ...sanitized } = user;
        return { ...sanitized, password: '', payPassword: '' } as User;
    }
}
