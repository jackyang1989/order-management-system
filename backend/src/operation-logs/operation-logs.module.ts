import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './operation-log.entity';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([OperationLog])],
    controllers: [OperationLogsController],
    providers: [OperationLogsService],
    exports: [OperationLogsService],
})
export class OperationLogsModule {}
