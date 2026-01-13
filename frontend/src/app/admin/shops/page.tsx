'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { getFullImageUrl } from '../../../services/shopService';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';

interface Shop {
    id: string;
    platform: string;
    shopName: string;
    accountName?: string;
    contactName?: string;
    mobile?: string;
    province?: string;
    city?: string;
    district?: string;
    detailAddress?: string;
    url?: string;
    screenshot?: string;
    needLogistics?: boolean;
    expressCode?: string;
    status: number;
    auditRemark?: string;
    merchant?: { username: string; companyName?: string };
    createdAt: string;
}

const statusConfig: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '正常', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已删除', color: 'slate' },
};

const platformOptions = [
    { value: '', label: '全部平台' },
    { value: 'TAOBAO', label: '淘宝' },
    { value: 'TMALL', label: '天猫' },
    { value: 'JD', label: '京东' },
    { value: 'PDD', label: '拼多多' },
    { value: 'DOUYIN', label: '抖音' },
    { value: 'OTHER', label: '其他' },
];

function ShopsContent() {
    const searchParams = useSearchParams();
    const merchantId = searchParams.get('merchantId');

    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [platformFilter, setPlatformFilter] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    // 编辑弹窗
    const [editModal, setEditModal] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [editForm, setEditForm] = useState({
        shopName: '',
        accountName: '',
        contactName: '',
        mobile: '',
        province: '',
        city: '',
        district: '',
        detailAddress: '',
        url: '',
        needLogistics: true,
        expressCode: '',
    });
    const [saving, setSaving] = useState(false);

    // 审核弹窗
    const [reviewModal, setReviewModal] = useState(false);
    const [reviewingShop, setReviewingShop] = useState<Shop | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
    const [rejectReason, setRejectReason] = useState('');

    const loadShops = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (platformFilter) params.append('platform', platformFilter);
        if (merchantId) params.append('merchantId', merchantId);
        if (searchText) params.append('search', searchText);
        const query = params.toString() ? `?${params.toString()}` : '';
        try {
            const res = await fetch(`${BASE_URL}/admin/shops${query}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const json = await res.json();
            if (json.list) setShops(json.list);
        } catch (e) {
            console.error('加载店铺失败:', e);
        }
        setLoading(false);
    }, [statusFilter, platformFilter, merchantId, searchText]);

    useEffect(() => { loadShops(); }, [loadShops]);

    // 打开编辑弹窗
    const openEditModal = (shop: Shop) => {
        setEditingShop(shop);
        setEditForm({
            shopName: shop.shopName || '',
            accountName: shop.accountName || '',
            contactName: shop.contactName || '',
            mobile: shop.mobile || '',
            province: shop.province || '',
            city: shop.city || '',
            district: shop.district || '',
            detailAddress: shop.detailAddress || '',
            url: shop.url || '',
            needLogistics: shop.needLogistics !== false,
            expressCode: shop.expressCode || '',
        });
        setEditModal(true);
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        if (!editingShop) return;
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/shops/${editingShop.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(editForm)
            });
            const json = await res.json();
            if (json.success) {
                alert('保存成功');
                setEditModal(false);
                loadShops();
            } else {
                alert(json.message || '保存失败');
            }
        } catch (e) {
            alert('保存失败');
        }
        setSaving(false);
    };

    // 打开审核弹窗
    const openReviewModal = (shop: Shop, action: 'approve' | 'reject') => {
        setReviewingShop(shop);
        setReviewAction(action);
        setRejectReason('');
        setReviewModal(true);
    };

    // 提交审核
    const handleReview = async () => {
        if (!reviewingShop) return;
        const status = reviewAction === 'approve' ? 1 : 2;
        try {
            const res = await fetch(`${BASE_URL}/admin/shops/${reviewingShop.id}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status, remark: reviewAction === 'reject' ? rejectReason : undefined })
            });
            const json = await res.json();
            if (res.ok) {
                alert('操作成功');
                setReviewModal(false);
                loadShops();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-medium">
                        店铺管理
                        {merchantId && <span className="ml-2 text-base text-[#6b7280]">(筛选商家ID: {merchantId})</span>}
                    </h1>
                    {merchantId && (
                        <Button variant="outline" onClick={() => window.location.href = '/admin/shops'}>
                            查看全部
                        </Button>
                    )}
                </div>

                {/* 筛选栏 */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        type="text"
                        placeholder="搜索店铺名称/账号"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="w-48"
                    />
                    <Select
                        value={platformFilter}
                        onChange={setPlatformFilter}
                        options={platformOptions}
                        className="w-32"
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: '0', label: '待审核' },
                            { value: '1', label: '正常' },
                            { value: '2', label: '已拒绝' },
                        ]}
                        className="w-32"
                    />
                    <Button onClick={loadShops}>搜索</Button>
                </div>

                <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1200px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-3 py-3 text-left text-sm font-medium">所属商家</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">平台</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">后台截图</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">店铺名称</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">店铺账号</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">联系人/手机</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">发货地址</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">状态</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">申请时间</th>
                                    <th className="px-3 py-3 text-left text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={10} className="py-10 text-center text-[#9ca3af]">加载中...</td></tr>
                                ) : shops.length === 0 ? (
                                    <tr><td colSpan={10} className="py-10 text-center text-[#9ca3af]">暂无数据</td></tr>
                                ) : shops.map(shop => (
                                    <tr key={shop.id} className="border-b border-[#f3f4f6]">
                                        <td className="px-3 py-3">
                                            <div>{shop.merchant?.companyName || shop.merchant?.username || '--'}</div>
                                            <div className="text-xs text-[#9ca3af]">{shop.merchant?.username}</div>
                                        </td>
                                        <td className="px-3 py-3">{shop.platform}</td>
                                        <td className="px-3 py-3">
                                            {shop.screenshot ? (
                                                <a href={getFullImageUrl(shop.screenshot)} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={getFullImageUrl(shop.screenshot)}
                                                        alt="店铺截图"
                                                        className="h-12 w-12 cursor-pointer rounded border border-[#e5e7eb] object-cover hover:opacity-80"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#9ca3af]">
                                                    无
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 font-medium">{shop.shopName || '-'}</td>
                                        <td className="px-3 py-3 text-[#6b7280]">{shop.accountName || '-'}</td>
                                        <td className="px-3 py-3">
                                            <div>{shop.contactName || '-'}</div>
                                            <div className="text-xs text-[#9ca3af]">{shop.mobile || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-[#6b7280]">
                                            {[shop.province, shop.city, shop.district].filter(Boolean).join(' ') || '-'}
                                            {shop.detailAddress && <div>{shop.detailAddress}</div>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge variant="soft" color={statusConfig[shop.status]?.color || 'slate'}>
                                                {statusConfig[shop.status]?.text || '未知'}
                                            </Badge>
                                            {shop.auditRemark && <div className="mt-1 text-xs text-danger-400">{shop.auditRemark}</div>}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-[#6b7280]">{new Date(shop.createdAt).toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => openEditModal(shop)}
                                                    className="cursor-pointer border-none bg-transparent text-sm text-primary-500 hover:underline"
                                                >
                                                    编辑
                                                </button>
                                                {shop.status === 0 && (
                                                    <>
                                                        <button
                                                            onClick={() => openReviewModal(shop, 'approve')}
                                                            className="cursor-pointer border-none bg-transparent text-sm text-success-400 hover:underline"
                                                        >
                                                            通过
                                                        </button>
                                                        <button
                                                            onClick={() => openReviewModal(shop, 'reject')}
                                                            className="cursor-pointer border-none bg-transparent text-sm text-danger-400 hover:underline"
                                                        >
                                                            拒绝
                                                        </button>
                                                    </>
                                                )}
                                                {shop.status === 1 && (
                                                    <button
                                                        onClick={() => openReviewModal(shop, 'reject')}
                                                        className="cursor-pointer border-none bg-transparent text-sm text-warning-500 hover:underline"
                                                    >
                                                        禁用
                                                    </button>
                                                )}
                                                {shop.status === 2 && (
                                                    <button
                                                        onClick={() => openReviewModal(shop, 'approve')}
                                                        className="cursor-pointer border-none bg-transparent text-sm text-success-400 hover:underline"
                                                    >
                                                        恢复
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* 编辑店铺弹窗 */}
            <Modal title="编辑店铺资料" open={editModal} onClose={() => setEditModal(false)}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">店铺名称</label>
                            <Input
                                type="text"
                                value={editForm.shopName}
                                onChange={e => setEditForm({ ...editForm, shopName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">店铺账号</label>
                            <Input
                                type="text"
                                value={editForm.accountName}
                                onChange={e => setEditForm({ ...editForm, accountName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">联系人</label>
                            <Input
                                type="text"
                                value={editForm.contactName}
                                onChange={e => setEditForm({ ...editForm, contactName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">手机号</label>
                            <Input
                                type="text"
                                value={editForm.mobile}
                                onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-[#374151]">店铺链接</label>
                        <Input
                            type="text"
                            value={editForm.url}
                            onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                            placeholder="https://"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">省份</label>
                            <Input
                                type="text"
                                value={editForm.province}
                                onChange={e => setEditForm({ ...editForm, province: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">城市</label>
                            <Input
                                type="text"
                                value={editForm.city}
                                onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">区县</label>
                            <Input
                                type="text"
                                value={editForm.district}
                                onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-[#374151]">详细地址</label>
                        <Input
                            type="text"
                            value={editForm.detailAddress}
                            onChange={e => setEditForm({ ...editForm, detailAddress: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">是否需要物流</label>
                            <Select
                                value={editForm.needLogistics ? 'true' : 'false'}
                                onChange={v => setEditForm({ ...editForm, needLogistics: v === 'true' })}
                                options={[
                                    { value: 'true', label: '需要物流' },
                                    { value: 'false', label: '无需物流' },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">快递站点号</label>
                            <Input
                                type="text"
                                value={editForm.expressCode}
                                onChange={e => setEditForm({ ...editForm, expressCode: e.target.value })}
                                placeholder="选填"
                            />
                        </div>
                    </div>

                    {/* 店铺截图显示 */}
                    {editingShop?.screenshot && (
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">店铺后台截图</label>
                            <a href={getFullImageUrl(editingShop.screenshot)} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={getFullImageUrl(editingShop.screenshot)}
                                    alt="店铺截图"
                                    className="max-h-[200px] max-w-full cursor-pointer rounded border border-[#e5e7eb] object-contain hover:opacity-80"
                                />
                            </a>
                            <div className="mt-1 text-xs text-[#9ca3af]">点击图片查看大图</div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setEditModal(false)}>取消</Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 审核弹窗 */}
            <Modal
                title={reviewAction === 'approve' ? '确认通过审核' : '确认拒绝/禁用'}
                open={reviewModal}
                onClose={() => setReviewModal(false)}
            >
                <div className="space-y-4">
                    <div className="rounded-md bg-[#f9fafb] p-4">
                        <div className="text-sm text-[#374151]">
                            店铺: <span className="font-medium">{reviewingShop?.shopName}</span>
                        </div>
                        <div className="mt-1 text-sm text-[#6b7280]">
                            账号: {reviewingShop?.accountName || '-'}
                        </div>
                    </div>

                    {/* 审核时显示截图 */}
                    {reviewingShop?.screenshot && (
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">店铺后台截图</label>
                            <a href={getFullImageUrl(reviewingShop.screenshot)} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={getFullImageUrl(reviewingShop.screenshot)}
                                    alt="店铺截图"
                                    className="max-h-[200px] max-w-full cursor-pointer rounded border border-[#e5e7eb] object-contain hover:opacity-80"
                                />
                            </a>
                            <div className="mt-1 text-xs text-[#9ca3af]">点击图片查看大图</div>
                        </div>
                    )}

                    {reviewAction === 'approve' ? (
                        <div className="text-sm text-[#374151]">
                            确认将此店铺审核通过？
                        </div>
                    ) : (
                        <div>
                            <label className="mb-1 block text-sm text-[#374151]">拒绝/禁用原因</label>
                            <Input
                                type="text"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="请输入原因（选填）"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setReviewModal(false)}>取消</Button>
                        <Button
                            onClick={handleReview}
                            className={reviewAction === 'approve' ? 'bg-success-500 hover:bg-success-600' : 'bg-danger-400 hover:bg-danger-500'}
                        >
                            {reviewAction === 'approve' ? '确认通过' : '确认拒绝'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

export default function AdminShopsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-12 text-[#6b7280]">加载中...</div>}>
            <ShopsContent />
        </Suspense>
    );
}
