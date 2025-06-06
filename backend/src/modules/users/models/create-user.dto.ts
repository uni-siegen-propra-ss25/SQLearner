// src/auth/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'max@example.com', description: 'Email of the student' })
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty({ message: 'Email cannot be empty' })
    email: string;

    @ApiProperty({
        example: 'SuperGeheim123',
        description: 'Secure password with min 6 characters',
    })
    @IsNotEmpty({ message: 'Password cannot be empty' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password can be at most 32 characters long' })
    password: string;

    @ApiProperty({ example: 'Max', description: 'First name of the user' })
    @IsNotEmpty({ message: 'First name cannot be empty' })
    @MinLength(2, { message: 'First name must be at least 2 characters long' })
    @MaxLength(50, { message: 'First name can be at most 50 characters long' })
    firstName: string;

    @ApiProperty({ example: 'Mustermann', description: 'Last name of the user' })
    @IsNotEmpty({ message: 'Last name cannot be empty' })
    @MinLength(2, { message: 'Last name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Last name can be at most 50 characters long' })
    lastName: string;

    @ApiProperty({
        example: Role.STUDENT,
        enum: Role,
        description: 'Role of the new user',
    })
    @IsEnum(Role, { message: 'Role must be one of STUDENT, TUTOR' })
    role: Role;

    @ApiProperty({
        example: '20210001',
        description: 'Matriculation number of the student',
        required: false,
    })
    @IsOptional()
    matriculationNumber?: string;
}
