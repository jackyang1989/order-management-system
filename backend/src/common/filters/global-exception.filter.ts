import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Exception Filter
 * 
 * In production mode:
 * - Hides internal error details (SQL, file paths, stack traces)
 * - Returns generic "Internal System Error" for 500 errors
 * - Logs all errors to /logs/error.log
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('GlobalExceptionFilter');
    private readonly isProduction = process.env.NODE_ENV === 'production';
    private readonly logDir = path.join(process.cwd(), 'logs');
    private readonly errorLogPath = path.join(this.logDir, 'error.log');

    constructor() {
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string;
        let errorDetails: any = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody = exception.getResponse();

            if (typeof responseBody === 'object' && responseBody !== null) {
                message = (responseBody as any).message || exception.message;
                errorDetails = responseBody;
            } else {
                message = responseBody as string;
            }
        } else if (exception instanceof Error) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            errorDetails = {
                name: exception.name,
                stack: exception.stack,
            };
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Unknown error occurred';
        }

        // Build log entry
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: status >= 500 ? 'ERROR' : 'WARN',
            method: request.method,
            url: request.url,
            ip: request.ip || request.headers['x-forwarded-for'],
            userAgent: request.headers['user-agent'],
            status,
            message,
            ...(status >= 500 && errorDetails ? { details: errorDetails } : {}),
        };

        // Log to console
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${status} - ${message}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        } else {
            this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`);
        }

        // Write to error log file (async, non-blocking)
        if (status >= 500) {
            this.writeToLogFile(logEntry);
        }

        // Build response
        const responseBody: any = {
            success: false,
            statusCode: status,
            timestamp,
            path: request.url,
        };

        // In production, hide internal error details for 500 errors
        if (this.isProduction && status >= 500) {
            responseBody.message = 'Internal System Error';
            responseBody.error = 'INTERNAL_ERROR';
        } else {
            responseBody.message = message;

            // Include validation errors in development
            if (!this.isProduction && errorDetails?.message && Array.isArray(errorDetails.message)) {
                responseBody.errors = errorDetails.message;
            }
        }

        response.status(status).json(responseBody);
    }

    private writeToLogFile(logEntry: any): void {
        const logLine = JSON.stringify(logEntry) + '\n';

        fs.appendFile(this.errorLogPath, logLine, (err) => {
            if (err) {
                this.logger.error(`Failed to write to error log: ${err.message}`);
            }
        });
    }
}
