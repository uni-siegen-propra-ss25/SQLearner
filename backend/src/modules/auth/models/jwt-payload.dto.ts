import { Role } from '@prisma/client';

export interface JwtPayload {
    sub: number; // id
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: Role;
    matriculationNumber?: string;
}
