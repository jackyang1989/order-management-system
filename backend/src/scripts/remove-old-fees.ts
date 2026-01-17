import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { SystemConfig } from '../admin-config/config.entity';

async function removeOldFees() {
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const configRepo = app.get('SystemConfigRepository');

        // 删除 phone_fee 和 pc_fee
        const result = await configRepo.delete({
            key: ['phone_fee', 'pc_fee']
        });

        console.log(`已删除 ${result.affected} 个配置项`);
        console.log('删除的配置: phone_fee, pc_fee');

    } catch (error) {
        console.error('删除配置失败:', error);
    } finally {
        await app.close();
    }
}

removeOldFees();
