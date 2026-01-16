import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedFile, FileGroup } from './upload.entity';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { UploadCompatController } from './upload-compat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadedFile, FileGroup]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [UploadsController, UploadCompatController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
