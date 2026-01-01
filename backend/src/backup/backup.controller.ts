import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { BackupService, BackupInfo } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

    /**
     * 获取备份列表
     */
    @Get()
    async listBackups(): Promise<BackupInfo[]> {
        return this.backupService.listBackups();
    }

    /**
     * 创建新备份
     */
    @Post()
    async createBackup(
        @Body('description') description?: string,
    ): Promise<BackupInfo> {
        return this.backupService.createBackup(description);
    }

    /**
     * 恢复备份
     */
    @Post('restore/:filename')
    async restoreBackup(
        @Param('filename') filename: string,
    ): Promise<{ success: boolean; message: string }> {
        await this.backupService.restoreBackup(filename);
        return { success: true, message: '数据库恢复成功' };
    }

    /**
     * 下载备份文件
     */
    @Get('download/:filename')
    async downloadBackup(
        @Param('filename') filename: string,
        @Res() res: express.Response,
    ) {
        const filepath = this.backupService.getBackupPath(filename);
        res.download(filepath, filename);
    }

    /**
     * 删除备份
     */
    @Delete(':filename')
    async deleteBackup(
        @Param('filename') filename: string,
    ): Promise<{ success: boolean; message: string }> {
        await this.backupService.deleteBackup(filename);
        return { success: true, message: '备份已删除' };
    }

    /**
     * 清理旧备份
     */
    @Post('clean')
    async cleanOldBackups(
        @Body('keepCount') keepCount: number = 10,
    ): Promise<{ success: boolean; deletedCount: number }> {
        const deletedCount = await this.backupService.cleanOldBackups(keepCount);
        return { success: true, deletedCount };
    }
}
