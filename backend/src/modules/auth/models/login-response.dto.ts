import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * DTO returned upon successful login, containing JWT and user info.
 */
export class LoginResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
        description: 'JWT access token',
    })
    accessToken: string;

    @ApiProperty({
        example: 42,
        description: 'The authenticated user’s ID',
    })
    userId: number;

    @ApiProperty({
        example: 'student@example.com',
        description: 'The authenticated user’s email',
    })
    email: string;

    @ApiProperty({
        example: 'Max',
        description: 'The authenticated user’s first name',
    })
    firstName: string;

    @ApiProperty({
        example: 'Mustermann',
        description: 'The authenticated user’s last name',
    })
    lastName: string;

    @ApiProperty({
        example: Role.STUDENT,
        enum: Role,
        description: 'The authenticated user’s role',
    })
    role: Role;
}
