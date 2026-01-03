/**
 * 银行卡类型定义
 * 统一买手和商家的银行卡接口
 */

export type BankCardOwnerType = 'buyer' | 'merchant';

export type BankCardStatus = 0 | 1 | 2 | 3; // PENDING | APPROVED | REJECTED | DELETED

export type BankCardType = 1 | 2; // PERSONAL | COMPANY

export interface BankCard {
    id: string;
    ownerType: BankCardOwnerType;
    ownerId: string;
    bankName: string;
    accountName: string;
    cardNumber: string;
    cardType?: BankCardType;
    phone?: string;
    province?: string;
    city?: string;
    branchName?: string;
    idCard?: string;
    idCardFrontImage?: string;
    idCardBackImage?: string;
    taxNumber?: string;      // 商家特有
    licenseImage?: string;   // 商家特有
    isDefault: boolean;
    status: BankCardStatus;
    rejectReason?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateBankCardRequest {
    bankName: string;
    accountName: string;
    cardNumber: string;
    cardType?: BankCardType;
    phone?: string;
    province?: string;
    city?: string;
    branchName?: string;
    idCard?: string;
    idCardFrontImage?: string;
    idCardBackImage?: string;
    taxNumber?: string;
    licenseImage?: string;
}

export interface UpdateBankCardRequest {
    phone?: string;
    province?: string;
    city?: string;
    branchName?: string;
    taxNumber?: string;
    licenseImage?: string;
}

// 状态标签映射
export const BankCardStatusLabels: Record<BankCardStatus, string> = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝',
    3: '已删除'
};

// 卡类型标签映射
export const BankCardTypeLabels: Record<BankCardType, string> = {
    1: '个人账户',
    2: '企业对公账户'
};

// 银行卡号脱敏
export function maskCardNumber(cardNumber: string): string {
    if (cardNumber.length <= 8) return cardNumber;
    return cardNumber.slice(0, 4) + '****' + cardNumber.slice(-4);
}
