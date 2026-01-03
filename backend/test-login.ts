import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/auth/auth.service';
import { LoginDto } from './src/users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    const loginDto: LoginDto = {
        username: 'ouyang',
        password: '123456'
    };

    console.log(`Simulating login for: ${loginDto.username} with password: ${loginDto.password}`);

    try {
        const result = await authService.login(loginDto);
        console.log('Login Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Login Failed:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response, null, 2));
        }
    } finally {
        await app.close();
    }
}

bootstrap();
