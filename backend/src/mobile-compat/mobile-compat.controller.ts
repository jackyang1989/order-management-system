import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
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
import { DingdanxiaService } from '../dingdanxia/dingdanxia.service';

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
    private dingdanxiaService: DingdanxiaService,
  ) { }

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
      const inviteStats = await this.usersService.getInviteStats(
        req.user.userId,
      );

      return {
        code: 1,
        msg: 'success',
        data: {
          id: user.id,
          username: user.username,
          mobile: user.phone,
          balance: user.balance || 0,
          vip: user.vip ? 1 : 0,
          vip_time: user.vipExpireAt
            ? Math.floor(new Date(user.vipExpireAt).getTime() / 1000)
            : 0,
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
        },
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
      const accounts = await this.buyerAccountsService.findAllByUser(
        req.user.userId,
        true,
      );
      return {
        code: 1,
        msg: 'success',
        data: accounts || [],
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
      const account = await this.buyerAccountsService.create(
        req.user.userId,
        body,
      );
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
        body.code,
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
        body.newPassword || body.new_password,
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
        body.code,
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
  @Post('task/index')
  @UseGuards(JwtAuthGuard)
  async taskIndex(@Body() body: any) {
    try {
      const result = await this.tasksService.findAll({
        taskType: body.task_type || body.taskType,
        search: body.keyword,
      });
      return {
        code: 1,
        msg: 'success',
        data: {
          list: result,
          total: result.length,
        },
      };
    } catch (error) {
      return {
        code: 0,
        msg: error.message || '获取任务列表失败',
        data: { list: [], total: 0 },
      };
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
      const buyerAccount = await this.buyerAccountsService.findOne(
        buynoId,
        req.user.userId,
      );
      if (!buyerAccount) {
        return { code: 0, msg: '买号不存在', data: null };
      }

      const order = await this.ordersService.create(req.user.userId, {
        taskId: body.taskId || body.task_id,
        buynoId: buynoId,
        buynoAccount: buyerAccount.platformAccount,
      });
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
      const result = await this.ordersService.submitStep(
        orderId,
        req.user.userId,
        {
          step: body.step || 1,
          screenshot: body.screenshot,
          inputData: body.inputData || body.input_data,
        },
      );
      return { code: 1, msg: '提交成功', data: result };
    } catch (error) {
      return { code: 0, msg: error.message || '提交步骤失败', data: null };
    }
  }

  /**
   * 商品链接核对
   * 原版: /mobile/task/task_hedui
   * 用于买手执行任务时核对商品链接是否正确
   */
  @Post('task/task_hedui')
  @UseGuards(JwtAuthGuard)
  async taskHedui(@Body() body: any) {
    try {
      const { input, id: goodsId } = body;
      if (!input) {
        return { code: 0, msg: '商品链接不能为空', data: null };
      }
      if (!goodsId) {
        return { code: 0, msg: '商品ID不能为空', data: null };
      }

      // 使用订单侠API验证商品链接
      const result = await this.dingdanxiaService.validateGoodsLink(input, goodsId);
      if (result.valid) {
        return { code: 1, msg: '核对成功，商品链接正确', data: { actualId: result.actualId } };
      } else {
        return { code: 0, msg: result.error || '商品链接核对失败', data: null };
      }
    } catch (error) {
      return { code: 0, msg: error.message || '商品链接核对失败', data: null };
    }
  }

  /**
   * 商品口令核对
   * 原版: /mobile/task/task_heduinum
   * 用于买手执行任务时核对商品口令是否正确
   */
  @Post('task/task_heduinum')
  @UseGuards(JwtAuthGuard)
  async taskHeduinum(@Body() body: any, @Request() req) {
    try {
      const { inputnum, id: goodsId } = body;
      if (!inputnum) {
        return { code: 0, msg: '口令不能为空', data: null };
      }
      if (!goodsId) {
        return { code: 0, msg: '商品ID不能为空', data: null };
      }

      // 获取任务信息以验证口令
      const task = await this.tasksService.findOne(goodsId);
      if (!task) {
        return { code: 0, msg: '任务不存在', data: null };
      }

      // 核对口令：检查输入的口令是否包含任务设置的核对口令
      if (task.checkPassword && inputnum.includes(task.checkPassword)) {
        return { code: 1, msg: '核对成功，口令正确', data: null };
      } else {
        return { code: 0, msg: '口令核对失败，请检查输入是否正确', data: null };
      }
    } catch (error) {
      return { code: 0, msg: error.message || '口令核对失败', data: null };
    }
  }

  /**
   * 提交第二步（收藏截图+商品链接）
   * 原版: /mobile/task/task_two
   * 用于买手执行任务时提交第二步信息
   */
  @Post('task/task_two')
  @UseGuards(JwtAuthGuard)
  async taskTwo(@Body() body: any, @Request() req) {
    try {
      const {
        user_task_id: orderId,
        keywordimg,
        inputall,
        inputallnum,
        dizhi1,
        dizhi2,
        chatimg,
      } = body;

      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 获取任务信息
      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { code: 0, msg: '任务不存在', data: null };
      }

      // 验证商品链接（如果任务有platformProductId配置）
      if (task.platformProductId && dizhi1) {
        const validation = await this.dingdanxiaService.validateGoodsLink(dizhi1, task.platformProductId);
        if (!validation.valid) {
          return { code: 0, msg: `主商品链接核对失败: ${validation.error}`, data: null };
        }
      }

      // 提交步骤2数据
      const result = await this.ordersService.submitStep(orderId, req.user.userId, {
        step: 2,
        screenshot: keywordimg,
        inputData: {
          goodsLink1: dizhi1,
          goodsLink2: dizhi2,
          chatImg: chatimg,
          inputall: inputall,
          inputallnum: inputallnum,
        },
      });

      return { code: 1, msg: '提交成功', data: result };
    } catch (error) {
      return { code: 0, msg: error.message || '提交第二步失败', data: null };
    }
  }

  /**
   * 提交第三步（订单信息+截图）
   * 原版: /mobile/task/task_three
   * 用于买手执行任务时提交第三步信息
   */
  @Post('task/task_three')
  @UseGuards(JwtAuthGuard)
  async taskThree(@Body() body: any, @Request() req) {
    try {
      const {
        user_task_id: orderId,
        table_order_id: platformOrderNumber,
        user_principal: paymentAmount,
        order_detail_img: orderDetailImg,
        threeradio,
        province,
        city,
        block,
        inputstreet,
        adressperson,
        addressphone,
      } = body;

      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 如果修改了收货地址
      if (threeradio === '2') {
        const addressData = {
          addressName: adressperson,
          addressPhone: addressphone,
          address: `${province} ${city} ${block} ${inputstreet}`,
        };
        await this.ordersService.updateAddress(orderId, req.user.userId, addressData);
      }

      // 更新平台订单号
      if (platformOrderNumber) {
        await this.ordersService.updatePlatformOrderNumber(orderId, req.user.userId, platformOrderNumber);
      }

      // 提交步骤3数据
      const result = await this.ordersService.submitStep(orderId, req.user.userId, {
        step: 3,
        screenshot: orderDetailImg,
        inputData: {
          platformOrderNumber,
          paymentAmount,
        },
      });

      return { code: 1, msg: '提交成功', url: '/orders', data: result };
    } catch (error) {
      return { code: 0, msg: error.message || '提交第三步失败', data: null };
    }
  }

  /**
   * 验证付款金额
   * 原版: /mobile/task/tasknumberchange
   * 用于买手执行任务时验证输入的付款金额是否在允许范围内
   */
  @Post('task/tasknumberchange')
  @UseGuards(JwtAuthGuard)
  async taskNumberChange(@Body() body: any, @Request() req) {
    try {
      const { number, task_id: orderId } = body;
      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      const paymentAmount = parseFloat(number);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return { code: 0, msg: '付款金额必须大于0', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 获取任务信息
      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { code: 0, msg: '任务不存在', data: null };
      }

      // 验证付款金额是否在允许范围内（商品价格的80%-120%）
      const expectedPrice = parseFloat(String(task.goodsPrice)) || 0;
      const minPrice = expectedPrice * 0.8;
      const maxPrice = expectedPrice * 1.2;

      if (paymentAmount < minPrice || paymentAmount > maxPrice) {
        return {
          code: 0,
          msg: `付款金额必须在 ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} 元之间`,
          data: null,
        };
      }

      return { code: 1, msg: '金额验证通过', data: null };
    } catch (error) {
      return { code: 0, msg: error.message || '金额验证失败', data: null };
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
      await this.ordersService.cancelOrder(orderId, req.user.userId);
      return { code: 1, msg: '取消成功', data: null };
    } catch (error) {
      return { code: 0, msg: error.message || '取消任务失败', data: null };
    }
  }

  /**
   * 获取预售任务尾款信息
   * 原版: /mobile/task/wk
   * 用于买手查看预售订单尾款信息
   */
  @Post('task/wk')
  @UseGuards(JwtAuthGuard)
  async taskWk(@Body() body: any, @Request() req) {
    try {
      const orderId = body.id || body.orderId || body.order_id;
      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 获取任务信息
      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { code: 0, msg: '任务不存在', data: null };
      }

      // 返回预售订单信息
      return {
        code: 1,
        msg: 'success',
        data: {
          list: {
            id: order.id,
            task_number: task.taskNumber || order.id,
            terminal: task.terminal === 1 ? '本佣货返' : '本立佣货',
            create_time: order.createdAt,
            task_type: task.taskType,
            ending_time: order.endingTime,
            principal: order.userPrincipal,
            seller_principal: order.sellerPrincipal || task.goodsPrice,
            wwid: order.buynoAccount,
            delivery: order.delivery,
            delivery_num: order.deliveryNum,
            ys_time: order.endingTime, // 尾款截止时间（使用订单截止时间）
            is_presale: order.isPresale,
            okYf: order.okYf,
            okWk: order.okWk,
            yfPrice: order.yfPrice,
            wkPrice: order.wkPrice,
          },
          product: [{
            name: task.title || order.productName,
            text_praise: '', // 好评文字（后续商家配置）
            img_praise: '', // 好评图片
            video_praise: '', // 好评视频
          }],
        },
      };
    } catch (error) {
      return { code: 0, msg: error.message || '获取预售订单信息失败', data: null };
    }
  }

  /**
   * 提交预售尾款
   * 原版: /mobile/task/take_wk
   * 用于买手提交预售订单尾款凭证
   */
  @Post('task/take_wk')
  @UseGuards(JwtAuthGuard)
  async taskTakeWk(@Body() body: any, @Request() req) {
    try {
      const {
        task_id: orderId,
        high_praise_img: screenshot,
        wk_order_detail: orderNo,
        wk_input_detail: paymentAmount,
      } = body;

      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      // 调用订单服务确认尾款
      const order = await this.ordersService.confirmPresaleFinal(
        orderId,
        req.user.userId,
        screenshot,
      );

      // 更新订单号和付款金额
      if (orderNo) {
        await this.ordersService.updatePlatformOrderNumber(orderId, req.user.userId, orderNo);
      }

      return {
        code: 1,
        msg: '尾款凭证提交成功，等待商家审核',
        url: '/orders',
        data: order,
      };
    } catch (error) {
      return { code: 0, msg: error.message || '提交尾款凭证失败', data: null };
    }
  }

  /**
   * 验证尾款金额
   * 原版: /mobile/task/wknumberchange
   * 用于买手验证尾款金额是否在允许范围内
   */
  @Post('task/wknumberchange')
  @UseGuards(JwtAuthGuard)
  async wkNumberChange(@Body() body: any, @Request() req) {
    try {
      const { number, task_id: orderId } = body;
      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      const paymentAmount = parseFloat(number);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return { code: 0, msg: '付款金额必须大于0', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 验证尾款金额是否在允许范围内（实际尾款金额的±100元）
      const expectedWkPrice = parseFloat(String(order.wkPrice)) || 0;
      const minPrice = expectedWkPrice - 100;
      const maxPrice = expectedWkPrice + 100;

      if (paymentAmount < minPrice || paymentAmount > maxPrice) {
        return {
          code: 0,
          msg: `尾款金额必须在 ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} 元之间`,
          data: null,
        };
      }

      return { code: 1, msg: '金额验证通过', data: null };
    } catch (error) {
      return { code: 0, msg: error.message || '金额验证失败', data: null };
    }
  }

  /**
   * 获取任务步骤信息
   * 原版: /mobile/task/taskstep
   * 用于买手执行任务时获取任务详情和步骤信息
   */
  @Post('task/taskstep')
  @UseGuards(JwtAuthGuard)
  async taskStep(@Body() body: any, @Request() req) {
    try {
      const orderId = body.id || body.orderId || body.order_id;
      if (!orderId) {
        return { code: 0, msg: '订单ID不能为空', data: null };
      }

      // 获取订单信息
      const order = await this.ordersService.findOne(orderId);
      if (!order || order.userId !== req.user.userId) {
        return { code: 0, msg: '订单不存在', data: null };
      }

      // 获取任务信息
      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { code: 0, msg: '任务不存在', data: null };
      }

      // 构建商品信息，使用脱敏口令
      const maskedPassword = task.isPasswordEnabled && task.checkPassword
        ? this.ordersService.maskPassword(task.checkPassword)
        : '';

      // 返回任务步骤信息
      return {
        code: 1,
        msg: 'success',
        data: {
          order_id: order.id,
          task_id: task.id,
          task_number: task.taskNumber,
          status: order.status,
          current_step: order.currentStep || 1,
          total_steps: order.totalSteps || 6,

          // 任务基础信息
          shop_name: task.shopName || '',
          shop_img: '', // TODO: 从商家或店铺表获取
          main_image: task.mainImage || '',
          title: task.title || '',
          url: task.url || '',
          keyword: task.keyword || '',
          tao_word: task.taoWord || '',
          goods_price: task.goodsPrice || 0,

          // 口令验证相关
          admin_limit_switch: task.isPasswordEnabled ? 1 : 0,
          goods_info: [{
            goods_name: task.title || '',
            goods_img: task.mainImage || '',
            goods_price: task.goodsPrice || 0,
            goods_spec: maskedPassword, // 脱敏后的口令
            goods_num: 1,
          }],

          // 增值服务
          is_praise: task.isPraise ? 1 : 0,
          is_img_praise: task.isImgPraise ? 1 : 0,
          is_video_praise: task.isVideoPraise ? 1 : 0,

          // 佣金信息
          commission: order.commission || 0,
          user_divided: order.userDivided || 0,
          user_principal: order.userPrincipal || 0,

          // 浏览时长要求
          total_browse_minutes: task.totalBrowseMinutes || 15,
          main_browse_minutes: task.mainBrowseMinutes || 8,
          sub_browse_minutes: task.subBrowseMinutes || 2,

          // 其他要求
          need_huobi: task.needHuobi ? 1 : 0,
          huobi_keyword: task.huobiKeyword || '',
          need_shoucang: task.needShoucang ? 1 : 0,
          need_guanzhu: task.needGuanzhu ? 1 : 0,
          need_jialiao: task.needJialiao ? 1 : 0,
          need_jiagou: task.needJiagou ? 1 : 0,

          // 时间信息
          create_time: order.createdAt,
          task_time_limit: task.taskTimeLimit || 24,
        },
      };
    } catch (error) {
      return { code: 0, msg: error.message || '获取任务步骤失败', data: null };
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
        },
      );
      return { code: 1, msg: 'success', data: result };
    } catch (error) {
      return {
        code: 0,
        msg: error.message || '获取本金流水失败',
        data: { list: [], total: 0 },
      };
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
        },
      );
      return { code: 1, msg: 'success', data: result };
    } catch (error) {
      return {
        code: 0,
        msg: error.message || '获取银锭流水失败',
        data: { list: [], total: 0 },
      };
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
      const result = await this.withdrawalsService.findAllByUser(
        req.user.userId,
      );
      return {
        code: 1,
        msg: 'success',
        data: { list: result, total: result.length },
      };
    } catch (error) {
      return {
        code: 0,
        msg: error.message || '获取提现记录失败',
        data: { list: [], total: 0 },
      };
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
        },
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
      const defaultCard = cards.find((c) => c.isDefault) || cards[0];
      if (!defaultCard) {
        return { code: 0, msg: '请先添加银行卡', data: null };
      }

      const result = await this.withdrawalsService.create(req.user.userId, {
        amount: parseFloat(body.price) || 0,
        type:
          body.radio === '1' ? WithdrawalType.BALANCE : WithdrawalType.SILVER,
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
        },
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
      const user = await this.usersService.findByPhone(
        body.mobile || body.phone,
      );
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
        register: SmsCodeType.REGISTER,
        login: SmsCodeType.LOGIN,
        forget: SmsCodeType.RESET_PASSWORD,
        change_phone: SmsCodeType.CHANGE_PHONE,
        change_password: SmsCodeType.RESET_PASSWORD,
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

  // ============ /mobile/my/taskmanagement 订单管理 ============

  /**
   * 获取用户订单列表
   * 原版: POST /mobile/my/taskmanagement
   * 参数: page, datetime1, datetime2, choose_a, buyno, task_type, terminal, zhuipin, indexorder
   */
  @Post('my/taskmanagement')
  @UseGuards(JwtAuthGuard)
  async taskManagement(@Request() req: any, @Body() body: any) {
    try {
      const userId = req.user.id;
      const page = body.page || 1;
      const limit = body.limit || 10;

      // 1. 获取分页订单 (Fetch Orders)
      const { data: orders, total } = await this.ordersService.findAllAndCount(userId, {
        page,
        limit,
        status: body.choose_a,
        // TODO: Support other filters like task_type, buyno, etc. if needed
      });

      // 2. 批量获取相关任务信息 (Fetch Related Tasks)
      const taskIds = orders.map(o => o.taskId);
      let tasksMap: Record<string, any> = {};
      if (taskIds.length > 0) {
        const tasks = await this.tasksService.findByIds(taskIds);
        tasksMap = tasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {});
      }

      // 3. 构建返回列表 (Build Response List)
      const list = orders.map((order: any) => {
        const task = tasksMap[order.taskId] || {};
        const statusMap = this.mapStatusToLegacy(order.status);

        return {
          id: order.id,
          task_number: task.taskNumber || order.id, // 任务编号
          shop_name: task.shopName || '未知店铺',
          shop_img: order.shopImg || '', // TODO: Get from Task or Merchant?
          type: this.getPlatformName(order.platform), // 店铺类型 (淘宝/天猫...)
          task_type: this.getTaskTypeName(task.taskType), // 任务类型名称
          main_product_name: order.productName,
          main_product_pc_img: task.mainImage || '',

          state: statusMap.state,           // 显示状态文本
          index_state: statusMap.index_state, // 状态码

          wwid: order.buynoAccount, // 买号
          commission: order.commission,
          user_divided: order.userDivided || 0,
          user_principal: order.userPrincipal || 0,
          create_time: order.createdAt, // Should be string formatted? Frontend likely handles date string
          progress: this.getOrderProgress(order) + '%', // Frontend likely expects string "50%" or number? Frontend code: list[i].progress + '%'

          review_task_id: order.reviewTaskId || '', // TODO: 追评ID
          checked: false,
        };
      });

      return {
        code: 1,
        msg: 'success',
        data: {
          list,
          total: total,
          page,
          limit,
        },
      };
    } catch (error) {
      return { code: 0, msg: error.message || '获取订单列表失败', data: null };
    }
  }

  // 辅助函数：映射状态到旧版 state 和 index_state
  private mapStatusToLegacy(status: string): { state: string; index_state: string } {
    const map: Record<string, { state: string; index_state: string }> = {
      'PENDING': { state: '进行中', index_state: '0' },
      'SUBMITTED': { state: '待审核', index_state: '0' },
      'APPROVED': { state: '待发货', index_state: '1' }, // 审核通过即待发货
      'WAITING_DELIVERY': { state: '待发货', index_state: '1' },
      'WAITING_RECEIVE': { state: '待收货', index_state: '2' },
      'WAITING_REFUND': { state: '待返款', index_state: '3' },
      'WAITING_REVIEW_REFUND': { state: '待返款', index_state: '3' },
      'COMPLETED': { state: '已完成', index_state: '5' },
      'CANCELLED': { state: '已取消', index_state: '7' },
      'REJECTED': { state: '已拒绝', index_state: '99' },
      'APPEAL_PENDING': { state: '申诉中', index_state: '7' }, // 申诉中暂归为特殊状态
      'ADDITIONAL_REVIEW': { state: '需追评', index_state: '5' }, // 追评通常在已完成以后的流程
    };
    return map[status] || { state: '未知状态', index_state: '' };
  }

  private getPlatformName(platform: string): string {
    return platform || '其他';
  }

  private getTaskTypeName(type: number): string {
    const types = ['关键词', '关键词', '淘口令', '二维码', '直通车', '通道任务']; // 0-based index? TaskType enum starts at 1
    // Enum: 1=Taobao... Wait, TaskType enum is specific to platform?
    // Frontend TASK_TYPE_OPTIONS: 1=关键词 2=淘口令 3=二维码 4=直通车 5=通道任务
    // But Task.taskType is platform (1=Taobao). 
    // Is there a separate field for traffic type?
    // Task entity: taoWord, qrCode fields imply type.
    // Let's assume generic "普通任务" if not specified.
    return '普通任务';
  }

  // 辅助函数：计算订单进度百分比
  private getOrderProgress(order: any): number {
    if (order.status === 'COMPLETED') return 100;
    if (order.status === 'CANCELLED') return 0;
    if (order.totalSteps && order.currentStep) {
      return Math.round((order.currentStep / order.totalSteps) * 100);
    }
    // 根据状态估算进度
    const statusProgress: Record<string, number> = {
      PENDING: 10,
      SUBMITTED: 30,
      APPROVED: 50,
      WAITING_DELIVERY: 50,
      WAITING_RECEIVE: 70,
      WAITING_REFUND: 90,
    };
    return statusProgress[order.status] || 0;
  }
  /**
   * 确认收货
   * 原版: /mobile/my/take_delivery
   */
  @Post('my/take_delivery')
  @UseGuards(JwtAuthGuard)
  async takeDelivery(@Body() body: any, @Request() req) {
    try {
      const orderId = body.task_id || body.orderId;
      const praiseImg = body.high_praise_img; // Base64 or URL

      // Update order status to WAITING_REFUND (Legacy state 5)
      // We need to extend OrdersService or access Repository directly?
      // Best to use OrdersService.updateStatus but we might need to save proof too.
      // Let's add a method in OrdersService for this specific business action if proper.
      // For now, using direct update or service call.

      // Since OrdersService.confirmReceipt isn't defined, let's use a custom logic here or add it to service.
      // Ideally, added to OrdersService.
      await this.ordersService.confirmReceipt(orderId, req.user.userId, praiseImg);

      return { code: 1, msg: '确认收货成功', data: null, url: '/orders' };
    } catch (error) {
      return { code: 0, msg: error.message || '确认收货失败', data: null };
    }
  }
}
