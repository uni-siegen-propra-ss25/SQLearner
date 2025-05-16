import { ApiProperty } from '@nestjs/swagger';

export class RegisterCredentialsDto {
  @ApiProperty({ example: 'student@example.com', description: 'Email address of the user' })
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd', description: 'User password', minLength: 8 })
  password: string;

  @ApiProperty({ example: 'Max Mustermann', description: 'Full name of the user', required: false })
  name?: string;
}