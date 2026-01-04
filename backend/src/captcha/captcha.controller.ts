import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CaptchaService } from './captcha.service';

class VerifyCaptchaDto {
    captchaId: string;
    captchaCode: string;
}

@Controller('captcha')
export class CaptchaController {
    constructor(private readonly captchaService: CaptchaService) { }

    /**
     * Generate a new text captcha
     * GET /captcha/generate
     */
    @Get('generate')
    generate() {
        const result = this.captchaService.generate();
        return {
            success: true,
            data: {
                captchaId: result.captchaId,
                svg: result.svg,
            },
        };
    }

    /**
     * Generate a new math captcha
     * GET /captcha/generate-math
     */
    @Get('generate-math')
    generateMath() {
        const result = this.captchaService.generateMath();
        return {
            success: true,
            data: {
                captchaId: result.captchaId,
                svg: result.svg,
            },
        };
    }

    /**
     * Get captcha as SVG image directly (for img src)
     * GET /captcha/image?id=xxx
     */
    @Get('image')
    getImage(@Query('id') captchaId: string, @Res() res: Response) {
        const result = this.captchaService.generate();
        res.type('svg');
        res.send(result.svg);
    }

    /**
     * Verify captcha
     * POST /captcha/verify
     */
    @Post('verify')
    verify(@Body() dto: VerifyCaptchaDto) {
        const isValid = this.captchaService.verify(dto.captchaId, dto.captchaCode);
        return {
            success: isValid,
            message: isValid ? '验证成功' : '验证码错误或已过期',
        };
    }
}
