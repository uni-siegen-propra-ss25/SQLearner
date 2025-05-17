import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { CreateUserDto } from '../models/create-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * UsersService handles database operations related to the User model.
 */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Retrieves a user by ID.
   * @param id The user's unique identifier.
   * @returns The User object.
   * @throws NotFoundException if no user is found.
   */
  async getUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Retrieves a user by email.
   * @param email The user's email address.
   * @returns The User object.
   * @throws NotFoundException if no user is found.
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Retrieves a user by matriculation number.
   * @param matriculationNumber The user's matriculation number.
   * @returns The User object.
   * @throws NotFoundException if no user is found.
   */
  async getUserByMatriculationNumber(matriculationNumber: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { matriculationNumber } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Finds all users with a specific role.
   * @param role Role name (e.g., 'STUDENT', 'TUTOR', 'ADMIN').
   * @returns An array of user data objects.
   */
  async getUsersByRole(role: string): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: { role: role.toUpperCase() as any },
      select: {
        id: true,
        matriculationNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  /**
   * Checks whether a user with the given email exists.
   * @param email Email to check.
   * @returns True if a user exists, false otherwise.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return Boolean(user);
  }

  /**
   * Checks whether a user with the given matriculation number exists.
   * @param matriculationNumber Matriculation number to check.
   * @returns True if a user exists, false otherwise.
   */
  async checkMatriculationNumberExists(matriculationNumber: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { matriculationNumber } });
    return Boolean(user);
  }

  /**
   * Creates a new user record, hashing the provided password.
   * @param dto Data transfer object containing user registration fields
   * @returns The created user without the password field
   */
  async createUser(dto: CreateUserDto): Promise<number> {
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
      10,
    );
    const hashed = await bcrypt.hash(dto.password, saltRounds);
    const user = await this.prisma.user.create({
      data: {
        matriculationNumber: dto.matriculationNumber,
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: {
        id: true,
      },
    });

    return user.id;
  }
}
