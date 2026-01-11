import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Shop } from './shop.entity';
import { UploadsService } from '../uploads/uploads.service';
import { FileUsage } from '../uploads/upload.entity';

@Controller('shops')
@UseGuards(JwtAuthGuard)
export class ShopsController {
  constructor(
    private shopsService: ShopsService,
    private uploadsService: UploadsService,
  ) { }

  @Get()
  async getMyShops(@Request() req: any) {
    const sellerId = req.user.merchantId || req.user.userId;
    const shops = await this.shopsService.getMyShops(sellerId);
    return { success: true, data: shops };
  }

  @Post()
  @UseInterceptors(FileInterceptor('screenshot'))
  async create(
    @Request() req: any,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const sellerId = req.user.merchantId || req.user.userId;

    // 如果有上传截图文件，先上传并获取URL
    let screenshotUrl = '';
    if (file) {
      const uploadResult = await this.uploadsService.uploadFile(
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer,
          size: file.size,
        },
        {
          usage: FileUsage.SCREENSHOT,
          uploaderId: req.user.userId,
          uploaderType: req.user.role,
        },
      );
      if (uploadResult.success && uploadResult.data?.url) {
        screenshotUrl = uploadResult.data.url;
      }
    }

    const shopData: Partial<Shop> = {
      platform: body.platform,
      shopName: body.shopName,
      accountName: body.accountName,
      contactName: body.contactName,
      mobile: body.mobile,
      url: body.url,
      province: body.province,
      city: body.city,
      district: body.district,
      detailAddress: body.detailAddress,
      screenshot: screenshotUrl || undefined,
    };

    const shop = await this.shopsService.create(sellerId, shopData);
    return { success: true, message: '申请提交成功，请等待审核', data: shop };
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<Shop>,
  ) {
    const sellerId = req.user.merchantId || req.user.userId;
    const shop = await this.shopsService.update(id, sellerId, body);
    return { success: true, message: '修改成功，请等待审核', data: shop };
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const sellerId = req.user.merchantId || req.user.userId;
    await this.shopsService.delete(id, sellerId);
    return { success: true, message: '删除成功' };
  }
}
