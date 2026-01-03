'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../../../services/authService';
import BottomNav from '../../../../../components/BottomNav';

// ========================

// 确认收货页面 - 上传好评截图
// ========================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface ProductInfo {
    taskBianHao: string;      // 任务编号
    time: string;             // 发布时间
    type: string;             // 任务类型
    title: string;            // 商品标题
    content: string;          // 文字好评内容
    img: string;              // 照片好评图片 (逗号分隔)
    video: string;            // 视频好评地址
    maiHao: string;           // 买号
    kuaiDi: string;           // 快递方式
    danHao: string;           // 快递单号
    price: string;            // 付款金额
}

export default function ReceivePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [taskId, setTaskId] = useState('');
    const [testData, setTestData] = useState<ProductInfo[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // ========================
    // 加载任务详情 - 对齐旧版 shouhuo
    // ========================
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/shouhuo`, {
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
                setTaskId(list.id || id);

                // 构建 testData - 对齐旧版 {volist name="product" id="vo"}
                if (data.product && Array.isArray(data.product)) {
                    setTestData(data.product.map((vo: any) => ({
                        taskBianHao: list.task_number || '',
                        time: list.create_time || '',
                        type: list.task_type || '',
                        title: vo.name || '',
                        content: vo.text_praise || '',
                        img: vo.img_praise || '',
                        video: vo.video_praise ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.video_praise}` : '',
                        maiHao: list.wwid || '',
                        kuaiDi: list.delivery || '',
                        danHao: list.delivery_num || '',
                        price: list.seller_principal || '',
                    })));
                }
            } else {
                alertError(res.msg || '获取数据失败');
            }
        } catch (error) {
            console.error('Load data error:', error);
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    }, [id, alertError]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router, loadData]);

    // 文件转Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 处理文件选择
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const content = await fileToBase64(file);
            setLocalFile({ file, content });
        }
    };

    // 删除图片 - 对齐旧版 handleRemove
    const handleRemove = () => {
        setLocalFile(null);
    };

    // 复制文字 - 对齐旧版 copyText
    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alertSuccess('复制成功');
        } catch {
            // 降级方案
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            alertSuccess('复制成功');
        }
    };

    // ========================
    // 确认收货 - 对齐旧版 mobile/my/take_delivery
    // ========================
    const dialogConfirm = async () => {
        if (!localFile) {
            alertError('请上传好评截图！');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/take_delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    high_praise_img: localFile.content,
                    task_id: taskId,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg || '确认收货成功');
                setTimeout(() => {
                    router.push(data.url || '/orders');
                }, 3000);
            } else {
                alertError(data.msg || '操作失败');
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <div style={{ color: '#999', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

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
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>去收货</div>
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
                去收货
            </div>

            <div style={{ padding: '12px' }}>
                {/* 确认收货按钮 - 对齐旧版 zhuipin-btn */}
                <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <button
                        onClick={() => setDialogVisible(true)}
                        style={{
                            padding: '10px 24px',
                            background: '#f56c6c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        确认收货
                    </button>
                </div>

                {/* 追评任务内容 - 对齐旧版 zhuipin-task-content */}
                {testData.map((item, index) => (
                    <div key={index} style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务编号：</span>
                            <span style={{ color: '#333' }}>{item.taskBianHao}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>发布时间：</span>
                            <span style={{ color: '#333' }}>{item.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>任务类型：</span>
                            <span style={{ color: '#333' }}>{item.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                            <span style={{ color: '#666' }}>商品标题：</span>
                            <span style={{ color: '#333' }}>{item.title}</span>
                        </div>

                        {/* 文字好评 - 对齐旧版 zhuipin-task-text */}
                        {item.content && (
                            <div style={{
                                background: '#f9f9f9',
                                borderRadius: '8px',
                                padding: '12px',
                                marginTop: '12px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#333', fontSize: '13px' }}>文字好评：</span>
                                        <span style={{ color: '#f56c6c', fontSize: '13px' }}>{item.content}</span>
                                    </div>
                                    <button
                                        onClick={() => copyText(item.content)}
                                        style={{
                                            padding: '4px 12px',
                                            background: '#f56c6c',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        一键复制
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 照片好评 - 对齐旧版 */}
                        {item.img && item.img.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: '600', color: '#333', fontSize: '13px', marginRight: '8px' }}>照片好评：</span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                    {item.img.split(',').filter(Boolean).map((imgUrl, idx) => (
                                        <img
                                            key={idx}
                                            src={imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`}
                                            alt="好评图片"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 视频好评 - 对齐旧版 */}
                        {item.video && (
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: '600', color: '#333', fontSize: '13px', marginRight: '8px' }}>视频好评：</span>
                                <div style={{ marginTop: '8px' }}>
                                    <video
                                        src={item.video}
                                        controls
                                        style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }}
                                    />
                                </div>
                                <a
                                    href={item.video}
                                    download="视频"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '8px',
                                        color: '#409eff',
                                        fontSize: '13px'
                                    }}
                                >
                                    下载视频
                                </a>
                            </div>
                        )}
                    </div>
                ))}

                {/* 提示信息 - 对齐旧版 task_row2 */}
                <div style={{
                    background: '#fff3cd',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '12px'
                }}>
                    <div style={{ fontWeight: '600', color: '#856404', marginBottom: '8px', fontSize: '14px' }}>提示</div>
                    <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.8' }}>
                        <p style={{ margin: '0 0 8px', color: '#f56c6c' }}>
                            1.请复制以上指定文字好评内容进行5星好评，若有照片好评内容需长按每张照片保存到相册再到评价页面上传买家秀，若有视频好评内容先点击下载视频保存到相册后再到评价页面上传视频，评价提交后将评价页面截图上传。
                        </p>
                        <p style={{ margin: '0 0 8px', color: '#f56c6c' }}>
                            2.无指定评价内容时需全5星并自由发挥15字以上与商品相关的评语。
                        </p>
                        <p style={{ margin: '0 0 8px' }}>
                            3.未按指定文字、照片、视频好评将扣除本次任务的银锭(佣金)。
                        </p>
                        <p style={{ margin: 0 }}>
                            4.评价环节若胡乱评价、复制店内他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，买号将永久拉黑。
                        </p>
                    </div>
                </div>
            </div>

            {/* 上传图片弹框 - 对齐旧版 van-dialog */}
            {dialogVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        width: '85%',
                        maxWidth: '360px',
                        padding: '20px'
                    }}>
                        <h3 style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px', color: '#333' }}>温馨提示</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '10px' }}>请上传好评截图：</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile && (
                                <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={localFile.content}
                                        alt="预览"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <button
                                        onClick={handleRemove}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#f56c6c',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setDialogVisible(false);
                                    setLocalFile(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#ddd',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={dialogConfirm}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: submitting ? '#a0cfff' : '#409eff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
