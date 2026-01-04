import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile as NestUploadedFile,
  UploadedFiles as NestUploadedFiles,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadFileDto, FileFilterDto, CreateGroupDto } from './upload.entity';

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  /**
   * 单文件上传
   */
  @Post('file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @NestUploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req,
  ) {
    if (!file) {
      return { success: false, message: '请选择文件' };
    }

    dto.uploaderId = req.user.userId;
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

    return result;
  }

  /**
   * 多文件上传
   */
  @Post('files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @NestUploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadFileDto,
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      return { success: false, message: '请选择文件' };
    }

    dto.uploaderId = req.user.userId;
    dto.uploaderType = req.user.role;

    const result = await this.uploadsService.uploadFiles(
      files.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        buffer: f.buffer,
        size: f.size,
      })),
      dto,
    );

    return result;
  }

  /**
   * 获取我的文件
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyFiles(@Request() req, @Query() filter: FileFilterDto) {
    const result = await this.uploadsService.getUserFiles(
      req.user.userId,
      filter,
    );
    return { success: true, ...result };
  }

  /**
   * 获取文件详情
   */
  @Get('file/:id')
  @UseGuards(JwtAuthGuard)
  async getFile(@Param('id') id: string) {
    const file = await this.uploadsService.getFile(id);
    if (!file) {
      return { success: false, message: '文件不存在' };
    }
    return { success: true, data: file };
  }

  /**
   * 删除文件
   */
  @Delete('file/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('id') id: string, @Request() req) {
    const result = await this.uploadsService.deleteFile(id, req.user.userId);
    if (!result) {
      return { success: false, message: '删除失败' };
    }
    return { success: true, message: '文件已删除' };
  }

  /**
   * 批量删除
   */
  @Post('delete-batch')
  @UseGuards(JwtAuthGuard)
  async deleteBatch(@Body() body: { ids: string[] }, @Request() req) {
    const count = await this.uploadsService.deleteFiles(
      body.ids,
      req.user.userId,
    );
    return { success: true, message: `已删除${count}个文件` };
  }

  // ============ 文件分组 ============

  /**
   * 获取我的分组
   */
  @Get('groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@Request() req) {
    const groups = await this.uploadsService.getUserGroups(req.user.userId);
    return { success: true, data: groups };
  }

  /**
   * 创建分组
   */
  @Post('groups')
  @UseGuards(JwtAuthGuard)
  async createGroup(@Body() dto: CreateGroupDto, @Request() req) {
    const group = await this.uploadsService.createGroup(req.user.userId, dto);
    return { success: true, message: '分组创建成功', data: group };
  }

  /**
   * 删除分组
   */
  @Delete('groups/:id')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(@Param('id') id: string, @Request() req) {
    const result = await this.uploadsService.deleteGroup(id, req.user.userId);
    if (!result) {
      return { success: false, message: '删除失败' };
    }
    return { success: true, message: '分组已删除' };
  }

  // ============ 管理员接口 ============

  /**
   * 获取所有文件
   */
  @Get('admin/files')
  @UseGuards(JwtAuthGuard)
  async getAllFiles(@Query() filter: FileFilterDto) {
    const result = await this.uploadsService.getAllFiles(filter);
    return { success: true, ...result };
  }

  /**
   * 获取存储统计
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.uploadsService.getStorageStats();
    return { success: true, data: stats };
  }

  /**
   * 清理已删除文件
   */
  @Post('admin/clean')
  @UseGuards(JwtAuthGuard)
  async cleanDeleted() {
    const count = await this.uploadsService.cleanDeletedFiles();
    return { success: true, message: `已清理${count}个文件` };
  }
}
