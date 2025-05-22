// A model for the login credentials of a user
export interface LoginCredentials {
    // TODO: The User can login with either their email or matriculation number
    // but not both at the same time
    // matriculationNumber?: string;
    email: string;
    password: string;
}
