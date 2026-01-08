'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchGoodsById, updateGoods, UpdateGoodsDto, Goods } from '../../../../../services/goodsService';
import { fetchShops, Shop } from '../../../../../services/shopService';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Spinner } from '../../../../../components/ui/spinner';

export default function EditGoodsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [goods, setGoods] = useState<Goods | null>(null);
    const [form, setForm] = useState<UpdateGoodsDto>({
        name: '',
        link: '',
        platformProductId: '',
        verifyCode: '',
        pcImg: '',
        price: 0,
        num: 1,
        showPrice: 0
    });

    useEffect(() => { loadData(); }, [resolvedParams.id]);

    const loadData = async () => {
        const [goodsData, shopsData] = await Promise.all([fetchGoodsById(resolvedParams.id), fetchShops()]);
        setShops(shopsData);
        if (goodsData) {
            setGoods(goodsData);
            setForm({
                name: goodsData.name,
                link: goodsData.link || '',
                platformProductId: goodsData.platformProductId || '',
                verifyCode: goodsData.verifyCode || '',
                pcImg: goodsData.pcImg || '',
                price: goodsData.price,
                num: goodsData.num,
                showPrice: goodsData.showPrice
            });
        }
        setLoading(false);
    };

    const handleChange = (field: keyof UpdateGoodsDto, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                handleChange('pcImg', reader.result as string);
                setUploading(false);
            };
            reader.onerror = () => {
                alert('图片读取失败');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch {
            alert('图片上传失败');
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name?.trim()) { alert('请输入商品名称'); return; }
        if (!form.price || Number(form.price) <= 0) { alert('请输入有效的商品价格'); return; }
        setSubmitting(true);
        const res = await updateGoods(resolvedParams.id, { ...form, price: Number(form.price), num: Number(form.num) || 1, showPrice: Number(form.showPrice) || Number(form.price) });
        setSubmitting(false);
        if (res.success) { alert('商品更新成功'); router.push('/merchant/goods'); } else alert(res.message);
    };

    if (loading) return <div className="py-6 text-center text-[#f9fafb]0">加载中...</div>;

    if (!goods) {
        return (
            <div className="py-6 text-center">
                <div className="mb-4 text-red-500">商品不存在</div>
                <button onClick={() => router.back()} className="text-blue-500 hover:underline">返回</button>
            </div>
        );
    }

    const shopName = shops.find(s => s.id === goods.shopId)?.shopName || '-';

    return (
        <div className="space-y-6 p-6">
            {/* Back Link */}
            <button onClick={() => router.back()} className="text-sm text-blue-500 hover:underline">← 返回商品列表</button>

            <h1 className="text-2xl font-medium">编辑商品</h1>

            <Card className="max-w-[800px] bg-white p-6">
                <div className="grid gap-5">
                    {/* Shop (readonly) */}
                    <div>
                        <label className="mb-2 block font-medium">所属店铺</label>
                        <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#4b5563]">{shopName}</div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block font-medium">商品名称 <span className="text-red-500">*</span></label>
                        <Input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="请输入商品名称" maxLength={200} />
                    </div>

                    {/* Link */}
                    <div>
                        <label className="mb-2 block font-medium">商品链接/淘口令</label>
                        <Input type="text" value={form.link || ''} onChange={e => handleChange('link', e.target.value)} placeholder="请输入商品链接或淘口令" />
                        <div className="mt-1.5 text-xs text-[#f9fafb]0">可粘贴商品链接或淘口令，系统将自动解析商品信息</div>
                    </div>

                    {/* Platform Product ID */}
                    <div>
                        <label className="mb-2 block font-medium">平台商品ID</label>
                        <Input type="text" value={form.platformProductId || ''} onChange={e => handleChange('platformProductId', e.target.value)} placeholder="可从商品链接自动解析" />
                    </div>

                    {/* Verify Code */}
                    <div>
                        <label className="mb-2 block font-medium">核对口令</label>
                        <Input type="text" value={form.verifyCode || ''} onChange={e => handleChange('verifyCode', e.target.value)} placeholder="请输入核对口令" maxLength={10} />
                        <div className="mt-1.5 text-xs text-[#f9fafb]0">请输入不超过10个字的核对口令，必须是商品详情页有的文字。买手做任务时需在详情页找到此口令进行核对。</div>
                    </div>

                    {/* Product Image Upload */}
                    <div>
                        <label className="mb-2 block font-medium">商品主图</label>
                        <div className="relative">
                            {form.pcImg ? (
                                <div className="relative inline-block">
                                    <img src={form.pcImg} alt="商品主图" className="h-32 w-32 rounded-md border border-[#e5e7eb] object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleChange('pcImg', '')}
                                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] text-[#9ca3af] transition-colors hover:border-blue-400 hover:text-blue-500">
                                    {uploading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <span className="text-3xl">+</span>
                                            <span className="text-xs">上传主图</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                        <div className="mt-1.5 text-xs text-[#f9fafb]0">建议上传800x800以上的正方形商品图</div>
                    </div>

                    {/* Price Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-2 block font-medium">商品单价 <span className="text-red-500">*</span></label>
                            <Input type="number" value={String(form.price)} onChange={e => handleChange('price', e.target.value)} placeholder="0.00" min={0} step={0.01} />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">数量</label>
                            <Input type="number" value={String(form.num)} onChange={e => handleChange('num', e.target.value)} placeholder="1" min={1} />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">展示价格</label>
                            <Input type="number" value={String(form.showPrice)} onChange={e => handleChange('showPrice', e.target.value)} placeholder="默认同单价" min={0} step={0.01} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex gap-4">
                    <Button onClick={handleSubmit} disabled={submitting} className={cn(submitting && 'cursor-not-allowed opacity-70')}>{submitting ? '保存中...' : '保存修改'}</Button>
                    <Button variant="secondary" onClick={() => router.back()}>取消</Button>
                </div>
            </Card>
        </div>
    );
}
