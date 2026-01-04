import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: Date;
  path: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 创建数据库备份
   */
  async createBackup(description?: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbUser = process.env.DB_USERNAME || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_DATABASE || 'order_management';

    try {
      // 使用 pg_dump 创建备份
      const command = `PGPASSWORD='${dbPassword}' pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f ${filepath}`;

      await execAsync(command);

      const stats = fs.statSync(filepath);

      // 保存备份元信息
      const metaFile = filepath + '.meta.json';
      fs.writeFileSync(
        metaFile,
        JSON.stringify({
          description: description || '手动备份',
          createdAt: new Date().toISOString(),
          dbName,
          dbHost,
        }),
      );

      this.logger.log(`数据库备份成功: ${filename}`);

      return {
        filename,
        size: stats.size,
        createdAt: new Date(),
        path: filepath,
      };
    } catch (error) {
      this.logger.error(`数据库备份失败: ${error.message}`);
      throw new Error(`数据库备份失败: ${error.message}`);
    }
  }

  /**
   * 获取所有备份列表
   */
  async listBackups(): Promise<BackupInfo[]> {
    const files = fs.readdirSync(this.backupDir);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);

        backups.push({
          filename: file,
          size: stats.size,
          createdAt: stats.mtime,
          path: filepath,
        });
      }
    }

    // 按创建时间倒序排列
    return backups.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * 恢复数据库
   * 警告：此操作会覆盖当前数据库！
   */
  async restoreBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`备份文件不存在: ${filename}`);
    }

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbUser = process.env.DB_USERNAME || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_DATABASE || 'order_management';

    try {
      // 使用 psql 恢复备份
      const command = `PGPASSWORD='${dbPassword}' psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${filepath}`;

      await execAsync(command);

      this.logger.log(`数据库恢复成功: ${filename}`);
    } catch (error) {
      this.logger.error(`数据库恢复失败: ${error.message}`);
      throw new Error(`数据库恢复失败: ${error.message}`);
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    const metaFile = filepath + '.meta.json';

    if (!fs.existsSync(filepath)) {
      throw new Error(`备份文件不存在: ${filename}`);
    }

    fs.unlinkSync(filepath);
    if (fs.existsSync(metaFile)) {
      fs.unlinkSync(metaFile);
    }

    this.logger.log(`备份已删除: ${filename}`);
  }

  /**
   * 下载备份文件
   */
  getBackupPath(filename: string): string {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`备份文件不存在: ${filename}`);
    }

    return filepath;
  }

  /**
   * 清理旧备份（保留最近N个）
   */
  async cleanOldBackups(keepCount: number = 10): Promise<number> {
    const backups = await this.listBackups();

    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    for (const backup of toDelete) {
      await this.deleteBackup(backup.filename);
    }

    this.logger.log(`清理了 ${toDelete.length} 个旧备份`);
    return toDelete.length;
  }
}
