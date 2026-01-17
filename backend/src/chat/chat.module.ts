import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { VisitorGateway } from './visitor.gateway';
import { AgentGateway } from './agent.gateway';
import { ChatMessage } from './entities/chat-message.entity';
import { Visitor } from './entities/visitor.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatMessage, Visitor]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    providers: [ChatService, VisitorGateway, AgentGateway],
    exports: [ChatService],
})
export class ChatModule { }
