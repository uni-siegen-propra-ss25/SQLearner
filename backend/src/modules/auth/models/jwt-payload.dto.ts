import { Role } from '@prisma/client';

export interface JwtPayload {
    sub: number; // id
    email: string;
    username: string;
    role: Role;
    matriculationNumber?: string;
}
