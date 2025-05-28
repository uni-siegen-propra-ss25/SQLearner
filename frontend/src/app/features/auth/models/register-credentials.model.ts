import { Role } from '../../../features/users/models/role.model';

// A model for the register credentials of a user
export interface RegisterCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    matriculationNumber?: string;
}
