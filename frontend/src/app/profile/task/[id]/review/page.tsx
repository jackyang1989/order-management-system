'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';

// ===================== 类型定义 =====================
interface TaskData {
    taskBianHao: string;
    time: string;
    type: string;
    title: string;
    content: string;  // 文字追评
    img: string;      // 照片追评（逗号分隔）
    video: string;    // 视频追评
    maiHao: string;
    kuaiDi: string;
    danHao: string;
    price: string;
}

interface UploadFile {
    file: File;
    content: string;
}

// ===================== 主组件 =====================
export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    // ===================== 状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [task_id, setTaskId] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [testData, setTestData] = useState<TaskData[]>([]);
    const [localFile, setLocalFile] = useState<UploadFile[]>([]); // 支持多张图片
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // ===================== 工具函数 =====================
    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // 文件转Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 处理文件选择（支持多张）
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles: UploadFile[] = [];
            for (let i = 0; i < Math.min(files.length, 3 - localFile.length); i++) {
                const file = files[i];
                const content = await fileToBase64(file);
                newFiles.push({ file, content });
            }
            setLocalFile(prev => [...prev, ...newFiles].slice(0, 3)); // 最多3张
        }
        // 清空 input 以便再次选择
        e.target.value = '';
    };

    // 删除图片
    const handleRemove = (index: number) => {
        setLocalFile(prev => prev.filter((_, i) => i !== index));
    };

    // 复制文字
    const copyText = (text: string) => {
        if (!text) return;
        const oInput = document.createElement('input');
        oInput.value = text;
        document.body.appendChild(oInput);
        oInput.select();
        document.execCommand('Copy');
        oInput.style.display = 'none';
        document.body.removeChild(oInput);
        alertSuccess('追评内容复制成功');
    };

    // ===================== API 调用 =====================
    // 获取任务数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/zhuipin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ id }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                setTaskId(data.list?.id || id);

                // 构建 testData
                if (data.product && Array.isArray(data.product)) {
                    const taskList: TaskData[] = data.product.map((vo: any) => ({
                        taskBianHao: data.list?.task_number || '',
                        time: data.list?.create_time || '',
                        type: data.list?.task_type || '',
                        title: vo.name || '',
                        content: vo.wenzi || '',
                        img: vo.img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.img}` : '',
                        video: vo.video || '',
                        maiHao: data.list?.wwid || '',
                        kuaiDi: data.list?.delivery || '',
                        danHao: data.list?.delivery_num || '',
                        price: data.list?.seller_principal || '',
                    }));
                    setTestData(taskList);
                } else if (data.list) {
                    // 单条数据情况
                    setTestData([{
                        taskBianHao: data.list.task_number || '',
                        time: data.list.create_time || '',
                        type: data.list.task_type || '',
                        title: data.list.name || '',
                        content: data.list.wenzi || '',
                        img: data.list.img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${data.list.img}` : '',
                        video: data.list.video || '',
                        maiHao: data.list.wwid || '',
                        kuaiDi: data.list.delivery || '',
                        danHao: data.list.delivery_num || '',
                        price: data.list.seller_principal || '',
                    }]);
                }
            } else {
                alertError(res.msg || '获取任务数据失败');
            }
        } catch (error) {
            console.error('获取任务数据失败:', error);
            alertError('获取任务数据失败');
        } finally {
            setLoading(false);
        }
    }, [id, getToken, alertError]);

    // 确认追评提交
    const dialogConfirm = async () => {
        if (localFile.length === 0) {
            alertError('请上传追评截图！');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            // 提取所有图片的base64
            const imgContents = localFile.map(f => f.content);

            const response = await fetch(`${BASE_URL}/mobile/my/take_zhuipin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    high_praise_img: imgContents,
                    task_id: task_id,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    router.push(data.url || '/orders');
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    // ===================== 副作用 =====================
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        getData();
    }, [getData, getToken, router]);

    // ===================== 渲染 =====================
    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                加载中...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', width: '30px' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>追评任务</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 标题 */}
            <div style={{ background: '#fff', padding: '12px 15px', marginBottom: '10px' }}>
                <span style={{ color: '#409eff', fontWeight: 'bold' }}>追评任务</span>
            </div>

            {/* 确认追评按钮 */}
            <div style={{ padding: '0 15px', marginBottom: '15px' }}>
                <button
                    onClick={() => setDialogVisible(true)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#f56c6c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    确认追评
                </button>
            </div>

            {/* 任务内容 */}
            {testData.map((item, index) => (
                <div key={index} style={{ background: '#fff', margin: '0 10px 10px', borderRadius: '8px', padding: '15px' }}>
                    {/* 基本信息 */}
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>任务编号：</span><span>{item.taskBianHao}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>发布时间：</span><span>{item.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>任务类型：</span><span>{item.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>商品标题：</span><span>{item.title}</span>
                        </div>
                    </div>

                    {/* 文字追评 */}
                    <div style={{ marginTop: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <b style={{ fontSize: '13px', color: '#333' }}>文字追评：</b>
                                <p style={{ fontSize: '13px', color: '#666', marginTop: '5px', lineHeight: '1.6' }}>
                                    {item.content || '无指定追评内容'}
                                </p>
                            </div>
                        </div>
                        {item.content && (
                            <button
                                onClick={() => copyText(item.content)}
                                style={{
                                    marginTop: '10px',
                                    padding: '6px 15px',
                                    background: '#f56c6c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                一键复制
                            </button>
                        )}
                    </div>

                    {/* 照片追评 */}
                    {item.img && item.img.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#333', fontWeight: 'bold' }}>照片追评：</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                {item.img.split(',').filter(Boolean).map((imgUrl, imgIndex) => (
                                    <img
                                        key={imgIndex}
                                        src={imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`}
                                        alt={`追评图${imgIndex + 1}`}
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: '1px solid #ddd',
                                        }}
                                        onClick={() => setPreviewImage(imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 视频追评 */}
                    {item.video && (
                        <div style={{ marginTop: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#333', fontWeight: 'bold' }}>视频追评：</span>
                            <div style={{ marginTop: '10px' }}>
                                <video
                                    src={item.video}
                                    controls
                                    style={{ width: '100%', maxHeight: '200px', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* 提示信息 */}
            <div style={{ background: '#fff3cd', margin: '10px', borderRadius: '8px', padding: '15px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#856404', marginBottom: '10px' }}>提示</p>
                <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.8' }}>
                    <p style={{ color: 'red' }}>1.请复制以上指定文字追评内容进行追评，若有照片追评内容需长按每张照片保存到相册再到追评页面上传，若有视频追评内容先点击下载视频保存到相册后再到追评页面上传，追评提交后将追评页截图上传。</p>
                    <p>2.未按指定文字、照片、视频追评将扣除本次追评任务的银锭。</p>
                    <p>3.评价环节若胡乱评价、复制店内他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，买号将永久拉黑。</p>
                </div>
            </div>

            {/* 上传图片弹框 */}
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
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        padding: '20px',
                    }}>
                        <h3 style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>温馨提示</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>请上传追评截图（最多3张）：</p>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                disabled={localFile.length >= 3}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {localFile.map((file, index) => (
                                        <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={file.content}
                                                alt={`预览${index + 1}`}
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                            <button
                                                onClick={() => handleRemove(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    background: '#f56c6c',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setDialogVisible(false);
                                    setLocalFile([]);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#ddd',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
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
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        zIndex: 1001,
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
        </div>
    );
}
