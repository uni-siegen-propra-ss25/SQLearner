// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginCredentialsDto {
  @ApiProperty({ example: 'student@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd', description: 'User password' })
  password: string;
}