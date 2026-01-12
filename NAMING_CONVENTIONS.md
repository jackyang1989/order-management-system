# 代码命名规范

## 核心原则

1. **统一语言**：代码中的标识符（变量、函数、类、字段等）必须使用纯英文，禁止使用拼音或中英混合
2. **语义清晰**：命名应准确表达其含义，让阅读者无需查看实现即可理解用途
3. **一致性**：同一概念在整个项目中使用相同的命名

---

## 禁止的命名方式

### ❌ 拼音命名
```typescript
// 错误示例
needHuobi: boolean;      // huobi = 货比
needShoucang: boolean;   // shoucang = 收藏
needGuanzhu: boolean;    // guanzhu = 关注
needJialiao: boolean;    // jialiao = 假聊/联系客服
needJiagou: boolean;     // jiagou = 加购
huobiKeyword: string;    // huobi = 货比
```

### ❌ 中英混合
```typescript
// 错误示例
getUserXinxi();          // xinxi = 信息
orderZhuangtai: string;  // zhuangtai = 状态
getPinglunList();        // pinglun = 评论
```

### ❌ 拼音缩写
```typescript
// 错误示例
sc: boolean;   // 收藏
gz: boolean;   // 关注
jg: boolean;   // 加购
```

---

## 正确的命名方式

### ✅ 纯英文命名
```typescript
// 正确示例
needCompare: boolean;      // 货比 -> compare
needFavorite: boolean;     // 收藏 -> favorite
needFollow: boolean;       // 关注 -> follow
needContactCS: boolean;    // 联系客服 -> contact customer service
needAddCart: boolean;      // 加购 -> add to cart
compareKeyword: string;    // 货比关键词
```

---

## 常用业务术语对照表

| 中文 | 英文 | 备注 |
|------|------|------|
| 货比 | compare | 比较多家商品 |
| 收藏 | favorite | 收藏商品 |
| 关注 | follow | 关注店铺 |
| 加购 | addCart / addToCart | 加入购物车 |
| 联系客服 | contactCS / contactService | CS = Customer Service |
| 好评 | praise / review | 评价相关 |
| 淘口令 | taoPassword / taoWord | 淘宝口令 |
| 二维码 | qrCode | QR Code |
| 商家/卖家 | merchant / seller | |
| 买家/买手 | buyer | |
| 佣金 | commission | |
| 订单 | order | |
| 任务 | task | |
| 提现 | withdraw / withdrawal | |
| 银行卡 | bankCard | |
| 余额 | balance | |
| 金币/银锭 | gold / silver | 虚拟货币 |
| 浏览 | browse | |
| 发布 | publish | |
| 审核 | audit / review | |
| 返款 | refund / repay | |
| 次日单 | nextDay | 次日任务 |
| 定时 | timing / scheduled | |
| 物流 | logistics / shipping | |
| 包邮 | freeShipping | |
| 店铺 | shop / store | |
| 商品 | goods / product | |
| 关键词 | keyword | |
| 渠道 | channel | |
| 截图 | screenshot | |

---

## 命名风格规范

### 变量和函数
- 使用 **camelCase**（小驼峰）
```typescript
const userName = 'John';
function getUserInfo() {}
const isActive = true;
```

### 类和接口
- 使用 **PascalCase**（大驼峰）
```typescript
class UserService {}
interface TaskDetail {}
type OrderStatus = 'pending' | 'completed';
```

### 常量
- 使用 **UPPER_SNAKE_CASE**（全大写下划线分隔）
```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';
const ORDER_STATUS_PENDING = 0;
```

### 数据库字段
- 使用 **camelCase**，TypeORM 会自动转换为 snake_case
```typescript
@Column()
createdAt: Date;  // 数据库中为 created_at

@Column()
userId: string;   // 数据库中为 user_id
```

### 布尔值
- 使用 is/has/can/should 等前缀
```typescript
isActive: boolean;
hasPermission: boolean;
canEdit: boolean;
shouldRefresh: boolean;
needCompare: boolean;  // need 也可以
```

### 数组/列表
- 使用复数形式或 List 后缀
```typescript
const users: User[] = [];
const orderList: Order[] = [];
const taskIds: string[] = [];
```

---

## API 端点命名

### RESTful 风格
```typescript
// 资源使用复数名词
GET    /api/tasks          // 获取任务列表
GET    /api/tasks/:id      // 获取单个任务
POST   /api/tasks          // 创建任务
PUT    /api/tasks/:id      // 更新任务
DELETE /api/tasks/:id      // 删除任务

// 操作使用动词
POST   /api/tasks/:id/claim     // 领取任务
POST   /api/tasks/:id/cancel    // 取消任务
POST   /api/tasks/:id/complete  // 完成任务
```

---

## 文件命名

### 组件文件
- 使用 **PascalCase**
```
UserProfile.tsx
TaskDetail.tsx
OrderList.tsx
```

### 服务/工具文件
- 使用 **camelCase** 或 **kebab-case**
```
taskService.ts
user-service.ts
utils.ts
date-helpers.ts
```

### 类型定义文件
- 使用 `.d.ts` 后缀或 `types.ts`
```
global.d.ts
types.ts
api.types.ts
```

---

## 注释规范

### 中文注释用于解释业务含义
```typescript
@Column({ default: false })
needCompare: boolean; // 货比：是否需要浏览对比其他商家商品

@Column({ nullable: true })
compareKeyword: string; // 货比关键词：用于搜索对比商品
```

### JSDoc 用于公共 API
```typescript
/**
 * 领取任务
 * @param taskId - 任务ID
 * @param buyerId - 买手ID
 * @returns 创建的订单
 * @throws TaskNotFoundError 任务不存在
 * @throws TaskFullError 任务已满
 */
async claimTask(taskId: string, buyerId: string): Promise<Order> {}
```

---

## 代码审查检查项

在代码审查时，检查以下命名问题：

- [ ] 是否有拼音命名？
- [ ] 是否有中英混合命名？
- [ ] 是否有无意义的缩写？
- [ ] 命名是否准确表达含义？
- [ ] 是否与项目现有命名风格一致？
- [ ] 布尔值是否使用正确前缀？
- [ ] 数组是否使用复数形式？

---

## 历史遗留问题处理

如发现历史代码存在命名问题：

1. 创建数据库迁移脚本重命名字段
2. 更新所有引用该字段的代码
3. 保持 API 响应字段与内部字段一致
4. 在 PR 中说明重命名原因

示例迁移：
```typescript
// 1704326500000-RenameBrowseBehaviorFields.ts
await queryRunner.query(
  `ALTER TABLE "tasks" RENAME COLUMN "needHuobi" TO "needCompare"`
);
```
