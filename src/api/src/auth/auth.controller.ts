import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Req,
    Res,
    HttpStatus,
    Patch,
    Param,
    Delete,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
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
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const authResponse = await this.authService.login(loginDto, ipAddress, userAgent);

        // Set httpOnly cookies for tokens
        this.setTokenCookies(res, authResponse.accessToken, authResponse.refreshToken);

        return authResponse;
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
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        // Try to get refresh token from cookie first, fallback to body for backward compatibility
        const refreshToken = req.cookies?.refresh_token || refreshTokenDto.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not provided');
        }

        const authResponse = await this.authService.refreshToken(refreshToken, req.ip);

        // Set new httpOnly cookies for tokens
        this.setTokenCookies(res, authResponse.accessToken, authResponse.refreshToken);

        return authResponse;
    }

    @ApiBearerAuth('JWT-auth')
    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User successfully logged out',
    })
    async logout(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Req() req: Request,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ message: string }> {
        // Try to get refresh token from cookie first, fallback to body for backward compatibility
        const refreshToken = req.cookies?.refresh_token || refreshTokenDto.refreshToken;

        // Get JTI and sessionId from current token to blacklist it
        const tokenPayload = (user as any).tokenPayload;
        const sessionId = (user as any).sessionId || tokenPayload?.sessionId;
        await this.authService.logout(refreshToken, tokenPayload?.jti, user.id, sessionId);

        // Clear cookies
        this.clearTokenCookies(res);

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
    @Get('sessions')
    @ApiOperation({ summary: 'Get all active sessions for current user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of active sessions',
    })
    async getSessions(@CurrentUser() user: User): Promise<any[]> {
        return await this.authService.getUserSessions(user.id);
    }

    @ApiBearerAuth('JWT-auth')
    @Delete('sessions/:sessionId')
    @ApiOperation({ summary: 'Terminate a specific session' })
    @ApiParam({ name: 'sessionId', description: 'Session ID to terminate' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Session terminated successfully',
    })
    async terminateSession(
        @CurrentUser() user: User,
        @Param('sessionId') sessionId: string,
    ): Promise<{ message: string }> {
        await this.authService.terminateSession(user.id, sessionId);
        return { message: 'Session terminated successfully' };
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
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const authResponse = await this.authService.switchOrganization(
            user.id,
            organizationId,
            ipAddress,
            userAgent,
        );

        // Set new httpOnly cookies for tokens with new organization context
        this.setTokenCookies(res, authResponse.accessToken, authResponse.refreshToken);

        return authResponse;
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

    /**
     * Helper method to set httpOnly cookies for tokens
     */
    private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
        const isProduction = process.env.NODE_ENV === 'production';

        // Set access token cookie (short-lived)
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction, // HTTPS only in production
            sameSite: 'lax', // CSRF protection
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        // Set refresh token cookie (long-lived)
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });
    }

    /**
     * Helper method to clear token cookies
     */
    private clearTokenCookies(res: Response): void {
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });
    }
}
