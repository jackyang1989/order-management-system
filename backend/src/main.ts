import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DataSource } from 'typeorm';
import { runSeeds } from './seeds';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const logger = new Logger('Bootstrap');

  // ============================================================
  // 0. BODY PARSER - Increase request body size limit
  // ============================================================
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // ============================================================
  // 1. COMPRESSION - Gzip for reduced bandwidth
  // ============================================================
  app.use(compression({
    threshold: 1024, // Only compress responses > 1KB
    level: 6, // Compression level (1-9, 6 is balanced)
  }));

  // ============================================================
  // 1.5. STATIC FILES - Serve uploaded files
  // ============================================================
  const express = await import('express');
  app.use('/uploads', express.default.static('uploads', {
    maxAge: '7d', // Cache for 7 days
    etag: true,
    lastModified: true,
  }));


  // ============================================================
  // 2. HELMET - HTTP Security Headers with CSP
  // ============================================================
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Ant Design
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", ...(process.env.ALLOWED_API_ORIGINS?.split(',') || [])],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    } : false, // Disable CSP in development
    crossOriginEmbedderPolicy: false, // Required for external images
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // ============================================================
  // 3. GLOBAL EXCEPTION FILTER - Hide internal errors in production
  // ============================================================
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ============================================================
  // 4. VALIDATION PIPE - Request validation
  // ============================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,  // P0 FIX: Disable whitelist to allow all fields through
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Disable detailed errors in production
      disableErrorMessages: isProduction,
    }),
  );

  // ============================================================
  // 5. CORS - Strict origin control for production
  // ============================================================
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:6005'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman) in development only
      if (!origin) {
        if (isProduction) {
          callback(new Error('Origin required in production'), false);
        } else {
          callback(null, true);
        }
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (!isProduction) {
        // Allow all origins in development
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // Cache preflight for 24 hours
  });

  // ============================================================
  // 6. GRACEFUL SHUTDOWN
  // ============================================================
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 6006;
  await app.listen(port);

  // ============================================================
  // 7. SEED DATA - Initialize default data on first run
  // ============================================================
  try {
    const dataSource = app.get(DataSource);
    await runSeeds(dataSource);
  } catch (error) {
    logger.warn(`Seed data initialization skipped: ${error.message}`);
  }

  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
  if (isProduction) {
    logger.log('🛡️  Production mode: Security hardening ENABLED');
  }
}

bootstrap();
