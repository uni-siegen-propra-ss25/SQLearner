import {
    Controller,
    Get,
    UseGuards,
    Patch,
    Param,
    Body,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role, User } from '@prisma/client';

/**
 * UsersController handles HTTP requests related to user operations.
 * It delegates the actual logic to the UsersService.
 * All endpoints require authentication and appropriate role permissions.
 */
@ApiTags('Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    /**
     * Retrieves all users from the database.
     * Accessible only by administrators and tutors.
     * 
     * @returns Promise resolving to an array of partial User objects
     */
    @Get('getAllUsers')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'List of all users returned successfully' })
    async getAllUsers(): Promise<Partial<User>[]> {
        return this.usersService.getAllUsers();
    }

    /**
     * Retrieves a user by their ID.
     * Accessible only by administrators and tutors.
     * 
     * @param id - The ID of the user to retrieve
     * @returns Promise resolving to a User object
     */
    @Get(':id')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User found successfully' })
    async getUserById(@Param('id', ParseIntPipe) id: number): Promise<Partial<User>> {
        return await this.usersService.getUserById(id);
    }

    /**
     * Retrieves a user by their email.
     * Accessible only by administrators and tutors.
     * 
     * @param email - The email of the user to retrieve
     * @returns Promise resolving to a User object
     */
    @Get('byEmail/:email')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get user by email' })
    @ApiResponse({ status: 200, description: 'User found successfully' })
    async getUserByEmail(@Param('email') email: string): Promise<Partial<User>> {
        return this.usersService.getUserByEmail(email);
    }

    /**
     * Retrieves users by their role.
     * Accessible only by administrators and tutors.
     * 
     * @param role - The role to filter users by
     * @returns Promise resolving to an array of partial User objects
     */
    @Get('byRole/:role')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Get users by role' })
    @ApiResponse({ status: 200, description: 'List of users with specified role' })
    async getUsersByRole(@Param('role') role: Role): Promise<Partial<User>[]> {
        return this.usersService.getUsersByRole(role);
    }

    /**
     * Updates user information.
     * Accessible only by administrators and tutors.
     * 
     * @param id - The ID of the user to update
     * @param updateData - The data to update the user with
     * @returns Promise resolving to the updated User object
     */
    @Patch(':id')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Update user information' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: Partial<User>,
    ): Promise<User> {
        return this.usersService.updateUser(id, updateData);
    }

    /**
     * Updates a user's role.
     * Accessible only by administrators.
     * 
     * @param id - The ID of the user whose role to update
     * @param role - The new role to assign
     * @returns Promise resolving to the updated User object
     */
    @Patch(':id/role')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update user role' })
    @ApiResponse({ status: 200, description: 'User role updated successfully' })
    async updateUserRole(
        @Param('id', ParseIntPipe) id: number,
        @Body('role') role: Role,
    ): Promise<User> {
        return this.usersService.updateUserRole(id, role);
    }

    /**
     * Updates a user's password.
     * Accessible only by administrators and tutors.
     * 
     * @param id - The ID of the user whose password to update
     * @param password - The new password
     * @returns Promise resolving to the updated User object
     */
    @Patch(':id/password')
    @Roles('ADMIN', 'TUTOR')
    @ApiOperation({ summary: 'Update user password' })
    @ApiResponse({ status: 200, description: 'User password updated successfully' })
    async updateUserPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body('password') password: string,
    ): Promise<User> {
        return this.usersService.updateUserPassword(id, password);
    }

    /**
     * Deletes a user.
     * Accessible only by administrators.
     * 
     * @param id - The ID of the user to delete
     */
    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.usersService.deleteUser(id);
    }
}
