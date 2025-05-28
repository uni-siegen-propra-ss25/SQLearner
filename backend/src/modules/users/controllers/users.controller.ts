import { Controller, Get, UseGuards, Patch, Param, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
@ApiBearerAuth()
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    /**
     * Retrieves all users from the database.
     * @returns Promise resolving to an array of User objects.
     */
    @Get('getAllUsers')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'List of all users returned successfully' })
    async getAllUsers(): Promise<Partial<User>[]> {
        return this.usersService.getAllUsers();
    }

    /**
     * Get users by role
     */
    @Get('byRole/:role')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get users by role' })
    @ApiResponse({ status: 200, description: 'List of users with specified role' })
    async getUsersByRole(@Param('role') role: string): Promise<Partial<User>[]> {
        return this.usersService.getUsersByRole(role);
    }

    /**
     * Update user information
     */
    @Patch(':id')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Update user information' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: Partial<User>
    ): Promise<User> {
        return this.usersService.updateUser(id, updateData);
    }

    /**
     * Update user role
     */
    @Patch(':id/role')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update user role' })
    @ApiResponse({ status: 200, description: 'User role updated successfully' })
    async updateUserRole(
        @Param('id', ParseIntPipe) id: number,
        @Body('role') role: string
    ): Promise<User> {
        return this.usersService.updateUserRole(id, role);
    }

    /**
     * Update user password
     */
    @Patch(':id/password')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Update user password' })
    @ApiResponse({ status: 200, description: 'User password updated successfully' })
    async updateUserPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body('password') password: string
    ): Promise<User> {
        return this.usersService.updateUserPassword(id, password);
    }

    /**
     * Delete user
     */
    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.usersService.deleteUser(id);
    }
}
