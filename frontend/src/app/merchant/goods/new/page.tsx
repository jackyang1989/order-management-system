'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGoods, CreateGoodsDto } from '../../../../services/goodsService';
import { fetchShops, Shop } from '../../../../services/shopService';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';

export default function NewGoodsPage() {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateGoodsDto>({ shopId: '', name: '', link: '', platformProductId: '', verifyCode: '', specName: '', specValue: '', price: 0, num: 1, showPrice: 0 });

    useEffect(() => { loadShops(); }, []);

    const loadShops = async () => {
        const data = await fetchShops();
        setShops(data.filter(s => s.status === 1));
        if (data.length > 0 && data[0].status === 1) setForm(prev => ({ ...prev, shopId: data[0].id }));
    };

    const handleChange = (field: keyof CreateGoodsDto, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.shopId) { alert('请选择店铺'); return; }
        if (!form.name.trim()) { alert('请输入商品名称'); return; }
        if (!form.price || form.price <= 0) { alert('请输入有效的商品价格'); return; }
        setLoading(true);
        const res = await createGoods({ ...form, price: Number(form.price), num: Number(form.num) || 1, showPrice: Number(form.showPrice) || Number(form.price) });
        setLoading(false);
        if (res.success) { alert('商品创建成功'); router.push('/merchant/goods'); } else alert(res.message);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Back Link */}
            <button onClick={() => router.back()} className="text-sm text-blue-500 hover:underline">← 返回商品列表</button>

            <h1 className="text-2xl font-medium">添加商品</h1>

            <Card className="max-w-[800px] bg-white p-6">
                <div className="grid gap-5">
                    {/* Shop */}
                    <div>
                        <label className="mb-2 block font-medium">所属店铺 <span className="text-red-500">*</span></label>
                        <Select value={form.shopId} onChange={v => handleChange('shopId', v)} options={[{ value: '', label: '请选择店铺' }, ...shops.map(shop => ({ value: shop.id, label: shop.shopName }))]} />
                        {shops.length === 0 && <div className="mt-1 text-xs text-red-500">暂无可用店铺，请先绑定店铺</div>}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block font-medium">商品名称 <span className="text-red-500">*</span></label>
                        <Input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="请输入商品名称" maxLength={200} />
                    </div>

                    {/* Link */}
                    <div>
                        <label className="mb-2 block font-medium">商品链接</label>
                        <Input type="text" value={form.link} onChange={e => handleChange('link', e.target.value)} placeholder="请输入商品链接或淘口令" />
                    </div>

                    {/* Platform Product ID */}
                    <div>
                        <label className="mb-2 block font-medium">平台商品ID</label>
                        <Input type="text" value={form.platformProductId} onChange={e => handleChange('platformProductId', e.target.value)} placeholder="可从商品链接自动解析" />
                    </div>

                    {/* Verify Code */}
                    <div>
                        <label className="mb-2 block font-medium">核对口令</label>
                        <Input type="text" value={form.verifyCode} onChange={e => handleChange('verifyCode', e.target.value)} placeholder="请输入核对口令" maxLength={10} />
                        <div className="mt-1.5 text-xs text-slate-500">请输入不超过10个字的核对口令，必须是商品详情页有的文字。买手做任务时需在详情页找到此口令进行核对。</div>
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

                    {/* Spec Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block font-medium">规格名</label>
                            <Input type="text" value={form.specName} onChange={e => handleChange('specName', e.target.value)} placeholder="如：颜色" />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">规格值</label>
                            <Input type="text" value={form.specValue} onChange={e => handleChange('specValue', e.target.value)} placeholder="如：红色" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex gap-4">
                    <Button onClick={handleSubmit} disabled={loading} className={cn(loading && 'cursor-not-allowed opacity-70')}>{loading ? '提交中...' : '保存商品'}</Button>
                    <Button variant="secondary" onClick={() => router.back()}>取消</Button>
                </div>
            </Card>
        </div>
    );
}
