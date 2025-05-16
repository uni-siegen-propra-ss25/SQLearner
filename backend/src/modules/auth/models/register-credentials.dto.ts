import { ApiProperty } from '@nestjs/swagger';

export class RegisterCredentialsDto {
    @ApiProperty({
        example: '20210001',
        description: 'Matriculation number of the user',
        required: false,
    })
    matriculationNumber?: string;

    @ApiProperty({ example: 'student@example.com', description: 'Email address of the user' })
    email: string;

    @ApiProperty({ example: 'Str0ngP@ssw0rd', description: 'User password', minLength: 8 })
    password: string;

    @ApiProperty({ example: 'Max', description: 'First name of the user' })
    firstName: string;

    @ApiProperty({ example: 'Mustermann', description: 'Last name of the user' })
    lastName: string;

    @ApiProperty({
        example: 'STUDENT',
        description: 'Role of the user',
        enum: ['STUDENT', 'TUTOR'],
    })
    role: 'STUDENT' | 'TUTOR';
}
