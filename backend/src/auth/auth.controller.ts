import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Req,
    HttpStatus,
    Patch,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User successfully logged in',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials',
    })
    async login(
        @Body() loginDto: LoginDto,
        @Req() req: Request,
        @CurrentUser() user: User,
    ): Promise<AuthResponse> {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        return await this.authService.login(loginDto, ipAddress, userAgent);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User successfully registered',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email already exists',
    })
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
        return await this.authService.register(registerDto);
    }

    @Public()
    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Token successfully refreshed',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid refresh token',
    })
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Req() req: Request,
    ): Promise<AuthResponse> {
        return await this.authService.refreshToken(refreshTokenDto.refreshToken, req.ip);
    }

    @ApiBearerAuth('JWT-auth')
    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User successfully logged out',
    })
    async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
        await this.authService.logout(refreshTokenDto.refreshToken);
        return { message: 'Successfully logged out' };
    }

    @ApiBearerAuth('JWT-auth')
    @Post('logout-all')
    @ApiOperation({ summary: 'Logout from all devices' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User logged out from all devices',
    })
    async logoutAll(@CurrentUser() user: User): Promise<{ message: string }> {
        await this.authService.logoutAll(user.id);
        return { message: 'Successfully logged out from all devices' };
    }

    @ApiBearerAuth('JWT-auth')
    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile',
    })
    async getProfile(@CurrentUser() user: User) {
        return await this.authService.getProfile(user);
    }

    @ApiBearerAuth('JWT-auth')
    @Patch('change-password')
    @ApiOperation({ summary: 'Change user password' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Password successfully changed',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Current password is incorrect',
    })
    async changePassword(
        @CurrentUser() user: User,
        @Body() body: { currentPassword: string; newPassword: string },
    ): Promise<{ message: string }> {
        await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
        return { message: 'Password successfully changed. Please log in again.' };
    }
}