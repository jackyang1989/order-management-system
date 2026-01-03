'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../../services/authService';
import BottomNav from '../../../../components/BottomNav';

// ========================
// 对齐旧版 my/detail.html
// 完整的任务详情页面
// ========================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// 任务信息 - 对齐旧版 taskData
interface TaskData {
    maiHao: string;           // 买号
    type: string;             // 任务类型
    zhongDuan: string;        // 返款方式
    benJin: string;           // 垫付金额
    yongJin: string;          // 佣金
    user_divided: string;     // 银锭分成
    money: string;            // 返款金额
    dianPu: string;           // 店铺名称
    taskNum: string;          // 任务编号
    time: string;             // 创建时间
    taskType: string;         // 任务状态
    delType: string;          // 取消原因
    goods_price: string;      // 任务金额
    seller_name: string;      // 商家用户名
}

// 任务进度 - 对齐旧版 taskData2
interface TaskData2 {
    img: string;              // 关键词截图 keywordimg
    img2: string;             // 聊天截图 chatimg
    zhiFu: string;            // 支付状态
    order: string;            // 订单编号 table_order_id
    style: string;            // 快递方式 delivery
    num: string;              // 快递单号 delivery_num
    type1: string;            // 当前状态 state
    time: string;             // 更新时间
    step_two_complete: string;   // 第二步完成时间
    upload_order_time: string;   // 上传订单时间
    delivery_time: string;       // 发货时间
    platform_refund_time: string; // 平台返款时间
}

