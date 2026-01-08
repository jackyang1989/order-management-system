import { DataSource } from 'typeorm';
import { HelpArticle, ArticleType } from '../help-center/help-article.entity';

/**
 * 帮助中心种子数据
 */
export async function seedHelpArticles(dataSource: DataSource): Promise<void> {
  const articleRepo = dataSource.getRepository(HelpArticle);

  // 检查是否已有数据
  const count = await articleRepo.count();
  if (count > 0) {
    console.log('帮助中心已有数据，跳过初始化');
    return;
  }

  const articles: Partial<HelpArticle>[] = [
    // ========== 公告 ==========
    {
      title: '欢迎使用平台',
      content: `## 平台简介

欢迎使用我们的任务平台！本平台致力于为用户提供安全、便捷的任务服务。

### 平台优势

- **安全保障**：资金托管，交易安全有保障
- **高效便捷**：操作简单，轻松赚取收益
- **专业服务**：7x24小时客服支持

### 联系我们

如有任何问题，请联系在线客服。`,
      type: ArticleType.ANNOUNCEMENT,
      sortOrder: 1,
      isPublished: true,
    },
    {
      title: '系统升级通知',
      content: `## 系统升级公告

为了给您提供更好的服务体验，平台将于近期进行系统升级。

### 升级内容

1. 优化任务流程，提升操作体验
2. 增强安全防护，保障账户安全
3. 新增多项功能，敬请期待

### 注意事项

升级期间部分功能可能受到影响，请提前做好准备。`,
      type: ArticleType.ANNOUNCEMENT,
      sortOrder: 2,
      isPublished: true,
    },

    // ========== 常见问题 ==========
    {
      title: '如何注册账号？',
      content: `## 注册流程

1. 点击首页"注册"按钮
2. 输入手机号码
3. 获取并输入短信验证码
4. 设置登录密码
5. 填写邀请码（可选）
6. 完成注册

### 注意事项

- 手机号码必须真实有效
- 密码长度6-20位
- 建议使用常用手机号，便于找回密码`,
      type: ArticleType.FAQ,
      sortOrder: 1,
      isPublished: true,
    },
    {
      title: '如何绑定买号？',
      content: `## 绑定买号步骤

1. 进入"个人中心" > "买号管理"
2. 点击"添加买号"
3. 选择平台（淘宝/京东/拼多多等）
4. 填写账号信息
5. 上传必要截图
6. 完成手机验证
7. 提交审核

### 必填信息

- 平台账号ID
- 常用登录地
- 收货人信息
- 实名认证信息

### 审核说明

买号提交后将在24小时内完成审核，请耐心等待。`,
      type: ArticleType.FAQ,
      sortOrder: 2,
      isPublished: true,
    },
    {
      title: '如何领取任务？',
      content: `## 领取任务流程

1. 进入"任务大厅"
2. 浏览可领取的任务
3. 查看任务详情和要求
4. 选择绑定的买号
5. 确认领取任务

### 注意事项

- 请确保买号已通过审核
- 仔细阅读任务要求
- 注意任务截止时间
- 领取后请及时完成`,
      type: ArticleType.FAQ,
      sortOrder: 3,
      isPublished: true,
    },
    {
      title: '如何完成任务？',
      content: `## 任务完成流程

### 1. 执行任务

按照任务要求完成指定操作：
- 搜索关键词
- 浏览商品
- 下单购买
- 确认收货
- 提交好评

### 2. 上传截图

每个步骤需要上传相应截图作为凭证。

### 3. 等待审核

商家审核通过后，佣金将自动发放。

### 注意事项

- 严格按照任务要求操作
- 截图必须清晰完整
- 好评内容需符合要求`,
      type: ArticleType.FAQ,
      sortOrder: 4,
      isPublished: true,
    },
    {
      title: '如何提现？',
      content: `## 提现流程

1. 进入"提现中心"
2. 选择提现类型（本金/银锭）
3. 输入提现金额
4. 选择银行卡
5. 输入验证码和支付密码
6. 确认提现

### 提现规则

- 最低提现金额：10元
- 银锭提现手续费：5%
- 本金提现：免手续费
- 到账时间：1-3个工作日

### 绑定银行卡

首次提现前需要先绑定银行卡：
1. 进入"银行卡管理"
2. 添加银行卡信息
3. 完成验证`,
      type: ArticleType.FAQ,
      sortOrder: 5,
      isPublished: true,
    },
    {
      title: '什么是银锭？',
      content: `## 银锭说明

银锭是平台的虚拟货币，用于任务佣金结算。

### 获取方式

- 完成任务获得佣金
- 邀请好友获得奖励
- 参与平台活动

### 使用方式

- 提现兑换现金
- 支付VIP会员费用

### 换算比例

1银锭 = 1元人民币`,
      type: ArticleType.FAQ,
      sortOrder: 6,
      isPublished: true,
    },
    {
      title: '如何邀请好友？',
      content: `## 邀请好友

### 获取邀请链接

1. 进入"邀请好友"页面
2. 复制专属邀请链接
3. 分享给好友

### 邀请奖励

- 好友每完成一单任务，您可获得1银锭奖励
- 每位好友最高可为您带来1000银锭

### 注意事项

1. 邀请链接只能发布于聊天工具中
2. 禁止向陌生人发送链接
3. 严禁自己邀请自己`,
      type: ArticleType.FAQ,
      sortOrder: 7,
      isPublished: true,
    },

    // ========== 使用指南 ==========
    {
      title: '新手入门指南',
      content: `## 新手入门

欢迎加入平台！以下是快速入门步骤：

### 第一步：完善信息

1. 设置支付密码
2. 绑定银行卡
3. 添加买号

### 第二步：领取任务

1. 浏览任务大厅
2. 选择合适任务
3. 领取并执行

### 第三步：完成任务

1. 按要求执行任务
2. 上传各步骤截图
3. 等待审核通过

### 第四步：提取收益

1. 佣金自动到账
2. 申请提现
3. 等待打款

### 温馨提示

- 认真阅读任务要求
- 按时完成任务
- 如有问题及时联系客服`,
      type: ArticleType.GUIDE,
      sortOrder: 1,
      isPublished: true,
    },
    {
      title: 'VIP会员权益说明',
      content: `## VIP会员

### 会员权益

- 每月免费提现次数
- 专属高佣金任务
- 优先接单权
- 专属客服服务

### 开通方式

1. 进入VIP页面
2. 选择会员套餐
3. 完成支付

### 会员套餐

- 月度会员：30元/月
- 季度会员：80元/季
- 年度会员：280元/年

### 续费说明

会员到期前会有续费提醒，请及时续费以保持会员权益。`,
      type: ArticleType.GUIDE,
      sortOrder: 2,
      isPublished: true,
    },
    {
      title: '任务规则说明',
      content: `## 任务规则

### 接单规则

1. 每日接单上限根据买号等级决定
2. 同一店铺30天内只能接单一次
3. 任务需在规定时间内完成

### 评价规则

1. 必须按要求进行五星好评
2. 文字/图片/视频好评需符合商家要求
3. 禁止中差评、恶意评价

### 违规处理

- 超时未完成：扣除信用分
- 恶意评价：永久封号
- 刷单行为：账号冻结

### 申诉渠道

如对处理结果有异议，可联系客服申诉。`,
      type: ArticleType.GUIDE,
      sortOrder: 3,
      isPublished: true,
    },
  ];

  await articleRepo.save(articles);
  console.log(`帮助中心种子数据初始化完成，共${articles.length}条`);
}
