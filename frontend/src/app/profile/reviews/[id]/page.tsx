'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '../../../../services/authService';
import {
    fetchReviewTaskDetail,
    submitReviewTask,
    rejectReviewTask,
    ReviewTask,
    ReviewTaskPraise,
    ReviewTaskStatus,
    ReviewTaskStatusLabels
} from '../../../../services/reviewTaskService';
import BottomNav from '../../../../components/BottomNav';

export default function ReviewTaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<ReviewTask | null>(null);
    const [praises, setPraises] = useState<ReviewTaskPraise[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTask();
    }, [router, taskId]);

    const loadTask = async () => {
        setLoading(true);
        try {
            const result = await fetchReviewTaskDetail(taskId);
            if (result) {
                setTask(result.task);
                setPraises(result.praises);
            }
        } catch (error) {
            console.error('Load task error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // 模拟上传并生成临时URL
        // 实际应用中需要上传到服务器
        const newImages = [...uploadedImages];
        for (let i = 0; i < files.length && newImages.length < 3; i++) {
            const url = URL.createObjectURL(files[i]);
            newImages.push(url);
        }
        setUploadedImages(newImages);
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...uploadedImages];
        newImages.splice(index, 1);
        setUploadedImages(newImages);
    };

    const handleSubmit = async () => {
        if (uploadedImages.length === 0) {
            alert('请上传追评截图');
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitReviewTask(taskId, uploadedImages);
            if (result.success) {
                alert('追评提交成功，等待商家确认');
                router.push('/profile/reviews');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('提交失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        setSubmitting(true);
        try {
            const result = await rejectReviewTask(taskId, rejectReason);
            if (result.success) {
                alert('已拒绝追评任务');
                router.push('/profile/reviews');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('操作失败，请稍后重试');
        } finally {
            setSubmitting(false);
            setShowRejectModal(false);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('复制成功');
    };

    if (loading || !task) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

    const statusInfo = ReviewTaskStatusLabels[task.state];
    const canSubmit = task.state === ReviewTaskStatus.APPROVED;

    // 解析追评内容
    const textPraises = praises.filter(p => p.type === 1);
    const imagePraises = praises.filter(p => p.type === 2);
    const videoPraises = praises.filter(p => p.type === 3);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f7',
            paddingBottom: '120px'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                padding: '20px',
                color: 'white',
                textAlign: 'center'
            }}>
                <div onClick={() => router.back()} style={{
                    position: 'absolute',
                    left: '16px',
                    top: '20px',
                    fontSize: '20px',
                    cursor: 'pointer'
                }}>←</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>追评任务详情</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    {task.taskNumber}
                </div>
            </div>

            {/* 状态卡片 */}
            <div style={{
                margin: '16px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: '#666' }}>任务状态</div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: statusInfo.color,
                            marginTop: '4px'
                        }}>
                            {statusInfo.text}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>追评佣金</div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#10b981',
                            marginTop: '4px'
                        }}>
                            ¥{Number(task.userMoney).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 追评内容 */}
            <div style={{
                margin: '16px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#333' }}>
                    追评要求
                </div>

                {/* 文字追评 */}
                {textPraises.map((praise, idx) => (
                    <div key={praise.id} style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                borderRadius: '4px'
                            }}>
                                文字追评 +2元
                            </span>
                            <button
                                onClick={() => copyText(praise.content)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    border: '1px solid #6366f1',
                                    borderRadius: '4px',
                                    background: 'white',
                                    color: '#6366f1',
                                    cursor: 'pointer'
                                }}
                            >
                                一键复制
                            </button>
                        </div>
                        <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                            {praise.content}
                        </div>
                    </div>
                ))}

                {/* 图片追评 */}
                {imagePraises.map((praise, idx) => {
                    let images: string[] = [];
                    try {
                        images = JSON.parse(praise.content);
                    } catch {
                        images = praise.content.split(',');
                    }
                    return (
                        <div key={praise.id} style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: '#f9fafb',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '8px'
                            }}>
                                图片追评 +3元
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ))}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                请长按保存图片后上传到追评
                            </div>
                        </div>
                    );
                })}

                {/* 视频追评 */}
                {videoPraises.map((praise, idx) => (
                    <div key={praise.id} style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            background: '#fce7f3',
                            color: '#be185d',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginBottom: '8px'
                        }}>
                            视频追评 +10元
                        </div>
                        <video
                            src={praise.content}
                            controls
                            style={{
                                width: '100%',
                                maxHeight: '200px',
                                borderRadius: '8px'
                            }}
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                            请下载视频后上传到追评
                        </div>
                    </div>
                ))}
            </div>

            {/* 上传追评截图 - 仅待追评状态显示 */}
            {canSubmit && (
                <div style={{
                    margin: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#333' }}>
                        上传追评截图
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {uploadedImages.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                                <img
                                    src={img}
                                    alt=""
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                                <div
                                    onClick={() => handleRemoveImage(idx)}
                                    style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        width: '20px',
                                        height: '20px',
                                        background: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </div>
                            </div>
                        ))}
                        {uploadedImages.length < 3 && (
                            <label style={{
                                width: '80px',
                                height: '80px',
                                border: '2px dashed #ddd',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexDirection: 'column',
                                color: '#999'
                            }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontSize: '24px' }}>+</span>
                                <span style={{ fontSize: '11px' }}>上传</span>
                            </label>
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                        最多上传3张追评截图
                    </div>
                </div>
            )}

            {/* 已上传的截图展示 - 非待追评状态 */}
            {!canSubmit && task.img && (
                <div style={{
                    margin: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#333' }}>
                        已提交的截图
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(() => {
                            let images: string[] = [];
                            try {
                                images = JSON.parse(task.img);
                            } catch {
                                images = task.img.split(',');
                            }
                            return images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt=""
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* 温馨提示 */}
            <div style={{
                margin: '16px',
                padding: '12px',
                background: '#fffbeb',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#92400e'
            }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>温馨提示</div>
                <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                    <li>请按指定内容进行追评，不符合要求将扣除佣金</li>
                    <li>胡乱评价、复制他人评价等行为将被拉黑</li>
                    <li>追评截图需清晰完整</li>
                </ul>
            </div>

            {/* 底部操作按钮 */}
            {canSubmit && (
                <div style={{
                    position: 'fixed',
                    bottom: '70px',
                    left: 0,
                    right: 0,
                    padding: '16px',
                    background: 'white',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={submitting}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid #ef4444',
                            background: 'white',
                            color: '#ef4444',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        拒绝追评
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || uploadedImages.length === 0}
                        style={{
                            flex: 2,
                            padding: '14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: submitting || uploadedImages.length === 0
                                ? '#ccc'
                                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: submitting || uploadedImages.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? '提交中...' : '提交追评'}
                    </button>
                </div>
            )}

            {/* 拒绝弹窗 */}
            {showRejectModal && (
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
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '320px'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                            确认拒绝追评？
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="请输入拒绝原因（可选）"
                                style={{
                                    width: '100%',
                                    height: '80px',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    resize: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    color: '#666',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                {submitting ? '处理中...' : '确认拒绝'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
