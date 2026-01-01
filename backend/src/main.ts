import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // 安全中间件 - HTTP 安全头
    app.use(helmet());

    // 全局验证管道
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,           // 自动剥离非白名单属性
        forbidNonWhitelisted: true, // 非白名单属性报错
        transform: true,            // 自动转换类型
        transformOptions: {
            enableImplicitConversion: true, // 允许隐式类型转换
        },
    }));

    // CORS 配置
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:3001'];

    app.enableCors({
        origin: (origin, callback) => {
            // 允许无 origin 的请求（如 Postman、移动端）
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    const port = process.env.PORT ?? 6006;
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
