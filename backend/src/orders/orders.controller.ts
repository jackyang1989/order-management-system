import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, SubmitStepDto, OrderFilterDto } from './order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TasksService } from '../tasks/tasks.service';
import { DingdanxiaService } from '../dingdanxia/dingdanxia.service';
import { TaskGoodsService } from '../task-goods/task-goods.service';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private tasksService: TasksService,
    private dingdanxiaService: DingdanxiaService,
    private taskGoodsService: TaskGoodsService,
    private buyerAccountsService: BuyerAccountsService,
  ) { }

  // ============ 管理员端订单管理 ============

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminFindAll(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const status = query.status;

    const result = await this.ordersService.findAllAdmin({
      page,
      limit,
      status,
    });
    return {
      success: true,
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  }

  @Get()
  async findAll(@Request() req, @Query() filter: OrderFilterDto) {
    const orders = await this.ordersService.findAll(req.user.userId, filter);
    return {
      success: true,
      data: orders,
    };
  }

  @Get('stats')
  async getStats(@Request() req) {
    const stats = await this.ordersService.getStats(req.user.userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }
    if (order.userId !== req.user.userId) {
      return {
        success: false,
        message: '无权访问此订单',
      };
    }

    // Security: Mask checkPassword in response, never expose original
    const responseOrder: any = { ...order };
    if (responseOrder.task?.checkPassword) {
      responseOrder.maskedPassword = this.ordersService.maskPassword(
        responseOrder.task.checkPassword,
      );
      delete responseOrder.task.checkPassword;
    }

    return {
      success: true,
      data: responseOrder,
    };
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    try {
      const order = await this.ordersService.create(
        req.user.userId,
        createOrderDto,
      );
      return {
        success: true,
        message: '订单创建成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/submit-step')
  async submitStep(
    @Param('id') id: string,
    @Body() submitStepDto: SubmitStepDto,
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.submitStep(
        id,
        req.user.userId,
        submitStepDto,
      );
      return {
        success: true,
        message:
          order.currentStep > order.totalSteps
            ? '任务已完成，等待审核'
            : '步骤提交成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 商家端订单审核 ============

  @Get('merchant/list')
  async findMerchantOrders(@Request() req, @Query('status') status?: string) {
    const filter = status ? { status: status as any } : undefined;
    const orders = await this.ordersService.findByMerchant(
      req.user.userId,
      filter,
    );
    return {
      success: true,
      data: orders,
    };
  }

  @Get('merchant/stats')
  async getMerchantStats(@Request() req) {
    const stats = await this.ordersService.getMerchantStats(req.user.userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectReason?: string },
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.review(
        id,
        req.user.userId,
        body.approved,
        body.rejectReason,
      );
      return {
        success: true,
        message: body.approved ? '订单审核通过' : '订单已驳回',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 发货管理 ============

  @Post(':id/ship')
  async shipOrder(
    @Param('id') id: string,
    @Body() body: { delivery: string; deliveryNum: string },
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.shipOrder(
        id,
        req.user.userId,
        body.delivery,
        body.deliveryNum,
      );
      return {
        success: true,
        message: '发货成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/return')
  async returnPayment(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.returnPayment(
        id,
        req.user.userId,
        body.amount,
      );
      return {
        success: true,
        message: '返款成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/confirm-receipt')
  async confirmReceipt(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.confirmReceipt(
        id,
        req.user.userId,
      );
      return {
        success: true,
        message: '确认收货成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/platform-order')
  async updatePlatformOrderNumber(
    @Param('id') id: string,
    @Body() body: { platformOrderNumber: string },
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.updatePlatformOrderNumber(
        id,
        req.user.userId,
        body.platformOrderNumber,
      );
      return {
        success: true,
        message: '平台订单号更新成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/address')
  async updateAddress(
    @Param('id') id: string,
    @Body()
    body: { addressName: string; addressPhone: string; address: string },
    @Request() req,
  ) {
    try {
      const order = await this.ordersService.updateAddress(
        id,
        req.user.userId,
        body,
      );
      return {
        success: true,
        message: '收货地址更新成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.cancelOrder(id, req.user.userId);
      return {
        success: true,
        message: '订单已取消',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 预售任务接口 ============

  /**
   * 获取预售订单状态
   */
  @Get(':id/presale-status')
  async getPresaleStatus(@Param('id') id: string, @Request() req) {
    try {
      const status = await this.ordersService.getPresaleStatus(id, req.user.userId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 确认支付定金
   */
  @Post(':id/presale/confirm-deposit')
  async confirmPresaleDeposit(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { screenshot?: string },
  ) {
    try {
      const order = await this.ordersService.confirmPresaleDeposit(
        id,
        req.user.userId,
        body.screenshot,
      );
      return {
        success: true,
        message: '定金已确认',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 确认支付尾款
   */
  @Post(':id/presale/confirm-final')
  async confirmPresaleFinal(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { screenshot?: string },
  ) {
    try {
      const order = await this.ordersService.confirmPresaleFinal(
        id,
        req.user.userId,
        body.screenshot,
      );
      return {
        success: true,
        message: '尾款已确认',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============ 任务执行流程 (RESTful API) ============

  /**
   * 获取订单执行数据
   * 替代: /mobile/task/taskstep
   */
  @Get(':id/execution-data')
  async getExecutionData(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        return { success: false, message: '订单不存在' };
      }
      if (order.userId !== req.user.userId) {
        return { success: false, message: '无权访问此订单' };
      }

      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 获取多商品数据
      const taskGoodsList = await this.taskGoodsService.findByTaskId(task.id);
      const taskKeywords = await this.taskGoodsService.findKeywordsByTaskId(task.id);

      // 从链接中提取平台商品ID
      const extractPlatformIdFromLink = (link: string): string | null => {
        if (!link) return null;
        // 淘宝/天猫链接: id=xxx
        const taobaoMatch = link.match(/[?&]id=(\d+)/);
        if (taobaoMatch) return taobaoMatch[1];
        // 京东链接: /xxx.html
        const jdMatch = link.match(/\/(\d+)\.html/);
        if (jdMatch) return jdMatch[1];
        // 拼多多链接: goods_id=xxx
        const pddMatch = link.match(/goods_id=(\d+)/);
        if (pddMatch) return pddMatch[1];
        // 1688链接: offer/xxx.html
        const alibabaMatch = link.match(/offer\/(\d+)\.html/);
        if (alibabaMatch) return alibabaMatch[1];
        // 通用：提取8位以上数字
        const genericMatch = link.match(/(\d{8,})/);
        if (genericMatch) return genericMatch[1];
        return null;
      };

      // 构建 goodsList 数据
      const goodsList = taskGoodsList.map((goods, index) => {
        // 找到属于这个商品的关键词（通过 taskGoodsId 匹配）
        const goodsKeywords = taskKeywords.filter(kw => kw.taskGoodsId === goods.id);

        // 为每个商品生成脱敏口令
        const goodsMaskedPassword = goods.verifyCode
          ? this.ordersService.maskPassword(goods.verifyCode)
          : '';

        // 优先从链接提取平台商品ID（因为goodsId可能是内部关联ID）
        const platformGoodsId = extractPlatformIdFromLink(goods.link) || goods.id;

        return {
          id: goods.id,
          goodsId: platformGoodsId,
          name: goods.name,
          pcImg: goods.pcImg,
          link: goods.link,
          specName: goods.specName,
          specValue: goods.specValue,
          price: goods.price,
          num: goods.num,
          totalPrice: goods.totalPrice,
          isMain: index === 0, // 第一个为主商品
          verifyCode: goodsMaskedPassword, // 脱敏后的口令提示
          orderSpecs: goods.orderSpecs ? (typeof goods.orderSpecs === 'string' ? JSON.parse(goods.orderSpecs) : goods.orderSpecs) : [],
          // 关键词列表
          keywords: goodsKeywords.map(kw => ({
            id: kw.id,
            keyword: kw.keyword,
            terminal: kw.terminal,
            sort: kw.sort,
            province: kw.province,
            minPrice: kw.minPrice,
            maxPrice: kw.maxPrice,
            discount: kw.discount,
            filter: kw.filter,
          })),
        };
      });

      // 构建脱敏口令（兼容旧逻辑）
      const maskedPassword = task.isPasswordEnabled && task.checkPassword
        ? this.ordersService.maskPassword(task.checkPassword)
        : '';

      // 获取用户买号的实际平台账号名称
      let buynoUsername = '';
      if (order.buynoId) {
        const buyerAccount = await this.buyerAccountsService.findOne(order.buynoId, order.userId);
        buynoUsername = buyerAccount?.platformAccount || order.buynoAccount || '';
      } else {
        buynoUsername = order.buynoAccount || '';
      }

      // 获取货比关键词（优先从关键词列表获取，否则使用任务级别的）
      let huobiKeyword = task.compareKeyword || '';
      if (!huobiKeyword && taskKeywords.length > 0) {
        // 查找第一个有 compareKeyword 的关键词
        const kwWithCompare = taskKeywords.find(kw => kw.compareKeyword);
        if (kwWithCompare) {
          huobiKeyword = kwWithCompare.compareKeyword;
        }
      }

      // 计算垫付本金（用户需要垫付的金额）
      let userPrincipal = Number(order.userPrincipal) || 0;
      if (userPrincipal === 0) {
        // 如果订单没有设置，使用任务的商品价格
        if (goodsList.length > 0) {
          userPrincipal = goodsList.reduce((sum, g) => sum + Number(g.totalPrice || g.price * g.num || 0), 0);
        } else {
          userPrincipal = Number(task.goodsPrice) || 0;
        }
      }

      // 新版：使用订单中已保存的好评配置（在订单创建时已分配）
      // 订单创建时已根据 orderPraiseConfigs 分配了对应的好评内容到 order.praiseContent, order.praiseImages, order.praiseVideo
      let praiseList: string[] = [];
      let praiseImgList: string[][] = [];
      let praiseVideoList: string[] = [];
      let isPraise = false;
      let isImgPraise = false;
      let isVideoPraise = false;

      // 从订单实体中获取已分配的好评内容
      if (order.praiseContent && order.praiseContent.trim() !== '') {
        praiseList = [order.praiseContent];
        isPraise = true;
      }
      if (order.praiseImages && Array.isArray(order.praiseImages) && order.praiseImages.length > 0) {
        praiseImgList = [order.praiseImages];
        isImgPraise = true;
      }
      if (order.praiseVideo && order.praiseVideo.trim() !== '') {
        praiseVideoList = [order.praiseVideo];
        isVideoPraise = true;
      }

      // 如果订单中没有好评数据，回退到旧版逻辑（向后兼容）
      if (!isPraise && !isImgPraise && !isVideoPraise) {
        const taskOrders = await this.ordersService.findByTask(task.id);
        const orderIndex = taskOrders.findIndex((o: any) => o.id === order.id);

        if (task.praiseList) {
          const allPraises = typeof task.praiseList === 'string'
            ? JSON.parse(task.praiseList)
            : task.praiseList;
          if (Array.isArray(allPraises) && allPraises.length > 0) {
            const assignedIndex = orderIndex >= 0 && orderIndex < allPraises.length
              ? orderIndex
              : orderIndex % allPraises.length;
            praiseList = [allPraises[assignedIndex]];
            isPraise = true;
          }
        }

        if (task.praiseImgList) {
          const allImages = typeof task.praiseImgList === 'string'
            ? JSON.parse(task.praiseImgList)
            : task.praiseImgList;
          if (Array.isArray(allImages) && allImages.length > 0) {
            const assignedIndex = orderIndex >= 0 && orderIndex < allImages.length
              ? orderIndex
              : orderIndex % allImages.length;
            praiseImgList = [allImages[assignedIndex]];
            isImgPraise = true;
          }
        }

        if (task.praiseVideoList) {
          const allVideos = typeof task.praiseVideoList === 'string'
            ? JSON.parse(task.praiseVideoList)
            : task.praiseVideoList;
          if (Array.isArray(allVideos) && allVideos.length > 0) {
            const assignedIndex = orderIndex >= 0 && orderIndex < allVideos.length
              ? orderIndex
              : orderIndex % allVideos.length;
            praiseVideoList = [allVideos[assignedIndex]];
            isVideoPraise = true;
          }
        }
      }

      return {
        success: true,
        data: {
          orderId: order.id,
          taskId: task.id,
          taskNumber: task.taskNumber,
          status: order.status,
          currentStep: order.currentStep || 1,
          totalSteps: order.totalSteps || 6,

          // 任务基础信息
          shopName: task.shopName || '',
          mainImage: task.mainImage || '',
          title: task.title || '',
          url: task.url || '',
          keyword: task.keyword || '',
          itemToken: task.itemToken || '',
          qrCode: task.qrCode || '',
          taoWord: task.itemToken || '',
          goodsPrice: task.goodsPrice || 0,
          taskType: task.taskType,
          terminal: task.terminal,

          // 口令验证相关
          isPasswordEnabled: task.isPasswordEnabled,
          checkPassword: task.checkPassword || '',
          maskedPassword,
          platformProductId: task.platformProductId,

          // 增值服务 - 使用订单已分配的好评
          isPraise: isPraise,
          isImgPraise: isImgPraise,
          isVideoPraise: isVideoPraise,
          praiseList: praiseList,
          praiseImgList: praiseImgList,
          praiseVideoList: praiseVideoList,

          // 佣金信息
          commission: order.commission || task.baseServiceFee || 0,
          userDivided: order.userDivided || task.extraCommission || task.extraReward || 0,
          userPrincipal: userPrincipal,
          addReward: task.extraCommission || task.extraReward || 0,
          extraReward: task.extraCommission || task.extraReward || 0,

          // 浏览时长要求
          totalBrowseMinutes: task.totalBrowseMinutes || 15,
          compareBrowseMinutes: task.compareBrowseMinutes || 3,
          mainBrowseMinutes: task.mainBrowseMinutes || 8,
          subBrowseMinutes: task.subBrowseMinutes || 2,
          hasSubProduct: task.hasSubProduct !== false,

          // 其他要求
          needCompare: task.needCompare,
          compareKeyword: task.compareKeyword || '',
          huobiKeyword: huobiKeyword,
          backupKeyword: task.backupKeyword || '',
          compareCount: task.compareCount || 3,
          needFavorite: task.needFavorite,
          needFollow: task.needFollow,
          contactCSConfig: task.contactCSConfig,
          needAddCart: task.needAddCart,
          needRandomBrowse: task.needRandomBrowse || false,
          needBrowseReviews: task.needBrowseReviews || false,
          needBrowseQA: task.needBrowseQA || false,
          isFreeShipping: task.isFreeShipping,
          weight: task.weight || 0,
          fastRefund: task.fastRefund || false,

          // 时间信息
          createdAt: order.createdAt,
          endingTime: order.endingTime,
          taskTimeLimit: task.taskTimeLimit || 24,

          // 订单信息 - 使用用户名而不是UUID
          buynoAccount: buynoUsername,
          stepData: order.stepData,
          address: order.address,
          addressName: order.addressName,
          addressPhone: order.addressPhone,

          // 商家备注
          memo: task.memo || '',

          // 多商品数据
          goodsList,
          version: task.version || 1,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 验证商品链接
   * 替代: /mobile/task/task_hedui
   */
  @Post(':id/verify-link')
  async verifyLink(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { link: string; goodsId?: string },
  ) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order || order.userId !== req.user.userId) {
        return { success: false, message: '订单不存在' };
      }

      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      const expectedId = body.goodsId || task.platformProductId;
      if (!expectedId) {
        return { success: true, message: '核对成功' };
      }

      const result = await this.dingdanxiaService.validateGoodsLink(body.link, expectedId);
      if (result.valid) {
        return { success: true, message: '核对成功，商品链接正确', data: { actualId: result.actualId } };
      } else {
        return { success: false, message: result.error || '商品链接核对失败' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 验证商品口令
   * 替代: /mobile/task/task_heduinum
   */
  @Post(':id/verify-password')
  async verifyPassword(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { password: string; goodsId?: string },
  ) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order || order.userId !== req.user.userId) {
        return { success: false, message: '订单不存在' };
      }

      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 获取任务商品列表，检查每个商品的verifyCode
      const taskGoodsList = await this.taskGoodsService.findByTaskId(task.id);

      // 如果指定了goodsId，只检查该商品的口令
      if (body.goodsId) {
        const targetGoods = taskGoodsList.find(g => g.id === body.goodsId);
        if (targetGoods && targetGoods.verifyCode && body.password.includes(targetGoods.verifyCode)) {
          return { success: true, message: '核对成功，口令正确' };
        }
      } else {
        // 检查所有商品的口令
        for (const goods of taskGoodsList) {
          if (goods.verifyCode && body.password.includes(goods.verifyCode)) {
            return { success: true, message: '核对成功，口令正确' };
          }
        }
      }

      // 兼容旧版：检查task.checkPassword
      if (task.checkPassword && body.password.includes(task.checkPassword)) {
        return { success: true, message: '核对成功，口令正确' };
      }

      return { success: false, message: '口令核对失败，请检查输入是否正确' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 验证付款金额
   * 替代: /mobile/task/tasknumberchange
   */
  @Post(':id/validate-payment')
  async validatePayment(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { amount: number },
  ) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order || order.userId !== req.user.userId) {
        return { success: false, message: '订单不存在' };
      }

      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      const paymentAmount = Number(body.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return { success: false, message: '付款金额必须大于0' };
      }

      const expectedPrice = parseFloat(String(task.goodsPrice)) || 0;
      const minPrice = expectedPrice * 0.8;
      const maxPrice = expectedPrice * 1.2;

      if (paymentAmount < minPrice || paymentAmount > maxPrice) {
        return {
          success: false,
          message: `付款金额必须在 ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} 元之间`,
        };
      }

      return { success: true, message: '金额验证通过' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 验证尾款金额
   * 替代: /mobile/task/wknumberchange
   */
  @Post(':id/validate-final-payment')
  async validateFinalPayment(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { amount: number },
  ) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order || order.userId !== req.user.userId) {
        return { success: false, message: '订单不存在' };
      }

      const paymentAmount = Number(body.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return { success: false, message: '付款金额必须大于0' };
      }

      const expectedFinalPayment = parseFloat(String(order.finalPayment)) || 0;
      const minPrice = expectedFinalPayment - 100;
      const maxPrice = expectedFinalPayment + 100;

      if (paymentAmount < minPrice || paymentAmount > maxPrice) {
        return {
          success: false,
          message: `尾款金额必须在 ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} 元之间`,
        };
      }

      return { success: true, message: '金额验证通过' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取预售订单详情
   * 替代: /mobile/task/wk
   */
  @Get(':id/presale-details')
  async getPresaleDetails(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order || order.userId !== req.user.userId) {
        return { success: false, message: '订单不存在' };
      }

      const task = await this.tasksService.findOne(order.taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      return {
        success: true,
        data: {
          id: order.id,
          taskNumber: task.taskNumber || order.id,
          terminal: task.terminal,
          createdAt: order.createdAt,
          taskType: task.taskType,
          endingTime: order.endingTime,
          principal: order.userPrincipal,
          sellerPrincipal: order.sellerPrincipal || task.goodsPrice,
          buynoAccount: order.buynoAccount,
          delivery: order.delivery,
          deliveryNum: order.deliveryNum,
          isPresale: order.isPresale,
          okYf: order.okYf,
          okWk: order.okWk,
          presaleDeposit: order.presaleDeposit,
          finalPayment: order.finalPayment,
          productName: task.title || order.productName,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 提交预售尾款
   * 替代: /mobile/task/take_wk
   */
  @Post(':id/presale/submit-final')
  async submitPresaleFinal(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { screenshot: string; orderNo?: string; paymentAmount?: string },
  ) {
    try {
      const order = await this.ordersService.confirmPresaleFinal(
        id,
        req.user.userId,
        body.screenshot,
      );

      if (body.orderNo) {
        await this.ordersService.updatePlatformOrderNumber(id, req.user.userId, body.orderNo);
      }

      return {
        success: true,
        message: '尾款凭证提交成功，等待商家审核',
        data: order,
        redirectUrl: '/orders',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============ 订单详情和确认收货 (RESTful API) ============

  /**
   * 获取订单完整详情
   * 替代: /mobile/my/detail
   */
  @Get(':id/detail')
  async getOrderDetail(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        return { success: false, message: '订单不存在' };
      }
      if (order.userId !== req.user.userId) {
        return { success: false, message: '无权访问此订单' };
      }

      const task = await this.tasksService.findOne(order.taskId);

      // 构建当前订单的好评数据
      const products: Array<{
        name: string;
        textPraise: string;
        imgPraise: string[];
        videoPraise: string;
      }> = [];
      if (order.praiseContent || order.praiseImages || order.praiseVideo) {
        products.push({
          name: order.productName || task?.title || '',
          textPraise: order.praiseContent || '',
          imgPraise: order.praiseImages || [],
          videoPraise: order.praiseVideo || '',
        });
      }

      return {
        success: true,
        data: {
          id: order.id,
          buynoAccount: order.buynoAccount || '',
          taskType: task?.taskType ? `类型${task.taskType}` : '',
          terminal: task?.terminal !== undefined ? task.terminal : 2,
          sellerPrincipal: order.sellerPrincipal || order.userPrincipal || 0,
          commission: order.commission || 0,
          userDivided: order.userDivided || 0,
          goodsPrice: task?.goodsPrice || 0,
          shopName: task?.shopName || '',
          taskNumber: task?.taskNumber || order.id,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          status: order.status || '待下单',
          cancelReason: '',
          keywordImg: order.keywordImg || '',
          chatImg: order.chatImg || '',
          platformOrderNumber: order.platformOrderNumber || '',
          delivery: order.delivery || '',
          deliveryNum: order.deliveryNum || '',
          deliveryTime: order.deliveryTime || '',
          products: products,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取收货页面数据
   * 替代: /mobile/my/shouhuo
   */
  @Get(':id/receive-data')
  async getReceiveData(@Param('id') id: string, @Request() req) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        return { success: false, message: '订单不存在' };
      }
      if (order.userId !== req.user.userId) {
        return { success: false, message: '无权访问此订单' };
      }

      const task = await this.tasksService.findOne(order.taskId);

      return {
        success: true,
        data: {
          id: order.id,
          taskNumber: task?.taskNumber || order.id,
          createdAt: order.createdAt,
          taskType: task?.taskType ? `类型${task.taskType}` : '',
          buynoAccount: order.buynoAccount || '',
          sellerPrincipal: order.sellerPrincipal || order.userPrincipal || 0,
          delivery: order.delivery || '',
          deliveryNum: order.deliveryNum || '',
          products: [],
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 确认收货并上传好评截图
   * 替代: /mobile/my/take_delivery
   */
  @Post(':id/confirm-delivery')
  async confirmDelivery(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { highPraiseImg: string },
  ) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        return { success: false, message: '订单不存在' };
      }
      if (order.userId !== req.user.userId) {
        return { success: false, message: '无权访问此订单' };
      }

      // 确认收货
      await this.ordersService.confirmReceipt(id, req.user.userId);

      return {
        success: true,
        message: '确认收货成功',
        redirectUrl: '/orders',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 批量获取订单返款金额
   * 替代: /mobile/task/all_seller_principal
   */
  @Post('batch/principal')
  async getBatchPrincipal(@Request() req, @Body() body: { orderIds: string[] }) {
    try {
      const orderIds = body.orderIds;
      if (!orderIds || orderIds.length === 0) {
        return { success: false, message: '请选择要操作的订单' };
      }

      let totalPrincipal = 0;
      for (const orderId of orderIds) {
        const order = await this.ordersService.findOne(orderId);
        if (order && order.userId === req.user.userId) {
          totalPrincipal += parseFloat(String(order.sellerPrincipal || order.userPrincipal || 0));
        }
      }

      return {
        success: true,
        data: {
          principal: totalPrincipal.toFixed(2),
          count: orderIds.length,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 批量确认返款
   * 替代: /mobile/task/allfankuan
   */
  @Post('batch/confirm-refund')
  async batchConfirmRefund(@Request() req, @Body() body: { orderIds: string[] }) {
    try {
      const orderIds = body.orderIds;
      if (!orderIds || orderIds.length === 0) {
        return { success: false, message: '请选择要确认返款的订单' };
      }

      let successCount = 0;
      let failCount = 0;

      for (const orderId of orderIds) {
        try {
          const order = await this.ordersService.findOne(orderId);
          if (order && order.userId === req.user.userId) {
            await this.ordersService.confirmReceipt(orderId, req.user.userId);
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      return {
        success: true,
        message: `成功确认 ${successCount} 笔返款${failCount > 0 ? `，${failCount} 笔失败` : ''}`,
        redirectUrl: '/orders',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
