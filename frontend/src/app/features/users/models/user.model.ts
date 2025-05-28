import { Role } from './role.model';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    matriculationNumber?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
