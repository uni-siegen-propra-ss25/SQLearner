import { Role } from "../../../features/users/models/role.model";

export interface RegisterCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
}