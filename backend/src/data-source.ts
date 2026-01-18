import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

// 导入所有实体
// admin-config
import { CommissionRate } from './admin-config/commission-rate.entity';
import { SystemConfig } from './admin-config/config.entity';
import { DeliveryWarehouse } from './admin-config/delivery-warehouse.entity';
import { Platform } from './admin-config/platform.entity';
import { PlatformImageRequirement } from './admin-config/platform-image-requirement.entity';
import { TablePreference } from './admin-config/table-preferences.entity';
import { EntryType } from './admin-config/entry-type.entity';
// admin-menus
import { AdminMenu } from './admin-menus/admin-menu.entity';
// admin-users
import {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
} from './admin-users/admin-user.entity';
// bank-cards
import { BankCard } from './bank-cards/bank-card.entity';
// banks
import { Bank } from './banks/bank.entity';
// buyer-accounts
import { BuyerAccount } from './buyer-accounts/buyer-account.entity';
// categories
import { Category } from './categories/category.entity';
// day-counts
import { UserDayCount, PlatformDayStat } from './day-counts/day-count.entity';
// deliveries
import { Delivery } from './deliveries/delivery.entity';
// finance-records
import { FinanceRecord } from './finance-records/finance-record.entity';
// goods
import { Goods } from './goods/goods.entity';
// keywords
import { GoodsKey, KeywordDetail } from './keywords/keyword.entity';
// questions
import { QuestionScheme, QuestionDetail } from './questions/question.entity';
// merchant-bank-cards
import { MerchantBankCard } from './merchant-bank-cards/merchant-bank-card.entity';
// merchant-blacklist
import { MerchantBlacklist } from './merchant-blacklist/merchant-blacklist.entity';
// merchant-withdrawals
import { MerchantWithdrawal } from './merchant-withdrawals/merchant-withdrawal.entity';
// merchants
import { Merchant } from './merchants/merchant.entity';
// messages
import { Message } from './messages/message.entity';
// notices
import { Notice } from './notices/notice.entity';
// operation-logs
import { OperationLog } from './operation-logs/operation-log.entity';
// order-logs
import { OrderLog } from './order-logs/order-log.entity';
// orders
import { Order } from './orders/order.entity';
// payments
import { PaymentCallback, PaymentOrder } from './payments/payment.entity';
// recharge
import { Recharge } from './recharge/recharge.entity';
import { RewardRecharge } from './recharge/reward-recharge.entity';
// review-tasks
import { ReviewTask } from './review-tasks/review-task.entity';
// sensitive-words
import { SensitiveWord } from './sensitive-words/sensitive-word.entity';
// shops
import { Shop } from './shops/shop.entity';
// sms
import { SmsLog } from './sms/sms.entity';
// task-goods
import { TaskGoods, TaskKeyword } from './task-goods/task-goods.entity';
// tasks
import { Task } from './tasks/task.entity';
// uploads
import { UploadedFile, FileGroup } from './uploads/upload.entity';
// user-addresses
import { UserAddress } from './user-addresses/user-address.entity';
// user-credits
import { UserCredit } from './user-credits/user-credit.entity';
// user-invites
import { UserInvite } from './user-invites/user-invite.entity';
// users
import { User } from './users/user.entity';
import { FundRecord } from './users/fund-record.entity';
// withdrawals
import { Withdrawal } from './withdrawals/withdrawal.entity';
// help-center
import { HelpArticle } from './help-center/help-article.entity';
// banners
import { Banner } from './banners/banner.entity';

// 所有实体的显式列表
const ENTITIES = [
  // admin-config
  CommissionRate,
  SystemConfig,
  DeliveryWarehouse,
  Platform,
  PlatformImageRequirement,
  TablePreference,
  EntryType,
  // admin-menus
  AdminMenu,
  // admin-users
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
  // bank-cards
  BankCard,
  // banks
  Bank,
  // buyer-accounts
  BuyerAccount,
  // categories
  Category,
  // day-counts
  UserDayCount,
  PlatformDayStat,
  // deliveries
  Delivery,
  // finance-records
  FinanceRecord,
  // goods
  Goods,
  // keywords
  GoodsKey,
  KeywordDetail,
  // questions
  QuestionScheme,
  QuestionDetail,
  // merchant-bank-cards
  MerchantBankCard,
  // merchant-blacklist
  MerchantBlacklist,
  // merchant-withdrawals
  MerchantWithdrawal,
  // merchants
  Merchant,
  // messages
  Message,
  // notices
  Notice,
  // operation-logs
  OperationLog,
  // order-logs
  OrderLog,
  // orders
  Order,
  // payments
  PaymentCallback,
  PaymentOrder,
  // recharge
  Recharge,
  RewardRecharge,
  // review-tasks
  ReviewTask,
  // sensitive-words
  SensitiveWord,
  // shops
  Shop,
  // sms
  SmsLog,
  // task-goods
  TaskGoods,
  TaskKeyword,
  // tasks
  Task,
  // uploads
  UploadedFile,
  FileGroup,
  // user-addresses
  UserAddress,
  // user-credits
  UserCredit,
  // user-invites
  UserInvite,
  // users
  User,
  FundRecord,
  // withdrawals
  Withdrawal,
  // help-center
  HelpArticle,
  // banners
  Banner,
];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
  entities: ENTITIES,
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
