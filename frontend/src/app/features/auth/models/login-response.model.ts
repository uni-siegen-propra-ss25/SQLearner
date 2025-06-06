// A model for the response of the login API
export interface LoginResponse {
    accessToken: string;
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    matriculationNumber?: string;
}
