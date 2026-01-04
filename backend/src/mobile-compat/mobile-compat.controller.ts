import { Controller, Get, Post, Body, Request, UseGuards, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { TasksService } from '../tasks/tasks.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BankCardsService } from '../bank-cards/bank-cards.service';
import { SmsService } from '../sms/sms.service';
import { AuthService } from '../auth/auth.service';
import { SmsCodeType } from '../sms/sms.entity';
import { WithdrawalType } from '../withdrawals/withdrawal.entity';

/**
 * Mobile 兼容层控制器
 *
 * 将原版 ThinkPHP /mobile/* 路由代理到新的 NestJS 服务
 * 这是一个临时兼容层，用于在前端迁移完成前保持系统可用
 *
 * 原版路由 -> 重构版服务映射
 */
@Controller('mobile')
export class MobileCompatController {
    constructor(
        private usersService: UsersService,
        private ordersService: OrdersService,
        private tasksService: TasksService,
        private withdrawalsService: WithdrawalsService,
        private financeRecordsService: FinanceRecordsService,
        private buyerAccountsService: BuyerAccountsService,
        private bankCardsService: BankCardsService,
        private smsService: SmsService,
        private authService: AuthService,
    ) {}

    // ============ /mobile/my/* 用户中心 ============

    /**
     * 获取用户信息
     * 原版: /mobile/my/index
     */
    @Get('my/index')
    @UseGuards(JwtAuthGuard)
    async myIndex(@Request() req) {
        try {
            const user = await this.usersService.findOne(req.user.userId);
            if (!user) {
                return { code: 0, msg: '用户不存在', data: null };
            }

            // 获取用户统计数据
            const stats = await this.usersService.getProfileStats(req.user.userId);
            const inviteStats = await this.usersService.getInviteStats(req.user.userId);

            return {
                code: 1,
                msg: 'success',
                data: {
                    id: user.id,
                    username: user.username,
                    mobile: user.phone,
                    balance: user.balance || 0,
                    vip: user.vip ? 1 : 0,
                    vip_time: user.vipExpireAt ? Math.floor(new Date(user.vipExpireAt).getTime() / 1000) : 0,
                    reward: user.silver || 0,
                    tj_award: inviteStats.totalReward || 0,
                    tj_award_day: inviteStats.todayReward || 0,
                    all_num_task: stats.totalCompletedTasks || 0,
                    all_obtain_reward: stats.totalEarnedSilver || 0,
                    wait_shop_issue: stats.pendingMerchantSilver || 0,
                    all_user_principal: stats.totalPaidPrincipal || 0,
                    freeze_reward: stats.frozenSilver || 0,
                    discounting: stats.silverToYuan || 0,
                    all_invite: inviteStats.totalInvited || 0,
                    day_invite: inviteStats.todayInvited || 0,
                    unread_msg_count: 0, // TODO: 从消息服务获取
                }
            };
        } catch (error) {
            return { code: 0, msg: error.message || '获取用户信息失败', data: null };
        }
    }

    /**
     * 获取买号列表
     * 原版: /mobile/my/buynolist
     */
    @Get('my/buynolist')
    @UseGuards(JwtAuthGuard)
    async buynoList(@Request() req) {
        try {
            const accounts = await this.buyerAccountsService.findAllByUser(req.user.userId, true);
            return {
                code: 1,
                msg: 'success',
                data: accounts || []
            };
        } catch (error) {
            return { code: 0, msg: error.message || '获取买号列表失败', data: [] };
        }
    }

    /**
     * 添加买号
     * 原版: /mobile/my/addbuyno
     */
    @Post('my/addbuyno')
    @UseGuards(JwtAuthGuard)
    async addBuyno(@Body() body: any, @Request() req) {
        try {
            const account = await this.buyerAccountsService.create(req.user.userId, body);
            return { code: 1, msg: '添加成功', data: account };
        } catch (error) {
            return { code: 0, msg: error.message || '添加买号失败', data: null };
        }
    }

    /**
     * 获取提现账户
     * 原版: /mobile/my/withdrawal
     */
    @Get('my/withdrawal')
    @UseGuards(JwtAuthGuard)
    async getWithdrawalAccount(@Request() req) {
        try {
            const cards = await this.bankCardsService.findAllByUser(req.user.userId);
            return { code: 1, msg: 'success', data: cards || [] };
        } catch (error) {
            return { code: 0, msg: error.message || '获取提现账户失败', data: [] };
        }
    }

    /**
     * 添加银行卡
     * 原版: /mobile/my/add_bank_card
     */
    @Post('my/add_bank_card')
    @UseGuards(JwtAuthGuard)
    async addBankCard(@Body() body: any, @Request() req) {
        try {
            const card = await this.bankCardsService.create(req.user.userId, body);
            return { code: 1, msg: '添加成功', data: card };
        } catch (error) {
            return { code: 0, msg: error.message || '添加银行卡失败', data: null };
        }
    }

    /**
     * 修改银行卡
     * 原版: /mobile/my/edit_bank_card
     */
    @Post('my/edit_bank_card')
    @UseGuards(JwtAuthGuard)
    async editBankCard(@Body() body: any, @Request() req) {
        try {
            await this.bankCardsService.update(body.id, req.user.userId, body);
            return { code: 1, msg: '修改成功', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '修改银行卡失败', data: null };
        }
    }

    /**
     * 修改手机号
     * 原版: /mobile/my/editphone
     */
    @Post('my/editphone')
    @UseGuards(JwtAuthGuard)
    async editPhone(@Body() body: any, @Request() req) {
        try {
            const user = await this.usersService.findOne(req.user.userId);
            if (!user) {
                return { code: 0, msg: '用户不存在', data: null };
            }
            const result = await this.usersService.changePhone(
                req.user.userId,
                user.phone,
                body.payPassword || body.pay_password,
                body.phone,
                body.code
            );
            if (!result.success) {
                return { code: 0, msg: result.message, data: null };
            }
            return { code: 1, msg: '修改成功', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '修改手机号失败', data: null };
        }
    }

    /**
     * 修改登录密码
     * 原版: /mobile/my/edit_login_pwd
     */
    @Post('my/edit_login_pwd')
    @UseGuards(JwtAuthGuard)
    async editLoginPwd(@Body() body: any, @Request() req) {
        try {
            const result = await this.usersService.changePassword(
                req.user.userId,
                body.oldPassword || body.old_password,
                body.newPassword || body.new_password
            );
            if (!result.success) {
                return { code: 0, msg: result.message, data: null };
            }
            return { code: 1, msg: '修改成功', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '修改密码失败', data: null };
        }
    }

    /**
     * 修改支付密码
     * 原版: /mobile/my/edit_pay_pwd
     */
    @Post('my/edit_pay_pwd')
    @UseGuards(JwtAuthGuard)
    async editPayPwd(@Body() body: any, @Request() req) {
        try {
            const user = await this.usersService.findOne(req.user.userId);
            if (!user) {
                return { code: 0, msg: '用户不存在', data: null };
            }
            const result = await this.usersService.changePayPassword(
                req.user.userId,
                body.password,
                user.phone,
                body.code
            );
            if (!result.success) {
                return { code: 0, msg: result.message, data: null };
            }
            return { code: 1, msg: '修改成功', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '修改支付密码失败', data: null };
        }
    }

    // ============ /mobile/task/* 任务相关 ============

    /**
     * 获取任务列表
     * 原版: /mobile/task/index
     */
    @Get('task/index')
    @UseGuards(JwtAuthGuard)
    async taskIndex(@Query() query: any) {
        try {
            const result = await this.tasksService.findAll({
                taskType: query.type,
                search: query.keyword,
            });
            return {
                code: 1,
                msg: 'success',
                data: {
                    list: result,
                    total: result.length
                }
            };
        } catch (error) {
            return { code: 0, msg: error.message || '获取任务列表失败', data: { list: [], total: 0 } };
        }
    }

    /**
     * 领取任务
     * 原版: /mobile/task/get_task
     */
    @Post('task/get_task')
    @UseGuards(JwtAuthGuard)
    async getTask(@Body() body: any, @Request() req) {
        try {
            // 获取买号信息
            const buynoId = body.buyerAccountId || body.buyno_id;
            const buyerAccount = await this.buyerAccountsService.findOne(buynoId, req.user.userId);
            if (!buyerAccount) {
                return { code: 0, msg: '买号不存在', data: null };
            }

            const order = await this.ordersService.create(
                req.user.userId,
                {
                    taskId: body.taskId || body.task_id,
                    buynoId: buynoId,
                    buynoAccount: buyerAccount.accountName,
                }
            );
            return { code: 1, msg: '领取成功', data: order };
        } catch (error) {
            return { code: 0, msg: error.message || '领取任务失败', data: null };
        }
    }

    /**
     * 执行任务步骤
     * 原版: /mobile/task/maketask
     */
    @Post('task/maketask')
    @UseGuards(JwtAuthGuard)
    async makeTask(@Body() body: any, @Request() req) {
        try {
            const orderId = body.orderId || body.order_id;
            // 提交步骤
            const result = await this.ordersService.submitStep(orderId, req.user.userId, {
                step: body.step || 1,
                screenshot: body.screenshot,
                inputData: body.inputData || body.input_data,
            });
            return { code: 1, msg: '提交成功', data: result };
        } catch (error) {
            return { code: 0, msg: error.message || '提交步骤失败', data: null };
        }
    }

    /**
     * 删除/取消任务
     * 原版: /mobile/task/del_task
     */
    @Post('task/del_task')
    @UseGuards(JwtAuthGuard)
    async delTask(@Body() body: any, @Request() req) {
        try {
            const orderId = body.orderId || body.order_id;
            await this.ordersService.cancelOrder(
                orderId,
                req.user.userId,
            );
            return { code: 1, msg: '取消成功', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '取消任务失败', data: null };
        }
    }

    // ============ /mobile/money/* 资金相关 ============

    /**
     * 本金流水
     * 原版: /mobile/money/benjinlist
     */
    @Get('money/benjinlist')
    @UseGuards(JwtAuthGuard)
    async benjinList(@Query() query: any, @Request() req) {
        try {
            const result = await this.financeRecordsService.findUserBalanceRecords(
                req.user.userId,
                {
                    page: parseInt(query.page) || 1,
                    limit: parseInt(query.limit) || 20,
                }
            );
            return { code: 1, msg: 'success', data: result };
        } catch (error) {
            return { code: 0, msg: error.message || '获取本金流水失败', data: { list: [], total: 0 } };
        }
    }

    /**
     * 银锭流水
     * 原版: /mobile/money/yindinglist
     */
    @Get('money/yindinglist')
    @UseGuards(JwtAuthGuard)
    async yindingList(@Query() query: any, @Request() req) {
        try {
            const result = await this.financeRecordsService.findUserSilverRecords(
                req.user.userId,
                {
                    page: parseInt(query.page) || 1,
                    limit: parseInt(query.limit) || 20,
                }
            );
            return { code: 1, msg: 'success', data: result };
        } catch (error) {
            return { code: 0, msg: error.message || '获取银锭流水失败', data: { list: [], total: 0 } };
        }
    }

    /**
     * 提现记录
     * 原版: /mobile/money/tixianlist
     */
    @Get('money/tixianlist')
    @UseGuards(JwtAuthGuard)
    async tixianList(@Request() req) {
        try {
            const result = await this.withdrawalsService.findAllByUser(req.user.userId);
            return { code: 1, msg: 'success', data: { list: result, total: result.length } };
        } catch (error) {
            return { code: 0, msg: error.message || '获取提现记录失败', data: { list: [], total: 0 } };
        }
    }

    /**
     * 获取提现信息
     * 原版: /mobile/money/withdrawal
     */
    @Post('money/withdrawal')
    @UseGuards(JwtAuthGuard)
    async withdrawalInfo(@Request() req) {
        try {
            const user = await this.usersService.findOne(req.user.userId);
            const cards = await this.bankCardsService.findAllByUser(req.user.userId);
            const config = await this.withdrawalsService.getWithdrawalConfig();
            return {
                code: 1,
                msg: 'success',
                data: {
                    users: {
                        balance: user?.balance || 0,
                        reward: user?.silver || 0,
                    },
                    admin_limit: {
                        user_min_money: config.userMinMoney,
                        user_cash_free: config.userCashFree,
                        user_fee_max_price: config.userFeeMaxPrice,
                        user_min_reward: config.userMinReward,
                        reward_price: config.rewardPrice,
                    },
                    cards: cards || [],
                    list: [],
                    total: 0,
                }
            };
        } catch (error) {
            return { code: 0, msg: error.message || '获取提现信息失败', data: null };
        }
    }

    /**
     * 创建提现申请
     * 原版: /mobile/money/creat_withdrawal
     */
    @Post('money/creat_withdrawal')
    @UseGuards(JwtAuthGuard)
    async createWithdrawal(@Body() body: any, @Request() req) {
        try {
            // 获取默认银行卡
            const cards = await this.bankCardsService.findAllByUser(req.user.userId);
            const defaultCard = cards.find(c => c.isDefault) || cards[0];
            if (!defaultCard) {
                return { code: 0, msg: '请先添加银行卡', data: null };
            }

            const result = await this.withdrawalsService.create(req.user.userId, {
                amount: parseFloat(body.price) || 0,
                type: body.radio === '1' ? WithdrawalType.BALANCE : WithdrawalType.SILVER,
                payPassword: body.password,
                bankCardId: body.bankCardId || body.bank_card_id || defaultCard.id,
            });
            return { code: 1, msg: '申请成功', data: result };
        } catch (error) {
            return { code: 0, msg: error.message || '提现申请失败', data: null };
        }
    }

    /**
     * 支付/充值
     * 原版: /mobile/money/pay
     */
    @Post('money/pay')
    @UseGuards(JwtAuthGuard)
    async pay() {
        // TODO: 实现支付逻辑
        return { code: 0, msg: '支付功能暂未实现', data: null };
    }

    // ============ /mobile/login/* 登录注册 ============

    /**
     * 检查注册
     * 原版: /mobile/login/check_register
     */
    @Post('login/check_register')
    async checkRegister(@Body() body: any) {
        try {
            const result = await this.authService.register({
                phone: body.phone || body.mobile,
                password: body.password,
                username: body.phone || body.mobile, // 使用手机号作为用户名
                invitationCode: body.inviteCode || body.invite_code || 'ADMIN',
            });
            return {
                code: 1,
                msg: '注册成功',
                data: {
                    token: result.data.accessToken,
                    user: result.data.user,
                }
            };
        } catch (error) {
            return { code: 0, msg: error.message || '注册失败', data: null };
        }
    }

    /**
     * 忘记密码
     * 原版: /mobile/login/forget_edit
     */
    @Post('login/forget_edit')
    async forgetEdit(@Body() body: any) {
        try {
            // 验证短信验证码
            const verifyResult = await this.smsService.verifyCode({
                phone: body.mobile || body.phone,
                code: body.dxyzm || body.code,
                type: SmsCodeType.RESET_PASSWORD,
            });
            if (!verifyResult.success) {
                return { code: 0, msg: verifyResult.message, data: null };
            }

            // 查找用户
            const user = await this.usersService.findByPhone(body.mobile || body.phone);
            if (!user) {
                return { code: 0, msg: '用户不存在', data: null };
            }

            // 更新密码
            await this.usersService.updatePassword(user.id, body.newpassword);

            return { code: 1, msg: '密码重置成功', url: '/login', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '密码重置失败', data: null };
        }
    }

    // ============ /mobile/way/* 短信验证码 ============

    /**
     * 发送验证码
     * 原版: /mobile/way/send_code
     */
    @Post('way/send_code')
    async sendCode(@Body() body: any) {
        try {
            // 映射类型
            let smsType: SmsCodeType = SmsCodeType.REGISTER;
            const typeMap: Record<string, SmsCodeType> = {
                'register': SmsCodeType.REGISTER,
                'login': SmsCodeType.LOGIN,
                'forget': SmsCodeType.RESET_PASSWORD,
                'change_phone': SmsCodeType.CHANGE_PHONE,
                'change_password': SmsCodeType.RESET_PASSWORD,
            };
            if (body.type && typeMap[body.type]) {
                smsType = typeMap[body.type];
            }

            const result = await this.smsService.sendCode({
                phone: body.phone || body.mobile,
                type: smsType,
            });

            if (!result.success) {
                return { code: 0, msg: result.message, data: null };
            }
            return { code: 1, msg: '验证码已发送', data: null };
        } catch (error) {
            return { code: 0, msg: error.message || '发送验证码失败', data: null };
        }
    }
}
