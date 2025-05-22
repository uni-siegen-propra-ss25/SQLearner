import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { User } from '@prisma/client';

/**
 * UsersController handles HTTP requests related to user operations.
 * It delegates the actual logic to the UsersService.
 */
@ApiTags('Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    /**
     * Retrieves all users from the database.
     * @returns Promise resolving to an array of User objects.
     */
    @Get('getAllUsers')
    async getAllUsers(): Promise<Partial<User>[]> {
        return this.usersService.getAllUsers();
    }

}
