import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile as NestUploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadFileDto } from './upload.entity';

/**
 * 兼容旧的 /upload 路径
 * TODO: 前端迁移到 /uploads/file 后可以移除此控制器
 */
@Controller('upload')
export class UploadCompatController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @NestUploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req,
  ) {
    if (!file) {
      return { success: false, message: '请选择文件' };
    }

    dto.uploaderId = req.user.userId || req.user.merchantId;
    dto.uploaderType = req.user.role;

    const result = await this.uploadsService.uploadFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      },
      dto,
    );

    // 返回兼容格式，url 在顶层
    if (result.success && result.data) {
      return {
        success: true,
        message: result.message,
        url: result.data.url,
        data: result.data,
      };
    }
    return result;
  }

  /**
   * 兼容 /upload/image 路径
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @NestUploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req,
  ) {
    return this.upload(file, dto, req);
  }
}
