import {
    Body,
    Controller,
    Post,
    UseGuards,
    Request,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginResponseDto } from '../models/login-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { LocalAuthGuard } from 'src/common/guards/local-auth/local-auth.guard';
import { RolesGuard } from 'src/common/guards/role/role.guard';
import { LoginCredentialsDto } from '../models/login-credentials.dto';
import { CreateUserDto } from 'src/modules/users/models/create-user.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Registers a new user in the system.
     * @param dto CreateUserDto containing email, password, and optional name
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiBody({ type: CreateUserDto })
    async register(@Body() dto: CreateUserDto): Promise<number> {
        return this.authService.signUp(dto);
    }

    /**
     * Authenticates a user with email and password.
     * On success returns JWT and user profile.
     * @param req Request object populated by LocalAuthGuard
     * @returns LoginResponseDto with accessToken and user info
     */
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login with email & password' })
    @ApiResponse({
        status: 200,
        description: 'JWT access token and user data',
        type: LoginResponseDto,
    })
    @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
    @ApiBody({ type: LoginCredentialsDto })
    async login(@Request() req): Promise<LoginResponseDto> {
        return this.authService.signIn(req.user);
    }

    /**
     * Returns the profile of the authenticated user.
     * Requires a valid JWT and appropriate role.
     * @param user Current user injected by GetUser decorator
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STUDENT', 'TUTOR', 'ADMIN')
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get profile of the authenticated user' })
    @ApiResponse({ status: 200, description: 'Current user profile' })
    getProfile(@GetUser() user) {
        return user;
    }
}
