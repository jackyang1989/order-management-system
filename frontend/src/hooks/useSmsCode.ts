'use client';

import { useState, useRef, useCallback } from 'react';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface UseSmsCodeOptions {
    /** 倒计时秒数，默认60秒 */
    countdown?: number;
    /** 发送成功回调 */
    onSuccess?: () => void;
    /** 发送失败回调 */
    onError?: (error: string) => void;
}

interface UseSmsCodeReturn {
    /** 验证码按钮是否禁用 */
    isDisabled: boolean;
    /** 按钮文字 */
    buttonText: string;
    /** 发送验证码方法 */
    sendCode: (mobile: string) => Promise<void>;
    /** 重置状态 */
    reset: () => void;
}

/**
 * 通用短信验证码 Hook
 *
 * @example
 * const { isDisabled, buttonText, sendCode } = useSmsCode();
 *
 * <button onClick={() => sendCode(phone)} disabled={isDisabled}>
 *   {buttonText}
 * </button>
 */
export function useSmsCode(options: UseSmsCodeOptions = {}): UseSmsCodeReturn {
    const { countdown = 60, onSuccess, onError } = options;

    const [isDisabled, setIsDisabled] = useState(false);
    const [buttonText, setButtonText] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);


    const phoneReg = /^1[3-9]\d{9}$/;

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
        onSuccess?.();
    }, [onSuccess]);

    const alertError = useCallback((msg: string) => {
        alert(msg);
        onError?.(msg);
    }, [onError]);

    const reset = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsDisabled(false);
        setButtonText('发送验证码');
    }, []);

    const sendCode = useCallback(async (mobile: string) => {
        // 校验手机号
        if (!mobile) {
            alertError('手机号码不能为空');
            return;
        }
        if (!phoneReg.test(mobile)) {
            alertError('手机号码格式不规范,请检查后重新输入');
            return;
        }

        // 如果已经在倒计时中，不重复发送
        if (isDisabled) {
            return;
        }

        try {
            // 调用旧版 API - mobile/way/send_code
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
        } catch (error) {

        }

        // 开始倒计时
        let num = countdown;
        setIsDisabled(true);
        setButtonText(`还剩 ${num} 秒`);

        timerRef.current = setInterval(() => {
            num--;
            setButtonText(`还剩 ${num} 秒`);
            if (num <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setButtonText('重新发送');
                setIsDisabled(false);
            } else if (num === countdown - 1) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    }, [countdown, isDisabled, alertSuccess, alertError]);

    return {
        isDisabled,
        buttonText,
        sendCode,
        reset,
    };
}

export default useSmsCode;
