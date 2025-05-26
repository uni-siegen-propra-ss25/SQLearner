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
    ApiInternalServerErrorResponse,
    ApiBadRequestResponse,
    ApiOkResponse,
    ApiCreatedResponse,
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
import { RegisterCredentialsDto } from '../models/register-credentials.dto';

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
    @ApiCreatedResponse({ description: 'User successfully registered' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @ApiBody({ type: CreateUserDto })
    async register(@Body() dto: RegisterCredentialsDto): Promise<number> {
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
    @ApiOkResponse({
        description: 'JWT access token and user data',
        type: LoginResponseDto,
    })
    @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async login(@Body() dto: LoginCredentialsDto): Promise<LoginResponseDto> {
        return this.authService.signIn(dto.email, dto.password);
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
    @ApiOkResponse({ description: 'Current user profile' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    getProfile(@GetUser() user) {
        return user;
    }
}
