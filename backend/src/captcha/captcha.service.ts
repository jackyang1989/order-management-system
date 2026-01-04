import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

interface CaptchaData {
    text: string;
    createdAt: number;
}

@Injectable()
export class CaptchaService {
    // In-memory store for captchas (use Redis in production)
    private captchaStore: Map<string, CaptchaData> = new Map();

    // Captcha expiry time in milliseconds (5 minutes)
    private readonly CAPTCHA_EXPIRY = 5 * 60 * 1000;

    /**
     * Generate a new SVG captcha
     * Returns captcha ID and SVG data
     */
    generate(): { captchaId: string; svg: string } {
        const captcha = svgCaptcha.create({
            size: 4, // Number of characters
            noise: 2, // Number of noise lines
            color: true, // Characters will have distinct colors
            background: '#f0f0f0',
            width: 120,
            height: 40,
            fontSize: 40,
        });

        // Generate unique ID
        const captchaId = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        // Store captcha text with timestamp
        this.captchaStore.set(captchaId, {
            text: captcha.text.toLowerCase(),
            createdAt: Date.now(),
        });

        // Cleanup expired captchas periodically
        this.cleanupExpired();

        return {
            captchaId,
            svg: captcha.data,
        };
    }

    /**
     * Generate a math-based captcha
     */
    generateMath(): { captchaId: string; svg: string } {
        const captcha = svgCaptcha.createMathExpr({
            mathMin: 1,
            mathMax: 20,
            mathOperator: '+-',
            color: true,
            background: '#f0f0f0',
            width: 120,
            height: 40,
            fontSize: 35,
        });

        const captchaId = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        this.captchaStore.set(captchaId, {
            text: captcha.text.toLowerCase(),
            createdAt: Date.now(),
        });

        this.cleanupExpired();

        return {
            captchaId,
            svg: captcha.data,
        };
    }

    /**
     * Verify captcha input
     * Returns true if valid, false otherwise
     * Captcha is consumed after verification attempt
     */
    verify(captchaId: string, userInput: string): boolean {
        const stored = this.captchaStore.get(captchaId);

        if (!stored) {
            return false;
        }

        // Check expiry
        if (Date.now() - stored.createdAt > this.CAPTCHA_EXPIRY) {
            this.captchaStore.delete(captchaId);
            return false;
        }

        // Case-insensitive comparison
        const isValid = stored.text === userInput.toLowerCase().trim();

        // Remove captcha after verification (one-time use)
        this.captchaStore.delete(captchaId);

        return isValid;
    }

    /**
     * Check if captcha is valid without consuming it
     */
    isValid(captchaId: string): boolean {
        const stored = this.captchaStore.get(captchaId);
        if (!stored) return false;
        return Date.now() - stored.createdAt <= this.CAPTCHA_EXPIRY;
    }

    /**
     * Cleanup expired captchas
     */
    private cleanupExpired(): void {
        const now = Date.now();
        for (const [id, data] of this.captchaStore.entries()) {
            if (now - data.createdAt > this.CAPTCHA_EXPIRY) {
                this.captchaStore.delete(id);
            }
        }
    }
}
