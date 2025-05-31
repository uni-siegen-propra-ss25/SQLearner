import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from '../models/create-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Service handling business logic for user-related operations.
 * Manages user accounts, authentication details, and role-based permissions.
 */
@Injectable()
export class UsersService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {}

    /**
     * Creates a new user account.
     * Hashes the password before storing.
     * 
     * @param dto - The data for creating the new user
     * @returns Promise resolving to the ID of the created user
     * @throws BadRequestException if the email is already taken
     */
    async createUser(dto: CreateUserDto): Promise<number> {
        const { email, password, role } = dto;

        // Check if user with same email exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already taken');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                ...dto,
                password: hashedPassword,
            },
        });

        return user.id;
    }

    /**
     * Retrieves all users from the database.
     * Password field is excluded from the results.
     * 
     * @returns Promise resolving to an array of partial User objects
     */
    async getAllUsers(): Promise<Partial<User>[]> {
        return this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                matriculationNumber: true,
                role: true,
                progress: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
        });
    }

    /**
     * Retrieves a user by their ID.
     * Password field is excluded from the results.
     * 
     * @param id - The ID of the user to retrieve
     * @returns Promise resolving to a User object
     * @throws NotFoundException if the user does not exist
     */
    async getUserById(id: number): Promise<Partial<User>> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                matriculationNumber: true,
                role: true,
                progress: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    /**
     * Retrieves a user by their email.
     * Accessible only by administrators and tutors.
     * 
     * @param email - The email of the user to retrieve
     * @returns Promise resolving to a User object
     */
    async getUserByEmail(email: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                matriculationNumber: true,
                role: true,
                progress: true,
                createdAt: true,
                updatedAt: true,
                password: true, // Include password for authentication purposes
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    /**
     * Retrieves users by their role.
     * Password field is excluded from the results.
     * 
     * @param role - The role to filter users by
     * @returns Promise resolving to an array of partial User objects
     */
    async getUsersByRole(role: Role): Promise<Partial<User>[]> {
        return this.prisma.user.findMany({
            where: { role },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                matriculationNumber: true,
                role: true,
                progress: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
        });
    }

    /**
     * Updates a user's information.
     * 
     * @param id - The ID of the user to update
     * @param updateData - The data to update the user with
     * @returns Promise resolving to the updated User object
     * @throws BadRequestException if the email is already taken
     * @throws NotFoundException if the user does not exist
     */
    async updateUser(id: number, updateData: Partial<User>): Promise<User> {
        // If email is being updated, check if new email is already taken
        if (updateData.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: updateData.email,
                    NOT: {
                        id,
                    },
                },
            });

            if (existingUser) {
                throw new BadRequestException('Email already taken');
            }
        }

        try {
            return await this.prisma.user.update({
                where: { id },
                data: updateData,
            });
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    /**
     * Updates a user's role.
     * 
     * @param id - The ID of the user whose role to update
     * @param role - The new role to assign
     * @returns Promise resolving to the updated User object
     * @throws NotFoundException if the user does not exist
     */
    async updateUserRole(id: number, role: Role): Promise<User> {
        try {
            return await this.prisma.user.update({
                where: { id },
                data: { role },
            });
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    /**
     * Updates a user's password.
     * Hashes the new password before storing.
     * 
     * @param id - The ID of the user whose password to update
     * @param password - The new password
     * @returns Promise resolving to the updated User object
     * @throws NotFoundException if the user does not exist
     */
    async updateUserPassword(id: number, password: string): Promise<User> {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        try {
            return await this.prisma.user.update({
                where: { id },
                data: { password: hashedPassword },
            });
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    /**
     * Finds a user by their email address.
     * Used primarily for authentication purposes.
     * 
     * @param email - The email address to search for
     * @returns Promise resolving to the User object if found
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Removes a user and their associated data.
     * 
     * @param id - The ID of the user to remove
     * @throws NotFoundException if the user does not exist
     */
    async deleteUser(id: number): Promise<void> {
        try {
            await this.prisma.user.delete({
                where: { id },
            });
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }
}
