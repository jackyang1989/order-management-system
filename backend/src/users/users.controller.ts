import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Mock buyer accounts (in production, this would be in a separate BuyerAccountsService)
const buyerAccounts: any[] = [];

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
    @Get('buyer-accounts')
    async getBuyerAccounts(@Request() req) {
        // Return buyer accounts for the current user
        const userAccounts = buyerAccounts.filter(acc => acc.userId === req.user.userId);
        return {
            success: true,
            data: userAccounts
        };
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return {
            success: true,
            data: req.user
        };
    }
}