// 商品信息 - 对齐旧版 product
interface ProductInfo {
    name: string;
    text_praise: string;      // 好评内容
    img_praise: string[];     // 好评图片
    video_praise: string;     // 好评视频
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [taskData2, setTaskData2] = useState<TaskData2 | null>(null);
    const [products, setProducts] = useState<ProductInfo[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // ========================
    // 加载任务详情 - 对齐旧版 API
    // ========================
    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                const list = data.list || {};

                // 构建 taskData - 对齐旧版
                setTaskData({
                    maiHao: list.wwid || '',
                    type: list.task_type || '',
                    zhongDuan: list.terminal === 1 ? '本佣货返' : list.terminal === 2 ? '本立佣货' : list.terminal || '',
                    benJin: list.seller_principal || '',
                    yongJin: list.commission || '',
                    user_divided: list.user_divided || '',
                    money: list.seller_principal || '',
                    dianPu: list.shop_name || '',
                    taskNum: list.task_number || '',
                    time: list.create_time || '',
                    taskType: list.state || '',
                    delType: list.deltask_type || '',
                    goods_price: list.goods_price || '',
                    seller_name: list.seller_name || '',
                });

                // 构建 taskData2 - 对齐旧版
                setTaskData2({
                    img: list.keywordimg || '',
                    img2: list.chatimg || '',
                    zhiFu: list.table_order_id ? '已上传订单' : '待上传',
                    order: list.table_order_id || '',
                    style: list.delivery || '',
                    num: list.delivery_num || '',
                    type1: list.state || '',
                    time: list.update_time || '',
                    step_two_complete: list.step_two_complete || '',
                    upload_order_time: list.upload_order_time || '',
                    delivery_time: list.delivery_time || '',
                    platform_refund_time: list.platform_refund_time || '',
                });

                // 构建 products - 对齐旧版 {volist name="product" id="vo"}
                if (data.product && Array.isArray(data.product)) {
                    setProducts(data.product.map((item: any) => ({
                        name: item.name || '',
                        text_praise: item.text_praise || '',
                        img_praise: item.img_praise || [],
                        video_praise: item.video_praise || '',
                    })));
                }
            } else {
                alertError(res.msg || '获取详情失败');
                router.back();
            }
        } catch (error) {
            console.error('Load detail error:', error);
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    }, [id, alertError, router]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadDetail();
    }, [router, loadDetail]);

    // 图片预览 - 对齐旧版 shouImg1/shouImg2
    const showImage = (img: string) => {
        if (img && img.length > 0) {
            setPreviewImage(img);
        } else {
            alertError('当前没有图片');
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <div style={{ color: '#999', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

    if (!taskData) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 - 对齐旧版 page-header */}
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>任务详情</div>
                    <div style={{ width: '24px' }}></div>
                </div>
            </div>

            {/* 公用tab标签 - 对齐旧版 public-tab-title */}
            <div style={{
                background: '#fff',
                padding: '14px 16px',
                borderBottom: '1px solid #e5e5e5',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '600',
                color: '#409eff'
            }}>
                任务详情
            </div>

            <div style={{ padding: '12px' }}>
                {/* ========================
                    任务信息卡片 - 对齐旧版 public-card
                ======================== */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    {/* 标题栏 - 对齐旧版 public-card-title */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderBottom: '1px solid #f5f5f5'
                    }}>
                        <div style={{ color: '#f56c6c', fontWeight: '600', fontSize: '15px' }}>任务信息</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a
                                onClick={() => router.push('/profile/records?type=silver')}
                                style={{ color: '#409eff', fontSize: '13px', cursor: 'pointer' }}
                            >
                                银锭记录
                            </a>
                            <a
                                onClick={() => router.push('/profile/records?type=principal')}
                                style={{ color: '#409eff', fontSize: '13px', cursor: 'pointer' }}
                            >
                                本金记录
                            </a>
                        </div>
                    </div>

                    {/* 任务详情 - 对齐旧版 task-detail-card */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>买号：</span>
                            <span style={{ color: '#333' }}>{taskData.maiHao}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务类型：</span>
                            <span style={{ color: '#333' }}>{taskData.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>返款方式：</span>
                            <span style={{ color: '#333' }}>{taskData.zhongDuan}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>佣金：</span>
                            <span style={{ color: '#1677ff', fontWeight: '600' }}>
                                {taskData.yongJin}<span style={{ color: '#ffd700' }}>+{taskData.user_divided}银锭</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务金额：</span>
                            <span style={{ color: '#333' }}>{taskData.goods_price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>垫付金额：</span>
                            <span style={{ color: '#409eff', fontWeight: '600' }}>{taskData.benJin}元</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>返款金额：</span>
                            <span style={{ color: '#333' }}>{taskData.money}元</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务编号：</span>
                            <span style={{ color: '#333' }}>{taskData.taskNum}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>店铺：</span>
                            <span style={{ color: '#333' }}>{taskData.dianPu?.substring(0, 3)}...</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>创建时间：</span>
                            <span style={{ color: '#333' }}>{taskData.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务状态：</span>
                            <span style={{ color: '#333' }}>
                                {taskData.taskType}
                                {taskData.taskType === '已取消' && taskData.delType && (
                                    <span style={{ marginLeft: '10px', color: '#f56c6c' }}>{taskData.delType}</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ========================
                    任务进度卡片 - 对齐旧版 task-progress
                ======================== */}
                {taskData2 && (
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        {/* 标题栏 */}
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid #f5f5f5'
                        }}>
                            <div style={{ color: '#f56c6c', fontWeight: '600', fontSize: '15px' }}>任务进度</div>
                        </div>

                        {/* 进度表格 - 对齐旧版 public-table */}
                        <div style={{ padding: '16px', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f7' }}>
                                        <th style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'left' }}>服务项目</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>完成状态</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>完成时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 浏览店铺及在线客服聊天 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>浏览店铺及在线客服聊天</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <a
                                                    onClick={() => showImage(taskData2.img)}
                                                    style={{ color: '#409eff', cursor: 'pointer' }}
                                                >
                                                    点击查看
                                                </a>
                                                <a
                                                    onClick={() => showImage(taskData2.img2)}
                                                    style={{ color: '#409eff', cursor: 'pointer' }}
                                                >
                                                    点击查看
                                                </a>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.step_two_complete}</td>
                                    </tr>
                                    {/* 下单/支付 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>下单/支付</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.zhiFu}</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.upload_order_time}</td>
                                    </tr>
                                    {/* 订单编号 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>订单编号</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.order}</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.upload_order_time}</td>
                                    </tr>
                                    {/* 商家发货 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>商家发货</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>
                                            <div>
                                                <p style={{ margin: '0 0 4px' }}>快递方式：<span>{taskData2.style || '-'}</span></p>
                                                <p style={{ margin: 0 }}>快递单号：<span>{taskData2.num || '-'}</span></p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.delivery_time}</td>
                                    </tr>
                                    {/* 平台返款 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>平台返款</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                                            {taskData2.type1 === '待确认返款' || taskData2.type1 === '已完成' ? (
                                                <span style={{ color: '#07c160' }}>已返款</span>
                                            ) : (
                                                <span style={{ color: '#ff9500' }}>待返款</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.platform_refund_time}</td>
                                    </tr>
                                    {/* 任务状态 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>任务状态</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.type1}</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{taskData2.time}</td>
                                    </tr>
                                    {/* 好评内容 - 对齐旧版 {volist name="product" id="vo"} */}
                                    {products.map((vo, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>好评内容</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e5e5', color: '#f56c6c' }}>{vo.text_praise || '暂无内容'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>暂无内容</td>
                                        </tr>
                                    ))}
                                    {/* 好评图片 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>图片</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {products.flatMap(p => p.img_praise || []).map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={`https://b--d.oss-cn-guangzhou.aliyuncs.com${img}`}
                                                        alt="好评图片"
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                                        onClick={() => setPreviewImage(`https://b--d.oss-cn-guangzhou.aliyuncs.com${img}`)}
                                                    />
                                                ))}
                                                {products.flatMap(p => p.img_praise || []).length === 0 && (
                                                    <span style={{ color: '#999' }}>暂无图片</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>暂无内容</td>
                                    </tr>
                                    {/* 好评视频 */}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>视频</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5' }}>
                                            {products.some(p => p.video_praise) ? (
                                                <video
                                                    src={`https://b--d.oss-cn-guangzhou.aliyuncs.com${products.find(p => p.video_praise)?.video_praise}`}
                                                    controls
                                                    style={{ width: '120px', height: '80px', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <span style={{ color: '#999' }}>暂无视频</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                                            {products.some(p => p.video_praise) && (
                                                <a
                                                    href={`https://b--d.oss-cn-guangzhou.aliyuncs.com${products.find(p => p.video_praise)?.video_praise}`}
                                                    download="视频"
                                                    style={{ color: '#409eff' }}
                                                >
                                                    下载
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* 图片预览弹层 */}
            {previewImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="预览"
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                </div>
            )}

            <BottomNav />
        </div>
    );
}
