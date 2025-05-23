import { Role } from "@prisma/client";  

export interface RegisterCredentialsDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    matriculationNumber?: string;
}