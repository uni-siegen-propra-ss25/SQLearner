// src/auth/dto/login-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ example: 42, description: 'The authenticated user’s ID' })
  userId: number;

  @ApiProperty({ example: 'student@example.com', description: 'The authenticated user’s email' })
  email: string;

  @ApiProperty({ example: 'STUDENT', description: 'The authenticated user’s role' })
  role: string;
}