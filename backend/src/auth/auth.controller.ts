import { Controller, Post, Body, UseGuards, Get, Req, HttpStatus, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
import { Organization } from '../organizations/entities/organization.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
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
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registration attempts per minute
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
    @Get('organizations')
    @ApiOperation({ summary: 'Get list of organizations for registration' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of organizations',
        type: [Organization],
    })
    async getOrganizations(): Promise<Partial<Organization>[]> {
        return await this.authService.getPublicOrganizations();
    }

    @Public()
    @Post('refresh')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refresh attempts per minute
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
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 password change attempts per minute
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

    @ApiBearerAuth('JWT-auth')
    @Post('switch-organization/:organizationId')
    @ApiOperation({ summary: 'Switch to a different organization' })
    @ApiParam({ name: 'organizationId', description: 'Organization ID to switch to' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully switched organization',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'User does not have access to this organization',
    })
    async switchOrganization(
        @CurrentUser() user: User,
        @Param('organizationId') organizationId: string,
        @Req() req: Request,
    ): Promise<AuthResponse> {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        return await this.authService.switchOrganization(user.id, organizationId, ipAddress, userAgent);
    }

    @ApiBearerAuth('JWT-auth')
    @Get('organizations/user')
    @ApiOperation({ summary: 'Get all organizations for the current user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of user organizations',
        type: [Organization],
    })
    async getUserOrganizations(@CurrentUser() user: User): Promise<Organization[]> {
        return await this.authService.getUserOrganizations(user.id);
    }
}
