import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
    UploadedFile,
    FileGroup,
    FileType,
    FileUsage,
    StorageType,
    UploadFileDto,
    FileFilterDto,
    CreateGroupDto,
} from './upload.entity';

@Injectable()
export class UploadsService {
    // 上传目录
    private readonly uploadDir = 'uploads';
    // 允许的图片类型
    private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // 允许的文档类型
    private readonly allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    // 最大文件大小 (10MB)
    private readonly maxFileSize = 10 * 1024 * 1024;

    constructor(
        @InjectRepository(UploadedFile)
        private fileRepository: Repository<UploadedFile>,
        @InjectRepository(FileGroup)
        private groupRepository: Repository<FileGroup>,
    ) {
        // 确保上传目录存在
        this.ensureUploadDir();
    }

    /**
     * 确保上传目录存在
     */
    private ensureUploadDir(): void {
        const dirs = ['images', 'documents', 'videos', 'others'].map(d => path.join(this.uploadDir, d));
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    /**
     * 获取文件类型
     */
    private getFileType(mimeType: string): FileType {
        if (mimeType.startsWith('image/')) return FileType.IMAGE;
        if (mimeType.startsWith('video/')) return FileType.VIDEO;
        if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return FileType.DOCUMENT;
        return FileType.OTHER;
    }

    /**
     * 生成存储路径
     */
    private generateFilePath(fileType: FileType, originalName: string): { fileName: string; filePath: string } {
        const date = new Date();
        const dateDir = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const ext = path.extname(originalName);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;

        let subDir = 'others';
        switch (fileType) {
            case FileType.IMAGE: subDir = 'images'; break;
            case FileType.VIDEO: subDir = 'videos'; break;
            case FileType.DOCUMENT: subDir = 'documents'; break;
        }

        const fullDir = path.join(this.uploadDir, subDir, dateDir);
        if (!fs.existsSync(fullDir)) {
            fs.mkdirSync(fullDir, { recursive: true });
        }

        return {
            fileName,
            filePath: path.join(subDir, dateDir, fileName)
        };
    }

    /**
     * 计算文件MD5
     */
    private calculateMD5(buffer: Buffer): string {
        return crypto.createHash('md5').update(buffer).digest('hex');
    }

    /**
     * 上传文件
     */
    async uploadFile(
        file: {
            originalname: string;
            mimetype: string;
            buffer: Buffer;
            size: number;
        },
        dto?: UploadFileDto
    ): Promise<{ success: boolean; message: string; data?: UploadedFile }> {
        // 验证文件大小
        if (file.size > this.maxFileSize) {
            return { success: false, message: '文件大小不能超过10MB' };
        }

        const fileType = this.getFileType(file.mimetype);
        const md5 = this.calculateMD5(file.buffer);

        // 检查是否已上传过相同文件（秒传）
        const existingFile = await this.fileRepository.findOne({
            where: { md5, isDeleted: false }
        });

        if (existingFile) {
            // 创建新记录指向相同文件
            const newFile = this.fileRepository.create({
                originalName: file.originalname,
                fileName: existingFile.fileName,
                path: existingFile.path,
                url: existingFile.url,
                type: fileType,
                mimeType: file.mimetype,
                size: file.size,
                storage: StorageType.LOCAL,
                md5,
                width: existingFile.width,
                height: existingFile.height,
                ...dto,
            });
            const saved = await this.fileRepository.save(newFile);
            return { success: true, message: '上传成功（秒传）', data: saved };
        }

        // 生成存储路径
        const { fileName, filePath } = this.generateFilePath(fileType, file.originalname);
        const fullPath = path.join(this.uploadDir, filePath);

        // 保存文件
        fs.writeFileSync(fullPath, file.buffer);

        // 生成访问URL
        const url = `/${this.uploadDir}/${filePath}`;

        // 创建记录
        const uploadedFile = this.fileRepository.create({
            originalName: file.originalname,
            fileName,
            path: filePath,
            url,
            type: fileType,
            mimeType: file.mimetype,
            size: file.size,
            storage: StorageType.LOCAL,
            md5,
            ...dto,
        });

        const saved = await this.fileRepository.save(uploadedFile);
        return { success: true, message: '上传成功', data: saved };
    }

    /**
     * 批量上传
     */
    async uploadFiles(
        files: Array<{ originalname: string; mimetype: string; buffer: Buffer; size: number }>,
        dto?: UploadFileDto
    ): Promise<{ success: boolean; data: UploadedFile[]; failed: string[] }> {
        const results: UploadedFile[] = [];
        const failed: string[] = [];

        for (const file of files) {
            const result = await this.uploadFile(file, dto);
            if (result.success && result.data) {
                results.push(result.data);
            } else {
                failed.push(file.originalname);
            }
        }

        return { success: failed.length === 0, data: results, failed };
    }

    /**
     * 获取文件信息
     */
    async getFile(id: string): Promise<UploadedFile | null> {
        return this.fileRepository.findOne({
            where: { id, isDeleted: false }
        });
    }

    /**
     * 获取用户文件列表
     */
    async getUserFiles(
        userId: string,
        filter?: FileFilterDto
    ): Promise<{ data: UploadedFile[]; total: number }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.fileRepository.createQueryBuilder('f')
            .where('f.uploaderId = :userId', { userId })
            .andWhere('f.isDeleted = false');

        if (filter?.type) {
            queryBuilder.andWhere('f.type = :type', { type: filter.type });
        }
        if (filter?.usage) {
            queryBuilder.andWhere('f.usage = :usage', { usage: filter.usage });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('f.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 删除文件（软删除）
     */
    async deleteFile(id: string, userId: string): Promise<boolean> {
        const file = await this.getFile(id);
        if (!file || file.uploaderId !== userId) {
            return false;
        }

        file.isDeleted = true;
        await this.fileRepository.save(file);
        return true;
    }

    /**
     * 批量删除
     */
    async deleteFiles(ids: string[], userId: string): Promise<number> {
        let count = 0;
        for (const id of ids) {
            if (await this.deleteFile(id, userId)) {
                count++;
            }
        }
        return count;
    }

    // ============ 文件分组管理 ============

    /**
     * 创建分组
     */
    async createGroup(userId: string, dto: CreateGroupDto): Promise<FileGroup> {
        const group = this.groupRepository.create({
            userId,
            ...dto,
        });
        return this.groupRepository.save(group);
    }

    /**
     * 获取用户分组
     */
    async getUserGroups(userId: string): Promise<FileGroup[]> {
        return this.groupRepository.find({
            where: { userId },
            order: { sort: 'ASC', createdAt: 'ASC' }
        });
    }

    /**
     * 删除分组
     */
    async deleteGroup(id: string, userId: string): Promise<boolean> {
        const result = await this.groupRepository.delete({ id, userId });
        return (result.affected || 0) > 0;
    }

    // ============ 管理员功能 ============

    /**
     * 获取所有文件（管理员）
     */
    async getAllFiles(filter?: FileFilterDto): Promise<{ data: UploadedFile[]; total: number }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.fileRepository.createQueryBuilder('f')
            .where('f.isDeleted = false');

        if (filter?.type) {
            queryBuilder.andWhere('f.type = :type', { type: filter.type });
        }
        if (filter?.usage) {
            queryBuilder.andWhere('f.usage = :usage', { usage: filter.usage });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('f.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 获取存储统计
     */
    async getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        byType: Record<string, { count: number; size: number }>;
    }> {
        const stats = await this.fileRepository
            .createQueryBuilder('f')
            .select('f.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(f.size), 0)', 'size')
            .where('f.isDeleted = false')
            .groupBy('f.type')
            .getRawMany();

        const byType: Record<string, { count: number; size: number }> = {};
        let totalFiles = 0;
        let totalSize = 0;

        for (const row of stats) {
            byType[row.type] = {
                count: parseInt(row.count, 10),
                size: parseInt(row.size, 10),
            };
            totalFiles += parseInt(row.count, 10);
            totalSize += parseInt(row.size, 10);
        }

        return { totalFiles, totalSize, byType };
    }

    /**
     * 清理已删除文件（物理删除）
     */
    async cleanDeletedFiles(): Promise<number> {
        const deletedFiles = await this.fileRepository.find({
            where: { isDeleted: true }
        });

        let count = 0;
        for (const file of deletedFiles) {
            // 检查是否有其他记录使用相同文件
            const otherUsage = await this.fileRepository.count({
                where: { md5: file.md5, isDeleted: false }
            });

            if (otherUsage === 0) {
                // 删除物理文件
                const fullPath = path.join(this.uploadDir, file.path);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }

            // 删除数据库记录
            await this.fileRepository.delete(file.id);
            count++;
        }

        return count;
    }
}
