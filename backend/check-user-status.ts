import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const username = 'ouyang';

    console.log(`Searching for user: ${username} in all tables...`);

    try {
        const tables = ['users', 'merchants', 'admin_users'];
        for (const table of tables) {
            const user = await dataSource.getRepository(table).findOne({ where: { username } });
            if (user) {
                console.log(`Found in [${table}]:`, {
                    id: user.id,
                    username: user.username,
                    password: user.password ? 'HIDDEN' : 'MISSING',
                    isActive: user.isActive,
                    isBanned: user.isBanned,
                    status: user.status,
                    phone: user.phone
                });
            } else {
                console.log(`Not found in [${table}]`);
            }
        }
    } catch (error) {
        console.error('Error searching user:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
